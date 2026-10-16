# PR 1770 review contract

Source: issue 1105 and PR 1770 at 323449d9618693c85d2191f7dd10010ad22f640b. Derived review criteria, not a separately approved design.

- A1: Preserve native single and multiple selection and match value, label, or normalized text.
- A2: Select standard ARIA combobox/listbox options through real input and verify committed widget state.
- A3: Filter input-backed controls, poll dynamic options, and tolerate disappearing popup options after commitment.
- A4: Explicit ARIA multiselect listboxes reach the final requested set.
- A5: Selection returns within the configured action timeout and surfaces dialogs without hanging.
- A6: CLI, MCP, Eve, help, docs, and guidance advertise the same behavior; WebDriver is explicitly unsupported.

Authorization: local review, compilation, verification, and reports. No GitHub posting or implementation changes requested. No existing work-item manifest or specialist receipts found for this PR.
