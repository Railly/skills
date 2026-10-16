# agent-browser #1371: contraste de configuraciones

2026-09-17. Continuación solicitada por Hunter para seguir planteando hipótesis y buscar una reproducción. Base de código `aff6125c023b810ea3f2e5deec5379e9a4270bdc`, agent-browser 0.38.1, Chrome for Testing 151.0.7922.71, macOS arm64 / Apple M5 Pro.

## Conclusión

Se reprodujo más de un núcleo de CPU al renderizar una escena WebGL con software, pero no un bucle persistente cuando cesa el trabajo. El documento oculto deja de avanzar frames tanto con la bandera de backgrounding actual como sin ella. Las navegaciones pendientes elevan moderadamente la CPU y se recuperan al completar.

Se encontró un bloqueo distinto, reproducible 2/2: con logging verboso, el `stderr` habitual de Chrome hace que `open` y `close` no respondan dentro de los límites del arnés. Con exactamente los mismos flags y `stderr` redirigido a archivo, `open`, `snapshot` y `close` funcionan 2/2. Una muestra nativa del navegador registra el hilo principal detenido en `write`. La CPU estabilizada de ese caso es ~2%, no 100%.

No se presenta este bloqueo como causa demostrada del spin de #1371, ni se aprobó un cambio de flags o una solución de producto. La coincidencia con una pila bloqueada en escritura es una pista, no prueba de que los incidentes originales compartan causa.

## Hipótesis y diseño

Documento previo a las pruebas: `/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro/config-hypotheses.md`.

- H1: fallback software deja trabajo residual después de renderizar.
- H2: desactivar GPU tiene un efecto distinto del backend WebGL software.
- H3: el switch `--disable-backgrounding-occluded-windows` impide que una pestaña inactiva ceda trabajo.
- H4: navegación pendiente deja UI/omnibox repintando después de completarse.
- H5: frames, CSS o polling continúan después de una parada explícita.
- H6: backpressure de `stderr` bloquea Chrome.

Cada configuración usó sesión, socket y perfil temporal propios. Ejecuciones secuenciales, máximo aproximado de 2 GiB de RSS agregada y límite conservador de 400% de CPU por intervalo. Los promedios se midieron con deltas del tiempo de CPU de los procesos del grupo de Chrome. 100% equivale a un núcleo, no a toda la máquina.

Un wrapper Python hizo `exec` del mismo Chrome en todos los casos, conservando PID/PGID. Para retirar backgrounding eliminó exactamente el switch; no usó `=false` como negación ficticia. Se conservaron los argumentos efectivos. No se cambiaron instalaciones ni perfiles personales.

La página local dibuja un canvas WebGL de 640×360, una animación CSS y un poll por segundo. `stopWork()` cancela rAF/polling y pausa CSS. El contador de frames/polls se compara antes y después. La navegación pendiente usa un endpoint local cuya respuesta se libera explícitamente. No es el dashboard original del reporte.

## Matriz de CPU

Promedios del grupo Chrome; ventanas de perfilado separadas de las ventanas de medición.

| Configuración | Backend observado | Trabajo activo | Oculto, todavía habilitado | Tras detener trabajo | Navegación pendiente | Blank final |
|---|---|---:|---:|---:|---:|---:|
| Defaults, control repetido | ANGLE Metal / Apple M5 Pro | 13,02% | No ejecutado | 0,12% | 9,60% | 0,33% |
| `--use-angle=swiftshader` | SwiftShader / Vulkan | 104,14% | No ejecutado | 0,28% | 8,50% | 0,89% |
| `--disable-gpu` | SwiftShader / Vulkan | 129,59% | No ejecutado | 0,20% | 10,06% | 0,33% |
| SwiftShader, bandera actual | SwiftShader / Vulkan | 121,18% | 2,18% | 0,20% | 8,10% | 0,77% |
| SwiftShader, sin bandera de backgrounding | SwiftShader / Vulkan | 83,86% | 0,52% | 0,04% | 10,99% | 1,22% |

El primer control adicional midió 15,48% activo y 0,49% detenido. Su fase de navegación emitió una advertencia del timeout HTTP por defecto de Bun, aunque el cliente acabó recibiendo la página. Se repitió con `idleTimeout: 30`; no se usa ese primer intervalo para afirmar una navegación retenida sin interrupciones.

Las diferencias entre ejecuciones activas no son un benchmark general de rendimiento: no se controló temperatura ni el resto del trabajo del equipo, y solo hay una pasada por varias celdas. Sí son una separación grande entre renderizar deliberadamente y permanecer detenido. No hubo helpers estabilizados a ≥85% en las fases de reposo.

## Prueba real de segundo plano

Una segunda pestaña, estática y del mismo origen, consulta y detiene el dashboard mediante BroadcastChannel sin traerlo al frente. Se verificó `document.visibilityState === "hidden"`.

| Caso | Frames al ocultar | Frames 30 s después | Polls antes → después | Después de stop |
|---|---:|---:|---|---|
| SwiftShader + bandera actual | 1768 | 1768 | 29 → 44 | Frames 1768, polls 44, CSS `paused`, sin cambios durante 24 s |
| SwiftShader sin bandera | 2651 | 2651 | 44 → 75 | Frames 2651, polls 75, CSS `paused`, sin cambios durante 24 s |

La bandera actual no impidió la suspensión del rAF de esta pestaña oculta. Esto no prueba comportamiento de ventanas físicamente minimizadas/ocultadas por macOS, ni de toda animación de la UI interna de Chrome. No justifica retirarla globalmente.

