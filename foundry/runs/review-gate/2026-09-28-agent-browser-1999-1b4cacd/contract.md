# PR 1999 review contract

User authorized before/after verification then Review Gate. Review-only: no product edits, publication, merge, or push. Isolated local fixtures and disposable credentials are authorized by verification scope.

A1: Hidden-first username, password, and submit controls must not prevent filling and submitting the visible usable form.
A2: Disabled and readonly matches must not receive credential input.
A3: The selected backend node must remain the action target; a stale selection must fail safely without silently targeting another control.
A4: Existing normal login, explicit CSS selector overrides, origin checks, and ordinary snapshot refs must retain their contracts.
A5: Transient node-description failures must repoll within the existing wait budget and release remote object handles.

Source: GitHub issue 1998 and PR 1999, fetched 2026-09-28. Baseline d01253d9db28d75080e36da3c1c31ef89454731e, PR head 1b4cacd0f1a7f9ee5cdf365882fc3ea01e763d51.
