El artifact está escrito en `/Users/raillyhugo/.claude/plans/act-a-como-reviewer-ciego-frolicking-blanket.md`. Aquí está completo:

*The artifact is written. Here it is in full:*

---

# Shaping review (blind): scoped browser CA trust with session continuity

Revisión Shaping ciega: confianza CA acotada con continuidad de sesión

Packet: `foundry/runs/solution-gate/2026-08-17-agent-browser-1669-ca-trust-stickiness/packet.md`
Base: `vercel-labs/agent-browser` @ `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`
Mode: candidate audit: blind. No candidate, PR, or branch was inspected.

---

## Context / Contexto

**ES.** El packet congela una propiedad violada: una sesión larga de `agent-browser` no puede confiar selectivamente en una CA privada del usuario para un Chromium lanzado localmente sin, o bien romper la verificación normal de certificados (`--ignore-https-errors`), o bien romper la continuidad de sesión. La evidencia F5/F6 muestra que el fallo real no es criptográfico sino de **propiedad del estado**: cuando la CA se modela como configuración del proceso daemon, omitirla en el segundo comando se lee como *eliminación*, reinicia el daemon y el navegador, y pierde target, URL y página. La revisión debe decidir **qué componente posee la CA efectiva** y **qué mecanismo de confianza en Linux** puede probarse contra la matriz discriminadora, sin implementar.

**EN.** The packet freezes a violated property: a long-running `agent-browser` session cannot selectively trust a user-supplied private CA for locally launched Chromium without either breaking ordinary certificate verification (`--ignore-https-errors`) or breaking session continuity. F5/F6 show the real failure is not cryptographic but one of **state ownership**: when the CA is modelled as daemon process configuration, omitting it on the second command reads as *removal*, restarts daemon and browser, and loses target, URL, and page. This review must decide **which component owns the effective CA** and **which Linux trust mechanism** can be proven against the discriminator matrix, without implementing.

### Reviewer stance / Postura del reviewer

- Read: the packet and the base repository only. / Leído: el packet y el repositorio base únicamente.
- Not read: candidates, PRs, branches, contributor diffs. R18 is therefore assessed as *compatibility of the contract*, not as a diff review. / No leído: candidatos, PRs, ramas, diffs. R18 se evalúa como *compatibilidad del contrato*, no como revisión de diff.
- Every mechanism claim below carries a `file:line` handle from the base commit. / Toda afirmación de mecanismo lleva un handle `file:line` del commit base.

### Mechanism inventory found in base / Inventario de mecanismos en base

Esto es lo que ya existe y determina qué shapes son baratas. / This is what already exists and determines which shapes are cheap.

| # | Existing mechanism | Handle | Why it matters |
|---|---|---|---|
| M1 | Daemon process config + fingerprint. Only 6 fields hash; a mismatch restarts the daemon. | `cli/src/connection.rs:433-471`, `:591-600`, `:609-625` | The F5 trap lives here. `proxy`, `headed`, `profile` are in `DaemonOptions` but **not** in the fingerprint: so "carried to the daemon as env" and "restarts the daemon" are already separable. |
| M2 | Browser launch hash decides reuse vs relaunch. | `cli/src/native/actions.rs:257-304`, `:4219-4261` | Reuse is decided on launch-time inputs only; `ignore_https_errors` is deliberately excluded from the hash. |
| M3 | **Absent field → spawn-time env** fallback. | `actions.rs:4056-4063` (`headless`), `:3684-3729` (`launch_options_from_env`), `main.rs:1498-1506` | The in-tree comment states the exact R9 hazard: a follow-up command without `--headed` must not flip the session and relaunch onto `about:blank`. |
| M4 | **Absent field → live daemon state** fallback. | `actions.rs:4094-4099` (`requested.unwrap_or(existing)`), `:2891` (`current_allowed_domains`) | The closest analogue to "effective CA": omission keeps the current effective value, and the *effective* value is what enters `launch_hash` (`:4223`). |
| M5 | **Sticky per-session state persisted across daemon restarts**, atomic + `0600` + fsync, failures surfaced not swallowed. | `cli/src/native/tab_binding.rs:1-18,41-45,68-140`; consumer `actions.rs:2220-2265` | Full precedent for R9/R12: absent → untouched, `true` → enable, explicit `false` → clear sticky value. |
| M6 | Tri-state CLI booleans and empty-string clear sentinel. | `flags.rs:80-102,217-231,879-882` (`--no-pin-tab`), `:929-939` + `actions.rs:4210-4217` (`--allowed-domains ""` clears the filter) | Two competing, already-shipped syntaxes for explicit clear (U3). |
| M7 | Per-Chrome-process private resource with injected env, owned by the process, removed on `Drop`. | `cli/src/native/cdp/chrome.rs:99-107` (private Xvfb doc), `:654-655` (`DISPLAY`/`XAUTHORITY` injection), `:68-92` (`Drop`, 3 attempts + warn) | Architectural precedent for a *private trust store owned by one Chrome process*, and the exact injection site for a scoped `HOME`. |
| M8 | Temp `--user-data-dir` per launch, cleaned on `Drop`. | `chrome.rs:474-487`, `:635-680` | Cleanup contract shape for R8. |
| M9 | Stale sidecar sweep bounding residue after unclean death. | `connection.rs:161-207`, `:265-350` | The only in-tree answer to "daemon unrecoverable termination" residue. |
| M10 | Pre-launch guards at two layers: CLI flag-combination rejection and daemon-side launch validation. | `main.rs:130-164` (`--webgpu` + `--cdp`/`-p`/`--auto-connect`), `native/browser.rs:22-60`, `actions.rs:4116-4130` | R7/R14 mechanism, already dual-layer. |
| M11 | External binary detection. | `chrome.rs:896` (`which`), `install.rs:558` (`libnss3` dependency naming) | R7 prerequisite check; note base already ships `libnss3` as a dep but **no** `certutil`/`libnss3-tools`. |
| M12 | Bypass family already present: `--ignore-certificate-errors`. | `chrome.rs:489`, `README.md:957` | R13's "separate explicit bypass" anchor. |
| M13 | Parity obligations, enumerated and test-enforced. | `AGENTS.md:16-34`; schema parity test `main.rs:2027-2045` | R15 has an existing enforcement pattern to copy. |
| M14 | Zero pre-existing CA/NSS trust machinery. | repo-wide search: only `libnss3` as an install dep; no `certutil`, no `nssdb`, no SPKI list | U1 is genuinely greenfield; nothing to reuse, nothing to break. |

