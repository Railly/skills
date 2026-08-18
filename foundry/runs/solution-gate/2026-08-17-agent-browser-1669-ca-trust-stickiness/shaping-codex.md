# Shaping artifact: confianza de CA privada con continuidad de sesión

## 1. Tabla R completa

| ID | Estado | Requisito | Criterio de aceptación |
|---|---|---|---|
| R0 | Settled, core goal | Chromium local en Linux confía en una CA privada seleccionada sin desactivar la verificación ordinaria. | Navegación válida aceptada mediante confianza selectiva. |
| R1 | Settled | Se acepta una hoja con hostname correcto firmada por la CA seleccionada aunque el servidor omita esa CA de la cadena. | Caso discriminador aceptado. |
| R2 | Settled | Una hoja con hostname incorrecto sigue siendo rechazada. | Error de hostname observado. |
| R3 | Settled | Una hoja firmada por otra CA sigue siendo rechazada. | Error de autoridad observado. |
| R4 | Settled | Hojas expiradas o todavía no válidas siguen siendo rechazadas. | Ambos casos temporales rechazados. |
| R5 | Settled | Sin configuración de CA, el comportamiento actual no cambia. | Mismos resultados y política de relanzamiento que la base. |
| R6 | Settled | Sesiones concurrentes con CAs diferentes quedan aisladas en material de confianza y procesos. | Ambas funcionan simultáneamente sin confianza cruzada. |
| R7 | Settled | Un prerrequisito ausente o fallido produce un error accionable antes de lanzar Chromium y no deja estado creado. | No aparece proceso Chromium ni residuo activo. |
| R8 | Settled | Cierre normal, crash del browser, shutdown del daemon y terminación irrecuperable tienen contratos observables de cleanup. | Cada ruta tiene resultado verificable; cualquier residuo irrecuperable es inerte y acotado. |
| R9 | Settled | Después de establecer la CA en `open`, un `snapshot` que omite la opción conserva daemon, target, URL, confianza y estado de página. | Todos los observables permanecen iguales. |
| R10 | Settled | Repetir la misma CA efectiva reutiliza la sesión viva. | Sin cambio de PID ni browser target. |
| R11 | Settled | Seleccionar otra CA reemplaza deliberadamente el browser. | La nueva CA queda activa y la anterior deja de serlo. |
| R12 | Settled | Quitar una CA requiere una representación explícita y reemplaza deliberadamente el browser. | La omisión no limpia; el clear sí lo hace. |
| R13 | Settled | `--ignore-https-errors` permanece como bypass separado y no se combina silenciosamente con confianza selectiva. | La combinación se rechaza antes de trabajo parcial. |
| R14 | Settled | CDP remoto, auto-connect, providers, otros engines, perfiles y sistemas no soportados conservan su comportamiento o rechazan claramente la opción. | Ninguna modalidad ignora silenciosamente la petición. |
| R15 | Settled | CLI, config, entorno, MCP, ayuda, README, docs, schemas, core skill y tests expresan un único contrato. | Paridad completa de nombres, precedencia, clear y errores. |
| R16 | Settled, must not change | La confianza TLS del propio CLI queda fuera del cambio. | Ninguna modificación del cliente HTTP del CLI. |
| R17 | Settled, must not change | Sesiones sin la opción y configuraciones no relacionadas mantienen sus reglas actuales de reuse y relaunch. | Regresiones ausentes en el hash y los modos existentes. |
| R18 | Settled | El diseño permite conservar trabajo y atribución de contribuidores cuando sea compatible. | La shape separa contrato, estado y backend de confianza para permitir integración selectiva. |
| R19 | Derived | La identidad efectiva de una CA se basa en el contenido certificado normalizado, no en el path suministrado. | Dos paths con el mismo DER se consideran la misma CA; un cambio de contenido se considera reemplazo. |
| R20 | Derived | El archivo se valida y se copia a material privado antes del lanzamiento, evitando dependencia posterior del path y cambios TOCTOU. | La sesión usa un snapshot validado y owner-only. |
| R21 | Derived | La CA proporcionada debe ser un único certificado CA utilizable; bundles ambiguos, hojas y entradas malformadas fallan cerradas. | Error previo al lanzamiento con causa concreta. |
| R22 | Derived | La feature no requiere privilegios ni modifica almacenes globales, del usuario o perfiles suministrados por el usuario. | Ningún cambio fuera del workspace privado de la generación del browser. |
| R23 | Derived | La identidad efectiva y el estado de cleanup deben ser observables sin exponer contenido innecesario del certificado. | Estado muestra modo, digest o fingerprint y resultado de cleanup. |

## 2. Shapes

### S1. NSS privado por generación de browser, con estado efectivo en el daemon

Shape recomendada.

Partes:

1. API triestado:
   - CLI: `--ca-certificate <path>` para establecer y `--no-ca-certificate` para limpiar.
   - Config: propiedad ausente significa omisión; string significa establecer; `null` significa clear.
   - Entorno: variable ausente significa omisión; path no vacío significa establecer; valor vacío significa clear.
   - MCP: campo ausente significa omisión; string significa establecer; `null` significa clear.

2. El daemon posee `Unset | Set { digest, snapshot } | Cleared`. Un comando sin campo no modifica el estado efectivo.

3. La CA se parsea, valida, normaliza y copia antes de tocar el browser existente. La identidad de reuse es el digest del DER normalizado.

4. Para cada generación local de Chromium se crea un home o almacén NSS privado. La CA se importa como autoridad confiable usando `certutil`. Solo el hijo Chromium recibe el entorno que selecciona ese almacén.

5. El digest de la CA efectiva entra en el `launch_hash`, no en el fingerprint del daemon:
   - Omitido o mismo digest: reuse.
   - Digest diferente o clear: replacement.
   - Sin CA: hash y comportamiento actuales.

6. El modo se limita inicialmente a Chromium local en Linux, sin perfiles de usuario. CDP, auto-connect, providers, Lightpanda, otros sistemas y perfiles se rechazan antes de preparar estado.

7. El reemplazo prepara y valida primero la nueva generación. El estado efectivo solo se confirma cuando el nuevo browser queda operativo.

8. El proceso browser y su workspace de confianza comparten ownership de lifecycle. Una terminación no recuperable necesita un guardián o mecanismo equivalente que mate el grupo de procesos y retire el workspace cuando desaparezca el daemon.

9. `--ignore-https-errors` y CA selectiva son modos mutuamente excluyentes.

Flags de incertidumbre:

- ⚑ U1: falta demostrar qué ubicación NSS consulta el Chromium distribuido y cómo aislarla mediante entorno del hijo.
- ⚑ U4: falta probar `certutil`, los trust flags exactos y el cleanup ante `SIGKILL`.
- ⚑ El cambio temporal de `HOME` o variables NSS podría alterar otros comportamientos de Chromium.
- ⚑ Debe comprobarse compatibilidad headless y headed.

### S2. Importar la CA en el perfil Chromium seleccionado

Partes:

1. La CA se importa en el almacén asociado al `user-data-dir`.
2. El perfil conserva la confianza entre comandos y relanzamientos.
3. Clear elimina la entrada del perfil.
4. La identidad del perfil y de la CA participa en la decisión de relaunch.

Flags:

- ⚑ No está establecido que Chromium Linux consulte un trust store contenido en `user-data-dir`.
- ⚑ Un perfil proporcionado por el usuario se convierte en estado mutable permanente.
- ⚑ Dos sesiones que compartan perfil dejan de estar aisladas.
- ⚑ Crash o terminación durante importación o clear puede dejar confianza residual.

### S3. Importar temporalmente en el NSS del usuario o almacén del sistema

Partes:

1. Antes del lanzamiento se añade la CA al almacén que Chromium consulta normalmente.
2. En close o clear se elimina la entrada.
3. Un contador o lock intenta coordinar sesiones concurrentes.

Flags:

- ⚑ La confianza afecta procesos ajenos a la sesión.
- ⚑ CAs iguales, aliases y procesos concurrentes hacen ambiguo el ownership.
- ⚑ Un crash entre importación y eliminación deja confianza global residual.
- ⚑ Puede exigir privilegios o modificar estado permanente del usuario.

### S4. Bypass por SPKI derivado de la CA

Partes:

1. Se calcula un SPKI allowlist y se pasa a Chromium.
2. No se mantiene un trust store.
3. El valor entra en el hash de lanzamiento.

Flags:

- ⚑ Un SPKI de CA no concede semántica de trust anchor para hojas con claves distintas.
- ⚑ Un bypass SPKI no representa validación ordinaria de cadena.
- ⚑ Puede omitir hostname, vigencia u otros errores para las claves permitidas.

## 3. Fit check binario

`✓†` sigue siendo un fit positivo, condicionado a que los spikes demuestren la premisa técnica indicada.

| R | S1 NSS privado | S2 perfil | S3 store global | S4 SPKI |
|---|:---:|:---:|:---:|:---:|
| R0 | ✓† | ✓† | ✓ | ✗ |
| R1 | ✓† | ✓† | ✓ | ✗ |
| R2 | ✓† | ✓† | ✓ | ✗ |
| R3 | ✓† | ✓† | ✓ | ✗ |
| R4 | ✓† | ✓† | ✓ | ✗ |
| R5 | ✓ | ✓ | ✓ | ✓ |
| R6 | ✓ | ✗ | ✗ | ✓ |
| R7 | ✓† | ✗ | ✗ | ✓ |
| R8 | ✓† | ✗ | ✗ | ✓ |
| R9 | ✓ | ✓ | ✓ | ✓ |
| R10 | ✓ | ✓ | ✓ | ✓ |
| R11 | ✓ | ✗ | ✗ | ✓ |
| R12 | ✓ | ✗ | ✗ | ✓ |
| R13 | ✓ | ✓ | ✓ | ✗ |
| R14 | ✓ | ✗ | ✗ | ✓ |
| R15 | ✓ | ✓ | ✓ | ✓ |
| R16 | ✓ | ✓ | ✓ | ✓ |
| R17 | ✓ | ✗ | ✗ | ✓ |
| R18 | ✓ | ✓ | ✓ | ✓ |
| R19 | ✓ | ✓ | ✓ | ✓ |
| R20 | ✓ | ✗ | ✗ | ✓ |
| R21 | ✓ | ✓ | ✓ | ✗ |
| R22 | ✓ | ✗ | ✗ | ✓ |
| R23 | ✓ | ✓ | ✗ | ✓ |

