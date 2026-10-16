# agent-browser #1371: CPU con el daemon vivo

17 de septiembre de 2026. Seguimiento solicitado por Hunter después de aclarar que los comentarios de [#1371](https://github.com/vercel-labs/agent-browser/issues/1371) describen sesiones vivas con CPU alta, no solamente procesos huérfanos tras SIGKILL.

## Resultado

No se reprodujo el consumo sostenido de 85–100% por helper. Se completaron cuatro combinaciones de agent-browser/Chrome, de aproximadamente 6–7,5 minutos cada una, con New Tab, foco del buscador, pestañas en segundo plano, cierre de New Tab y retorno repetido a about:blank. El daemon permaneció vivo durante las mediciones; no hubo SIGKILL como estímulo del experimento.

Esto es un resultado negativo acotado, no evidencia de que el incidente reportado no exista ni de que esté resuelto. Los reportes hablan de sesiones de varios días, otras revisiones de Chrome y cargas previas desconocidas.

## Matriz medida

Máquina: macOS 26.6.2 (25G83), Darwin 25.6.0, arm64, Apple M5 Pro. Fuente actual ensayada: `aff6125c023b810ea3f2e5deec5379e9a4270bdc`, agent-browser 0.38.1. También se descargó el binario oficial 0.27.0 a una carpeta aislada, sin instalación global, y se verificó su SHA-256 contra el digest de GitHub.

Valores: promedio de CPU del grupo completo de Chrome durante cada fase, calculado con deltas del tiempo de CPU acumulado. 100% corresponde a un núcleo. No son porcentajes del total de núcleos de la máquina.

| agent-browser | Chrome | New Tab 60 s | Buscador enfocado 60 s | Tras cerrar New Tab 60 s | Blank tras seis ciclos 120 s |
|---|---|---:|---:|---:|---:|
| 0.38.1 | CfT 152.0.7977.64 | 0,18% | No ejecutado | 0,25% | 0,26% |
| 0.38.1 | CfT 151.0.7922.71 | 0,31% | No ejecutado | 0,23% | 0,28% |
| 0.38.1 | Google Chrome 153.0.8010.52 | 0,25% | 0,33% | 0,18% | 0,10% |
| 0.27.0 | CfT 151.0.7922.71 | 0,20% | 0,84% | 0,23% | 0,29% |

Cada secuencia comenzó con 30 segundos de about:blank sin inyectar JavaScript ni crear un contexto WebGL. La consulta del renderer se hizo al final. En las fases estabilizadas no hubo muestras de helpers a 85% o más. Hubo actividad transitoria de arranque; no se interpretó como spin sostenido.

El foco del buscador se comprobó en ambas ejecuciones que lo ejercitaron: `NTP-APP → NTP-SEARCHBOX → CR-SEARCHBOX-INPUT → INPUT[role=combobox]`, con `document.hasFocus() === true`. Es el buscador de la página New Tab. Los intentos `Meta+l` no demuestran por sí solos que se haya enfocado la barra nativa del navegador.

## Hallazgo importante: tab list no representa todos los targets

En la prueba con Chrome 153, después de cerrar la New Tab manejada por agent-browser, el CLI reportó una sola pestaña: about:blank. En ese mismo intervalo, el endpoint de descubrimiento CDP de ese Chrome de prueba mostraba:

- La pestaña about:blank.
- Otra New Tab de Chrome que no aparecía en la lista del CLI.
- Su iframe `chrome-untrusted://new-tab-page/one-google-bar?paramsencoded=`.
- Dos targets `browser_ui` del Omnibox Popup.
- Un target `browser_ui` para el pie de New Tab.

La evidencia está en `cpu-system-focus-94997/raw-targets-after-close-confirmed.json`, capturada a las 19:58:59.228 UTC durante `after-newtab-close`. La captura anterior cuyo nombre termina en `raw-targets-after-close.json` todavía pertenecía a la fase con dos pestañas; no se usa para afirmar que el cierre ya había sucedido.

Por tanto, el dato del comentario “solo about:blank” no descarta New Tab ni UI interna residuales. Pero esos targets estaban con CPU baja en esta máquina. Su presencia no prueba que sean la causa del incidente. Tampoco se hizo una ablación de todos los targets internos: se cerró la New Tab registrada por el CLI, no la restante fuera de su inventario.

## Perfiles y evidencia

Se obtuvieron 18 trazas CDP y 54 muestras nativas de proceso en las cuatro ejecuciones completas. El intento histórico interrumpido añadió dos trazas y seis muestras, conservadas por separado: total 20 trazas y 60 muestras.

Las muestras nativas incluyen navegador, GPU y un renderer seleccionado por CPU. El hilo principal del navegador, por ejemplo en `newtab-foreground-90301-sample.txt`, permaneció en la espera de eventos de AppKit/CoreFoundation terminando en `mach_msg2_trap` durante sus 280 muestras. Las trazas muestran poca actividad en las ventanas observadas, no un bucle de composición sostenido. Muchas funciones de Chrome solo se simbolizan como `ChromeMain + offset`; no se presenta la ausencia del nombre “Omnibox” como prueba de ausencia de ejecución.

El perfilado se realizó en ventanas separadas de los intervalos usados para los promedios de la tabla. Las duraciones inclusivas de eventos anidados no se sumaron como si fueran CPU independiente. La captura de vídeo se omitió porque introduce trabajo de renderizado y no prueba consumo de CPU; se guardaron screenshots de New Tab, snapshots AX, procesos, deltas de CPU y perfiles.

Los procesos conservaron su relación Chrome PPID → daemon durante todas las mediciones. Cada ejecución utilizó sesión, socket y perfil temporal propios. Algunas ventanas de las ejecuciones se solaparon, por lo que estos números son diagnósticos locales, no un benchmark de rendimiento aislado.

## Comandos y verificación

Directorio: `/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro`.

| Comando | Resultado |
|---|---|
| `bun live-cpu.ts 152.0.7977.64 baseline` | Exit 0, secuencia completa |
| `bun live-cpu.ts 151.0.7922.71 baseline` | Exit 0, secuencia completa |
| `bun live-cpu.ts system focus` | Exit 0, secuencia completa; advertencia de cierre redundante |
| `bun live-cpu.ts 151.0.7922.71 old-focus-ref historical-0.27.0/agent-browser-darwin-arm64` | Exit 0, secuencia completa |
| `bun live-cpu.ts 151.0.7922.71 old-focus historical-0.27.0/agent-browser-darwin-arm64` | Exit 1, intento conservado: selector por rol no encontró el buscador; corregido usando ref AX fresco |
| `bun analyze-live-cpu.ts cpu-152-baseline-90039 cpu-151-baseline-90339 cpu-system-focus-94997 cpu-151-old-focus-ref-97412 cpu-151-old-focus-94649` | Exit 0, análisis de las cinco capturas |
| `python3 verify-live-cpu.py` | Valida perfiles, fases, foco, diferencia CLI/CDP, hash histórico y limpieza; recibo final en `verification.json` |
| `python3 verify-evidence.py` | Exit 0, 474 archivos de fuente idénticos al archive original |

Advertencia: en Chrome 153, el `close` principal terminó correctamente. El `finally` del arnés intentó otro `close` 282 ms después y recibió exit 1, socket inexistente. La primera verificación falló por exigir cero errores en todos los comandos. Se refinó para aceptar únicamente ese cierre posterior a la finalización, con su error exacto y la limpieza comprobada; no se ocultó ni reinterpretó como éxito de ese comando. La secuencia de CPU y perfiles terminó antes del aviso.

No se cambiaron flags GPU, prioridades de procesos, perfiles del usuario, producción, commits o GitHub. No se dejó un navegador de prueba ejecutándose.

## Qué falta y siguiente paso

No se recrearon cuatro días de antigüedad, suspensión/reanudación del equipo, la revisión exacta 151.0.7922.175, ni la página real de dashboard/Next.js que originó algunos incidentes. La versión 148 del reporte inicial tampoco se ensayó. No se reprodujo la integración de OpenClaw/Codex ni su patrón de reintentos.

La siguiente evidencia útil es capturar una instancia que ya esté en el estado de CPU alta, antes de cerrarla: árbol y deltas de CPU, lista cruda de targets además de `tab list`, versiones, y `sample` del browser/GPU/helper afectado. Con eso se puede distinguir renderizado de New Tab/omnibox, una tarea de renderer o espera/bloqueo de IPC. Todavía no hay base para elegir un arreglo de CPU ni para aprobar un nuevo Solution Gate sobre ese síntoma. El gate anterior corresponde exclusivamente al defecto distinto de limpieza tras muerte del daemon.

## Ubicación de artefactos y fuentes

Capturas y scripts: `/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro/live-cpu-data/`. Cada subdirectorio contiene `results.json`, `analysis.json`, screenshot, trazas y muestras. Scripts: `live-cpu.ts`, snapshot inicial `live-cpu-v1.ts`, `analyze-live-cpu.ts`, `verify-live-cpu.py`.

Resumen canónico y verificación: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1371/live-cpu/`.

Binario histórico: [release 0.27.0](https://github.com/vercel-labs/agent-browser/releases/tag/v0.27.0), asset `agent-browser-darwin-arm64`, SHA-256 `a703fd9b74836d2849cfd6deb279e5d8ddcb768aa7b3d9c00352166cb930757a`.

Pistas externas consultadas, no adoptadas como diagnóstico: [browser-harness: selección accidental de un popup interno](https://github.com/browser-use/browser-harness/commit/23ce2ec464a3b17b319896d46721edc17aa5dbc6) y [Hermes: sesiones vivas durante 47 horas con helpers ocupados](https://github.com/NousResearch/hermes-agent/issues/100855). Son otras integraciones, no reproducciones de este experimento.
