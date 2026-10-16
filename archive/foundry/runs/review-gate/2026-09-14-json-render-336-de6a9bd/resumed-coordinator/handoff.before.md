# json-render

## Estado activo

Cierre del review de PR #336, 14 de septiembre de 2026. La revisión se interrumpió y Hunter pidió este handoff. **El veredicto sigue `incomplete`; no hay aprobación del cambio.**

- **Entrega, recuperable:** sólo artefactos locales de revisión. El worktree `/Users/raillyhugo/Programming/vercel/json-render-336-review` está limpio, detached en `de6a9bdbc0100ac778dff1ad48ab2f732b7d181e`. No hubo cambios al código, commits, push, comentarios, merge ni release en este ciclo. `git status --short` y `git log --oneline -15` quedaron guardados en `handoff-git-status.txt` y `handoff-git-log.txt` dentro del run.
- **GitHub, recuperable:** PR #336 permanece abierto y mergeable, con `reviewDecision=REVIEW_REQUIRED`. Base `6c7164342a37fab055907f1666658e1333e2cb86`; head idéntico al worktree. Evidencia: `handoff-pr-state.json`, consultado mediante `gh pr view 336 --repo vercel-labs/json-render --json headRefOid,baseRefOid,state,mergeable,reviewDecision,url`.
- **Verificación, recuperable:** build de core ESM/CJS y declaraciones completado; 577 tests de core pasaron, según `core-build.log` y `core-tests.log`. Los checks CI consultados estaban verdes. Typecheck directo de core produjo 115 diagnósticos tanto en base como en head, sin delta tras normalizar rutas y líneas: `typecheck-comparison.json`. El typecheck completo local quedó interrumpido por el setup de dependencias enlazadas.
- **Hallazgos, recuperables:** F1 P1, pérdida del origen de un move en `useUIStream` cuando el destino es rechazado; F2 P2, `StateProvider.onStateChange` anuncia entradas rechazadas dentro de un batch mixto. Ambos tienen observación de API pública y comparación base/head. Están abiertos en `run-report.json`.
- **Test Strength, recuperable:** terminó con `status=fail` y quedó integrado al manifest y al reporte. El receipt registra 20 mutantes: 19 detectados y uno sobreviviente, el guard de origen de `copy`. La suite focal mantuvo 203 tests verdes sin ese guard; una comprobación de propiedad propia detectó el defecto. Evidencia: `test-strength/receipt.json` y `test-strength/copy-survivor-results.json`.
- **Juicio humano:** Hunter autorizó la revisión y este handoff; no hay aprobación humana del diff ni de una corrección. La autorización persistente es `read-only` sobre el repo, con builds/probes locales aislados.
- **Bloqueante de cierre:** faltan receipts completos de Resilience Audit y Security Review, además del cierre de los findings y la independencia exigida por el perfil. Los especialistas dejaron revisión focal, pero no receipts completos de esos métodos. No se puede elevar el gate a pass.

Run canónico: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd`.
Manifest: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/manifest.json`.
Reporte JSON: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/run-report.json`.
Vista generada: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/run-report.md`.
El reporte fue renderizado y validado; el validador devuelve exit 1 por gaps y findings abiertos, conforme a `report-validation.log`.

## Dónde retomar

1. **Primero, verificar que el head siga siendo el mismo.** Un cambio de head invalida el alcance exacto de estos artefactos. Comandos: `git -C /Users/raillyhugo/Programming/vercel/json-render-336-review status -sb` y `gh pr view 336 --repo vercel-labs/json-render --json headRefOid,baseRefOid,state`.
2. Leer `manifest.json`, `run-report.json` y `test-strength/receipt.json` en el run. El receipt de Test Strength apareció después del cierre preliminar y ya fue integrado; no tratarlo como ausente. El estado correcto es fallido, no aprobado.
3. **F1, mayor impacto:** `packages/react/src/hooks.ts:184` conserva su dispatcher propio `getSpecValue → removeSpecValue → setSpecValue`. La nueva validación de core no protege esa secuencia. Repro y evidencia: `coordinator/hook-proof.test.ts`, `coordinator/hook-proof.config.mts`, `coordinator/hook-proof-head.json`, `coordinator/hook-proof-base.json`, `public-export-review.json`. La prueba existente se ejecuta desde `.../coordinator` con `HOOK_PROOF_OUTPUT=hook-proof-followup.json bun x --no-install vitest run --config hook-proof.config.mts`. No hace falta volver a descubrir el caso.
4. **F2:** `packages/react-state/src/index.tsx:156` genera callbacks desde las entradas solicitadas y el snapshot anterior, incluso si core rechazó parte del batch. Evidencia: `consumer/result.json`, `resumed-caller-review/base-invalid-result.json` y sus probes vecinos. La discrepancia de callbacks con paths válidos solapados se reprodujo también en base y fue refutada como regresión nueva; no volver a reportarla como introducida.
5. Revisar la brecha de test de `copy`: `packages/core/src/types.test.ts:624` usa igualdad que no detecta una propiedad adicional con valor `undefined`. El guard puede retirarse sin rojo. `test-strength/copy-survivor-results.json` contiene suite verde mutada, oracle rojo y restaurado verde. Es un hallazgo de cobertura separado de F1/F2.
6. Completar o dejar explícitamente pendientes los métodos faltantes según el alcance que Hunter elija. Ningún fix está autorizado por el pedido original de review. Si se autoriza implementar, la dirección candidata es propagar validación de operaciones compuestas a los dispatchers de renderers y emitir callbacks sólo por escrituras aceptadas; todavía no es una solución diseñada o aprobada.

## Decisiones que son del dueño

### Pendientes de juicio humano

- Elegir si el siguiente ciclo completa sólo la revisión o también implementa correcciones. El alcance actual sigue siendo revisión.
- Cualquier publicación de comentarios, push o merge requiere una instrucción propia. No se ha enviado nada a terceros.

### Ya decididas

- Es trabajo propio de Hunter en Vercel, confirmado explícitamente por él.
- Conservar este head y las pruebas aisladas; no tocar la rama de trabajo original `feat/forward-params-to-named-actions`.
- No atribuir diagnósticos existentes en base a este PR. No presentar CI verde como prueba de que los callers son correctos.
- No hacer pasar una revisión focal por un receipt completo de Security o Resilience. No usar las mismas familias de modelos como evidencia de independencia entre familias.

## Bugs con lo que los delató

- **F1 P1, observado:** con `state={source:"keep",items:["zero","one"]}`, el hook público recibe move de `/state/source` a `/state/items/01`. En head desaparece `source` y el array sigue intacto. En base el valor termina en el índice 1. El comportamiento deseado por la nueva regla es rechazar el move completo sin perder el origen. Copy/move desde un origen de array no canónico también agrega propiedades propias con `undefined`. La prueba usa React construido, `renderHook` y bytes JSONL consumidos desde una `Response`; no sólo llama al helper de core.
- **F2 P2, observado:** update con `/items/01` rechazado y `/count` válido conserva el array, pero el callback anuncia ambas escrituras. En base la escritura al array sí se aplicaba. Las aplicaciones que persisten callbacks podrían divergir del snapshot; esa consecuencia es inferida, mientras que el callback incorrecto está observado.
- **TS-3, observado:** quitar el guard del origen de `copy` no hace fallar los tests escritos en el PR. La comprobación explícita de propiedad propia sí falla y vuelve a verde con el guard restaurado. No se modificó el árbol revisado; las mutaciones fueron en copia desechable, con hashes de restauración en `test-strength/restoration.json`.

## Bloqueado por afuera

- **Reportado por Hunter:** la UI ocultó contenido con “This content can’t be shown” y un aviso de cuidado con solicitudes de ciberseguridad.
- **Recuperable:** `runtime-interruption.json` registra que el coordinador terminó en estado `errored`, con un motivo de señalamiento por posible riesgo de ciberseguridad. No contiene el detalle interno que activó el filtro.
- **Desconocido:** no se puede determinar desde estos artefactos qué fragmento exacto provocó el aviso ni prometer que otro hilo no lo mostrará. Este handoff conserva trabajo legítimo de revisión y no propone evadir el control.

## Entorno que costó

