Recreates #1999 with Jony credited as coauthor. Fixes #1998.

Auth login now selects usable duplicate form controls and keeps credential entry bound to the selected DOM node. If the page replaces a field or redirects focus, login fails before submitting instead of typing into the previously focused input. The general fill command is unchanged.

Chrome uses synchronous native editing. Engines without that capability use the selected element's native value setter; a failed native edit still returns an error. Both paths were exercised in Chrome and actual Lightpanda, including React controlled forms, Unicode values, textarea, and contenteditable selectors.

Validation:
- 1,393 unit tests, 6 integration tests, and 9 auth E2E tests pass.
- Before/after CLI reproduction confirms the original wrong-field delivery and corrected rejection.
- 32 forced lifecycle failures and immediate retries pass across both engines; all 8 textarea/contenteditable combinations pass.
- Regression tests fail with the fix removed and with critical guards disabled. Formatting and Clippy pass.

Remote-object cleanup is best effort if the renderer or CDP connection is destroyed.
