# getByRole contract checklist (agent-browser)

A forced-enumeration checklist for any diff that touches role matching (`find role`, `build_role_selector`, `handle_getbyrole`, the AX-tree walk, or the presentational-role path). The reference implementation is Playwright's `getByRole`; the authority for role names is the WAI-ARIA spec and the browser's own accessibility-tree role computation.

This exists because the prose oracle "check against Playwright" ran as judgment and judgment sampled the cases the bug report cited (`image`→`img` fixed, `directory`→`list` missed; `button none` fixed, an incomplete role list missed). A checklist item is not "check role X" — it is "regenerate list Y from the reference and diff the code against it." A finding must emerge from the diff, not from this file naming it.

Sources (open them; do not answer from memory):
- Playwright getByRole contract: https://playwright.dev/docs/api/class-locator#locator-get-by-role
- ARIA role list: https://www.w3.org/TR/wai-aria-1.2/#role_definitions
- HTML → implicit ARIA role mapping: https://www.w3.org/TR/html-aria/
- The browser's computed AX role names differ from ARIA tokens for some roles; the canonical mapping is Chromium's `AXRole` ↔ ARIA table and Playwright's role-name normalization in its injected script.

## Checks (each is regenerate-then-diff, binary)

1. **AX-name → ARIA-name normalization is complete.** Pull the complete set of roles whose computed accessibility-tree name differs from the ARIA role token (the reference's normalization map). For each such role, confirm a `find role <ariaToken>` reaches the element whose AX tree reports the renamed name. The code path that matches against the AX tree is the surface under test; any role in the reference map but absent from the code's handling is a finding. Do not stop at the pair the bug report cited — the whole map is the matrix.

2. **The hard-coded role set equals the reference role set.** Locate every hard-coded role list in the diff (e.g. a `VALID_ROLES` set, a match arm list, a fallback ladder). Diff it element-by-element against the full ARIA role list from the spec. A role present in the reference but missing from the code list is a finding whenever the code's behavior degrades on its absence (e.g. an ordered fallback that skips an unknown-but-valid earlier token and matches a later one — a query can then select the wrong element). Enumerate: for a role attribute with multiple tokens, does an unlisted earlier token still shadow a listed later token, per the reference's "first supported token is operative" rule?

3. **Ordered fallback: first operative token wins, literally.** For `role="a b"`, the first token the spec supports is operative; `role="button none"` is a button and must not answer a query for `none`, `role="none button"` must. Confirm the code resolves the operative token from the *complete* role set (check 2), not a subset — a subset makes an earlier unsupported-in-code token fall through to a later one.

4. **presentation / none.** These strip semantics and do not appear in the AX tree, so they need the syntactic DOM path, not the AX-tree path. Confirm both synonyms are handled and matched literally (a query for `none` matches an operative `none` only).

5. **`--exact` / accessible-name matching scope.** Per the reference: name matching is case-insensitive substring by default; `exact` makes it case-sensitive whole-string but still trims whitespace. This applies to the **accessible-name** match of role locators. Confirm every doc surface that states the `--exact` or case rule scopes it to what it actually governs (role accessible-name matching), and does not imply it governs all semantic locators or the role token itself. An assertive sentence broader than the behavior is a finding (this is the docs-behavior-parity lens, applied to the exact contract).

6. **Whitespace and case of the role token itself.** The role token comparison is literal/lowercased; the accessible-name rule (check 5) does not extend to the token. Confirm the diff did not conflate the two (e.g. apply name-matching case rules to the role token, or vice versa).

## Classifier producer matrix (error-path companion, for 1553-class diffs)

Trigger: the diff adds or changes an error-message classifier (locator-miss detection, "element not found" normalization, wrapped-error handling).

A classifier is a two-sided boundary, and it has **two regression surfaces, not one** (this is the inverse-regression-surface lens applied to error classification). Both directions must be forced explicitly; a matrix built from only one is how the other ships broken:

- **Direction 1 — false negative (a real miss that never reaches the classifier).** A locator miss arriving in a form the classifier does not recognize falls through and surfaces as a raw engine/JS/protocol error instead of the anchored miss shape. This is the direction that hides in *new call shapes and new wrapping layers* the diff introduces.
- **Direction 2 — false positive (a non-miss the classifier claims).** Ordinary input whose echoed text contains a classifier keyword (`timeout`, `intercept`, `strict mode violation`, ...) trips the broad classifier before the anchored-miss check runs, erasing the locator detail and giving wrong guidance. This is the direction that hides in *classifier ordering* and *substring matching on user-controlled text*.

The matrix is (producer × form × direction), regenerated from the repo, not the bug report:

- **Producers (engines):** every engine that can emit a locator-miss is a row. From the repo's own engine set: Chrome CDP, WebDriver, Lightpanda. A string that reads as protocol noise in one engine is the genuine locator-miss path in another.
- **Forms:** unwrapped, wrapped once, re-wrapped, and every distinct call shape that reaches the classifier. Enumerate the call shapes from the command surface itself (each query arity the CLI exposes, frame-scoped variants, each action that resolves a locator); each is a cell.
- **For every cell, run both directions:** does a genuine miss in this form/engine reach the anchored shape (D1)? and does a benign value whose text contains a classifier keyword avoid being misclassified (D2)?

Binary: every cell, in both directions, either normalizes correctly (misses → anchored guidance; non-misses → untouched) or is acknowledged with a reason. A form whose miss skips the classifier (D1), a wrapper that drops the guidance, or a keyword-in-input that trips a broad classifier before the miss check (D2), is a finding.
