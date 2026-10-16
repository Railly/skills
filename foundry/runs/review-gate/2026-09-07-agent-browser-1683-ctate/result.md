# Review Gate: vercel-labs/agent-browser

Date: 2026-09-07
Repository: vercel-labs/agent-browser
Base: `8a346a2cfc0afa5dc259b02b896355ac476fa6e2`
Head: `5b2b1cc6b0b03b584799fe89d0a61f46df5d1355`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: fx_worker
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-07-agent-browser-1683-ctate/fx-cross-family-final.json
- Degraded from: native_subagent
- Schema failures: 1
- Independence gap: none

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-07-agent-browser-1683-ctate/contract.md
- Spec status: incomplete
- Acceptance reviewed: R0, R1, R2, R3, R4

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Cuatro mutaciones de las correcciones originales repetidas sobre el árbol final, todas rechazadas por assertions conductuales. Tres variantes anteriores y tres findings cross-family tienen trazas rojas previas; suite final restaurada verde. No se afirma cubrir las particiones excluidas. Quinta mutación final en call site del drain rechazada; 11 probes de fallos más restauración, Linux y auto-connect real.
- Resilience Audit: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Fallos forzados de validación, transporte, storage, publicación, primer comando e implícito; reconexión y continuidad observadas. Contextos ya persistidos conservan conexión tras error de acción; target desaparecido en commit se probó con eventos Chrome reales, nuevo/persistido. Se forzaron drain final, corte de CDP durante disposición y SIGKILL; nuevos/persistidos discriminados. Repetición y cierre real de Chrome observados.
- Security Review: pass

## Verified properties

- P1: Las descargas aisladas completan en el destino propio y no reconfiguran default/B. cli-v4.log; mutation-missing-download-context.log
- P2: Los fallos modelados no activan nuevo aislamiento sticky ni publican binding; estado previamente persistido se conserva. isolation-e2e-v4.log; cli-v4.log; first-request-red.log; implicit-red.log; cross-family-no-target-green.log; completion/fault-repeat-*.json; completion/late-commit-mutant.json; completion/linux-auto-connect.json
- P3: Éxito persiste aislamiento a través de omisión y reconexión; close mantiene reset del baseline. isolation-e2e-v4.log; cli-v4.log; mutation-missing-sticky-commit.log; cross-family-red.log primer fallo; cross-family-reconnect-red.log; isolation-e2e-v4.log
- P4: Integración de main conserva recording sobre la página actual y filtro aislado. integration.diff; isolation-e2e-v4.log

## Deterministic checks

- `identidad e integración`: pass. Worktree limpio en fix/1683-ctate-local-20260907. PR original e2607d6a511cb7757a4d3e412e4284d9971f5133; main integrado 219c47a9dab1776f320d11e66ce934fd239b2cb7; merge local 8a346a2cfc0afa5dc259b02b896355ac476fa6e2; fixes 0a53aefdcae889378132f54d8ea096805f3edcea y 5b2b1cc6b0b03b584799fe89d0a61f46df5d1355. Sin rebase/push/publicaciones/merge remoto. Fix total: 8 files changed, 720 insertions(+), 56 deletions(-)
- `cargo test serial`: pass. 1256 passed, 0 failed; full-tests-v4.log
- `isolation e2e`: pass. 5 passed; isolation-e2e-v4.log. Nueva prueba Chrome del commit sin target: 1 passed; cross-family-no-target-green.log.
- `compiled CLI`: pass. 3 passed, 10 stress rounds; cli-v4.log
- `fmt and CI clippy`: pass. cargo fmt --check; cargo clippy -- -D warnings
- `clippy all-targets extra`: acknowledged. Dos lints preexistentes con Rust 1.98 en tests: for_unbounded_range browser.rs y result_large_err cdp/client.rs. Ambos presentes en main 219c47a.
- `surfaces`: acknowledged. Corrección del contrato existente, sin flags/formatos/capacidades nuevas. CLI y MCP comparten comandos; no se modifica documentación pública.
- `xref`: acknowledged. xref.txt/xref.json: #1117 y #1683 compiten por #1068 (13 archivos compartidos); #1340 comparte 10 con #1683 y 8 con #1117. Abiertos relacionados #1624, #896, #1211, #1272, #1280. No se absorbió ni cerró ninguno. Hubs: xref 1589 --repo vercel-labs/agent-browser --depth 1; xref 326 --repo vercel-labs/agent-browser --depth 1; xref 896 --repo vercel-labs/agent-browser --depth 1. Primer snapshot de esta selección; no diff anterior.
- `falsificación final`: pass. v4-mutations.json: cuatro exit 101; revisados logs para excluir compilación/setup ajeno. Árbol original restaurado y checks finales verdes.
- `remote revalidation`: acknowledged. pr-v4.json: OPEN, e2607d6, CONFLICTING/DIRTY. refs/heads/main verificado por git ls-remote HTTPS autenticado en 219c47a9dab1776f320d11e66ce934fd239b2cb7. GraphQL baseRefOid devuelve bf3c85f4b6fd08c43c01627dc28502d37b2a330a pero baseRef.target/defaultBranchRef/ref y transporte Git coinciden en 219c47a; no se usa baseRefOid como main actual.
- `covered`: pass. Índice run-report-5b2b1cc.json generado desde reporte canónico de este HEAD. Cobertura por nombre no sustituye validación gate.sh report.
- `Linux ordinary suite`: pass. 1258 passed: 1252 unit +4 dashboard +2 doctor; completion/linux-user-tests.log
- `Linux isolation / compiled CLI`: pass. 5 e2e +1 no-target +3 CLI, diez rondas; completion/linux-isolation-e2e.log, linux-no-target.log, linux-cli-subreaper.log
- `Real auto-connect discovery`: pass. DevToolsActivePort puerto aleatorio; ausencia de Chrome falla sin sticky; éxito conserva contexto/target al reiniciar; close resetea. completion/linux-auto-connect.json
- `Late failure, disposal transport, process death`: pass. 11 traces de fallos y green restaurado; cierre host observado en cuatro repeticiones. Degradación remota documentada; completion/resilience-matrix.json
- `Late commit call-site mutation`: pass. Mutante compila y falla por failed request must not publish binding; fuente restaurada pasa. completion/late-commit-{mutant,restored}.json
- `Final identity / skill identity / deterministic checks`: pass. completion/final-identity.json y deterministic.json; style, callers commit/rollback, execdeps pasan; source Linux coincide con HEAD local limpio.
- `Environment fixture failures`: acknowledged. Logs iniciales preservados; OOM, home/env de root, recolección de zombies y dos errores de harness corregidos sin tocar código/tests. completion/resilience-matrix.json
- `historical Solution Gate`: acknowledged. Etapa previa incomplete; auditoría adicional de admisión también incomplete. No se representa como factory completo ni se consume para aprobar Review Gate.
- `Alcance del PASS local`: acknowledged. Validado en macOS ARM64 y Linux ARM64 con Chrome/Chromium152. Windows no probado y excluido de este veredicto. Pérdida de CDP/SIGKILL puede dejar un contexto remoto huérfano por fallo hasta cerrar Chrome; reintento no exige borrar estado. No se afirma cota global ante fallos repetidos ni sandbox frente a CDP global. Solution Gate histórico y auditoría nueva de admisión siguen incomplete; no se presentan como pasos previos aprobados.

