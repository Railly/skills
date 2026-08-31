Approve if Host/Origin validation and the unguessable external-access cookie are correctly enforced.

- The original DNS-rebinding/cross-origin access is the vulnerability and must block approval if incomplete.
- Token inheritance by plugins is not a separate vulnerability: those plugins already run arbitrary commands as the same OS user, so the token grants no meaningful new authority.
- Premature startup success is a reliability/correctness bug, not this security boundary. Track separately unless it bypasses the controls.

Neither adjacent observation should block this security fix.