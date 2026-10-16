# #1371: configuración, hipótesis y criterios previos

Continuación solicitada el 2026-09-17: seguir planteando hipótesis y probar configuraciones. Solo pruebas locales aisladas, no cambios de producto.

## Criterio de reproducción

El resultado de interés es CPU sostenida sin trabajo esperado, con daemon vivo, y especialmente actividad que persiste al detener animación/polling o al volver a about:blank. Aumentar la CPU mientras renderizamos deliberadamente una página no demuestra el bug. Cada señal necesita repetición y una ablación que elimine el factor supuesto sin cambiar los demás.

## Hipótesis

| ID | Predicción falsable | Contraste |
|---|---|---|
| H1 | El fallback software puede dejar compositores/renderer ocupados tras cesar el trabajo | Defaults vs `--use-angle=swiftshader`; verificar backend real, medir workload activo, detenerlo sin cambiar target y finalmente blank |
| H2 | El compositor CPU por GPU deshabilitada tiene comportamiento distinto de WebGL SwiftShader | Defaults vs `--disable-gpu`, mismo workload y transiciones |
| H3 | `--disable-backgrounding-occluded-windows` mantiene repintado residual de pestaña inactiva | Defaults vs retirar exactamente ese argumento mediante wrapper exec; no usar `=false`, porque la presencia de un switch no prueba su negación |
| H4 | Una navegación pendiente mantiene UI nativa/omnibox repintando incluso tras completarse | Endpoint HTTP local que retiene respuesta, observar con `open` en curso, completar con página vacía y medir recuperación |
| H5 | El renderer o el compositor conserva trabajo después de detener una animación/polling o de cerrar su pestaña | Página local instrumentada, contador de frames, `stopWork()` in-place, blank, cierre; comparar la continuidad y CPU |
| H6 | Backpressure del stderr de Chrome impide progresar al navegador y puede explicar muestras bloqueadas en write | Solo si H1–H5 no separan casos: comparar logging verbose hacia pipe de daemon vs mismo logging redirigido a archivo por wrapper. Es un estrés sintético, no prueba del incidente salvo firma equivalente |

## Diseño inicial

Chrome for Testing 151.0.7922.71, agent-browser 0.38.1 de aff6125. Cuatro configuraciones: baseline, SwiftShader forzado, GPU deshabilitada, y default sin el switch de backgrounding. El mismo wrapper Python hace exec del Chrome real en todos los casos, manteniendo PID/grupo; solo cambia el factor solicitado. Se deja registro de los argumentos efectivos, y se verifica renderer real.

Mismas fases por configuración: blank; New Tab; documento local con canvas moderado, CSS y polling; detener trabajo conservando documento; navegación retenida; liberación a blank; cierre. Se mide el grupo Chrome y cada proceso mediante deltas de tiempo CPU, separado de ventanas de profiling. Se enumeran targets CDP locales para no confundir tab list con inventario completo.

Límites: una configuración por vez; solo sesiones/perfiles propios; máximo 2 GiB aproximados de RSS agregada o 400% CPU agregado sostenido; no estrés de memoria, suspensión del equipo, cambios globales, lectura de perfiles personales ni SIGKILL como estímulo. Si aparece señal, capturar sample nativo y trace breve antes de la ablación. Comandos con espera de diagnóstico acotada; limpieza verificada al terminar incluso si una prueba falla.

Las pruebas duran minutos, no reproducen antigüedad de varios días. La página local no es el dashboard original. No se atribuirá la causa a flags solo por su presencia ni se seleccionará arreglo mientras la señal se explique por trabajo activo esperado.

## Continuación tras interrupción

Los recibos de baseline y SwiftShader terminaron y limpiaron sus perfiles. SwiftShader verificó backend software y ~104% de CPU en la escena activa, pero cayó a ~0,28% al detener exactamente los mismos frames y polls. `cfg-nogpu-20291` quedó sin recibo terminal después de la escena activa; al retomar no había proceso ni perfil, por lo que se conserva como incompleto, sin inferir su causa. No se llegó a la variante backgrounding.

Se repetirá el baseline con el timeout HTTP local corregido a 30 s, se completará nogpu, y se comparará SwiftShader con y sin el switch de backgrounding en un escenario realmente en segundo plano. Una pestaña de control del mismo origen consultará y detendrá el dashboard mediante BroadcastChannel, sin traerlo al frente. Se medirá `document.visibilityState`, progreso de frames/polls y pausa de animaciones, no se asumirá que la pestaña está oculta por cambiar el tab activo.

Las ejecuciones se harán secuencialmente y cada comando tendrá su propio recibo de salida; no se tratará el estado perdido de la herramienta como resultado de la prueba.
