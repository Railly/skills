# WebMCP editor contract

User authorization: editable web controls remain client-side. Coding agents reason about layout using their own subscription and optionally generate images externally via ai-cli and AI Gateway. Imported image bytes return through WebMCP. No browser model tools or API keys. Add GitHub to the shared header and publish the authorized product update; leave the blog and npm package unchanged.

A1: native tools discover and mutate the same validated editor state, including both faces, every existing document field, profile, image import/export, view and library.
A2: stale or invalid edits cannot silently overwrite the current design; locks and undo follow the editor.
A3: image/storage cancellation and failures report an outcome and permit retry. Completed durable writes are not rolled back. Explicit cancellation covers experimental browsers that omit invocation signals.
A4: unsupported native API keeps the manual editor. Header and guide work on mobile.
A5: no generation, API key, shell or remote-image URL tool is exposed. Generation documentation is external and optional.

Verification claims are limited to the installed Chromium on this Mac, native agent-browser transport and local production build, then public smoke. Hosted paid image generation, other browser engines and phone GPUs are not part of the verified claim.