---

## 1. Complete R table / Tabla R completa

Settled requirements are reproduced verbatim in status. Additions are labelled **derived** (forced by settled Rs + base mechanisms) or **undecided** (a product/contract call the shape cannot make alone).

Los requisitos asentados se conservan. Las adiciones se etiquetan **derived** o **undecided**.

| Req | Requirement | Status | Note / Nota |
|---|---|---|---|
| R0 | A locally launched Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary verification. | Core goal (settled) |: |
| R1 | A correct-hostname leaf signed by the selected CA is accepted even when the server omits the CA from the presented chain. | Must-have (settled) | This is the anchor test: it separates *trust anchor* from *chain repair* and from *error bypass*. |
| R2 | A wrong-hostname leaf remains rejected. | Must-have (settled) |: |
| R3 | A leaf signed by an unrelated CA remains rejected. | Must-have (settled) |: |
| R4 | Expired and not-yet-valid leaves remain rejected. | Must-have (settled) |: |
| R5 | A run without CA configuration retains current behavior. | Must-have (settled) |: |
| R6 | Trust material and process state are isolated between concurrent sessions using different CAs. | Must-have (settled) |: |
| R7 | A missing or failing external prerequisite produces an actionable error before Chromium launches and does not leak created state. | Must-have (settled) |: |
| R8 | Normal close, browser crash, daemon shutdown, and unrecoverable termination have an explicit, observable lifecycle and cleanup contract. | Must-have (settled) |: |
| R9 | After `open` sets a CA, a later `snapshot` that omits the option preserves the effective CA, daemon PID, browser target, URL, trust, and page state. | Must-have (settled) |: |
| R10 | Repeating the same effective CA reuses the live session. | Must-have (settled) |: |
| R11 | Selecting a different CA changes effective trust deliberately and replaces the browser safely. | Must-have (settled) | Read strictly: *replaces the browser*, not the daemon. A daemon restart is out of contract (F5 shows it loses target/URL). |
| R12 | Removing a previously effective CA requires an explicit clear representation, removes trust deliberately, and replaces the browser safely. | Must-have (settled) | Same strict reading as R11. |
| R13 | `--ignore-https-errors` remains a separate explicit bypass and is not silently combined with selective CA trust. | Must-have (settled) |: |
| R14 | Remote CDP, auto-connect, providers, non-Chromium engines, profiles, and unsupported operating systems either preserve their current behavior or reject the new option clearly before partial work. | Must-have (settled) |: |
| R15 | CLI flag, env var, config field, MCP surface, help, README, docs, schemas, core skill, and tests describe one consistent contract. | Must-have (settled) | Concrete target set from `AGENTS.md:20-34`. |
| R16 | The CLI's own outbound TLS trust is outside this change and remains a separate connection boundary. | Must-not-change (settled) |: |
| R17 | Existing sessions without the new option and unrelated launch configuration continue to reuse or relaunch under their current contracts. | Must-not-change (settled) |: |
| R18 | The design preserves useful contributor work and attribution when compatible with the selected contract. | Must-have (settled) | Assessed blind: judged as *contract compatibility*, since no candidate was inspected. |
| **D1** | Wherever browser reuse is decided, the **effective** CA identity must be what is hashed: never the *requested* value. | **derived** (R9 + R10 + M2/M4) | Without this, omission changes the hash and forces a relaunch. This is the mechanical core of the whole change. |
| **D2** | CA identity for change detection must be content-derived (digest of the parsed certificate), not path-derived. | **derived** (R11 + R6) | A rewritten file at the same path is a different trust anchor; a path-only key silently keeps stale trust. |
| **D3** | Trust material on disk must be owner-only and session-scoped; it must never be written into a shared or global store. | **derived** (R6 + `tab_binding` `0600` precedent, `tab_binding.rs:97-140`) |: |
| **D4** | A CA supplied by env or config must not, by its mere presence, force a launch envelope that flips unrelated launch options on every command. | **derived** (R17 + the in-tree hazard note at `main.rs:1498-1506`) | Env/config CA makes `should_send_local_launch_config` true on *every* invocation; every other launch field must keep its absent→effective fallback. |
| **D5** | The CA must be validated as a parseable CA certificate (`basicConstraints: CA`, usable validity) before any trust store or process is created. | **derived** (R7) | Distinguishes "bad input" from "prerequisite missing"; both must be pre-launch. |
| **D6** | The clear representation must be expressible in all four input channels (CLI, env, config, MCP) without any channel making clear indistinguishable from omission. | **derived** (R12 + R15 + U3) | Note the trap: `env::var(...).ok()` yields `Some("")` for an exported-empty variable (`flags.rs:563-571` style), so empty-string must be normalized deliberately in each channel. |
| **U-a** | Does R9 have to hold across an *idle-timeout or crash-induced daemon restart*, or only within one live daemon process? | **undecided** | Decides whether a persisted sidecar (M5) is required or whether live state (M4) suffices. Changes the shape's cost materially. |
| **U-b** | Is `--ca ""` (empty sentinel, per `--allowed-domains`) or `--no-ca` (negative flag, per `--no-pin-tab`) the clear syntax? | **undecided** | Both are shipped conventions (M6). Cannot be settled by fit; needs a product call. |
| **U-c** | Is `--ca` + `--ignore-https-errors` a hard conflict error, or independent-and-documented? | **undecided** | R13 forbids *silent* combination; it does not choose between "error" and "explicit precedence". |
| **U-d** | Is one CA per session sufficient, or must the option be repeatable? | **undecided** | Packet says "one private CA" (R0), so single is in contract; flagged because a list is a cheap forward door and a costly retrofit. |