- El runtime FX falló en la comprobación de auth del wrapper: `unsupported auth mode: missing`. Se inspeccionó su capacidad una vez y se pasó a subagentes nativos. Evidencia: `fx-capability.json` y `manifest.json`. No hay una revisión FX exitosa.
- Los `node_modules` del worktree son enlaces al checkout existente. `dependency-links.json` enumera los enlaces. No deben purgarse ni modificarse desde este run. El typecheck de todo el workspace disparó un intento automático de instalación de pnpm y terminó con `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
- Core construyó correctamente. El build React produjo JavaScript utilizable, pero falló su fase de declaraciones por resolución de tipos del setup enlazado; `react-build.log` contiene el error. No describir el build React completo como verde. La prueba del hook fuerza aliases al core construido de este head o de la base; sin ellos se puede probar accidentalmente otro `dist`.
- `gate.sh covered` sólo reconoce nombres: dio pass al existir el directorio con el SHA antes de que hubiese reporte. El control real es el contenido de `run-report.json` y la validación exacta.
- El mapa de surfaces existente usa `->`; el script espera `::`. Se creó `conventions.used.md` normalizado dentro del run y pasó. El archivo original de convenciones tenía cambios ajenos y no fue editado.

## Historial

# Primera sesión: investigación de versionado y migraciones, 2026-08-13

## Qué quedó andando

- **Entrega, recuperable:** quedó escrita la investigación en `05_Areas/research/json-render-versioning-migrations-feasibility.md`. Tiene 297 líneas, figura como archivo nuevo sin seguimiento en `git status`, y todavía no fue commiteada ni pusheada.
- **Investigación, recuperable:** `@json-render/core` sigue publicado en npm como `0.19.0`. El repositorio público no muestra un issue dedicado a versionado o migraciones de specs persistidos.
- **Estado del repositorio, recuperable:** el clone local está en `/Users/raillyhugo/Programming/vercel/json-render`, sin cambios locales, sobre `feat/forward-params-to-named-actions` en `3120b34f`. Esa rama corresponde al PR #307, ya mergeado. No existe una rama, implementación ni PR para migraciones.
- **Conclusión técnica, inferida:** el feature es viable porque el spec es un objeto serializable plano, el catálogo ya valida specs y core ya expone validación estructural. La propuesta separa dos versiones:
  - versión del formato json-render, migrada por la librería;
  - versión del catálogo de la aplicación, migrada por cada consumidor.
- **Forma recomendada, inferida:** envolver el spec persistido en `{ format, formatVersion, catalog: { id, version }, spec }`. La metadata no debe formar parte del documento generado por el modelo.
- **Verificación, reportada:** en la sesión de investigación se revisaron manualmente las fuentes principales y se reportaron 10 de 10 URLs vivas. El verificador automático no terminó.
- **Juicio humano:** pendiente. Hunter todavía no aprobó la forma propuesta ni confirmó que esto deba convertirse en RFC o implementación.

## Dónde retomar

1. **Bloqueante:** preguntarle al maintainer si ya existe un plan interno y si aceptaría un RFC. Sin esa señal, implementar puede fijar una API que el equipo no quiere sostener.
2. Convertir la propuesta en un issue o RFC corto. Punto de partida: `05_Areas/research/json-render-versioning-migrations-feasibility.md`.
3. Definir el contrato mínimo:
   - envelope `PersistedSpec`;
   - migraciones secuenciales y solo hacia adelante;
   - rechazo explícito de versiones futuras;
   - validación con `catalog.validate()` y `validateSpec()` después de migrar;
   - reporte de migraciones aplicadas;
   - decisión de escritura posterior a cargo de la aplicación.
4. Hacer un proof of concept pequeño en `/Users/raillyhugo/Programming/vercel/json-render` con dos versiones ficticias de catálogo. No intentar cubrir todas las versiones `0.x` todavía.
5. Resolver el estado de `05_Areas/research/verification-report.md` antes de commitear el vault. El archivo está modificado y actualmente afirma `0` URLs vivas y `1598` muertas, por lo que no es evidencia válida. No fue restaurado porque su propiedad exacta no pudo confirmarse.
6. Cuando Hunter apruebe la investigación, commitear por separado la nota y este handoff. El vault está alineado con `origin/main`, pero contiene muchos cambios ajenos a este ciclo.

## Decisiones que son del dueño

### Esperan juicio humano

- Confirmar si la siguiente entrega debe ser solo un RFC, un prototipo local o una implementación upstream.
- Elegir desde qué versión se garantiza migración. Cubrir todo el historial previo a `0.6.0` aumenta mucho el alcance.
- Definir la conducta cuando falta un componente: error total, fallback por componente o regeneración desde prompt y datos originales.
- Decidir si el sistema debe guardar también prompt, datos fuente y versión del modelo para permitir regeneración como último recurso.

### Ya decididas para esta propuesta

- No proponer migraciones automáticas de catálogos. La librería no conoce la semántica de componentes, props o acciones definidos por cada aplicación.
- No usar un LLM como migrador predeterminado. Las migraciones persistentes deben ser determinísticas y auditables.
- Mantener la metadata fuera de `Spec`. Así no cambia el prompt, el output del modelo ni el contrato actual de los renderers.
- Empezar con migraciones hacia adelante. Downgrades y compatibilidad total con cada prerelease quedan fuera del MVP.

## Necesita verificación humana

- No hay declaración pública de maintainers sobre el roadmap, pero eso no descarta un plan interno.
- Las estimaciones de 3 a 5 días para un MVP y 2 a 4 semanas para una solución upstream son estimaciones de diseño, no trabajo medido.
- Falta validar la propuesta contra specs reales persistidos por Burak y contra sus requisitos de retención.

## Fuera de alcance

- Implementar el feature sin aprobación.
- Migrar automáticamente componentes definidos por consumidores.
- Prometer compatibilidad con todas las versiones históricas `0.x`.
- Tratar regeneración con IA como equivalente a una migración.

## Punteros

- Investigación: `05_Areas/research/json-render-versioning-migrations-feasibility.md`
- Handoff: `05_Areas/vercel/json-render-handoff.md`
- Clone local: `/Users/raillyhugo/Programming/vercel/json-render`
- Repositorio: `https://github.com/vercel-labs/json-render`
- PR que corresponde a la rama local actual: `https://github.com/vercel-labs/json-render/pull/307`
- Guía de migración actual: `https://json-render.dev/docs/migration`

# Segunda sesión: nested repeats, 2026-08-13

## Qué quedó andando

- **Entrega, recuperable:** el PR #319, `feat(core): support nested repeats with item paths`, fue mergeado el 2026-08-13 a las 19:32:33 UTC. El merge commit en `origin/main` es `9f58a3caded38689a51135bce85a8383fee5f940`.
- **Crédito, recuperable:** el commit original `f34f0713ae968facf9391bff82bf4eea18547039` reconoce a Trevin Chow como coautor. GitHub muestra a `Railly` y `tmchow` entre sus autores.
- **Alcance entregado, recuperable:** `repeat.statePath` acepta `{ "$item": "field" }` dentro de otro repeat. La resolución compartida se usa en React, React Native, React Email, React PDF, Image, Ink, Solid, Svelte y Vue. También se actualizaron validación, schemas, prompts, documentación y skills.
- **Verificación, recuperable:** CI reportó éxito en Version Sync Check, Lint, Test, Type Check, Socket Security, Vercel Agent Review y todos los previews de renderers. Antes del push, la suite focal pasó 162 tests y el Review Gate quedó asociado al SHA `f34f071`.
- **Issue, recuperable:** #252 quedó cerrado automáticamente al mergear #319.
- **Publicación, recuperable:** `@json-render/core` sigue en `0.19.0` según `pnpm view @json-render/core version`. El cambio está mergeado pero no publicado en npm.
- **Estado local, recuperable:** el worktree `/Users/raillyhugo/Programming/vercel/json-render-fix-256` sigue sobre `railly/fix-nested-repeats` en `f34f071`. `origin/main` está en `9f58a3c`. Sólo queda `.decisions.tsv` sin seguimiento.
- **Juicio humano:** Hunter aprobó el trabajo y mergeó #319.

## Dónde retomar

1. **Primero, evitar duplicación upstream:** cerrar el PR #256 original o pedirle a Trevin que lo cierre, indicando que #319 lo reemplazó conservando su coautoría. Actualmente #256 sigue abierto.
2. **Seguimiento de release:** observar el PR de release #305 y verificar cuándo una versión posterior a `0.19.0` publique el cambio. Comando de control: `pnpm view @json-render/core version`.
3. **Validación con SAP:** cuando exista una versión publicada, pedir a Leo o al equipo SAP que pruebe su caso real de nested repeats, incluido el adapter Swift si consume el mismo contrato serializado. La verificación actual cubre repositorio y previews, no la integración SAP.
4. **Issue candidate de mayor valor:** normalizar paths con slash inicial en `$bindItem`. Punto de partida: `packages/core/src/props.ts`, función `resolveBindItemPath`. Hoy `"/field"` puede formar un path con doble slash, mientras `$item` y `repeat.statePath` aceptan ambas formas.
5. **Segundo issue candidate:** decidir si los repeats con cero items deben producir la misma estructura en renderers runtime y estáticos. Runtime conserva un contenedor vacío; algunos renderers estáticos omiten el elemento.
6. **Limpieza local opcional:** decidir si conservar `.decisions.tsv` como evidencia local o eliminarla. No fue incluida en el commit ni en el PR. La rama y el worktree pueden borrarse después de cualquier inspección final.