### Notas de fallo

- S1 no tiene fallos contractuales conocidos, pero R0–R4 dependen de demostrar la integración NSS real. R7 y R8 dependen de probar preparación transaccional y cleanup irrecuperable.
- S2 falla aislamiento y no mutación: el perfil puede compartirse, persistir fuera de la sesión o pertenecer al usuario. Change y clear tampoco ofrecen rollback seguro.
- S3 falla por definición de scope. La confianza existe fuera del browser y no puede garantizar cleanup después de una muerte irrecuperable.
- S4 falla la propiedad central: una allowlist SPKI no convierte una CA en trust anchor para hojas con claves independientes. Tampoco garantiza que hostname y vigencia continúen verificándose.

## 4. Survivor recomendado

El survivor es S1, condicionado a los spikes de confianza NSS y lifecycle.

Encaja con los mecanismos existentes:

- El daemon ya mantiene estado efectivo por sesión.
- `pin-tab` demuestra el precedente de ausencia como “sin cambio” y un valor explícito como desactivación.
- El `launch_hash` ya gobierna inputs horneados en el proceso browser.
- El fingerprint del daemon está reservado para configuración realmente propiedad del proceso daemon.
- Chromium local ya recibe un perfil temporal y cleanup asociado a `ChromeProcess`.

La CA debe ser estado efectivo del daemon y configuración de lanzamiento del browser. No debe entrar en el fingerprint del daemon: hacerlo convertiría una omisión posterior en una diferencia de configuración y rompería R9.

S1 todavía no está lista para implementación. Si el spike NSS no demuestra aislamiento real y todos los discriminadores TLS, la shape queda eliminada y no hay survivor probado dentro de los mecanismos evaluados.

## 5. Alternativas rechazadas

### S2, confianza dentro del perfil

Rechazada porque mezcla confianza de sesión con estado persistente o compartible del usuario. No satisface aislamiento, cleanup ni el must-not-change de perfiles existentes.

### S3, modificación del store global o del usuario

Rechazada porque el alcance temporal no puede convertir una mutación global en confianza de sesión. Locks y cleanup best-effort no reparan la exposición a otros procesos ni la terminación irrecuperable.

### S4, bypass SPKI

Rechazada porque no implementa confianza de CA. El caso obligatorio con hoja de clave independiente y CA omitida discrimina directamente contra esta shape.

## 6. Spikes requeridos

### Spike A: integración NSS aislada en Linux

Debe determinar:

- Qué store consulta exactamente el Chromium soportado.
- Qué variables o paths permiten hacerlo privado para un único hijo.
- Qué flags de `certutil` producen semántica de trust anchor.
- Si funciona igual en headless y headed.

Pasa únicamente si satisface los cinco discriminadores: cadena omitida aceptada; hostname incorrecto, CA no relacionada, expirado y todavía no válido rechazados.

### Spike B: aislamiento y efectos laterales del entorno

Ejecutar dos sesiones concurrentes con homes o stores privados y CAs diferentes. Verificar ausencia de confianza cruzada y que cambiar `HOME` o variables NSS no rompe perfil temporal, discovery, keychain, downloads ni launch.

### Spike C: prerrequisitos y preparación transaccional

Probar `certutil` ausente, versión incompatible, certificado malformado, hoja en lugar de CA, bundle ambiguo, filesystem no escribible y fallo de importación. Todos deben fallar antes de Chromium y retirar el staging.

### Spike D: lifecycle irrecuperable

Probar close, crash de Chromium, shutdown del daemon y `SIGKILL` del daemon. El spike debe seleccionar y demostrar un mecanismo de guardianía o cleanup equivalente. No basta con cleanup en `Drop`, porque no corre ante `SIGKILL`.

### Spike E: contrato triestado y precedencia

Validar la misma transición en CLI, config, entorno y MCP:

- Ausente: conservar.
- Mismo certificado, incluso desde otro path: reuse.
- Certificado diferente: replacement.
- Clear explícito: replacement sin CA.
- CA selectiva junto con `--ignore-https-errors`: rechazo previo.

También debe fijar la precedencia cuando CLI, config y entorno expresen estados diferentes.