---

## 2. Materially distinct shapes / Shapes materialmente distintas

Los shapes se separan en dos ejes independientes: **(i) mecanismo de confianza en Chromium** y **(ii) propietario del estado de CA efectiva**. Un shape es materialmente distinto solo si difiere en al menos uno de los ejes de forma que cambie el resultado del fit check.

Shapes are separated on two independent axes: **(i) Chromium trust mechanism** and **(ii) owner of effective CA state**. A shape is materially distinct only if it differs on at least one axis in a way that changes the fit outcome.

| Shape | Trust mechanism (axis i) | Effective-CA owner (axis ii) |
|---|---|---|
| A | Session-private NSS DB reached via a scoped `HOME` for the Chrome child | Daemon live state + per-session persisted sidecar |
| B | Same as A | Daemon spawn-time env only |
| C | Same as A | Daemon process configuration + fingerprint |
| D | `--ignore-certificate-errors-spki-list` allow-list | Any |
| E | TLS terminated by `agent-browser`; responses fulfilled over CDP | Any |
| F | System trust store or Chrome enterprise policy file | Any (machine-global) |

---

### Shape A: Session-private trust anchor with sticky effective CA
**Anclaje de confianza privado por sesión con CA efectiva persistente**

**ES.** La CA se convierte en una entrada *de lanzamiento del navegador*, nunca en configuración del proceso daemon. Chrome recibe un `HOME` acotado a la sesión que contiene un NSS DB privado con exactamente una raíz añadida. La CA efectiva vive en el daemon con fallback absent→efectivo, y se persiste en un sidecar por sesión como `tab_binding`.

**EN.** The CA becomes a *browser launch* input, never daemon process configuration. Chrome receives a session-scoped `HOME` holding a private NSS DB with exactly one added root. The effective CA lives in the daemon with an absent→effective fallback, persisted in a per-session sidecar like `tab_binding`.

**Parts / Partes**

