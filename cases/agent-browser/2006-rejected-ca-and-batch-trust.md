# 2006: rejected --ca-cert was saved; batched reads lacked trust

- PR: vercel-labs/agent-browser#2006. Reviewed head fc11e90a (ctate, CHANGES_REQUESTED), fix 9a446779.

## Defects (maintainer-found)
1. `tls::session_options` wrote trust.json before `ca_bundle::load` validated the file, so a bad path broke later reads until reset.
2. Nested `read` in `batch` got no `tls`, and `command_is_browserless` did not know `batch`, so on macOS a batch with `--ca-cert` failed with "only Linux". Stdin batches were read after the launch gate, so even a browserless check could not see them.

## Fix
Validate before saving; attach session trust to nested reads; `batch` of only reads (args or stdin) is browserless; stdin batch read before launch decisions.

## Evidence
3 integration tests in tls_cli.rs (rejected CA keeps selection, arg batch, stdin batch), all red before; 3 mutants each red. 11/11 tls_cli.

## Lesson
Composition paths (`batch`, stdin form) are consumers of the same trust rule; the stdin form was found only by adding its cell after the arg form passed.