## Decisiones que son del dueño

### Esperan juicio humano

- Decidir si cerrar #256 directamente o dejar que Trevin lo cierre después de recibir contexto.
- Decidir si los dos issue candidates se abren ahora o se esperan señales de SAP.
- Decidir quién confirma la integración real con SAP una vez publicado el paquete.

### Ya decididas para este cambio

- Los strings existentes de `repeat.statePath` conservaron exactamente su semántica de root, incluidos los strings sin slash inicial.
- Sólo la forma explícita `{ "$item": string }` es relativa al repeat exterior.
- Un `$item` usado fuera de repeat scope no cae a root state.
- `"subitems"` y `"/subitems"` son equivalentes en la nueva forma.
- La semántica vive en helpers compartidos de core y debe permanecer igual en todos los renderers.
- La coautoría de Trevin debe conservarse porque #319 rehízo y completó su trabajo de #256.

## Necesita verificación humana

- SAP todavía no confirmó el comportamiento contra su integración real.
- No se verificó el adapter Swift. Sólo se sabe por el contexto interno que existe.
- El cambio aún no fue consumido desde una versión publicada de npm.

## Fuera de alcance

- Cambiar la semántica general de `$bindItem`.
- Unificar la representación de repeats vacíos entre renderers estáticos y runtime.
- Versionado o migraciones de specs persistidos, cubierto por la primera sesión de este handoff.

## Punteros

- PR mergeado: `https://github.com/vercel-labs/json-render/pull/319`
- Issue cerrado: `https://github.com/vercel-labs/json-render/issues/252`
- PR original aún abierto: `https://github.com/vercel-labs/json-render/pull/256`
- Solution Gate: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-13-json-render-256-9d3dfc8.md`
- Review Gate: `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-13-json-render-f34f071.md`
- Worktree: `/Users/raillyhugo/Programming/vercel/json-render-fix-256`

# Tercera sesión: cierre del PR original, 2026-08-13

## Qué quedó andando

- **Entrega, recuperable:** el PR original #256 fue cerrado el 2026-08-13 a las 19:37:03 UTC como reemplazado por #319.
- **Comunicación, recuperable:** antes de cerrarlo se publicó un mensaje para `@tmchow` agradeciendo su implementación original, explicando que #319 la completó sobre `main` actual y confirmando que su coautoría fue preservada.
- **Estado upstream, recuperable:** #319 permanece mergeado en `9f58a3caded38689a51135bce85a8383fee5f940`; #252 y #256 están cerrados. Ya no queda duplicación abierta para nested repeats.
- **Publicación, recuperable:** `@json-render/core` continúa publicado como `0.19.0`. El cambio todavía no está disponible desde npm.
- **Estado local, recuperable:** el worktree conserva únicamente `.decisions.tsv` sin seguimiento sobre la rama ya mergeada.
- **Juicio humano:** Hunter aprobó el mensaje antes de publicarlo y pidió cerrar #256.

## Dónde retomar

1. **Bloqueante para SAP:** esperar una publicación posterior a `0.19.0`. Verificar con `pnpm view @json-render/core version` y revisar el PR de release #305.
2. Cuando se publique, enviar a Leo o al equipo SAP la versión exacta y pedir validación contra su integración real de nested repeats.
3. Confirmar si el adapter Swift consume `repeat.statePath` como contrato serializado y necesita una actualización para aceptar `{ "$item": string }`.
4. Abrir, si se prioriza, el issue sobre slash inicial en `$bindItem`, comenzando en `packages/core/src/props.ts`.
5. Evaluar por separado la diferencia de salida para repeats vacíos entre renderers runtime y estáticos.
6. Limpiar la rama, el worktree y `.decisions.tsv` cuando ya no se necesite evidencia local.

## Decisiones que son del dueño

### Esperan juicio humano

- Quién coordina la validación SAP después del release.
- Si los dos issue candidates se abren inmediatamente o después de recibir feedback de SAP.
- Si `.decisions.tsv` se conserva fuera del repo o se elimina junto con el worktree.

### Ya decididas

- #256 no debe reabrirse. #319 es la implementación canónica y conserva el crédito de Trevin.
- La siguiente señal de entrega no es otro cambio de código, sino publicación en npm y validación de integración.

## Necesita verificación humana

- SAP aún no probó el cambio mergeado.
- El adapter Swift no fue inspeccionado.
- No existe todavía una versión publicada que contenga el merge commit.

## Punteros

- Mensaje de cierre en #256: `https://github.com/vercel-labs/json-render/pull/256#issuecomment-5285509718`
- PR canónico mergeado: `https://github.com/vercel-labs/json-render/pull/319`
- Release pendiente: `https://github.com/vercel-labs/json-render/pull/305`

# Cuarta sesión: named slots, 2026-08-13

## Qué quedó andando

- **Entrega, recuperable:** el reemplazo del PR #105 quedó commiteado y
  pusheado en `973327588a3822d2dcd94b48306076a271fa895b`, rama
  `railly/named-slots`. El PR nuevo es #320 y GitHub lo reporta abierto y
  mergeable.
- **Crédito, recuperable:** el commit reconoce a
  `wotnak <wotnak@pm.me>` como coautor. GitHub muestra a Railly y wotnak entre
  los autores del commit.
- **Alcance entregado, recuperable:** `UIElement.slots` agrega referencias
  estructurales nombradas. React las entrega a los componentes mediante
  `slots?: Record<string, ReactNode>`. `children` sigue siendo el slot default.
  Validación, autofix, traversal, streaming del playground, conversión nested,
  export de código y navegación de Devtools preservan los slots.
- **Semántica, recuperable:** los named slots se renderizan una vez y no
  heredan el scope creado por el repeat del elemento dueño. Repeat continúa
  aplicándose sólo a `children`.
- **Verificación, recuperable:** `pnpm test` pasó 1.061 tests en 66 archivos;
  `pnpm type-check` pasó 59 de 59 paquetes; `pnpm lint` pasó 14 de 14 tareas.
  También pasaron `git diff --check`, style, surfaces y el gate de cobertura
  para el SHA exacto.
- **Review Gate, recuperable:** el reporte durable está marcado `incomplete`
  únicamente porque no terminó un reviewer independiente. Claude agotó su
  presupuesto y el reviewer Codex no pudo arrancar sin
  `AI_GATEWAY_API_KEY`. La revisión local encontró y corrigió dos gaps antes
  del push: el prompt anunciaba `default` como named slot y `nestedToFlat` no
  convertía los hijos de slots a keys.
- **Publicación, recuperable:** `@json-render/core` continúa en `0.19.0`.
- **Estado CI, recuperable:** los 22 checks quedaron verdes, incluidos Lint,
  Test, Type Check, Version Sync Check, Socket Security, todos los previews y
  Vercel Agent Review. El review no dejó comentarios accionables.
- **Juicio humano:** Hunter todavía no revisó ni aprobó #320.

## Dónde retomar

1. **Bloqueante de juicio humano:** revisar el diff y mergear #320 si Hunter
   está de acuerdo. Los 22 checks ya están verdes.
2. Después del merge, agradecer a `@wotnak` en #105, indicar que #320 lo
   reemplazó preservando su crédito y cerrar #105.
3. Verificar que el issue #39 se cierre automáticamente con el merge de #320.
4. Seguir el release posterior a `0.19.0`; #305 continúa abierto como
   preparación de `0.19.1`.
5. Cuando exista una versión publicada, informar a Leo o al equipo SAP y pedir
   validación de #319 y #320 contra su integración real.

## Decisiones que son del dueño

### Esperan juicio humano

- Aprobar y mergear #320 cuando CI y revisión estén verdes.
- Decidir si la validación SAP se coordina directamente con Leo o mediante
  ctate.

### Ya decididas

- #320 reemplaza #105 sobre `main` actual y conserva la coautoría de wotnak.
- El slot default se representa con `children`; no se usa `slots.default`.
- El render de named slots queda soportado explícitamente por
  `@json-render/react`. El tipo core no promete paridad de runtime para otros
  renderers.
- Los named slots no participan del repeat scope creado por su elemento dueño.

## Necesita verificación humana

- El componente visual de named slots todavía no fue inspeccionado en un
  preview de Vercel.
- SAP todavía no confirmó su caso real.
- Vercel Agent Review pasó sin comentarios, pero no sustituye una inspección
  visual humana del caso de named slots.

## Entorno que costó

- Los tests de React resuelven `@json-render/core` desde `dist`. Después de
  cambiar `nestedToFlat`, fue necesario ejecutar
  `pnpm --filter @json-render/core build` antes del test focal.