| Part | What it is | Reuses |
|---|---|---|
| A1 | One input surface with three states: set / omitted / explicitly cleared, on CLI, env, config, MCP. | Tri-state pattern `flags.rs:80-102`; clear sentinel `flags.rs:929-939`; attach-on-command shape `main.rs:100-106` |
| A2 | The option joins `should_send_local_launch_config` so the *first* command establishes trust, and every other launch field keeps its absent→effective fallback. | `main.rs:166-192`, hazard note `main.rs:1498-1506` |
| A3 | Daemon resolves `effective_ca = requested.unwrap_or(current_effective)`; `Some(clear)` sets it to none. | Verbatim the `allowed_domains` pattern `actions.rs:4094-4099` + `:4210-4217` |
| A4 | `launch_hash` hashes the **effective** CA digest (D1, D2), so omitted/same → reuse, changed/cleared → relaunch. | `actions.rs:257-304`, reuse decision `:4219-4261` |
| A5 | The CA is carried to the daemon in `DaemonOptions`/env as a spawn-time default but is **excluded from `daemon_config_fingerprint`**. | `connection.rs:433-471` vs `:591-600`: `proxy`/`headed` already do exactly this |
| A6 | Per-session sidecar for the effective CA (path + digest), atomic temp+rename, `0600`, fsync, failures returned not swallowed, written *before* live state flips. | `tab_binding.rs:68-140`; commit-order precedent `actions.rs:2226-2244` |
| A7 | Trust material: session-scoped directory under the socket dir namespace containing an NSS DB with one root added at `C,,`; Chrome child launched with `HOME` pointing at it. | Injection site `chrome.rs:654-655`; private-resource-per-process doctrine `chrome.rs:99-107`; session paths `connection.rs:101-158` |
| A8 | Prerequisite + input validation before any directory or process exists: `certutil` presence, then CA parse/CA-bit/validity (D5). | `which` detection `chrome.rs:896`; dep naming `install.rs:558`; validation layer `native/browser.rs:22-60` |
| A9 | Lifecycle: trust dir owned by the Chrome process, removed in `Drop` with the 3-attempt + warn contract; orphans after `SIGKILL` swept by the existing stale-sidecar walk. | `chrome.rs:68-92`, `:635-680`; sweep `connection.rs:161-207`, `:265-350` |
| A10 | Dual-layer refusal for `--cdp`, `--auto-connect`, `-p/--provider`, non-Chromium engine, non-Linux: before any work. | `main.rs:130-164`; `browser.rs:22-60`; `actions.rs:4116-4130` |
| A11 | `--ignore-https-errors` stays a separate axis; excluded from the CA path and from the launch hash as today. | `actions.rs:260-261`, `chrome.rs:489` |
| A12 | Parity set: help, README options table, core skill + references, docs MDX (HTML tables), both schemas, MCP tool surface, and an alignment test in the style of the existing schema parity test. | `AGENTS.md:16-34`; `main.rs:2027-2045` |

**Flagged unknowns / Incógnitas marcadas**

- ⚠ **A-u1 (U1).** That an NSS root at `C,,` in a session-private DB makes Chromium accept a leaf whose served chain *omits* the CA: and still reject R2/R3/R4: is asserted, not observed. It must be proven on the Chrome version this repo pins, because modern Chromium resolves user-added roots through the Chrome Root Store plus platform NSS, and the interaction is version-sensitive. **Spike S1.**
- ⚠ **A-u2.** Blast radius of a scoped `HOME`. `--user-data-dir` is always explicit (`chrome.rs:474-487`), which removes the biggest risk, but default download location, crashpad, and font/dconf caches are HOME-derived. **Spike S2.**
- ⚠ **A-u3.** `--profile` interaction: profiles are copied to a temp user-data-dir (`chrome.rs:562-595`), but NSS roots do **not** live in the user-data-dir, so a scoped HOME hides the user's real `~/.pki/nssdb` from the session. Whether that is a feature (isolation) or a regression (profile users lose their own roots) is a contract decision. **Spike S2 / decision.**
- ⚠ **A-u4 (U-a).** Whether A6 is required at all, or whether A3 alone satisfies R9. Also: must the sidecar survive daemon restart (like `.target`) while being removed on explicit close (unlike `.target`)?
- ⚠ **A-u5.** `certutil` is not a current dependency (M11/M14); only `libnss3` is. Adding a prerequisite the base does not install is a real cost, and F11 permits it only if the dependency behavior is explicit.

---

### Shape B: Same trust anchor, env-default stickiness only
**Mismo anclaje, persistencia solo por env de arranque**

Parts A1, A2, A7–A12 unchanged. Ownership collapses to M3: absent field → daemon spawn-time env, no live-state fallback, no sidecar. No new persisted state at all.

Partes A1, A2, A7–A12 sin cambios. La propiedad se reduce a M3: campo ausente → env de arranque del daemon, sin fallback de estado vivo ni sidecar.

**Flagged unknowns**

- ⚠ **B-u1.** A daemon's env is fixed at spawn (`connection.rs:473-589`). Changing the CA mid-session cannot update it, so R11 either forces a daemon restart or leaves the env fallback disagreeing with the requested value.
- ⚠ **B-u2.** After an idle-timeout or crash restart, the new daemon inherits the env of the *current* invocation: which, under R9, omits the CA. Trust drops silently.
- Inherits A-u1, A-u2, A-u5.

