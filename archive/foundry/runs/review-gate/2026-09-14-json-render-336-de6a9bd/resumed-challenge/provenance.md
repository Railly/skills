# independent_challenge: provenance and scope

This is an additive, local challenge receipt for vercel-labs/json-render#336, HEAD de6a9bdbc0100ac778dff1ad48ab2f732b7d181e, base 6c7164342a37fab055907f1666658e1333e2cb86. It is not an amended Review Gate report, a promotion, a fix, a deployment, or a replacement specialist receipt. The machine decision and actual results are in receipt.json and execution.json.

## Applicable obligation

The complete canonical skills/review-gate/SKILL.md and references/proof-obligations.md were read. Proof obligations lines 40-44 permit a substrate corpus whose oracle was defined independently of the implementation; they do not require a different model family when this alternative is used. Canonical skill revision is git:77fdde3e8d7e13b7c27c7660f7c15619839e38af, tree 54c8a332dab0febea175fc4fc375785e8745e6c4. The requested scope overrides the skill's normal manifest/report writeback and broader gate workflow.

Independence type: substrate_corpus_with_implementation_independent_normative_oracle. No model-family independence, human review, blinded authorship, or normative reference implementation is asserted. This reviewer has read inherited implementation-exposed material. The independence is in the normative expected results, not the person/model constructing or executing the harness. The corpus is newly assembled, not an independently published test suite.

## Audit of inherited corpus

../test-strength/model.json:39 explicitly says the model was assembled after inherited implementation exposure. Its oracle_sources list RFC 6901, RFC 6902, review acceptance A1-A4 and JavaScript observations. That statement alone does not establish independent expectations for every assertion.

../test-strength/corpus.mjs:26-34 classifies tokens by Object.defineProperty on a real JavaScript Array and whether its length changes. This is a substrate observation independent of the production parser, but it is an Array-index property oracle, not a complete RFC 6901 validator or RFC 6902 evaluator. In particular, canonical decimal strings 4294967295 and larger satisfy RFC 6901's grammar although they are not usable Array indices under json-render's documented bound. The old classifier's four canonical reads include sparse/missing reads; an undefined read does not prove acceptance of an upper-bound index. No new claim closes that coverage gap.

Its invalid-token loops at lines 44-94 test no-op mutations, literal object keys, store identity/notifications, and continued seven-character-chunk streams. These are useful assertions but mix substrate classification, RFC grammar, and product policy. The old receipt's oracle.independent=true is therefore not blindly adopted as proof for the whole model. In particular:

- Silent write rejection, stable snapshot identity and zero notifications require the product docs, not merely RFC text.
- Continued JSONL streaming after rejected operations is not the error semantics of an RFC 6902 patch document.
- Object keys such as "01" are legitimate under RFC 6901 section 4. Array-only restrictions cannot be applied to objects.
- Reserved decoded tokens and complete renderer/batch dimensions were not exhaustively tested by that generated token set.
- The inherited 9,042 assertions and the copy-source mutation survivor are not a passing Test Strength receipt. Saved copy-survivor-results.json records the authored mutant suite exiting 0, stricter own-key mutant proof exiting 1, and restored proof exiting 0. This run consumes those records and does not repeat mutations.

verify.mjs preserves the old corpus's assertions and generator exactly. It changes only the model input directory and results output destination in a new resumed-challenge/reused-corpus.mjs. Both replacements and both file hashes are recorded. This inexpensive replay is supplemental regression evidence, not the sole independence argument.

## New expected-value provenance

corpus.json contains explicit expected values and a source table with local paths, section names, line ranges and authority classifications. verify.mjs hashes the corpus and saves those local source excerpts in oracle-freeze.json before importing production artifacts. Expected values are never calculated by a production helper, a production diff generator, a reference wrapper around the same implementation, or by copying observed output.

The independently defined core comes from the saved April 2013 normative documents:

- ../rfc6901.txt:231-259, section 5: the example JSON document and its complete twelve-entry pointer/result table, including the root empty string and the distinct root "/" pointer.
- ../rfc6901.txt:140-159, section 4: decoding order and literal object-member equality. The text expressly says "~01" decodes to "~1", not "/". The additional literal "01", "-" and nested empty-member fixtures instantiate that rule.
- ../rfc6901.txt:175-205, section 4: array-index grammar. The finite invalid spellings in corpus.json are classified from this grammar before execution. Their undefined/no-op observable is separately attributed to product error policy.
- ../rfc6902.txt Appendix A.1-A.7, A.10-A.11 and A.16: inputs, patches and final documents transcribed as literal fixtures. A.7 independently specifies remove-before-add behavior in a same-array move.
- ../rfc6902.txt:316-362, sections 4.4-4.5, together with section 4.1: additional copy from object key "01" to an array append, and move to existing object key "01". Their explicit expected documents are rule instantiations, not implementation observations.

Normative texts predate this implementation. Only their saved local contents are used, with full-file SHA-256 and consulted excerpts. No network authenticity check or signed source provenance is invented.

Supplemental product-policy expectations are clearly separate:

- Target packages/core/README.md:283-296,327-329: canonical Array-index bound, no hidden named array properties, progressive batches, identity, notifications and adapter writes.
- Target apps/web/app/(main)/docs/api/core/page.mdx:454-467: undefined invalid reads; rejected writes/removals; terminal append; reserved tokens and compound validation.
- Target skills/core/SKILL.md:248-260: literal object keys and store/adapter semantics.
- ../contract.json:A1-A4: preservation of valid/literal paths, rejected-write identities, source retention and no undefined insertion for invalid compound patches, prototype-path rejection.

These documents are implementation-independent descriptions of expected behavior, but the target docs are part of this PR and the acceptance file is review-authored. Neither is misrepresented as an independently published normative source. They supplement, rather than manufacture, the external challenge.

## Divergent scopes and diagnostic expectations

JSON Pointer distinguishes object members from Array indices. RFC 6901 does not prohibit literal object key "01". It also does not impose the 4294967294 limit or forbid JSON object members named "__proto__", "constructor" or "prototype". The bound and reserved-token rejection are json-render policies.

RFC 6901 section 7 leaves error handling to the application. RFC 6902 section 3 defines an array of operations, not JSONL. RFC 6902 section 5 says a failed patch must not be deemed successful; its HTTP PATCH discussion concerns atomicity. Product-level silent no-ops and continuing a SpecStream are not a proof of RFC patch failure reporting or HTTP atomicity.

The root "/" example retains its normative expected result 0. The inherited model already excludes root aliases from changed claims. It is intentionally retained as a diagnostic, not changed to the implementation's result or silently omitted. Any mismatch is emitted in both execution.json and receipt.json, separately from in-scope failures. A satisfied challenge-source obligation does not mean that this example or the entire implementation conforms to the RFC.

RFC 6902 `test` success cannot be proved just by unchanged final state: an implementation that ignores `test` has that same observable. A.8/A.9/A.14/A.15 patch-test semantics are therefore not counted as positive conformance proof. Decode ordering is instead observed by getByPath's actual value. Other exclusions remain explicit in corpus.json and the receipt: URI fragments, malformed escapes, missing parents, duplicate members, root replacement, out-of-bounds add, descendant moves, deep-copy aliasing and giant writes.

## Public boundary and reproducibility

Run with Bun, without installation or building:

    bun /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/resumed-challenge/verify.mjs

The runner resolves existing ESM/CJS entry files from target packages/core/package.json's public exports, including ./store-utils. It exercises getByPath, applySpecStreamPatch, createSpecStreamCompiler, state stores and adapters. JSON.stringify serializes the fixed external operation fixtures into documented JSONL, and the actual compiler receives one- and seven-character fragments. This is a reachable documented protocol producer, not a type-only synthetic runtime event. No internal source exports or mocked parser are called. Strict deep equality preserves detection of extra own undefined properties; own array keys, old snapshot contents, snapshot identity and event/write counts are observed separately.

The original successful build log is reused. All existing dist file bytes are hashed before and after execution; source-map sourcesContent is compared byte-for-byte with git show at the frozen HEAD and current source files, including path-utils.ts, types.ts, state-store.ts and store-utils.ts. This is evidence linking the saved build to the target, not a fresh reproducible build or a signed build attestation.

Target HEAD/cleanliness and critical inherited run artifact hashes are checked before and after. Only resumed-challenge files are written. The original manifest, run-report, source tree, dist and node_modules are not edited. No network, publication, fixes, installs, builds or expensive mutation campaigns are performed.

## Decision semantics

receipt.satisfied concerns only the availability and execution of an implementation-independent normative challenge source for the changed claims. It is false on identity drift, artifact/source mismatch, replay failure or unexpected in-scope failures. Root-alias diagnostic mismatches remain visible and do not imply a full-compliance pass. An exit code 0 means the bounded challenge completed according to this policy, not that every normative diagnostic passed.

The inherited Review Gate remains incomplete/failing as recorded, and required Test Strength, Security and Resilience dispositions are not upgraded. Existing renderer source-loss and rejected-entry callback findings are not refuted by a passing core corpus. No claim is made about browser/renderer parity, external deployment, security audit completion, hostile objects, resilience or full behavioral coverage. The additive receipt can be consumed later by the owner of the shared gate state; this resumption does not modify that state.

## Executed result and retained failed attempt

The command above completed with exit 0: 744 checks, 742 passed, zero unexpected failures and two normative diagnostic mismatches. Both mismatches are the section 5 root "/" example, one per ESM/CJS format: normative expected 0, actual whole example document. Those are failures of that normative example, not passes. The bounded source-independence obligation is satisfied; full conformance is not claimed. The reused corpus completed with exit 0, 220 tokens and 9,042 assertions matching the saved corpus counts and format observations.

The first invocation exited 1 before imports or tests because the new harness initially compared raw contract file bytes to the manifest fingerprint. Read-only diagnosis found that the existing digest is SHA-256 of JSON.stringify(JSON.parse(file)) with original key order: 966d5e729ab34ac0eb09368cdf0864277c5f7f8d51a63468e6c23c8221d90be5. Raw formatted bytes hash to 23a325d76e201c8e2b83f8ce0d0540284d19142c6027803937148cb2c324d22a. Only the harness's serialization check and identity field labeling were corrected. No contract, corpus input or expected output changed. attempt-1-verify.mjs, attempt-1-execution.json and attempt-1-receipt.json retain the failed attempt. The successful oracle-freeze.json was saved before production import, after this correction.