- El mapa Radius reportó 18.178 llamadas sin resolver frente a 5.131 edges. Se
  usó para orientar la revisión, no como prueba de cobertura completa.

## Punteros

- PR nuevo: `https://github.com/vercel-labs/json-render/pull/320`
- PR original: `https://github.com/vercel-labs/json-render/pull/105`
- Issue que cerrará el PR: `https://github.com/vercel-labs/json-render/issues/39`
- Commit: `973327588a3822d2dcd94b48306076a271fa895b`
- Worktree: `/Users/raillyhugo/Programming/vercel/json-render-named-slots`
- Review Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-13-json-render-9733275.md`

# Quinta sesión: release v0.20.0, 2026-08-18

## Qué quedó andando

- **Entrega, recuperable:** el PR #320 de named slots fue mergeado el
  2026-08-15 en `0f6798b1937bf8f4371fc38a83de95dbf7c6a0fd`. El issue
  #39 y los PRs originales #105 y #256 están cerrados.
- **Release, recuperable:** el PR #321, `chore(release): prepare v0.20.0`,
  fue mergeado el 2026-08-16 en
  `ea4b361b9ff23bcab20286c4f559a5316f0e892b`.
- **Publicación, recuperable:** los 28 paquetes públicos del workspace están
  disponibles en npm como `0.20.0`. Se comprobó enumerando los package
  manifests no privados y consultando cada nombre con
  `npm view <package>@0.20.0 version`: `total=28 published=28 missing=none`.
- **GitHub Release, recuperable:** `v0.20.0` fue publicado el 2026-08-18 a
  las 18:23:29 UTC. Incluye named slots, nested repeats, params en acciones
  encadenadas, el ejemplo harness-chat y los demás cambios desde `0.19.0`.
- **Verificación de release, recuperable:** el reintento del workflow Release
  terminó verde. El job de npm publicó u omitió correctamente los paquetes
  según su versión y el job posterior creó el GitHub Release.
- **Estado local, recuperable:** el worktree
  `/Users/raillyhugo/Programming/vercel/json-render-release-0.20.0` permanece
  limpio sobre `railly/release-0.20.0` en `cb047fd`, alineado con su rama
  remota. El merge commit sólo existe en `main`.
- **Juicio humano:** Hunter aprobó el release PR. La integración real de SAP
  con `0.20.0` todavía no tiene confirmación registrada.

## Dónde retomar

1. **Mayor valor:** informar a Leo o al equipo SAP que `0.20.0` ya está
   publicado y pedir validación real de nested repeats y named slots.
2. Confirmar si el adapter Swift acepta la forma serializada
   `{ "$item": string }` en `repeat.statePath` o necesita una actualización.
3. Abrir, si se prioriza, el issue sobre normalización de slash inicial en
   `$bindItem`, comenzando en `packages/core/src/props.ts`.
4. Evaluar por separado la paridad de salida para repeats con cero items entre
   renderers runtime y estáticos.
5. Decidir si named slots necesita seguimiento de paridad en React Native. El
   contrato publicado en `0.20.0` documenta el render de named slots como una
   capacidad de `@json-render/react`.
6. Limpiar los worktrees y ramas locales de #319, #320 y el release cuando ya
   no se necesite su evidencia.

## Decisiones que son del dueño

### Esperan juicio humano

- Quién coordina la validación con SAP y cómo se registra su resultado.
- Si los issue candidates de `$bindItem`, repeats vacíos y paridad de named
  slots se abren ahora o después del feedback de SAP.
- Si se eliminan ya los worktrees de implementación y release.

### Ya decididas

- `v0.20.0` es la entrega canónica de #319 y #320. No reabrir #105 ni #256.
- El slot default sigue representado por `children`; los named slots de
  runtime están soportados explícitamente por React.
- Los créditos de `@tmchow` y `@wotnak` quedaron preservados en los commits y
  en las notas del release.
- El aviso de npm sobre la futura restricción de tokens que evitan 2FA no fue
  la causa del fallo de publicación.

## Bugs con lo que los delató

- El primer intento del workflow Release falló únicamente al publicar
  `@json-render/directives@0.20.0` con `E404`, mientras los otros 27 paquetes
  sí se publicaron. `npm view` mostró que `directives` seguía en `0.19.0`.
- La diferencia de identidad de publicación señaló la causa:
  `directives@0.19.0` había sido publicado manualmente por `ctate`, mientras
  otros paquetes mostraban `GitHub Actions <npm-oidc-no-reply@github.com>`.
  Faltaba o no coincidía la configuración de npm Trusted Publishing para ese
  paquete.
- Después de que ctate corrigió la configuración y reejecutó los jobs fallidos,
  `@json-render/directives@0.20.0` publicó correctamente y se desbloqueó la
  creación del GitHub Release.

## Necesita verificación humana

- SAP todavía debe confirmar que `0.20.0` funciona en su integración real.
- El adapter Swift no fue inspeccionado.
- La validación visual local de named slots cubrió el playground y un harness,
  pero no sustituye la prueba de la aplicación de SAP.

## Lecciones de método

- Un release monorepo puede quedar parcialmente publicado. Verificar sólo
  `@json-render/core` no prueba que todos los paquetes estén disponibles.
- npm Trusted Publishing se autoriza por paquete. Un paquete publicado
  manualmente puede quedar fuera de la configuración OIDC aunque comparta
  scope, maintainers y repositorio con los demás.
- Ante un release parcial, reejecutar los jobs fallidos preserva la salida del
  check inicial. Un workflow nuevo habría visto `core@0.20.0` y habría omitido
  la publicación restante.

## Punteros

- Release: `https://github.com/vercel-labs/json-render/releases/tag/v0.20.0`
- PR de release: `https://github.com/vercel-labs/json-render/pull/321`
- Workflow corregido:
  `https://github.com/vercel-labs/json-render/actions/runs/31950623188`