---

### Shape C: CA as daemon process configuration
**CA como configuración del proceso daemon**

The CA enters `DaemonOptions`, `apply_daemon_env`, **and** `daemon_config_fingerprint`. Trust is established once per daemon process; a change or omission is resolved by restarting the daemon.

La CA entra en `DaemonOptions`, `apply_daemon_env` **y** `daemon_config_fingerprint`. La confianza se establece una vez por proceso daemon; cambio u omisión se resuelven reiniciando el daemon.

Included because F5/F6 are direct observations of this shape's behavior, so it must be scored rather than assumed away. / Incluido porque F5/F6 son observaciones directas de este shape.

**Flagged unknowns**

- ⚠ **C-u1.** None material: the failure mode is already observed, not unknown. F5 is the measurement.

---

### Shape D: SPKI allow-list bypass
**Bypass por lista SPKI**

Trust mechanism is `--ignore-certificate-errors-spki-list`, a Chromium switch that suppresses certificate errors for certificates whose SubjectPublicKeyInfo hash is listed. Ownership axis is irrelevant to its outcome.

El mecanismo es `--ignore-certificate-errors-spki-list`, que suprime errores de certificado para SPKI listados. El eje de propiedad no cambia su resultado.

**Flagged unknowns**

- ⚠ **D-u1.** None needed to score it: F3 (the CA is absent from the served chain, so its SPKI is never presented) and F4 (hostname/validity must still be enforced) already contradict the mechanism's semantics. It suppresses *errors*, it does not add an *anchor*.

---

### Shape E: TLS terminated by `agent-browser`, fulfilled over CDP
**TLS terminado por `agent-browser` y servido por CDP**

Requests are intercepted at the CDP `Fetch` layer, performed from Rust with a TLS client whose only extra root is the user CA, and fulfilled back into the page. Portable across OSes, no external binary, exact control of R1–R4 semantics.

Las peticiones se interceptan en `Fetch`, se realizan desde Rust con un cliente TLS cuya única raíz extra es la CA del usuario, y se sirven a la página. Portable, sin binario externo, control exacto de R1–R4.

**Flagged unknowns**

- ⚠ **E-u1.** `Fetch` interception is already owned by the proxy-auth and network-control path (`actions.rs:4276-4294`, `install_network_controls_or_close`). A full-traffic interceptor collides with an existing, shipped subsystem.
- ⚠ **E-u2.** Non-`Fetch` traffic: WebSocket upgrades, downloads, h3: has no fulfillment path, so the session is only partially covered.
- ⚠ **E-u3.** Chromium's own verifier stops participating for intercepted traffic; the security model is substituted rather than scoped.

---

### Shape F: System trust store or enterprise policy
**Almacén del sistema o política de empresa**

The CA is installed into the machine trust store or declared in a Chrome managed-policy file so Chromium picks it up globally.

La CA se instala en el almacén del sistema o se declara en un fichero de política gestionada para que Chromium la tome globalmente.

**Flagged unknowns**

- ⚠ **F-u1.** None needed: the mechanism is machine-global and privileged by construction, which is decidable against R5/R6/R7/R8/R16 without a spike.

---

## 3. Binary fit check / Fit check binario

✓ = satisfies. ✗ = fails. Notes are keyed `Rn/Shape`. Ninguna celda es "parcial": una R con condición no probada se marca ✓ solo si la condición está cubierta por un spike obligatorio, y esto se dice explícitamente.

| Req | A | B | C | D | E | F |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| R0 | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✓ |
| R1 | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓ | ✓ |
| R2 | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓ | ✓ |
| R3 | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓ | ✓ |
| R4 | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓ | ✓ |
| R5 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| R6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| R7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| R8 | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| R9 | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| R10 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| R11 | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| R12 | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| R13 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| R14 | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| R15 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| R16 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| R17 | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| R18 | ✓² | ✓² | ✓² | ✗ | ✗ | ✗ |
| D1 | ✓ | ✗ | ✗ | n/a | n/a | n/a |
| D2 | ✓ | ✗ | ✗ | n/a | n/a | n/a |
| D3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| D4 | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| D5 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| D6 | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Verdict** | **survives** | fails | fails | fails | fails | fails |

¹ Contingent on **S1** only. The trust-anchor semantics of A/B/C are identical; S1 either clears all three or kills all three. This is stated as a contingency, not hidden inside a ✓. / Contingente solo a **S1**; S1 despeja o mata los tres por igual.

² Blind assessment. A/B/C keep a CA-as-launch-input contract, so trust-establishment work is reusable in principle; verifying it would require inspecting the candidate, which the packet excludes. D/E/F change the mechanism family outright, so no compatibility claim is made. / Evaluación ciega.

### Failure notes / Notas de fallo