## Bloqueo de stderr

Se aplicaron `--enable-logging=stderr --v=1` en ambos lados del contraste. La única diferencia intencional de salida fue conservar el pipe que crea agent-browser o redirigir el descriptor 2 a un archivo antes de hacer exec de Chrome.

| Repetición | Salida de stderr | Open | Snapshot | Close | CPU estable del grupo |
|---|---|---|---|---|---:|
| 1 | Pipe habitual | No respondió en 20 s; CLI detenido, exit 143 | No ejecutado | No respondió en 8 s; exit 143 | 2,09% |
| 1 | Archivo | Exit 0 | Exit 0 | Exit 0 | 1,14% |
| 2 | Pipe habitual | No respondió en 20 s; CLI detenido, exit 143 | No ejecutado | No respondió en 8 s; exit 143 | 1,84% |
| 2 | Archivo | Exit 0 | Exit 0 | Exit 0 | 1,52% |

Los límites de 20/8 segundos pertenecen al arnés de diagnóstico, no son timeouts anunciados por el producto. Los comandos fallidos no se contabilizan como operaciones exitosas: exit 0 del script significa recolección y limpieza completadas.

Evidencia nativa: `stderr-probe-data/stderr-pipe-32313/32323.sample.txt`, líneas 24–70, muestra 185 observaciones del hilo principal terminando en `write` dentro de `libsystem_kernel`. Una pila ocupada por una espera de escritura no equivale a 100% de CPU. Los logs del lado archivo superaron 64 KiB y el navegador siguió respondiendo.

Evidencia de código: `cli/src/native/cdp/chrome.rs:825–831` configura `.stderr(Stdio::piped())`. En la ruta normal `DevToolsActivePort`, líneas 882–883, continúa directamente. La lectura visible de `child.stderr` está en el fallback de error, líneas 884–892. La combinación de código, pila y contraste repetido apunta a backpressure del pipe no consumido en la ruta exitosa. No se instrumentó el descriptor de la llamada `write` ni se desbloqueó esa misma instancia mediante drenaje en vivo, por lo que se conserva ese límite de atribución.

Esto merece una reproducción mínima y un arreglo separados. Redirigir permanentemente a un archivo no está propuesto como arreglo final: perder diagnóstico, crecimiento del log, shutdown y fallback de lanzamiento requieren su propio diseño. No hubo parche ni nuevo Pass de Solution Gate para este hallazgo.

## Estado de las hipótesis

| Hipótesis | Resultado |
|---|---|
| H1 | Backend software confirmado; amplifica carga activa, pero no dejó CPU persistente tras stop en esta escena |
| H2 | Desactivar GPU activó SwiftShader y aumentó carga activa; recuperación correcta después |
| H3 | rAF detenido con pestaña oculta en ambos casos; no se reprodujo falta de throttling de esa pestaña |
| H4 | ~8–11% durante navegación pendiente y caída posterior; no se reprodujo spin residual |
| H5 | Frames/polls estables y CSS pausado después del stop; no se reprodujo continuación del trabajo |
| H6 | Bloqueo con pipe 2/2 y funcionamiento con archivo 2/2; CPU baja, distinto de la firma original |

## Comandos y verificación

En `/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro`:

- `bun config-matrix.ts baseline full && bun config-matrix.ts nogpu full && bun config-matrix.ts swiftshader background && bun config-matrix.ts swiftshaderbg background`: exit 0, cuatro pasadas completas.
- `bun stderr-probe.ts pipe && bun stderr-probe.ts file`: exit 0 en dos repeticiones; los fallos internos esperados del lado pipe quedan explícitos arriba.
- `python3 analyze-config-matrix.py`: exit 0, resumen de todas las capturas.
- `python3 verify-config-experiments.py`: PASS, exit 0; seis matrices completas, una captura incompleta conservada, cuatro pruebas stderr, 36 archivos de perfil verificados, 474 archivos fuente sin cambios, cero procesos/perfiles Chrome de prueba restantes.
- `python3 -m py_compile chrome-config-wrapper.py analyze-config-matrix.py verify-config-experiments.py`: exit 0.

`cfg-nogpu-20291` quedó sin recibo terminal durante la primera ejecución, cuyo identificador de herramienta dejó de estar disponible. Al retomar no había proceso ni perfil asociado. Se conserva como incompleto sin atribuir una causa; `cfg-nogpu-25875` es la repetición completa. La consulta retenida por indisponibilidad del revisor de herramientas no se contó como ejecución.

## Alcance y siguiente paso

El spin sostenido de #1371 con una sesión aparentemente en blanco sigue sin reproducirse. No se replicaron varios días de antigüedad, suspensión/reanudación ni los perfiles/versiones exactos de los reporteros. Tampoco se combinó la saturación de logs con pérdida de GPU o con una sesión envejecida.

Siguiente trabajo justificable: aislar el bloqueo de stderr sin confundirlo con el síntoma CPU; si se decide corregirlo, fijar su contrato de diagnóstico y ejecutar Solution Gate antes de implementar. Para #1371, la siguiente señal fuerte sigue siendo una muestra nativa y lista cruda de targets de una instancia que ya esté al 100%, idealmente distinguiendo tiempo de CPU de espera en `write`.

Datos crudos: `config-matrix-data/` y `stderr-probe-data/` dentro del checkout de reproducción. Resumen/verificación canónicos: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1371/config-experiments/`. Los perfiles, binarios y fuentes permanecen fuera del vault. No se modificó GitHub ni se creó commit, PR o release.