- Named slots: `https://github.com/vercel-labs/json-render/pull/320`
- Nested repeats: `https://github.com/vercel-labs/json-render/pull/319`
- Review Gate del release:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-15-json-render-cb047fd.json`
- Worktree del release:
  `/Users/raillyhugo/Programming/vercel/json-render-release-0.20.0`

# Sexta sesión: xref y repriorización, 2026-08-18

## Resultado

- `xref` recorrió los 59 issues abiertos como seeds: 89 nodos en 52
  componentes. Snapshot durable:
  `05_Areas/vercel/json-render/xref-priority-2026-08-18.json`.
- **P0 de cola:** revisar y destrabar el PR #322, que ya implementa named slots
  para Vue sobre #320. Es mergeable; Lint, Test, Type Check, Version Sync,
  Socket y Vercel Agent Review están verdes. El bloqueo visible son los
  previews de Vercel sin autorización y review requerido.
- **P1 de ingeniería propia:** issue #311, re-render completo en streaming que
  puede terminar en OOM. No tiene PR. La lectura de `origin/main` confirma que
  `buildSpecFromParts()` reconstruye todo `Spec` en cada cambio y que
  `ElementRenderer` recibe ese `spec`, anulando su `React.memo` durante el
  stream. Falta reproducir y aislar el write final antes de implementar.
- **P2:** issue #222 + PR #255. Es pérdida silenciosa de `on`, `watch` y `state`
  al validar, tiene dos usuarios afectados y sigue presente en `origin/main`:
  `buildZodType()` usa `z.object(zodShape)` sin passthrough, mientras el schema
  React sólo declara `visible` y `repeat`. #255 está mergeable pero es antiguo
  y requiere rebase/revisión contra 0.20.0.
- **P3 quick win:** issue #312 + PR #313, dos líneas de paths Tailwind. PR
  mergeable; los checks de código reportados están verdes y los previews
  fallan por autorización.
- Después: #296 (schema/runtime de action params), #297 (Zod 4.4), y el bug de
  slash inicial de `$bindItem` detectado en el handoff. #292 no describe un bug
  según el contrato actual: `$item` en action params devuelve deliberadamente
  un path; `$bindItem` devuelve el valor.

## Ruido y limpieza upstream

- El ranking bruto de calor pone #34 primero (41 puntos), pero Vue ya existe.
  Es cierre/actualización, no implementación. #37 (33) y #42 (22.9) también
  describen el prompt antiguo; `origin/main` ya documenta JSONL, componentes,
  props, state, repeats y acciones. Verificar docs publicados y cerrar si
  coinciden.
- #305 (`prepare v0.19.1`) fue reemplazado por v0.20.0/#321. Candidato claro a
  cerrar como superseded.
- Overlaps objetivos de PRs abiertos: #303/#305 comparten dos manifests;
  #213/#27 comparten `core/src/types.ts`; #254/#255/#278 comparten
  `core/src/schema.ts`. Revisarlos juntos antes de revivir cualquiera.
- No se publicó ningún comentario ni se cambió estado en GitHub.

## Próximo movimiento

1. Revisar #322 focalmente y autorizar/reintentar previews si la política del
   repo los exige; mergear sólo tras esa revisión.
2. Correr un reproduction/profiling gate para #311. Medir renders por patch y
   heap antes de elegir entre acumulación incremental del spec, comparator
   focal de `ElementRenderer` o throttling explícito.
3. Rebasar o rehacer #255 con crédito a `@tmchow`, añadiendo regresiones para
   `on`, `repeat`, `watch` y `state` antes de mergear.

# Séptima sesión: Solution Gate de Vue named slots, 2026-08-18

## Decisión sobre P0

- Se ejecutó `solution-gate` en modo candidate audit para el PR #322 usando
  dos proposers de familias distintas en Cursor: `claude-fable-5-high` y
  `cursor-grok-4.6-high`.
- Ambos trabajaron sobre archivos aislados del base
  `ea4b361b9ff23bcab20286c4f559a5316f0e892b`, sin el commit candidato. Sus
  propuestas quedaron selladas antes de revelar el PR.
- **Veredicto: Amend.** La arquitectura de `@wotnak` coincide con la solución
  blind en todos los puntos materiales. No rehacerla. Antes de mergear, añadir
  regresiones focales para los casos que la implementación ya pasa pero sus
  tests comprometidos no fijan.
- Preservar el commit y crédito de `@wotnak`. Una enmienda de tests puede ser
  un commit adicional del maintainer o del contributor.

## Coincidencia blind contra PR #322

- Vue posee schema, runtime, tipos, docs y tests. Core queda intacto.
- `ElementRenderer` entrega funciones lazy de slots nombrados por el canal
  nativo de Vue, también a registries raw.
- `defineRegistry` expone `Slots` y conserva `children` evaluado.
- Metadata de catálogo en `WeakMap` respalda warnings sin bloquear render.
- Un slot no declarado avisa y renderiza. `slots.default` avisa y se ignora;
  `children` sigue siendo dueño exclusivo del default.
- Los named slots quedan fuera del scope de repeat creado por su owner.
- El schema y prompt de Vue anuncian slots nombrados, y docs/skill se
  actualizaron.

## Evidencia ejecutada sobre el head candidato

- Head auditado: `c67314e82a9dd7a5a7d11384725c72f232cd516b`.
- Tests focales del candidato más matriz auditora: **36/36 pasaron**.
- Matriz auditora, seis casos:
  - registry raw y no evaluación de un slot no consumido;
  - warning e ignore de `slots.default` preservando `children`;
  - warning más render de slot no declarado;
  - ref faltante silenciosa durante loading y warning después;
  - named slot del owner una vez fuera del repeat;
  - prompt incluye `slots: header` y excluye `slots: default`.
- `pnpm type-check`: **59/59 tasks pasaron**.
- El test temporal vive sólo en el worktree descartable. No se modificó el PR
  ni se publicó nada en GitHub.

## Enmienda requerida antes de merge

Los tests comprometidos por #322 cubren el happy path vía `defineRegistry` y
la preservación de slots en nested specs. Falta convertir la matriz anterior
en regresiones permanentes, al menos separando:

1. registry raw más laziness;
2. `slots.default` y slot no declarado;
3. loading y owner repeat;
4. salida del prompt Vue.

Este gap es de S9, test que no fija todos los mecanismos, no un defecto de la
implementación. Los seis probes pasan hoy.

## Punteros

- Gate completo:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-18-json-render-vue-named-slots/candidate-audit.md`
- Veredicto blind:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-18-json-render-vue-named-slots/blind-verdict.md`
- PR: `https://github.com/vercel-labs/json-render/pull/322`
- Ref local recuperable: `refs/codex-audit/json-render-322`
- No se comentó, aprobó, pusheó ni mergeó nada en GitHub.

# Octava sesión: recreación lista para merge, 2026-08-18

## Entrega

- Se recreó el PR #322 desde `origin/main` en la rama
  `railly/vue-named-slots-ready`, incorporando la implementación de `@wotnak`
  más las seis regresiones exigidas por Solution Gate.
- Commit: `a34d63bc89f69dc96648de456f1b8c4c8d6e6abd`.
- Crédito preservado en el commit con
  `Co-authored-by: wotnak <wotnak@pm.me>`.
- PR reemplazo: `https://github.com/vercel-labs/json-render/pull/323`.
- El body declara que recrea y supersede #322, preservando implementación y
  autoría. #322 no fue cerrado ni modificado.

## Verificación

- Vue renderer/hooks: 36/36.
- Suite completa: 1.069/1.069.
- Type-check: 59/59 tasks.
- Lint: 14/14 tasks.
- Force-red: quitar el delivery de named slots hace fallar cinco tests.
- Review Gate: pass sobre el SHA exacto `a34d63b`.
- Estado inicial de GitHub: PR mergeable; checks y previews en curso.

## Punteros

- Review Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-18-json-render-a34d63b.md`
- Run JSON:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-18-json-render-a34d63b.json`
- Worktree:
  `/Users/raillyhugo/Programming/vercel/json-render-vue-named-slots-ready`

# Novena sesión: merge de Vue named slots y roadmap, 2026-08-19

## Qué quedó andando

- **Entrega, recuperable:** el PR #323 fue mergeado el 2026-08-19 a las
  15:28:05 UTC en `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`.
- **Crédito, recuperable:** GitHub reconoce en el commit del PR a Railly y a
  `@wotnak`; el commit fuente conserva
  `Co-authored-by: wotnak <wotnak@pm.me>`.
- **Verificación, recuperable:** los 22 checks de #323 terminaron en success,
  incluidos Lint, Test, Type Check, Version Sync, Socket, Vercel Agent Review
  y todos los previews de Vercel.
- **Juicio humano, recuperable:** el PR terminó con review decision
  `APPROVED` antes del merge.
- **Publicación, recuperable:** npm todavía reporta
  `@json-render/core@0.20.0`. El merge de Vue named slots aún no pertenece a
  una release publicada.
- **Estado local, recuperable:** el worktree
  `/Users/raillyhugo/Programming/vercel/json-render-vue-named-slots-ready`
  está limpio sobre `railly/vue-named-slots-ready`, alineado con su rama
  remota en `a34d63b`. El merge commit sólo está en `main` remoto.

## Dónde retomar: roadmap priorizado

### P0 siguiente: issue #311, streaming con crash/OOM

- Issue abierto: `https://github.com/vercel-labs/json-render/issues/311`.
- Impacto: React puede entrar en `Maximum update depth exceeded` al streamear
  muchos componentes y terminar en out-of-memory.
- Primer movimiento: crear un worktree limpio desde `origin/main`, reproducir
  el fallo y medir renders por patch, profundidad de updates y heap. No elegir
  implementación antes de esa evidencia.
- Después de reproducir: correr Solution Gate entre acumulación incremental
  del spec, estabilización/comparator de `ElementRenderer` y throttling
  explícito. El write final también debe quedar aislado en la reproducción.

### P1: issue #222 y PR #255, pérdida silenciosa en validate

- Issue y PR siguen abiertos:
  `https://github.com/vercel-labs/json-render/issues/222` y
  `https://github.com/vercel-labs/json-render/pull/255`.
- Riesgo: `catalog.validate()` elimina silenciosamente `on`, `repeat`, `watch`
  y `state`.
- Acción: reevaluar #255 contra el `main` posterior a 0.20.0, recrear si está
  obsoleto, preservar crédito de `@tmchow` y añadir regresiones para los cuatro
  campos. Revisar junto con #254 y #278 por solapamiento en `core/src/schema.ts`.

### P2 quick win: issue #312 y PR #313, paths Tailwind

- Ambos siguen abiertos:
  `https://github.com/vercel-labs/json-render/issues/312` y
  `https://github.com/vercel-labs/json-render/pull/313`.
- Acción: verificar el bug visual en los ejemplos chat y harness-chat sobre
  `main`, recrear el parche mínimo con crédito de `@adhamali450`, comprobar
  que `grid-cols-4` y otras clases del catálogo produzcan CSS y enviar PR.

### P3: contratos de schema y compatibilidad

1. #296: alinear `DynamicValueSchema` con el contrato real de
   `resolveActionParam`.
2. #297: permitir Zod 4.4+ sin depender del tipo estrecho de
   `_zod.version.minor`.
3. Abrir o validar el bug candidato de slash inicial en `$bindItem` detectado
   en `packages/core/src/props.ts`.

### Cola de limpieza upstream