**R9/B.** Env is frozen at daemon spawn (`connection.rs:473-589`). After an idle-timeout or crash restart, the replacement daemon is spawned from the *current* invocation's env, which under R9 has no CA. Effective trust silently reverts to none while the user believes it is set: worse than F5, because F5 at least announces itself by restarting visibly.

**R11/B, R12/B.** Changing or clearing the CA cannot mutate a live daemon's env. The only lever is a daemon restart, which exceeds R11/R12's "replaces the browser safely" and reproduces the F5 continuity loss.

**D1/B, D2/B, D4/B, D6/B.** With no effective-value resolution in the daemon, the hash is computed from the requested value; omission and clear become indistinguishable at the hash, which is the D1 violation restated. No content digest exists, so D2 fails. `--ca` from env forces a launch envelope on every command while the CA itself has no absent→effective fallback (D4). Clear has no representation that survives the env channel (D6).

**R9/C, R11/C, R12/C.** Directly observed. F5: omission is read as removal, the daemon and browser restart, target and URL are lost, a fresh page returns. F6 confirms the only passing path is verbatim repetition, i.e. R10 alone. R11/R12 are executed as daemon replacement rather than browser replacement.

**R17/C.** Adding a field to `daemon_config_fingerprint` (`connection.rs:591-600`) makes daemon restart decisions depend on a launch-time input. That re-keys `daemon_config_status` for every session, including sessions that never use the option, changing the existing reuse/relaunch contract.

**R0/D, R1/D.** The switch suppresses certificate *errors* for listed SPKI hashes; it does not install an anchor. Per F3 the server omits the CA from the presented chain, so the CA's SPKI is never observed on the wire and cannot match. Per F2 this is the same bypass family as `--ignore-https-errors`, only narrower: the packet states the requested capability is different in kind, not in width.

**R2/D, R3/D, R4/D.** Error suppression is not selective by error type. A matching certificate is accepted despite hostname mismatch and despite expired or not-yet-valid periods, contradicting F4 and the four required Reject rows of the discriminator matrix.

**R13/D.** It *is* a bypass, so shipping it as "selective CA trust" silently merges the two axes R13 keeps separate.

**D5/D.** The input is a public-key hash, not a certificate, so there is nothing to validate as a CA; the pre-launch validation R7 asks for has no subject.

**R0/E, E-u3.** Chromium's verifier is removed from the path for intercepted traffic and replaced by ours. That is a substitution of verification for the whole session, not a scoped anchor added to it.

**R8/E, R14/E, R17/E.** `Fetch` interception is already owned by proxy authentication and network controls (`actions.rs:4276-4294`); a full-traffic interceptor collides with a shipped subsystem, and WebSocket/download traffic has no fulfillment path, so failure and cleanup semantics are not observable as a single contract.

**R5/F, R6/F.** Machine-global trust affects every session on the host, including runs with no CA configured, and cannot isolate two concurrent sessions using different CAs.

**R7/F, R8/F.** Writing a system trust store or a managed-policy file requires privilege, and its residue is global state that outlives daemon and browser; "no leaked state" is not achievable.

**R16/F.** A system trust store is also consulted by the CLI's own outbound TLS stack. Installing the CA there crosses the boundary R16 declares must not change.

**R12/F.** Removal is a privileged global mutation with no per-session meaning; a "clear" in one session would revoke trust for another.

---

## 4. Recommended survivor / Superviviente recomendado

### Shape A: Session-private trust anchor with sticky effective CA

**ES.** Es el único shape que sobrevive al fit check, y sobrevive por una razón estructural, no por afinación: separa los dos ejes que el packet mide por separado. El eje de confianza queda dentro del proceso Chrome (`HOME` acotado + NSS DB privado), que es exactamente el patrón que la base ya usa para el Xvfb privado: recurso privado, inyectado por env, propiedad de un proceso, borrado en `Drop`. El eje de estado queda en el daemon con la semántica `requested.unwrap_or(existing)` que `allowedDomains` ya ejerce, más un sidecar por sesión con las invariantes de `tab_binding`. F5 desaparece no por un caso especial, sino porque la CA nunca toca `daemon_config_fingerprint`, igual que `proxy` y `headed` ya no lo tocan.

**EN.** It is the only shape that survives the fit check, and it survives structurally rather than by tuning: it separates the two axes the packet measures separately. The trust axis lives inside the Chrome process (scoped `HOME` + private NSS DB), which is precisely the pattern the base already uses for the private Xvfb: private resource, env-injected, owned by one process, removed on `Drop`. The state axis lives in the daemon with the `requested.unwrap_or(existing)` semantics `allowedDomains` already exercises, plus a per-session sidecar carrying `tab_binding`'s invariants. F5 disappears not through a special case but because the CA never touches `daemon_config_fingerprint`, exactly as `proxy` and `headed` already do not.

**Why it is the survivor / Por qué es el superviviente**

