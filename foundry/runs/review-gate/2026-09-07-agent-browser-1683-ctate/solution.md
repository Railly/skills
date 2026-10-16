# Solución local para los dos findings de ctate

Contrato congelado: contract.md. Oráculo: texto de ctate revalidado y protocolo CDP Browser.setDownloadBehavior. Perfil high-risk por persistencia y ciclo de vida.

## Reconstrucción y límites

FX produjo fx-shaping.json sin ver el candidato, sobre merge 8a346a2. Reportó openai/gpt-6-astra, misma familia que implementador. El primer subagente devolvió solo un acuse de instrucciones: no produjo una propuesta y no cuenta como evidencia. Su llamada inicial tuvo un error de esquema (reasoning_effort vacío); se inspeccionó capacidad y corrigió el argumento, sin retry idéntico. Se solicitó una revisión posterior concreta. No hay independencia entre familias demostrada.

## R y fit check

| R | Requisito establecido | A: intención provisional y commit al finalizar | B: asignar temprano y restaurar booleano |
|---|---|---|---|
| R0 | Descarga en destino propio sin reconfigurar default/otra sesión | Pasa en Chrome con ID explícito | Pasa con el mismo ID explícito |
| R1 | Errores no activan aislamiento en memoria ni tras reinicio | Pasa para validación/transporte/storage; fallo de escritura ejecutado y verde | Falla: publicación del binding sobrevive al rollback booleano |
| R2 | Éxito compatible persiste aislamiento con omisión y reconexión | Pasa URL/puerto, estado y target conservados | Pasa camino feliz |
| R3 | Conservar binding, storage, cierre y recuperación existentes | Cinco pruebas de integración pasan | Falla ante persistencia temprana |
| R4 | Conservar main y ámbito local autorizado | Pasa merge sin rebase | Pasa |

A1: se deriva intención desde estado previo OR flag verdadero, sin mutar el estado.
A2: URL, puerto e implícito CDP/auto reciben intención explícita. Aplicar binding consulta el BrowserManager real, no una intención aún no confirmada.
A3: conexiones aisladas difieren publicación del binding hasta después de las operaciones fallibles. commit_isolated_connection publica el binding y después fija el estado sticky. Fallo de publicación usa rollback de conexión.
A4: los rollbacks descartan contextos nuevos no persistidos y conservan los preexistentes. Red de setup usa el mismo rollback.
A5: descarga envía el browserContextId de la sesión. El comando conserva allowAndName y el destino solicitado.
A6: integración de recording adopta main, que captura página activa; se conserva filtro de targets ajenos.

Evidencia antes/después: sticky-red.log, sticky-green.log; download-red.log (default control pasa, A cancela), download-green.log; sticky-e2e-green.log (fallo storage luego reconexión; éxito y omisión conservan contexto, target y cinco sustratos de storage).

S1 sobrealcance: no se modifica parsers/flags ni se reescribe motor de descargas. S2 subalcance: se incluye persistencia y no solo booleano. S3 inversa: error previo true conserva intención, close exitoso borra. S4 proxies: no basta success, se comparan bytes, contextos y storage. S5: binding conserva formato y cleanup dueño existente. S6: no nuevo wire format. S7: CLI real realiza descargas. S8: particiones derivadas del contrato. S9: baseline rojo antes del fix, cuatro mutaciones detectadas. S10: sustrato Chrome real. S11: URL/puerto/implícito usan helper común. S12: BrowserContext es primitiva de partición, no frontera contra controladores con acceso CDP global. S13: omisión OR previo y prueba de continuidad.

Veredicto: A seleccionado para corrección local, sujeto a verificaciones finales y gap de independencia. Sin autorización de promoción remota y sin afirmación de gate independiente completo.

## Revisión de la solución tras FX

La revisión fx-review.json encontró tres variantes reproducidas con evidencia roja: primer flag transformado en entorno del daemon (first-request-red.log), transición pinned a nuevo contexto sin binding durable (pinned-implicit-red.log), y petición implícita mal formada que persistía antes del dispatch (implicit-red.log). A se amplía con A7: el flag viaja en el comando, no inicializa estado sticky por DaemonOptions; A8: un binding de contexto distinto no restaura su target antiguo; A9: lanzamiento implícito confirma al completarse el comando, y ante error hace rollback manteniendo la intención previa. El entorno real declarado por el usuario sigue siendo configuración explícita preexistente.

La observación sobre close se refuta: el HEAD remoto original e2607d6 ya resetea isolate_context=false al disponer el contexto. La frase ambigua del primer prompt de revisión no modifica el contrato congelado ni la instrucción de conservarlo. No se alteró ese reset.

Fit check local actualizado: R0, R1, R2, R3 y R4 pasan las pruebas ejecutadas; autodetección real y plataformas adicionales permanecen sin ejecutar. La independencia entre familias sigue sin demostrarse. Cinco e2e y tres tests CLI, incluyendo diez rondas del stress, pasan en isolation-e2e-v2.log y cli-v2.log.

## Ubicación final del commit

El commit se centralizó después del drain final de execute_command, pues ese drain todavía puede devolver error. handle_launch ya no publica aislamiento; la persistencia genérica omite conexiones aisladas pendientes. Revisión estática acotada fx-final.json no encontró defectos concretos nuevos. El fallo tardío del drain no se inyectó dinámicamente y se conserva como gap.

La atomicidad entre dos envelopes del CLI queda fuera del contrato: un launch válido ya completado confirma aislamiento; una petición posterior denegada conserva ese estado previo. Esto implementa la instrucción de persistir tras conexión compatible exitosa. No se cambió la política de dos solicitudes del CLI.

Estado final: cinco e2e, tres tests CLI y 1256 tests ordinarios pasan; fmt/CI clippy pasan. HEAD y base exactos en manifest.json. Gate estricto incomplete, sin afirmar independencia entre familias ni completar las particiones no ejercitadas.

## Seguimiento con otra familia

Claude Opus 5 revisó mediante FX y el token de Keychain. El intento exploratorio expiró a 300 segundos; dos paquetes posteriores produjeron revisiones completas. La revisión sobre 0a53aefd encontró tres variantes confirmadas con Chrome: teardown tras reconexión persistida, indicador histórico de recreación y éxito sin target durable. Se corrigieron en 5b2b1cc6b0b03b584799fe89d0a61f46df5d1355. El rollback ahora depende de la propiedad real del contexto sin persistir y vive después del drain; el commit rechaza un contexto nuevo sin binding. Se preserva un contexto ya persistido aunque desaparezca su target. Evidencia y adjudicación: cross-family-dispositions.json, trazas cross-family-*-red.log y fx-cross-family-final.json. Esta revisión es posterior a implementar y no reemplaza retrospectivamente el shaping original.

El seguimiento de Claude confirma los tres arreglos y el orden del commit. Cuatro mutaciones repetidas en el árbol final fallan conductualmente; 1256 tests ordinarios, 5 e2e, 1 prueba Chrome del commit, 3 tests CLI con 10 rondas, fmt y Clippy pasan. Continúan los gaps dinámicos y de plataforma de run-report.json. Sin publicación remota.
