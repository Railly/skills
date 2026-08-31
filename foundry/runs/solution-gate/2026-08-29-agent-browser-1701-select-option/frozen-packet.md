# Frozen problem packet

## Mode

Candidate audit for vercel-labs/agent-browser#1701.

Base under review: `origin/main` at `fbd046c23a2c1156891bda294aaaee715c23b3f1`.

The candidate implementation is sealed until the blind shaping passes complete.

## Frame

The native `select` command cannot reliably use an option name returned by the interactive accessibility snapshot when the DOM label contains a non-breaking space. The product should let an agent select a native option by the readable name it was shown without weakening established exact-value behavior or changing state when resolution fails.

## Evidence

- E1, reported in issue #1700: an option whose DOM text is `Capital\u00A0Federal` appears in `snapshot -i` as `CapitalFederal`.
- E2, reported in issue #1700: `select "CapitalFederal"` and `select "Capital Federal"` fail, while the raw NBSP string and opaque value succeed.
- E3, observed in `cli/src/native/snapshot.rs` on the base: U+00A0 is included with zero-width characters in `INVISIBLE_CHARS`; rendered names replace every listed character with an empty string.
- E4, observed in `cli/src/native/interaction.rs` on the base: native option resolution accepts an exact option value or exact trimmed `textContent`.
- E5, observed in `cli/src/native/interaction.rs` on the base: the loop mutates every option's selected state before it knows whether any input resolved; a total miss then returns an error.
- E6, observed in `cli/src/mcp.rs` and `cli/src/native/actions.rs` on the base: MCP and CLI select requests converge on the native `select_option` implementation.
- E7, specified by existing command behavior: a native select may receive more than one requested value for a multiple-select element.

## Settled requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | An option name displayed by the interactive snapshot can be passed back to `select` successfully. | Core goal |
| R1 | A human-readable ASCII-space spelling resolves an otherwise identical label containing non-breaking whitespace. | Must-have |
| R2 | Exact option values continue to resolve with their current case-sensitive semantics. | Must-have |
| R3 | A request that cannot be resolved fails loudly and leaves the current selection unchanged. | Must-have |
| R4 | Multiple requested values remain supported for native multiple-select elements. | Must-have |
| R5 | CLI and MCP behavior remain aligned through their shared native path. | Must-have |
| R6 | Snapshot option names remain readable and do not join words separated by non-breaking whitespace. | Must-have |
| R7 | The fix does not add unrelated case-insensitive matching. | Must-have |
| R8 | Resolution does not silently choose among multiple options that become indistinguishable only after fallback normalization. | Must-have |

## Must not change

- Exact matching by opaque option value.
- Successful native selection dispatches the existing change event.
- The command continues returning the existing loud available-options error for a genuine miss.
- No new command, flag, output schema, or MCP surface is introduced.

## Unknowns to probe

- U1: What exact name does current Chrome expose to the base snapshot for NBSP and zero-width variants?
- U2: How does current base behavior mutate single-select and multiple-select state after a miss?
- U3: What happens when two labels normalize to the same spelling?
- U4: Should a raw exact label outrank a normalized collision?
- U5: Can snapshot rendering and selection matching share one practical normalization contract across Rust and injected JavaScript without broadening case semantics?

## Required discriminator cells

| Cell | Options | Input | Required result |
|---|---|---|---|
| D1 | label `Capital\u00A0Federal`, opaque value `C` | displayed snapshot name | select `C` |
| D2 | label `Capital\u00A0Federal`, opaque value `C` | `Capital Federal` | select `C` |
| D3 | label `Capital\u00A0Federal`, opaque value `C` | `C` | select `C` |
| D4 | selected value `C` | unknown input | error and retain `C` |
| D5 | values `US` and `us` | `us` | exact value `us`, never case-folded ambiguity |
| D6 | labels `Alpha Beta` and `Alpha\u00A0Beta` | exact raw spelling of either | exact option wins |
| D7 | labels that only collide after normalization | normalized fallback spelling | error without mutation |
| D8 | multiple-select with two distinct requested values | both values | both selected |
| D9 | label containing NBSP | snapshot | words remain visually separated |

## Source handles

- `gh issue view 1700 --repo vercel-labs/agent-browser`
- `cli/src/native/snapshot.rs:68`
- `cli/src/native/snapshot.rs:1137`
- `cli/src/native/interaction.rs:424`
- `cli/src/mcp.rs:2532`
- `cli/src/native/actions.rs:5437`
