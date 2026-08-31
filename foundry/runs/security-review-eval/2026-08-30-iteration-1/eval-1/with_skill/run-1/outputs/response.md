- Original browser/DNS-rebinding path: `confirmed_vulnerability`, in scope. Incorrect Origin/Host validation or bypassable cookie enforcement blocks approval.
- Token inherited by same-user arbitrary-command plugins: `informational` or `out_of_scope_hardening`; no new authority crosses a trust boundary.
- Premature startup success: `non_security_defect` and `unrelated_bug`; track separately, not a security blocker.

If Origin/Host checks and the unguessable-cookie boundary are correctly enforced, approve the security change.