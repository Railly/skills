# Crafter Research support program review gate

Status: pass

Exact head: `dd023a47039df3c8e1bcde7f990506c789939e2a`

The support program builds at all four locale routes, keeps shipped proof separate from three proposed compute-gated programs, and routes inquiries to `railly@crafterstation.com`. Its proof values `11`, `21,244`, and `N=35`, resource asks, and independence policy agree with the approved research briefs.

The built artifact was inspected at 1440, 768, and 390 pixels in light and dark modes. Every subsection clears the side grecas, uses the available horizontal space, and avoids horizontal overflow. Axe reported zero violations, with skip navigation, focus treatment, headings, links, and language semantics also checked manually.

One locale defect was found and fixed before the final commit: PT and ZH English fallback copy originally inherited the document language. Exact HEAD now shows a localized notice and declares the fallback content as English while keeping the route document language.

`bun run check`, `bun run build`, `git diff --check`, style, surfaces, and exact-HEAD coverage pass. The Radius map reports 138 unresolved calls against 100 edges, so it under-covers Astro and was used only for orientation.

The report validator's durable-state regex produces a false positive on the bare word `link` inside `nav-link` and `skip-link`. Every matched added line was inspected and contains only HTML anchors or CSS selectors, with no filesystem `link()`, persistence API, or runtime write. Structural report validation and exact-HEAD coverage pass separately.

Warning: the same model family authored and reviewed the diff, so shared-prior risk remains recorded. This is standard-risk static content and layout with no runtime durable or remote side effect.

## Exemptions claimed

- Four Biome `noImportantStyles` warnings are pre-existing reduced-motion overrides used for accessibility.
- The empty blog collection warning predates this page and does not prevent any of the 24 routes from building.
- No formal Issue Contract or separate Spec result was supplied. The gate reviews the user requests and approved research briefs without inferring a Spec pass.
- The validator's durable-state signal matches `link` inside HTML and CSS names. The matched lines contain no durable operation, so the change remains standard risk with no side effects.

## Issue candidates

None.
