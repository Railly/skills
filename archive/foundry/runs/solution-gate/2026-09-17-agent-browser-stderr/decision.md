# Solution Gate: Chrome stderr / PR #1527

## Veredicto

**Return to contract. No Pass to detail ni aprobación de merge bajo el contrato amplio congelado.**

La [PR #1527](https://github.com/vercel-labs/agent-browser/pull/1527) de **Simon Ellefsen (`simonellefsen`)**, HEAD `f89be85ca5f9960c178270ff8145ff3829fac64f`, resuelve el bloqueo posterior a readiness observado en esta investigación. La verificación independiente lo confirma: base sin respuesta a `open` en 12 s; base actual más el parche completa open/marker/snapshot/marker/close, sin relanzar ni perder estado.

La PR no cubre ruido anterior a readiness ni el fallback que espera un escritor silencioso. Ambos fallos existían en base. El contrato que congelamos exigía todo el ciclo de salida, por lo que no se puede dar un pase completo ni estrechar ese requisito silenciosamente.

**Recomendación del coordinador, todavía no una decisión de producto:** aprovechar el cambio acotado de Simon, añadir una regresión determinista del caso posterior a readiness y verificar recursos al relanzar. Mantener las mejoras de arranque/fallback como trabajo separado, salvo que Hunter elija explícitamente ampliar el alcance. No sustituir una corrección de 19 líneas por un sistema general de logging/reaping solo para hacer pasar todos los casos descubiertos.

No se cambió la PR, el checkout de trabajo, su rama, commits o GitHub. El parche se aplicó únicamente a una copia aislada para probarlo. Tampoco se afirma que corrija el spin de CPU de #1371.

## Identidad y aislamiento

- Base compartida y main verificado: `aff6125c023b810ea3f2e5deec5379e9a4270bdc`, versión 0.38.1.
- Candidato: HEAD `f89be85…`; diff SHA-256 `0c346e401d4d27e6501e2ab663f1303a560f84333180d013178373e2a6bfc15b`.
- Probado: **base aff6125 + diff exacto de la PR**, no el árbol antiguo completo del fork. Aplicación limpia con `git apply --check`; único archivo distinto: `cli/src/native/cdp/chrome.rs`, 19 adiciones, cero eliminaciones.
- Skill solution-gate: revisión `a006c7a52acfdb112e7a4882063d0a3dbbe757d7`, sin cambios locales en la skill.
- Perfil `standard`, modo `candidate-audit`.
- Dos conversaciones independientes, modelos seleccionados por el padre: `anthropic/claude-opus-5` y `openai/gpt-5.6-sol`. Identidad documentada por selección de la herramienta, no inspección de credenciales/entorno.
- Cada revisor recibió un archive source-only separado, sin `.git`, commits del candidato ni artifacts de otro revisor. Contratos primero; contrato reconciliado después; luego shapes; después probes/catálogo; solo entonces se reveló el diff sellado.
- GitHub al revalidar: OPEN, MERGEABLE, REVIEW_REQUIRED, mismo HEAD. MERGEABLE no acredita corrección. `xref 1527 --repo vercel-labs/agent-browser --depth 2 --no-snapshot` mostró solo ese nodo, sin issues enlazadas. El comentario de autorización de preview no se ejecutó.

Artifacts: [input](frozen-input.md), [contrato](contract.md), [A contrato](contract-a.md), [B contrato](contract-b.md), [A shapes](shapes-a.md), [B shapes](shapes-b.md), [probes previos](blind-probes.md), [reveal y feedback](candidate-feedback.md), [A final](final-a.md), [B final](final-b.md).

## Resultado observado

Representación elegida: tabla de discriminadores y secuencia textual. Los hechos no se mezclan con el mecanismo propuesto.

| Caso | Base | Base actual + candidato |
|---|---|---|
| CLI normal, Chrome real, `--v=1` | Sin respuesta en 12 s; SIGTERM del arnés, returncode -15 | Open en 2,76 s; cinco comandos exit 0, una sola familia de procesos y marcador 1371 preservado |
| Chrome real, `--v=2` | No repetido por separado | Open en 1,13 s; misma secuencia exit 0 |
| Hold posterior a readiness de 15 s | Evidencia de bloqueo previa | Open en 1,35 s; marcador antes/después, snapshot y close correctos; sin relanzamiento |
| Wrapper con ~1,2 MB antes de exec de Chrome | Sin respuesta en 12 s | Mismo fallo en 12 s; aún no se alcanzó el nuevo consumidor |
| Fallo inmediato con status 42 y error | Exit 1 en 1,40 s; status y marcador útiles | Exit 1 en 1,45 s; mismo diagnóstico, sin regresión |
| Proceso inicial sale, descendiente conserva stderr abierto y silencioso | Sin respuesta después de 35,01 s | Sin respuesta después de 35,00 s |

El escritor silencioso supera el presupuesto de intento de 30 s que aparece en el código. Es un fallo preexistente del fallback, no una regresión de esta PR. El wrapper de ráfaga es una fixture sintética finita del punto de entrada `--executable-path`, no una carga de producción observada de Chrome antes de readiness.

Los límites 12/35 s son del arnés. Returncode -15 indica que ese arnés terminó el cliente por SIGTERM; no es un error de timeout emitido por el producto. Los scripts de recolección finalizaron exit 0 porque preservaron los resultados negativos y limpiaron procesos.

Secuencia observada:

```text
Base: open → sin respuesta a 12 s → limpieza del arnés
Candidato: open → marker 1371 → 15 s → snapshot → marker 1371 → close
Ambos: ruido previo / escritor silencioso → ausencia de respuesta dentro del límite medido
```

El primer `normal-02d74bb8` mezclaba flags explícitos en los comandos posteriores y observó dos grupos. Se conservó pero se excluyó como prueba de continuidad. El caso corregido `normal-e31a6653` solo pasa configuración al open. Los casos del candidato hacen lo mismo.

## Mecanismo del candidato, leído en código

Después de seleccionar readiness, antes de construir ChromeProcess, toma el stderr que siga presente y crea un thread `chrome-stderr-drain` que ejecuta `io::copy` hacia `io::sink` hasta EOF. No conserva bytes, no agrega archivo/global log ni flags. Descarta el resultado del spawn, el JoinHandle y el resultado de copy. Si el fallback ya tomó stderr, no agrega otro consumidor.

La inserción está después de la selección de readiness. La ubicación explica tanto la mejora observada como la falta de cobertura de preburst. `io::copy` consume bytes sin depender de UTF-8 o líneas; no implica buffering ilimitado.

Forward chain del candidato, separado de la observación:

1. Toma del pipe tras readiness (inferred, diff) → consumo continuo por copy-to-sink (inferred) → el próximo write ya no depende de un pipe abandonado (inferred) → comandos reales responden (observed, tres sesiones).
2. Thread sigue EOF (inferred) → Chrome y sus writers normales terminan (observed en cierres ensayados) → lector puede terminar (inferred; no se midió su conteo). Rama dañina: un writer que sobreviva a la vida esperada puede retener thread/fd; no hay prueba de una fuga real introducida en estos ensayos.
3. Hook posterior a readiness (inferred) → no atiende salida previa (inferred) → preburst conserva el fallo (observed). Esta es cobertura faltante respecto de R0 amplio, no prueba de que haya empeorado el caso anterior.

## Contrato: satisfacción del candidato

`❌` significa que el contrato completo no está satisfecho/demostrado; no equivale a regresión introducida. La tabla conserva el alcance amplio, sin cambiarlo para forzar un pase.

| R | Requisito | Candidato |
|---|---|---|
| R0 | El volumen de logs no debe bloquear un Chrome administrado antes de readiness ni impedir comandos después | ❌ |
| R1 | Preservar DevToolsActivePort y la detección/fallback existente de DevTools listening on | ✅ |
| R2 | Conservar status y diagnósticos útiles acotados de arranque fallido | ❌ |
| R3 | Mantener PID, target, URL y estado entre comandos ordinarios, sin nuevo reset por omisión | ✅ |
| R4 | Costos finitos de bytes/almacenamiento/threads/fds y teardown no retenido por un writer heredado | ❌ |
| R5 | Mantener stdout/JSON limpio, sin forwarding ilimitado ni almacenamiento global por defecto | ✅ |
| R6 | Preservar ownership local/adjunto, grupos/Job Object/perfiles, retry e idle policy | ✅ |
| R7 | Alcance Chrome output/readiness, no CPU original, otros motores, timeout general o reaper | ✅ |
| R8 | Chunks, diagnósticos largos/sin newline y bytes inválidos consumidos sin crecimiento ilimitado | ❌ |
| R9 | Esperas nuevas de salida/cleanup respetan el intento; no dependen indefinidamente de línea/EOF | ❌ |
| R10 | Recursos de salida siguen el intento/browser, sin mezclar retries/sesiones | ❌ |

R1 y R6 se preservan por la forma del diff; faltan pruebas E2E del fallback y runtime Windows. R2 conserva el diagnóstico ensayado pero el fallback sigue sin cota. R8 pasa en la nueva ruta post-ready y conserva las limitaciones antiguas antes. R4/R10 conservan una duda de lifetime del nuevo thread, no una fuga medida.

**Corrección de interpretación del coordinador:** como el thread no se une en Drop, su `io::copy` bloqueante no demuestra un nuevo bloqueo del caller. El riesgo es retención de recursos. El fallo de deadline que sí medimos en R9 está en el fallback preexistente. No se atribuye al thread nuevo ni se exige que un lector de sesión termine al cumplir 30 s de vida.

## Probes de las shapes independientes

Ambos propusieron un consumidor acotado durante todo el ciclo; sus detalles diferían y no se votaron. Ninguna implementación de esa alternativa fue agregada a producción.

- `python3 stream-spike.py`: 65 cortes del marcador, 7.266.402 bytes consumidos; máximo 196.703 bytes retenidos bajo presupuesto explícito de 266.240. Error y URL completa sobreviven a la expulsión de ruido. Bytes inválidos se presentan con reemplazo. Stop con writer silencioso abierto: 12,54 ms.
- Prototipo exclusivamente POSIX/Python, no prueba de Rust ni cancelación de pipe Windows.
- `rustc line-limit-probe.rs -o line-limit-probe && ./line-limit-probe`: std `read_until` puede asignar 1 MiB antes de un truncate posterior. La cota debe aplicarse al leer, no después.
- Un read bloqueante con writer abierto no termina por comprobar un stop flag en otro lugar. La alternativa amplia mantiene pendiente su implementación de lifetime/cancelación multiplataforma.

## Catálogo de fallos, síntesis del coordinador

| S | Disposición |
|---|---|
| S1 Over-reach | La PR es acotada. Exigirle un rediseño completo sin decidir alcance sería ampliar el trabajo más allá de su hallazgo. |
| S2 Under-reach | Falla el R0 amplio en preburst. No falla por ello su afirmación más estrecha post-ready. |
| S3 Direction inheritance | Primaria y fallback tienen disposiciones de stderr distintas; deben permanecer diferenciadas en las afirmaciones. |
| S4 Proxy property | Un puerto publicado no garantiza progreso posterior. La PR corrige ese caso. Un line read no es una cota de memoria. |
| S5 Unregistered peer | El thread nuevo no tiene control explícito en ChromeProcess; retención fuera de la vida del browser requiere prueba, no acusación de fuga observada. |
| S6 Peer-version blindness | No hay nuevo protocolo externo. Windows sigue como validación de entrega pendiente. |
| S7 Wrong layer | El test de status 42 demuestra que el diagnóstico sigue llegando al JSON del CLI. |
| S8 Guard-derived cells | Matriz congelada antes de leer el parche: before/after readiness, bytes, error, writer quieto y continuidad. |
| S9 Wrong test | La PR no añade tests. Los probes externos muestran base fallando y candidato pasando en el caso real; deben convertirse en regresión mantenible. |
| S10 Claim from prose | El autor reporta correlación lsof y recuperación por cierre del pipe. Se acredita como reported, no como ejecución propia. EPIPE/plataformas y días de antigüedad no se generalizan. |
| S11 Asymmetric consumers | Sink no interpreta logs ni adquiere autoridad extra. Mantener esa propiedad en cualquier ampliación. |
| S12 Primitive mismatch | Consumo post-ready no es una garantía de todo el arranque. No cambiar el contrato en prosa para llamar equivalente a esa cobertura. |
| S13 Invocation-state collapse | Pruebas corregidas omiten flags después de open y conservan marcador/hash/grupo. No se usó relanzar como workaround. |

## Decisión pendiente y siguiente paso

Hay dos alcances legítimos, pero son distintos:

1. **Arreglo acotado de #1527:** post-readiness. Reutilizar el trabajo y crédito de Simon, añadir regresión del bloqueo y pruebas de recursos al relanzar; dar seguimiento separado a preburst/fallback. Es la recomendación del coordinador para evitar sobreingeniería, no una aprobación de merge.
2. **Contrato completo de stderr:** desde spawn hasta cleanup, incluyendo captura útil acotada y cancelación. Requiere ampliar/reshapear, no adoptar los 19 renglones como cobertura completa.

Hasta fijar ese alcance no se emite Pass to detail. Review Gate posterior debe recibir la matriz, el test de continuidad, los límites Windows/relaunch y la clasificación de fallos preexistentes. El gate anterior de limpieza tras SIGKILL y la investigación de CPU de #1371 permanecen separados.

## Verificación y límites

En `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate`:

- `git apply --check ../sealed/candidate.diff` dentro de `candidate`: PASS, exit 0.
- `cargo build --locked --manifest-path cli/Cargo.toml` dentro de `candidate`: PASS, exit 0.
- `cargo fmt --manifest-path candidate/cli/Cargo.toml -- --check`: PASS, exit 0.
- `python3 stream-spike.py`: PASS, exit 0.
- `rustc line-limit-probe.rs -o line-limit-probe && ./line-limit-probe`: PASS, exit 0, longitud 1048576.
- `python3 cli-proof.py <binary> <normal|preburst|error|quiet-writer> [verbosity] [bound]`: recolecciones exit 0; los returncodes reales de los comandos están en la tabla/recibos. Ver `verification.json` para las 12 pruebas exactas y sus SHA-256.
- `python3 verify-gate.py`: PASS, exit 0; 12 pruebas verificadas, un intento confuso excluido, 474 fuentes base intactas, candidato con exactamente +19/-0 en un archivo, sin procesos propios restantes.
- `python3 -m py_compile cli-proof.py launch-fixture.py stream-spike.py verify-gate.py`: PASS, exit 0.

No se ejecutó la suite completa ni CI Windows/Linux, no se midieron días de sesión ni flatness de threads/fds durante muchos relanzamientos. Estos límites no se convierten en resultados verdes.