1. **D1 is satisfied by construction.** Hashing the *effective* CA makes omitted and repeated inputs produce an identical hash, so `actions.rs:4235-4248` reuses the browser without a special case, and changed or cleared inputs produce a different hash, so relaunch is the ordinary path. R9–R12 fall out of one mechanism instead of four.
2. **Every part has an in-tree precedent.** No new architectural concept is introduced: M3, M4, M5, M6, M7, M8, M9, M10, M11, M13 all already exist. The novelty is confined to the NSS population step (M14: greenfield).
3. **The two escalating cases are already distinguished.** "Change" and "clear" both mean *replace the browser*; neither means *restart the daemon*. The base's own split between `DaemonOptions` and the launch hash (F7) is what makes this expressible.
4. **F11's narrow scope is honoured cleanly.** Linux-and-local-Chromium-only is enforced at the same dual-layer guard site that already rejects `--webgpu` with `--cdp`, so R14 is a copy of a shipped shape rather than new policy.

**What the survivor still owes / Qué debe todavía**

- S1 is load-bearing. If S1 fails, Shape A fails with it, and so do B and C, which would leave **no surviving shape in this problem's shape space** and force the packet back to the frame: that is the honest reading, and it should be said before any work starts.
- U-a, U-b, U-c, U-d are open contract decisions, not implementation details. U-a decides whether part A6 exists at all.

---

## 5. Rejected alternatives and required spikes / Alternativas rechazadas y spikes requeridos

### Rejected / Rechazadas

| Shape | Rejected on | One-line reason |
|---|---|---|
| B: env-default stickiness | R9, R11, R12, D1, D2, D4, D6 | A daemon's env is frozen at spawn, so stickiness survives exactly as long as the daemon does: and dies silently, not visibly, when it does not. |
| C: daemon process configuration | R9, R11, R12, R17, D1, D2, D4 | This is the shape whose failure F5 records: omission reads as removal, and the escalation lever is a daemon restart rather than a browser replacement. |
| D: SPKI allow-list | R0, R1, R2, R3, R4, R13, R18, D5 | Suppresses errors instead of adding an anchor; the CA's SPKI is never on the wire (F3) and hostname/validity checks go down with it (F4). |
| E: CDP-side TLS termination | R0, R8, R14, R17, R18 | Portable and semantically precise, but it replaces Chromium's verifier wholesale, collides with the shipped `Fetch`/proxy-auth path, and leaves WebSocket and download traffic uncovered. |
| F: system store / enterprise policy | R5, R6, R7, R8, R12, R16, R17, R18, D3 | Machine-global and privileged: it cannot isolate concurrent sessions, cannot avoid leaking state, and crosses the R16 boundary into the CLI's own trust. |

**Note on E / Nota sobre E.** E is the only rejected shape worth revisiting if F10 (portability to macOS and Windows) is later promoted from unknown to requirement. Its rejection here is about *this* contract, not about its ceiling. / E es el único shape rechazado que merece revisitarse si F10 pasa de incógnita a requisito.

### Required spikes / Spikes requeridos

Cada spike declara qué mata. Un spike que no puede fallar no es un spike. / Each spike declares what it kills. A spike that cannot fail is not a spike.

| # | Spike | Answers | Kill condition |
|---|---|---|---|
| **S1** | **Trust-anchor sufficiency.** With one root added at `C,,` to a session-private NSS DB and Chromium started under a scoped `HOME`, drive the five certificate rows of the discriminator matrix: correct-hostname leaf with the CA omitted from the served chain (Accept), wrong hostname, unrelated CA, expired, not-yet-valid (all Reject). Run headless and headed, on the Chrome version this repo pins. | U1, R0–R4 | If the Accept row fails, or any Reject row passes, Shapes A, B, and C all die and the problem returns to the frame. **Blocking: nothing else should start before this.** |
| **S2** | **Scoped-`HOME` blast radius.** Enumerate what Chromium reads from `HOME` when `--user-data-dir` is explicit (`chrome.rs:474-487`): default download directory, crashpad, font/dconf caches. Then answer the `--profile` question: with a scoped `HOME`, a profile session loses the user's real `~/.pki/nssdb`. | A-u2, A-u3, R5, R14, R17 | If a HOME-derived path changes observable behavior that existing suites depend on, part A7's injection point must move or A7 needs pre-seeding, which changes the shape's cost. |
| **S3** | **Prerequisite and rollback.** With `certutil` absent from `PATH`, and separately with it present but failing, confirm an actionable pre-launch error naming the installable package, with no trust directory and no Chrome process left behind. Then confirm the same for a malformed or non-CA input certificate (D5). | U4, R7, D5 | If any path creates a directory or a process before failing, R7 fails and the ordering inside A8 must be inverted. |
| **S4** | **Continuity across restart.** `open` with a CA, then force an idle-timeout daemon restart, then `snapshot` with the option omitted. Observe daemon PID, target, URL, page state, trust result, and effective CA identity. Repeat with the sidecar deliberately corrupted. | U-a, U2, R8, R9 | If live state alone suffices, part A6 is unnecessary scope and should be cut. If the sidecar is required, the corrupt-file path must surface an error rather than silently degrade to no-trust: the invariant `tab_binding.rs:68-95` already documents for the same reason. |
| **S5** | **Concurrency and isolation.** Two sessions, two different CAs, overlapping in time; each must accept only its own CA's leaf. Then kill one daemon with `SIGKILL` and confirm the surviving session is unaffected and the dead session's trust directory is bounded by the existing stale sweep. | U3-adjacent, R6, R8, D3 | If trust material or sweep behavior crosses sessions, part A7's path scheme or part A9's sweep hook is wrong. |
| **S6** | **Clear-representation reachability** *(decision spike).* Express set / omit / clear in all four channels and confirm none of them collapses clear into omission: in particular that an exported-empty env var and an absent env var are distinguishable by deliberate normalization, not by accident. | U3, U-b, D6, R12, R15 | If any channel cannot express clear, R12 is unreachable through that channel and R15's "one consistent contract" fails. |
| **S7** | **`--ignore-https-errors` composition** *(decision spike).* Choose hard conflict error versus independent-and-documented, and state where the choice is enforced. | U-c, R13 | Not a kill risk; it is an unresolved contract that must be settled before the parity set in A12 can be written, since help, README, docs, and schema must all say the same thing. |

