# Vercel visual system for before/after artifacts

Source snapshot: `https://vercel.com/design.md`, `https://vercel.com/geist/colors.md`, and `https://vercel.com/geist/typography.md`, read on 2026-08-18.

## Composition

- Make the comparison the dominant object in the first viewport.
- Put peers on the same visual basis so the difference is seen rather than reconstructed.
- Support two speeds: a fast first read and an exact audit path.
- Give each section a new reader question. Remove repeated summaries.
- Use one evidence-bearing organizing move specific to the subject.

## Typography

- Geist Sans owns headings, prose, labels, controls, tables, and numeric evidence.
- Geist Mono is limited to code, commands, paths, raw tokens, timestamps, and short identifiers.
- Use sentence case.
- Keep prose near 60 to 68 characters per line.
- Keep equivalent before/after roles at identical size, weight, leading, and alignment.
- Avoid all-caps eyebrows, tracked overlines, decorative section numbers, and em dashes.

## Color and surfaces

- Design in monochrome.
- Use color only for meaningful state, action, warning, error, or data distinction, paired with a non-color cue.
- Use Background 1 by default and Background 2 sparingly.
- Use Vercel scale steps 1 to 3 for component backgrounds, 4 to 6 for borders, 7 to 8 for high-contrast backgrounds, 9 for secondary text, and 10 for primary text.
- Prefer spacing and alignment before adding a border or surface.
- Keep radii restrained.

Reject gradients, gradient text, glows, blobs, textures, glass effects, ornamental shadows, decorative grids, fake depth, colored side rails, and generic card walls.

## Evidence

- Use semantic tables with captions, heads, bodies, and aligned numeric columns.
- Show units, period, population, base, and material comparators.
- Use a common documented scale for peer length encodings.
- Give charts direct labels and a text alternative.
- Do not use final-state equality as evidence for timing, flicker, input, or lifecycle behavior.

## Interaction

- Interaction must expose evidence or clarify a state change.
- Use native controls, visible labels, visible focus, and keyboard access.
- Pre-render a useful default.
- Update dependent outputs atomically.
- Default to stillness and respect reduced motion.

## Responsive and access

- Use landmarks, one descriptive `h1`, ordered headings, a skip link, and semantic figures and tables.
- Preserve source order as reading order.
- Reflow comparisons before shrinking type.
- Never conceal page overflow globally.
- Check light and dark themes without adding a visible theme switcher.

The target is Vercel judgment, not Vercel decoration.