## Judgment lenses

- Inverse regression surface (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- New-domain matrix (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Resolution-rule consistency across consumers (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Shell re-parse append domain (candidate): skipped. No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.
- Emission channel and one-shot latch reachability (candidate): skipped. No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.
- Shim hermeticity (candidate): skipped. No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.
- Deliberate-default check (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Fresh-seam scan (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Substrate differential corpus (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Reference-implementation oracle (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- New-failure-outcome propagation (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Flag-propagation dispatch sweep (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Error-path forcing (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Non-destructive recovery (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Cancellation and timeout hygiene (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Boundary pipeline trace (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Substrate verification (promoted): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Dogfood the built artifact (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Newly-asserted invariant ownership (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Docs-behavior parity (candidate): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Demonstrative example (candidate): skipped. No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.
- Choice audit (candidate, needs a decision trail to fire): run. Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.
- Complexity budget (candidate): skipped. No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.
- security: run. security.json: partición cooperativa, sin claim de sandbox contra CDP global; receipt exacto existente vigente.

## Findings

- F1: confirmed, fixed. download context omitted Evidence: download-red.log; cli-v4.log
- F2: confirmed, fixed. premature sticky/binding commit Evidence: sticky-red.log; mutation-early-binding.log; isolation-e2e-v4.log
- F3: confirmed, fixed. pinned conversion fails durable context binding Evidence: pinned-implicit-red.log; isolation-e2e-v4.log
- F4: confirmed, fixed. first request poisons spawn environment Evidence: first-request-red.log; cli-v4.log
- F5: confirmed, fixed. invalid implicit command commits isolation Evidence: implicit-red.log; isolation-e2e-v4.log
- R-close: refuted, not_applicable. explicit close must retain isolation true Evidence: e2607d6 handle_close already clears true; frozen contract retains explicit close semantics
- R-cli-policy: refuted, not_applicable. Un launch válido completado debe revertirse si otra solicitud posterior es denegada por política Evidence: main.rs envía dos envelopes. La primera solicitud recibe launch success; la segunda hereda aislamiento ya confirmado. El contrato pide persistir tras conexión compatible exitosa y preservar estado previo ante error. No promete atomicidad entre envelopes.
- F6: confirmed, fixed. El drain final aún podía convertir un launch en error después de publicar aislamiento Evidence: fx-cross-family-final.json; completion/late-commit-mutant.json rojo por binding publicado; completion/late-commit-restored.json y fault-repeat-late-new.json verdes con Chrome real
- CF1: confirmed, fixed. Rollback tras reconexión persistida cerraba la conexión ante error ordinario Evidence: cross-family-reconnect-red.log; fx-cross-family-final.json; checks v4 verdes
- CF2: confirmed, fixed. context_recreated histórico disparaba teardown tras un error posterior Evidence: cross-family-red.log primer fallo; fx-cross-family-final.json; checks v4 verdes
- CF3: confirmed, fixed. Commit sin snapshot devolvía éxito sin contexto durable Evidence: cross-family-no-target-red.log; fx-cross-family-final.json; checks v4 verdes

## Gaps

None.

## Limits and provenance

- Author model: gpt-6
- Reviewer model: anthropic/claude-opus-5
- Same family: no
- Independent challenge: satisfied. Claude Opus 5 mediante FX + AI Gateway Keychain. Paquete de git show/diff con SHA256 ligado a HEAD 5b2b1cc; revisión estática externa al implementador. Tres findings reproducidos y corregidos; seguimiento confirma correcciones. El revisor no ejecutó pruebas ni verificó Git por sí mismo en los paquetes.