**Sequencing / Secuencia.** S1 gates everything. S2 and S3 shape part A7/A8 and can run in parallel after S1. S4 decides whether A6 is in scope. S5 validates R6/R8. S6 and S7 are decisions that must land before A12's parity work, and they do not depend on S1.

---

## Verification of the review itself / Verificación de la propia revisión

**ES.** Esta revisión es auditable de dos formas: (i) cada handle `file:line` puede abrirse en el commit base `548b159` para confirmar que el mecanismo citado existe y hace lo que se afirma; (ii) las cinco filas de certificado de la matriz discriminadora son ejecutables como S1 sin escribir código de producto. Los tres veredictos que no dependen de S1 (D, E, F) se derivan de F2/F3/F4 y de `actions.rs:4276-4294`, es decir, de evidencia del packet y del código base, no de juicio.

**EN.** This review is auditable two ways: (i) every `file:line` handle can be opened at base commit `548b159` to confirm the cited mechanism exists and does what is claimed; (ii) the five certificate rows of the discriminator matrix are executable as S1 without writing any product code. The three verdicts that do not depend on S1 (D, E, F) follow from F2/F3/F4 and from `actions.rs:4276-4294`, i.e. from packet and base-code evidence rather than judgement.

**Out of scope by instruction / Fuera de alcance por instrucción.** No breadboard, no slicing, no candidate/PR/branch inspection, no implementation. R18 is therefore a contract-compatibility statement only.

---

## Notas del reviewer / Reviewer notes

**ES.** Dos observaciones que quiero dejar explícitas por honestidad:

1. **El hallazgo más útil de la exploración no es un mecanismo nuevo, es que el problema ya está resuelto tres veces en la base.** `headless` (fallback a env), `allowedDomains` (fallback a estado vivo) y `pinTab`/`tab_binding` (sticky persistido con clear explícito) son tres soluciones distintas al mismo patrón "ausente ≠ eliminar". El comentario en `main.rs:1498-1506` describe literalmente el peligro de F5 para `--headed`. El shape superviviente es la composición de dos de esos tres patrones, no una invención.

2. **S1 es la única incógnita real y es binaria.** Todo el resto de la revisión: propiedad del estado, hashing, limpieza, paridad: es cartografía sobre mecanismos existentes y se puede juzgar sin ejecutar nada. Pero la semántica de anclaje NSS bajo el verificador actual de Chromium no está establecida por ninguna evidencia del packet (F10 lo admite para macOS/Windows; para Linux nadie lo ha medido en este commit). Recomiendo no aprobar trabajo de implementación hasta que S1 tenga resultado.

**EN.** Two observations I want to state plainly:

1. **The most useful finding is not a new mechanism: it is that the base already solves this problem three times.** `headless` (env fallback), `allowedDomains` (live-state fallback), and `pinTab`/`tab_binding` (persisted sticky with explicit clear) are three different answers to the same "absent ≠ remove" pattern. The comment at `main.rs:1498-1506` literally describes the F5 hazard for `--headed`. The surviving shape composes two of those three; it invents nothing.

2. **S1 is the only real unknown, and it is binary.** Everything else in this review is mapping onto existing mechanisms and can be judged without running anything. But NSS anchor semantics under Chromium's current verifier are not established by any packet evidence: F10 concedes this for macOS/Windows, and for Linux nobody has measured it at this commit. I recommend not approving implementation work until S1 has a result.
