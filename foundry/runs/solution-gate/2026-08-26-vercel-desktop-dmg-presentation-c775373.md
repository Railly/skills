# Vercel Desktop: DMG presentation restoration

Date: 2026-08-26

Mode: candidate audit

Base: `vercel-labs/vercel-desktop@c77537352ec3b1afee0a0c8e53ac8d1052248fa8`

Candidate PR: `vercel-labs/vercel-desktop#21`

## Frame

Downloaded release DMGs must open with the repository-owned branded artwork and exact installer layout. The presentation must survive final compression, another machine, a suffixed mount path, macOS 14 and 15, and normal download quarantine without changing signing, notarization, updater, feed, or publication behavior.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | A downloaded release DMG opens in Finder with the branded installer artwork rendered rather than a plain Finder background. | Core goal, settled |
| R1 | The window presents `Vercel.app` at `{190, 185}`, `Applications` at `{570, 185}`, 128-point icons, and a 760×660 content area. | Must-have, settled |
| R2 | Artwork remains Retina-capable using the repository's current 760×660 and 1520×1320 source assets. | Must-have, settled |
| R3 | Presentation remains correct on another machine and when macOS assigns a suffixed mount path such as `/Volumes/Vercel 1`. | Must-have, settled |
| R4 | The final DMG remains Developer ID signed, notarized, stapled, Gatekeeper-verifiable, and `hdiutil verify`-clean. | Must-have, settled |
| R5 | App bundle, updater ZIP, update feed, release filenames/content types, publication order, and version/tag safety behavior remain unchanged. | Must-not-change, settled + derived |
| R6 | Local ad-hoc packaging and protected `macos-15` release packaging run non-interactively, produce the same presentation contract, and fail clearly when they cannot. | Must-have, settled |
| R7 | Verification rejects a DMG Finder renders incorrectly even when artwork files and background-related metadata strings are present. | Must-have, settled |
| R8 | Every build derives presentation state from repository-owned inputs and does not reuse a pre-authored template. | Must-have, settled |
| R9 | Customers need no setup, repair action, Automation permission, or other consent beyond normal Finder mounting. | Must-have, settled + derived |
| R10 | Presentation renders on the supported consumer floor, macOS 14.0, and later supported releases. | Must-have, derived |
| R11 | Presentation is fully embedded before signing and renders from the final read-only compressed DMG without Finder repairing it. | Must-have, derived |
| R12 | Downloaded identical bytes with normal quarantine provenance render the same as locally verified final bytes. | Must-have, derived |

## Independent blind shaping

| Reviewer | Family | Artifact | Final recommendation |
|---|---|---|---|
| Opus | Anthropic via AI Gateway | `/private/tmp/vercel-dmg-solution-gate/opus-reshaped.md` | Finder authoring plus screenshot-based verification |
| Gemini | Google via AI Gateway | `/private/tmp/vercel-dmg-solution-gate/gemini-reshaped.md` | Finder authoring plus screenshot-based verification |

Both passes received the same base-only packet and no candidate diff. Initial disagreement about Finder reliability and deterministic metadata synthesis was resolved by probes rather than voting.

## Surviving shape F

| Part | Mechanism |
|---|---|
| F1 | Keep the existing `appdmg` staging output and repository-owned 1×/2× artwork. |
| F2 | Convert to a writable image and let Finder author the layout with bounded AppleScript automation. |
| F3 | Detach and convert to final read-only UDZO before signing and notarization. |
| F4 | Mount the exact final bytes read-only, open the volume in Finder, assert geometry and icon positions, capture its window, and compare distinctive artwork pixels outside icon occlusion zones. |
| F5 | Fail packaging if Finder, capture, geometry, or artwork verification fails. |

One independently mergeable slice owns F1 through F5 because authoring without its result-level oracle would recreate the release escape.

## Probe evidence

| Probe | Outcome |
|---|---|
| Published v0.0.18 and v0.0.19 | Both contain artwork and background metadata but render plain white. |
| Finder final read-only remount | Correct artwork and exact layout render after detach and UDZO conversion at a suffixed mount path. |
| AppleScript background readback | Returns `missing value` for a visibly correct DMG, so it is not an oracle. |
| `dmgbuild` 1.6.7 | Renders locally but adds Python, `dmgbuild`, `ds_store`, and `mac_alias` without eliminating result verification. |
| GitHub Actions `32999502003` | Finder authoring, read-only remount, and capture pass noninteractively on `macos-14` and `macos-15`. |
| Pixel discriminator | Correct DMG: 100.0% match. Published broken DMG: 24.2% match and mean channel difference 108.4. |
| GitHub Actions `33000899153` | Bytes produced on macOS 15, transferred unchanged, quarantined, mounted as `/Volumes/Vercel 1`, and visually verified on macOS 14 at 100.0% match. |

## Final fit

| Req | F |
|---|:---:|
| R0 | ✅ |
| R1 | ✅ |
| R2 | ✅ |
| R3 | ✅ |
| R4 | ✅ |
| R5 | ✅ |
| R6 | ✅ |
| R7 | ✅ |
| R8 | ✅ |
| R9 | ✅ |
| R10 | ✅ |
| R11 | ✅ |
| R12 | ✅ |

## Failure-shape score

| Shape | Disposition |
|---|---|
| S1 over-reach | Existing app, updater, signing, notarization, feed, and publication paths remain unchanged. |
| S2 under-reach | Same-machine, suffixed-mount, macOS 14/15, cross-machine, quarantine, and broken-artifact cells were driven. |
| S3 direction inheritance | Authoring success and verification rejection are both observed. |
| S4 proxy property | Screenshot pixels and Finder geometry directly observe presentation; strings and metadata readback were rejected as proxies. |
| S5 unregistered peer | No persistent state or lifecycle peer is introduced. |
| S6 peer-version blindness | No cross-process protocol is introduced. |
| S7 wrong layer | Verification runs on the final Finder-rendered DMG bytes consumed by users. |
| S8 guard-derived cells | The negative cell comes from the published release artifact, not from the comparator's implementation. |
| S9 wrong test | The published broken DMG turns the visual gate red while fixed artifacts turn it green. |
| S10 prose claim | Claims come from mounted artifacts and runner executions. |
| S11 asymmetric validation | Not applicable; no shared untrusted input gains authority. |
| S12 primitive mismatch | Finder remains the presentation authority and the gate observes Finder's output. |
| S13 invocation-state collapse | Not applicable; no invocation-persistent state is introduced. |

## Candidate verdict

**Amend, then pass to detail.**

Retain the candidate's Finder authoring pass. Remove the metadata/bookmark check that rejects correct artifacts, add a final visual gate, bound Finder automation, and discard all temporary probe workflows and commits. Do not adopt `dmgbuild` or a new packaging toolchain.

Review Gate receives R4 through R7 as the must-not-change and regression set, plus the published v0.0.18 negative control and the cross-machine runner evidence.

Visualization choice: inline tables. The mechanism is a short linear artifact transition and does not need a larger diagram.