- #34 puede cerrarse o actualizarse: Vue ya existe y #323 añadió named slots.
- #305 está reemplazado por v0.20.0/#321.
- #37 y #42 describen el prompt o streaming antiguo. Verificar primero la
  documentación publicada y cerrar sólo si el comportamiento actual coincide.
- #292 no se prioriza como bug mientras el contrato siga distinguiendo `$item`
  como path y `$bindItem` como valor.

## Decisiones que son del dueño

### Esperan juicio humano

- Si el merge de #323 entra en una release inmediata o se agrupa con #311.
- Quién coordina una validación real de Vue named slots fuera de los previews
  y tests automatizados.
- Si la limpieza administrativa de #34, #37, #42 y #305 se hace antes o
  después de #311.

### Ya decididas

- El siguiente trabajo de ingeniería es #311. Su riesgo de crash/OOM supera el
  quick win de Tailwind y la deuda de compatibilidad.
- #311 empieza por reproducción y profiling. No implementar por intuición.
- #222 va después de #311 por pérdida silenciosa de datos y conserva crédito
  de `@tmchow` si se recrea #255.
- #313 no se mergea a ciegas por ser pequeño; primero debe probarse la salida
  CSS real.

## Necesita verificación humana

- Vue named slots fue verificado por tests y previews, pero no hay una
  validación registrada en una integración externa real.
- #311 aún no fue reproducido localmente ni perfilado.

## Punteros

- PR mergeado: `https://github.com/vercel-labs/json-render/pull/323`
- Merge commit: `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`
- Snapshot de prioridad:
  `05_Areas/vercel/json-render/xref-priority-2026-08-18.json`
- Solution Gate de Vue:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-18-json-render-vue-named-slots/candidate-audit.md`
- Review Gate de Vue:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-18-json-render-a34d63b.md`

# Décima sesión: reproducción y fix local de #311, 2026-08-19

## Qué quedó andando

- **Entrega local, recuperable:** el worktree
  `/Users/raillyhugo/Programming/vercel/json-render-fix-311` está en
  `railly/fix-311-streaming-oom`, basado en
  `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`. Hay dos archivos modificados y
  un test nuevo; no hay commit, push ni PR.
- **Reproducción, recuperable:** el workload append-paced de 26 elementos y
  200 patches produjo 5.226 ejecuciones de catálogo, 5.025 de hojas
  intocadas. Un efecto dependiente de `bindings` que escribe al store llegó a
  18.304 writes antes de `Maximum update depth exceeded`.
- **Resultado local, recuperable:** el mismo workload produce 226 ejecuciones,
  26 montajes y 200 updates del único elemento tocado. Las hojas intocadas
  tienen cero ejecuciones adicionales. El conteo exacto se repitió cinco veces.
- **Verificación, recuperable:** React 80/80; type-check 59/59; lint, Prettier,
  `git diff --check`, style y surfaces pasan.

## Dónde retomar

1. El bloqueante para shipping es obtener una revisión independiente con
   output. Cursor Claude Sonnet y Cursor Grok quedaron vivos sin emitir nada y
   fueron abortados. El Review Gate está registrado honestamente como
   incompleto.
2. Releer el diff final y, si el juicio humano lo aprueba, committear. Después
   repetir Review Gate sobre el SHA exacto para que `covered` pueda pasar.
3. Sólo entonces push y PR contra #311.

## Decisiones que son del dueño

### Esperan juicio humano

- Autorizar commit, push y PR del fix local.
- Decidir si se exige además una medición de heap en Chrome. La evidencia
  actual prueba la eliminación del loop y de ejecuciones de catálogo
  intocadas, no la recolección de Fiber en Chrome.

### Ya decididas

- La shape permanece en el renderer: versiones semánticas bottom-up y boundary
  memoizado alrededor del componente de catálogo.
- No usar throttling, acumulador incremental ni store paralelo.
- `ElementRenderer` conserva sus suscripciones de contexto. Sólo se evita
  ejecutar el componente de catálogo cuando sus entradas observables no
  cambiaron.

## Bugs con lo que los delató

- La primera firma recursiva desbordaba el stack en árboles profundos. Un test
  de 12.000 nodos la llevó a postorden iterativo.
- El primer comparator retenía callbacks stale de repeat, functions y
  directives. Mutaciones focales devolvieron valores anteriores y fijaron las
  entradas del boundary.
- Serializar props resueltas y repeat items rechazaba estado cíclico o
  `BigInt`. Una regresión cambió el comparator a versiones e identidades.

## Punteros

- Solution Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-19-json-render-311-streaming-oom/packet.md`
- Review Gate incompleto:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-19-json-render-311-working-tree.md`
- Radius final, bajo cobertura:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/radius-dogfood/2026-08-19-json-render-311-final.json`
- xref:
  `/Users/raillyhugo/.xref/vercel-labs-json-render-311/2026-08-19T19-26-45-450Z.json`

# Undécima sesión: gates y commit local de #311, 2026-08-19

## Qué quedó andando

- **Entrega, recuperable:** el fix de #311 quedó commiteado localmente en
  `39ba7154b550d34edbf76652277a5fbffbac4af4`, rama
  `railly/fix-311-streaming-oom`. La rama está un commit delante de
  `origin/main`; no hay push ni PR.
- **Verificación, recuperable:** la suite completa pasó 1.085 tests en 67
  archivos. Type-check pasó 59/59 tareas y lint 14/14. El test focal pasó
  16/16 después del commit.
- **Test Strength, recuperable:** mutaciones del bailout, own-key,
  estabilización de bindings, callbacks, DAG, profundidad, cleanup de watch y
  recuperación fallaron en la aserción prevista y volvieron a verde al
  restaurar el fix.
- **Resilience Audit, recuperable:** se forzaron presión de 200 patches, ciclo,
  DAG compartido, 12.000 nodos, unmount durante una cadena async, error de
  catálogo seguido por parche correctivo, estado cíclico y `BigInt`.
- **Review Gate, recuperable:** Gemini 3.7 Flash mediante AI Gateway encontró
  dos defectos en la primera ronda. Ambos fueron corregidos. La ronda final
  sobre el diff completo devolvió `PASS` y el Review Gate exacto cubre
  `39ba715`.
- **Entorno, recuperable:** la key de AI Gateway se leyó desde Keychain y no se
  imprimió. El primer intento de commit falló al firmar con 1Password; el
  segundo desactivó firma sólo para esa invocación y no cambió configuración.

## Dónde retomar

1. **Bloqueante de entrega upstream:** obtener autorización de Hunter para
   push y PR. El commit local ya pasó el gate exacto.
2. Si se autoriza, pushear `railly/fix-311-streaming-oom` y abrir PR contra
   #311 con la reproducción 5.226 a 226, las mutaciones y el gap de Chrome.
3. Verificar CI y Vercel Agent Review. Cualquier cambio posterior al SHA
   `39ba715` requiere repetir Review Gate.
4. Opcional antes o después del PR: medir heap y Fiber en Chrome con stream
   largo y GC forzado. Es evidencia adicional; no hay un defecto residual
   conocido que la exija para corregir el loop reproducido.

## Decisiones que son del dueño

### Esperan juicio humano

- Autorizar push y apertura del PR.
- Decidir si la medición de heap en Chrome es requisito previo al PR o un
  seguimiento separado.

### Ya decididas

- La solución permanece en el renderer, con versiones bottom-up, bailout del
  renderer interno, boundary del componente de catálogo y records estables.
- No usar throttling, acumulación incremental ni un store paralelo.
- El gap de heap en Chrome se reporta explícitamente y no se presenta como
  verificado por jsdom.

## Necesita verificación humana

- No se midió recolección de Fiber ni heap después de GC en Chrome.
- Hunter todavía no revisó el diff ni autorizó su publicación upstream.

## Punteros

- Commit local: `39ba7154b550d34edbf76652277a5fbffbac4af4`
- Review Gate exacto:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-19-json-render-39ba715.md`
- Test Strength:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/test-strength/2026-08-19-json-render-311.md`
- Resilience Audit:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/resilience-audit/2026-08-19-json-render-311.md`
- Independent review:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/evidence/2026-08-19-json-render-311-gemini.md`

# Duodécima sesión: commit firmado listo para push, 2026-08-19

## Qué quedó andando

- **Entrega local, recuperable:** GitHub rechazó el primer push porque
  `39ba715` no tenía firma verificada. El contenido se re-firmó sin cambios y
  ahora vive en `476e27a4e9ad8cfce2e4e105ada6bebdda716bd4`.
- **Firma, recuperable:** `git show --show-signature` reporta una firma `git`
  válida para `railly.hugoquispe@vercel.com` con la key ED25519 configurada.
- **Contenido, recuperable:** `git diff 39ba715 476e27a` está vacío para los
  tres archivos del fix. Sólo cambió la identidad del commit.
- **Publicación:** el primer push fue rechazado y no creó rama remota ni PR.

## Dónde retomar

1. Repetir Review Gate exacto para `476e27a`.
2. Pushear `railly/fix-311-streaming-oom` y abrir el PR contra #311.
3. Verificar que GitHub marque el commit como `Verified` y que los checks
   iniciales aparezcan en el PR.

## Decisiones que son del dueño

### Ya decididas

- El repo exige commits firmados. No volver a pushear `39ba715`.
- `476e27a` reemplaza exactamente a `39ba715` y conserva el mismo diff.

## Punteros

- Commit firmado: `476e27a4e9ad8cfce2e4e105ada6bebdda716bd4`

# Decimocuarta sesión: finding de Vercel resuelto, 2026-08-19

## Qué quedó andando

- **Finding, recuperable:** Vercel Agent Review señaló que
  `Object.keys(frame.element.props)` podía lanzar cuando `type` llegaba antes
  que `props`. La reproducción confirmó el crash.
- **Diagnóstico, recuperable:** aplicar sólo `props ?? {}` en la firma movía el
  mismo crash a `resolveBindings`. La sugerencia era necesaria pero
  insuficiente.
- **Entrega upstream, recuperable:** el fix completo quedó firmado y pusheado
  en `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`. La firma tolera props ausentes
  y el renderer usa un objeto vacío estable hasta que llega el patch.
- **Test Strength, recuperable:** quitar el guard de firma falla en
  `useElementSignatures`; quitar la normalización falla en `resolveBindings`;
  restaurar ambos renderiza `waiting` y luego `ready`.
- **Verificación, recuperable:** suite 1.086/1.086, focused 17/17, type-check
  59/59, lint 14/14. Grok revisó el diff completo y devolvió `PASS`. Review
  Gate exacto pasa para `dc03573`.
- **GitHub, recuperable:** se respondió el comentario con la evidencia y el
  thread quedó resuelto. CI se reinició para el nuevo SHA.

## Dónde retomar

1. Esperar CI y la nueva ronda de Vercel Agent Review sobre `dc03573`.
2. Si aparece otro finding, repetir reproducción, force-red y Review Gate.
3. Si todo queda verde, pedir aprobación humana para mergear #325.

## Punteros

- PR: `https://github.com/vercel-labs/json-render/pull/325`
- Commit: `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`
- Finding original:
  `https://github.com/vercel-labs/json-render/pull/325#discussion_r3817104114`
