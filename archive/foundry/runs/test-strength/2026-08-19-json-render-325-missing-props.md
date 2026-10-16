# Test Strength: PR #325 missing streamed props

Date: 2026-08-19
Target: `recovers when props arrive after the element type`

## Contract

A type-first streamed element must render without crashing, and a later props
patch must invalidate it and render the completed value.

## Force-red and green

- Removing `?? {}` from signature computation fails in
  `useElementSignatures` with `Cannot convert undefined or null to object`.
- Keeping that guard but removing the stable empty-props fallback fails in
  `resolveBindings` with the same error.
- Restoring both renders `waiting`, then renders `ready` after the props patch.

Each mutation failed at the intended runtime consumer. The literal Vercel
suggestion killed only the first failure and therefore was not sufficient by
itself.

## Boundary and cost

The test uses `buildSpecFromParts` with real `data-spec` patch parts and the
React renderer through Testing Library. The final focused file passes 17/17;
the repository suite passes 1,086/1,086, type-check 59/59, and lint 14/14.
