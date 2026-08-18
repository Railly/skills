# Portless #378 review gate

Status: complete.

## Result

- Replaced the two-step `schtasks` plus PowerShell configuration with one `schtasks /Create /XML /F` registration containing `PT0S`.
- Preserved boot trigger, `SYSTEM`, and highest privileges.
- Runs the batch entry through `cmd.exe /d /s /c`.
- Registers the new task before stopping the current proxy, so a registration failure does not explicitly stop the prior service.

## Evidence

- Task XML validates against Microsoft's Task Scheduler XSD.
- Mutation `PT0S` to `PT72H` produced three intended failures.
- 28 of 28 focused service tests pass.
- 754 of 754 tests pass in a non-Git snapshot.
- Build, type-check, lint, format, and `git diff --check` pass.
- Review gates `style`, `surfaces`, `artifacts`, and caller sweeps pass.
- GitHub Actions run `31641000991` passed on `windows-latest`.
- The registered task exported `PT0S`, `SYSTEM`, highest privileges, a boot trigger, and `cmd.exe`.
- `portless service status` reported the service running and the proxy responding on port 18080.
- `cuse` found and focused Task Scheduler, extracted 68 accessibility controls, and captured a screenshot.
- The workflow uninstalled the service successfully after evidence collection.

## Exemptions claimed

- No documentation update. The user-facing behavior is unchanged.

## Issue candidates

- `portless clean` leaves the Windows service directory when task registration never succeeded.
- Reinstall overwrites the shared `.cmd` before replacement task registration succeeds.