- Solution Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-08-19-json-render-325-missing-props/decision.md`
- Review Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-19-json-render-dc03573.md`
- Review Gate exacto:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-19-json-render-476e27a.md`

# Decimotercera sesión: PR #325 abierto, 2026-08-19

## Qué quedó andando

- **Entrega upstream, recuperable:** la rama
  `railly/fix-311-streaming-oom` fue pusheada y el PR #325 está abierto contra
  `main`: `https://github.com/vercel-labs/json-render/pull/325`.
- **Identidad, recuperable:** el head remoto y local coinciden en
  `476e27a4e9ad8cfce2e4e105ada6bebdda716bd4`. La API de GitHub reporta
  `verified: true` y `reason: valid` para su firma.
- **Estado inicial, recuperable:** GitHub reporta el PR como `MERGEABLE`. CI,
  previews, Socket Security y Vercel Agent Review ya comenzaron. El merge está
  bloqueado mientras faltan checks y review requeridos.
- **Contrato de cierre, recuperable:** el body contiene `Fixes #311`, la
  reducción de 5.226 a 226 ejecuciones, los gates y el gap explícito de heap en
  Chrome.

## Dónde retomar

1. Esperar los checks de #325 y revisar cualquier finding de Vercel Agent
   Review.
2. Si cambia el SHA, repetir Review Gate exacto antes de otro push.
3. Cuando checks y review estén verdes, pedir juicio humano para merge.

## Decisiones que son del dueño

### Esperan juicio humano

- Aprobar y mergear #325 cuando termine CI.
- Mantener la medición de heap Chrome como seguimiento o exigirla antes del
  merge.

## Punteros

- PR: `https://github.com/vercel-labs/json-render/pull/325`
- Issue: `https://github.com/vercel-labs/json-render/issues/311`
- Commit firmado: `476e27a4e9ad8cfce2e4e105ada6bebdda716bd4`
# Decimoquinta sesión: reconciliación upstream y casos, 2026-08-24

## Qué quedó andando

- **Release, recuperable:** `v0.20.0` fue publicado el 2026-08-18 sobre
  `ea4b361b9ff23bcab20286c4f559a5316f0e892b`. El changelog del tag incluye
  nested repeats de #319 y named slots de React de #320. npm reportó
  `0.20.0` para `@json-render/core`, `@json-render/react` y
  `@json-render/vue` el 2026-08-24.
- **Entregas cerradas, recuperable:** #319 está mergeado en `9f58a3c`, #320
  en `0f6798b` y #323 en `a4d033c`. GitHub registra aprobación de maintainer
  para los tres. Los issues #252 y #39 están cerrados.
- **Corte de release, recuperable:** `git tag --contains` confirma que
  `v0.20.0` contiene #319 y #320, pero no #323. Vue named slots está mergeado
  en `origin/main`, todavía sin release que lo contenga.
- **Casos, recuperable:** quedaron materializados cuatro ledgers públicos en
  el checkout canónico de `Railly/skills`: #319, #320, release parcial #321 y
  #323. Todos pasan la comprobación de campos obligatorios, secciones y
  `git diff --check`. Permanecen sin commit en ese repo.
- **PR #325, recuperable:** sigue abierto en
  `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`. CI, previews, Socket y Vercel
  Agent Review están verdes, pero `reviewDecision` sigue en
  `REVIEW_REQUIRED`.
- **Review humano, recuperable:** `ctate` dejó dos findings no resueltos el
  2026-08-23: preservar identidades de props anidadas y reemplazar la firma
  lossy que no cubre todo el dominio de valores soportado. Por eso #325 no
  está listo para merge aunque los checks estén verdes.

## Dónde retomar

1. **Bloqueante:** reproducir por separado los dos findings de `ctate` en
   #325. Para cada uno, añadir una regresión que falle sin el fix antes de
   cambiar producción.
2. Reabrir Solution Gate sólo si preservar identidad anidada obliga a cambiar
   la shape elegida. El fingerprint actual no debe ampliarse con otra
   serialización parcial de valores.
3. Corregir #325, ejecutar Test Strength y Resilience Audit focales, y repetir
   Review Gate sobre el nuevo SHA firmado antes de push.
4. Responder y resolver ambos threads con evidencia. Esperar aprobación de
   maintainer antes de mergear. #311 debe permanecer abierto hasta entonces.
5. Decidir el siguiente release para #323. `v0.20.0` no contiene Vue named
   slots aunque npm publique `@json-render/vue@0.20.0`.
6. Cuando #325 cierre, registrar su caso por separado. No convertir el estado
   actual de PR abierto en caso de fix completado.
7. Commitear los cuatro casos de json-render en el repo canónico de skills
   cuando Hunter apruebe su redacción.

## Decisiones que son del dueño

### Esperan juicio humano

- Aprobar los cuatro casos nuevos antes de commitearlos en `Railly/skills`.
- Decidir si #323 entra en una release inmediata o se agrupa con el eventual
  merge de #325.
- Decidir si la medición de heap y Fiber en Chrome sigue como requisito de
  #325 o como seguimiento. Los findings de `ctate` son bloqueantes
  independientes de ese gap.

### Ya decididas

- #319, #320, #321 y #323 son casos distintos porque tienen mecanismos y
  lecciones transferibles distintos.
- #325 no es un caso cerrado ni está listo para merge. CI verde no sustituye
  los dos threads humanos abiertos.
- `v0.20.0` es la entrega canónica de #319 y #320, no de #323 ni #325.
- La key local de AI Gateway puede usarse para los gates sin imprimirla.

## Necesita verificación humana

- No hay validación registrada de #319/#320 en la integración SAP ni de #323
  en una aplicación Vue externa.
- No se midió retención de heap o Fiber después de GC forzado en Chrome para
  #311.
- Los dos nuevos findings de #325 todavía no tienen reproducción ni
  veredicto técnico en este ciclo.

## Punteros

- Release: `https://github.com/vercel-labs/json-render/releases/tag/v0.20.0`
- PRs cerrados: `https://github.com/vercel-labs/json-render/pull/319`,
  `https://github.com/vercel-labs/json-render/pull/320`,
  `https://github.com/vercel-labs/json-render/pull/321`,
  `https://github.com/vercel-labs/json-render/pull/323`
- PR abierto: `https://github.com/vercel-labs/json-render/pull/325`
- Finding de identidad anidada:
  `https://github.com/vercel-labs/json-render/pull/325#discussion_r3837800072`
