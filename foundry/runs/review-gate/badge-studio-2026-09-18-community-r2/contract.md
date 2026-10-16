# Public Badge Studio collection

Date: 2026-09-18
Base: 11f7abaed7f2ba6afae621077f2aacc0fce9d0bb
Mode: greenfield, high risk because this introduces public persistence and author authority.
Budget: two isolated shaping passes and targeted probes before implementation.

## Source

> ok i like it guardalo para que qued e listado en los badges otra cosa es que el mismo debe ser capaz de subir eso a la web y se vea para todos los usuarios via webmcp debemos tener una BD en Neon para hacer esto posible y la gente pueda empezar a pushear sus vainas

> Publicar con cuenta de Clerk; explorar y diseñar sin cuenta

> wait wait wait, clerk cli porfa y usar neon cli tengo mi propia bd con mi cuenta de github de neo debemos usar eso please no otra! gracias! y clerk tambien nuestra propio cuenta que esta asociada a github no otra!

## Frame

The approved Noche Abierta badge exists only in one browser and exported artifacts. Other people cannot discover it or publish their own editable badges to the shared collection. Desired outcome: an author can explicitly publish a complete badge, anyone can discover and reuse it, and that author can maintain its public presence.

## Settled requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | Noche Abierta becomes discoverable in the public collection with its approved design intact. | Core |
| R1 | Browsing, designing, local saving and exporting remain anonymous. | Must |
| R2 | Public publishing requires a real Clerk account. Only the publishing author can update or withdraw that publication. | Must |
| R3 | Publishing, reading and updating are available through the same WebMCP surface used by badgio and the browser. | Must |
| R4 | Published documents and their required images remain available to another browser and after deployment. | Must |
| R5 | Publishing is explicit and discloses that the selected identity, image and composition become public. Saving locally does not publish. | Must |
| R6 | Authentication or a failed publication does not discard the ongoing composition, participant data or local library. | Must |
| R7 | Repeated and concurrent requests do not create accidental duplicates, overwrite another author's work, or acknowledge an uncommitted publication. | Derived safety |
| R8 | The shared schema, both faces, editable native layers, participant bindings and readable QR are preserved. | Must |
| R9 | Crafter UI components and design tokens are used. Create with your agent remains the primary entry point. | Must |
| R10 | Neon and Clerk are accessed using their CLIs and the user's existing GitHub-linked accounts. No Vercel Marketplace account provisioning. | Must |
| R11 | The visible preview stays in the user's built-in browser or OS default, supporting continued natural-language iteration. | Must |
| R12 | Public reads do not overwrite a visitor's private shared participant identity. | Derived safety |
| R13 | Server-side validation and bounded inputs enforce the public publication contract regardless of client or WebMCP checks. | Derived safety |

The user's standing stack preference is Uploadthing for stored files. Exact media provisioning is unresolved. The existing event SDK and legacy generation endpoints are outside scope.

## Observed evidence

- `apps/web/src/app/design/design-client.ts:designRequest` uses browser persistence by default.
- `apps/web/src/app/design/use-design-studio.ts` owns the current composition, local saved identity, history and guarded asynchronous operations.
- `apps/web/src/app/design/use-studio-webmcp.ts` registers nine tools through native WebMCP and the loopback bridge. Mutations require a current revision. `badge_library` explicitly only saves locally.
- `apps/web/src/app/design/design-studio.tsx` holds the renderer handle, which exports actual front/back PNGs.
- `apps/web/src/components/participant-profile-provider.tsx` owns shared browser participant identity and portrait.
- `apps/web/src/app/gallery/page.tsx` and `design-gallery.tsx` list the static catalog only.
- `apps/web/src/lib/prism-auth.ts` contains real Clerk resolution and a separate local-only demo mode.
- `apps/web/src/middleware.ts` applies Clerk only to enumerated routes.
- `apps/web/src/lib/design-http.ts` refuses server filesystem storage on Vercel.
- `packages/cli/src/studio-shell.txt` embeds the editor in a loopback iframe.
- `packages/design/src/badge-design.ts` is the authoritative design validator.
- `v19-release-dogfood/noche-abierta/` contains the approved document, fictional portrait, participant and both rendered faces.
- `clerk whoami --json` and `neon me --output json` now succeed after the user's browser authentication. Neon reports GitHub-linked account Railly Hugo.
- `neon-existing-projects.json` and `clerk-existing-apps.json` contain a sanitized inventory. Exact target selection is pending.
- `neon-marketplace-removal.json` confirms removal of the mistaken empty resource created earlier. Clerk Marketplace was never provisioned.

## Temporal contract

| State | Owner and lifetime | Default / unset → set | Omitted / repeated | Changed | Explicit clear | Reload / restart observables |
|---|---|---|---|---|---|---|
| Local draft | Current browser / author | Existing editor behavior | Preserve current draft | Edit through current history | Existing explicit reset/import | Saved local draft and participant survive authentication and normal reload rules |
| Publication | Clerk author / durable until withdrawal | Unpublished → explicit successful publication | Preserve publication; identical retry refers to same result | Only owner updates against known version | Owner explicitly withdraws | Another browser sees complete current publication; withdrawn entry disappears |
| Publication ownership | Clerk identity / publication lifetime | Set from authenticated server identity | Preserve, never infer from submitted owner field | Ownership transfer is outside scope | Withdrawal does not transfer ownership | Author can continue maintenance after signing in again |
| Published images | Publication author / published version | Private until explicit public publish | Preserve current version's complete images | Commit replacement with matching document | Remove only through an explicit update/withdrawal | No published document may refer to local blob URLs or expired temporary resources |
| Sign-in session | Clerk / session lifetime | Anonymous until real login | Anonymous design works; auth failure preserves draft | Account switch changes publishing authority | Sign-out removes publishing authority | Browser behavior must be tested inside and outside the loopback preview |
| Public remix | Visiting browser / local draft | Load editable composition | Preserve visitor identity when omitted | Visitor chooses their own identity/photo | Existing explicit profile remove | Source publication remains untouched |

## Unknowns and required probes

- Exact existing Neon and Clerk resources the user intends, including production domain status.
- Uploadthing availability and the smallest reliable lifecycle for public images.
- Clerk auth in the cross-origin loopback iframe, including third-party cookie blocking and login resumption.
- Public snapshot limits and renderer outputs that fit real Vercel request limits.
- Retry, stale-version, unauthorized-update, withdrawal, and cross-browser visibility behavior on the selected persistence layer.

No implementation shape has been selected.

## September 18 continuation

User explicitly requested fresh dedicated projects and full production deployment. Created Neon late-darkness-85859150 (badge_studio) and Clerk app_3JVmICVD75CUaB9jIDFkYzMXt7A in the already authenticated owner accounts. Fresh Uploadthing app 0dcjol5vhl created through the user-authorized Dia session; free quota exhausted, $10/month private-storage plan awaits user authorization. Skill must proactively offer agent-driven submission after presenting and approving the finished badge.

Final user amendments: dedicated projects in existing accounts; R2 private images; production release and approved public badges authorized; anonymous creation, Clerk only for publication.