- Finding de fingerprint:
  `https://github.com/vercel-labs/json-render/pull/325#discussion_r3837800963`
- Caso #319:
  `/Users/raillyhugo/Programming/railly/skills/cases/json-render/0319-nested-repeat-contract-across-renderers.md`
- Caso #320:
  `/Users/raillyhugo/Programming/railly/skills/cases/json-render/0320-structural-slots-cross-every-consumer.md`
- Caso release #321:
  `/Users/raillyhugo/Programming/railly/skills/cases/json-render/0321-partial-monorepo-release-recovery.md`
- Caso #323:
  `/Users/raillyhugo/Programming/railly/skills/cases/json-render/0323-vue-slot-delivery-matrix.md`

# Decimosexta sesión: dos findings de ctate corregidos y gateados, 2026-08-28

## Qué quedó andando

- **Estado local, recuperable:** el checkout
  `/Users/raillyhugo/Programming/vercel/json-render-325-review` está en
  `review/json-render-325-comments-20260828`, HEAD
  `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`, con sólo
  `packages/react/src/renderer.tsx` modificado y
  `packages/react/src/json325-contract-probe.test.tsx` sin trackear.
- **Identidad exacta, recuperable:** el diff de producción tiene SHA256
  `e6767688f6bc3a4305f56592ceec181156fbe8542e9dfc5418e2d021bd0c91d2`
  y el probe SHA256
  `6af1f038acf37d1dbbbfefae8e6b88bcca29d67031df6f861aa0f6c82261030b`.
- **GitHub, recuperable:** PR #325 sigue abierto en el mismo head. Existen
  exactamente dos threads no resueltos y no obsoletos de `ctate`, sobre
  identidad de props anidadas y firma no lossless. No se respondió ni resolvió
  ningún thread.
- **Contrato, recuperable:** `/tmp/json325-frozen-packet.md` congela
  JR325-A1-A9, JR325-M1-M8, unknowns, evidencia baseline y comandos de prueba.
- **Entrega local, recuperable:** el renderer usa comparación estructural sin
  serialización para las firmas y sharing recursivo copy-on-write para props
  resueltas. No cambia API, schema, dependencias, documentación ni package
  boundary.
- **Verificación, recuperable:** focused 40/40, suite completa 1.101/1.101,
  typecheck de repo 59/59 y lint 14/14. Test Strength con
  `anthropic/claude-sonnet-5` mató 7/7 mutaciones y conservó los hashes.
- **Spec, recuperable:** el pase independiente de
  `google/gemini-3.7-flash` aprobó JR325-A1-A9 y JR325-M1-M8 sobre el estado
  exacto.
- **Review Gate, recuperable:** el reporte canónico pasa
  `gate.sh report`. Nueve lentes focales terminaron en PASS y conservaron HEAD
  y hashes. Los intentos Claude incompletos no se contaron.
- **Before/After, recuperable:** el artefacto
  `/tmp/2026-08-28-json-render-325-before-after.html` compara evidencia
  baseline capturada con el estado revisado. Fue verificado sólo con
  `agent-browser` en desktop y narrow, light y dark, mouse y teclado, sin
  overflow. Su SHA256 es
  `d8744f70c5918c28942d36f3f57f9e09dd1ab058455c2c9a922a4d933818efe4`.
- **Juicio humano:** pendiente. No existe autoridad de promoción sobre este
  working tree.

## Dónde retomar

1. Bloqueante: Hunter debe revisar el artefacto Before/After y decidir si
   promueve exactamente HEAD `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`
   más los hashes `e6767688...` y `6af1f038...`.
2. Sin esa autoridad, no commitear, pushear, actualizar #325, responder,
   resolver threads ni comentar externamente.
3. Si Hunter autoriza una acción exacta, ejecutar sólo esa acción mediante el
   workflow de entrega y revalidar los tres identificadores inmediatamente
   antes.
4. Si cambia código o contrato, retirar Spec, Review Gate y Before/After y
   volver al primer estado invalidado.

## Decisiones que son del dueño

### Esperan juicio humano

- Autorizar o rechazar promoción del estado exacto revisado.
- Nombrar por separado cualquier acción externa permitida: commit, push,
  actualización del PR, respuesta o resolución de threads.

### Ya decididas

- Shape F es la forma aceptada: firma estructural sin serialización y sharing
  recursivo de props resueltas en los boundaries React existentes.
- Cycles dentro de raw props y preservación estructural de instancias
  non-plain siguen fuera del contrato.
- No se usa Cursor. Los pases independientes usan Gemini o Claude mediante
  `fx` con modelo explícito y `--auto`.
- El Before/After no afirma dos builds vivos. Su lado baseline proviene de
  evidencia capturada.

## Fuera de alcance

- Commitear, pushear, modificar el PR o resolver comentarios sin promoción
  explícita.
- Medición de heap y Fiber con GC forzado en Chrome, que sigue siendo un gap
  histórico separado de estos dos findings.

## Punteros

- Contrato: `/tmp/json325-frozen-packet.md`
- Test Strength: `/tmp/json325-final-strengthen.md`
- Prove: `/tmp/json325-final-prove.md`
- Spec: `/tmp/json325-final-spec-gemini.md`
- Review Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-28-json-render-325-working-tree.md`
- Review Gate JSON:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-28-json-render-325-working-tree.json`
- Before/After: `/tmp/2026-08-28-json-render-325-before-after.html`
- Capturas verificadas:
  `/tmp/json325-before-after-desktop-dark-final.png` y
  `/tmp/json325-before-after-narrow-light-final.png`

# Decimoséptima sesión: estado exacto pusheado, 2026-08-28

## Qué quedó andando

- **Entrega, recuperable:** el estado revisado se commiteó como
  `f05966f862d6de682f591171e843892851340350` con mensaje
  `fix(react): preserve nested prop identities` y se pusheó a
  `origin/railly/fix-311-streaming-oom`.
- **Firma, recuperable:** Git verifica la firma ED25519 del commit como
  válida para `railly.hugoquispe@vercel.com`.
- **Identidad, recuperable:** el parent es
  `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`. El diff comprometido de
  `renderer.tsx` conserva SHA256 `e6767688...` y el blob del probe conserva
  SHA256 `6af1f038...`, exactamente los promovidos.
- **Estado local y remoto, recuperable:** `HEAD`, upstream y head de PR #325
  coinciden en `f05966f`. El worktree está limpio.
- **GitHub, recuperable:** CI, previews, Hacker Security Review y Vercel Agent
  Review se reiniciaron para `f05966f`. Al cierre de esta sesión seguían
  pendientes, salvo los checks de Socket y Vercel Preview Comments que ya
  estaban verdes.
- **Threads de ctate, recuperable:** el push los volvió `isOutdated: true`,
  pero ambos conservan `isResolved: false`. No se respondió, resolvió ni
  comentó externamente.
- **Registro, recuperable:** `kai log` agregó
  `shipped: fix(react): preserve nested prop identities`.
- **Sync móvil, desconocido:** el script
  `/Users/raillyhugo/.claude/scripts/sync-to-icloud.sh` no existe en esta
  máquina Vercel, por lo que no se ejecutó.

## Dónde retomar

1. Esperar CI y Vercel Agent Review sobre `f05966f`.
2. No responder ni resolver los dos threads de ctate sin autoridad explícita
   para esas acciones externas.
3. Si aparece un finding sobre este SHA, iniciar un successor Factory Loop y
   retirar la evidencia downstream afectada.
4. Si los checks quedan verdes, pedir decisión humana separada para responder
   threads, resolverlos o mergear.

## Decisiones que son del dueño

### Esperan juicio humano

- Autorizar una respuesta externa con evidencia a los dos threads obsoletos.
- Autorizar su resolución.
- Autorizar merge de PR #325 cuando finalicen checks y review.

### Ya decididas

- La autoridad `push it` cubrió commit y push del estado exacto promovido.
- No cubrió comentarios, resolución de threads ni merge.

## Punteros

- Commit pusheado: `f05966f862d6de682f591171e843892851340350`
- PR: `https://github.com/vercel-labs/json-render/pull/325`
- Review Gate:
  `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-28-json-render-325-working-tree.md`
- Before/After: `/tmp/2026-08-28-json-render-325-before-after.html`


### 2026-09-14: review #336 interrumpido y handoff verificado

- Head `de6a9bd`, base `6c71643`, PR abierto y worktree limpio, corroborados con git y GitHub al cerrar.
- Artefactos locales guardados en `/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd`. F1 y F2 confirmados; Test Strength fallido e integrado. Gate `incomplete`, sin promoción.
- Hunter pidió handoff después del aviso de contenido oculto. Se preservó íntegro el historial anterior. No se ejecutaron tests ni builds durante la preparación del handoff.
