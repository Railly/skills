Independent review of vercel-labs/ai-cli PR #108 at d9070b1c3af9c8d03b5e757af3e92b63908c212d (base origin/main b67e1bdba3fbeceae423f9674163e4aa6f79491c). Feature: ai decide -i/--images adds images as file parts to AI SDK decision state; upgrades ai 7.0.123->7.0.139 and @ai-sdk/gateway->4.0.112 (experimental_decide, decisionModel, /decision-model, stateParts). Find correctness bugs, behavior regressions for existing text/JSON users, missing tests, doc claims that are false. Read the code in this repo to verify. Report each finding with file:line, severity P0-P3, and a concrete failure scenario. Say NONE if nothing real.

```diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 87c3983..4bf9e8c 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,10 @@
 
 ## Unreleased
 
+### New Features
+
+- Add `-i, --images` to `ai decide` so decision models such as Jev can judge images, alone or alongside stdin text or JSON. Upgrade to `ai` 7.0.139 and `@ai-sdk/gateway` 4.0.112, which add file parts to decision state.
+
 ### Improvements
 
 - Move repository development, builds, tests, and CI to Node.js and npm. Update installation requirements to Node.js 22+ and document the Node.js 24+ development workflow.
diff --git a/apps/web/docs/commands.mdx b/apps/web/docs/commands.mdx
index 19eaba8..d058a47 100644
--- a/apps/web/docs/commands.mdx
+++ b/apps/web/docs/commands.mdx
@@ -399,7 +399,7 @@ probabilities, usage, provider metadata, and response information. Repeat questi
 flags to ask more questions in one request.
 Text, JSON objects, and arrays remain one shared state.
 
-Use `--questions` for structured instructions and criteria, `--input auto|text|json`
+Use `-i, --images` to add images to the state, `--questions` for structured instructions and criteria, `--input auto|text|json`
 to control parsing, `--model` to choose one evaluation model, `--provider-options`
 for the SDK’s provider-specific settings, and `--max-retries` or `--timeout` for request controls.
 
diff --git a/apps/web/docs/decide.mdx b/apps/web/docs/decide.mdx
index bcd25b3..e0b5e18 100644
--- a/apps/web/docs/decide.mdx
+++ b/apps/web/docs/decide.mdx
@@ -37,7 +37,7 @@ that contain commas, separate option names and descriptions, or structured conte
 
 ## AI SDK in the shell
 
-The command calls AI SDK's `experimental_evaluate`. Stdin becomes its `state`,
+The command calls AI SDK's `experimental_decide`. Stdin becomes its `state`,
 and each named flag builds an entry in `questions`:
 
 | CLI | AI SDK |
@@ -105,6 +105,23 @@ TypeSafe's Noul primitive.
 
 ## Input and requests
 
+### Images
+
+`-i, --images <path-or-url>` adds an image to the state as a file part after stdin.
+Repeat it for several images; order is kept. Paths, `file://`, `http(s)`, and data
+URLs work. URLs are downloaded by the SDK before the request. Stdin is optional
+when at least one image is given:
+
+```bash
+ai decide --boolean "receipt=Is this a receipt?" -i scan.png
+echo "Order #123" | ai decide --boolean "match=Does the photo show order #123?" -i photo.jpg
+```
+
+Image limits come from the provider. Jev rejects images that are too small, such as
+squares under 280 pixels, with `invalid request body`; use a larger image.
+
+### Text and JSON
+
 Stdin is buffered through EOF and sent as one shared state. JSON objects and
 arrays keep their shape; an array is one state, not a batch of separate calls.
 Text retains whitespace and line breaks. Put any additional context in the state.
@@ -112,7 +129,8 @@ Text retains whitespace and line breaks. Put any additional context in the state
 `--input auto` tries a complete JSON value and otherwise treats input as text.
 Malformed JSON-looking input fails; use `--input text` for bracketed logs or
 other literal text. `--input json` requires a JSON string, object, or array.
-Scalar numbers, booleans, and null are not JSON states. Empty stdin is an error;
+Scalar numbers, booleans, and null are not JSON states. Empty stdin is an error
+unless images are given;
 an explicit empty JSON object, array, or string is valid. Binary input is rejected.
 To use JSONL as an array, convert it explicitly:
 
@@ -217,6 +235,7 @@ when changing instructions, criteria, or models.
 --score <id=question>      Ordered-score question (repeatable)
 --levels <id=low,...,high> Score levels for the named question (repeatable)
 --questions <path>        JSON file of named typed questions
+-i, --images <path-or-url> Image after stdin in the state (repeatable)
 -m, --model <id>          One evaluation model (default: typesafe-ai/jev)
 --input <format>          auto, text, or json (default: auto)
 --provider-options <path> JSON object of provider names to option objects
diff --git a/packages/ai-cli/README.md b/packages/ai-cli/README.md
index 94fd8ad..c8b26bf 100644
--- a/packages/ai-cli/README.md
+++ b/packages/ai-cli/README.md
@@ -107,12 +107,20 @@ ask more questions in the same request.
 - Score returns a fractional position on ordered levels, starting at zero, and
   a distribution when available. Jev uses the probability-weighted mean.
 
-The command calls AI SDK's `experimental_evaluate`: stdin maps to `state`,
+The command calls AI SDK's `experimental_decide`: stdin maps to `state`,
 and typed flags build its named `questions`. `--choices` creates a Choice
 `criteria` map; `--levels` creates a Score `criteria` array. The file form uses
 the SDK question schema directly. Jev is the default evaluation model; other
 supported evaluation models use the same interface.
 
+Pass images with `-i, --images` (paths or URLs, repeatable). They follow stdin
+as file parts in the same state, in order; stdin is optional when images are given:
+
+```bash
+ai decide --boolean "receipt=Is this a receipt?" -i scan.png
+echo "Order #123" | ai decide --boolean "match=Does the photo show order #123?" -i photo.jpg
+```
+
 For richer criteria, save a named question map to `triage.json`:
 
 ```json
@@ -158,6 +166,7 @@ Files and inline questions can be combined; duplicate IDs are errors.
 --score <id=question>      Ordered-score question (repeatable)
 --levels <id=low,...,high> Score levels for the named question (repeatable)
 --questions <path>        JSON file of named typed questions
+-i, --images <path-or-url> Image after stdin in the state (repeatable)
 -m, --model <id>          One evaluation model (default: typesafe-ai/jev)
 --input <format>          auto, text, or json (default: auto)
 --provider-options <path> JSON object of provider names to option objects
diff --git a/packages/ai-cli/package.json b/packages/ai-cli/package.json
index a4bc134..98b7198 100644
--- a/packages/ai-cli/package.json
+++ b/packages/ai-cli/package.json
@@ -43,8 +43,8 @@
     "prepack": "npm run typecheck && npm run build"
   },
   "dependencies": {
-    "@ai-sdk/gateway": "4.0.101",
-    "ai": "7.0.123",
+    "@ai-sdk/gateway": "4.0.112",
+    "ai": "7.0.139",
     "sharp": "0.35.4",
     "undici": "7.30.0"
   },
diff --git a/packages/ai-cli/src/cli.test.ts b/packages/ai-cli/src/cli.test.ts
index ac362a3..e4d9673 100644
--- a/packages/ai-cli/src/cli.test.ts
+++ b/packages/ai-cli/src/cli.test.ts
@@ -307,6 +307,7 @@ describe("cli integration", () => {
       "--score",
       "--levels",
       "--questions",
+      "--images",
       "--input",
       "--provider-options",
       "--max-retries",
diff --git a/packages/ai-cli/src/commands/decide.test.ts b/packages/ai-cli/src/commands/decide.test.ts
index 3444205..321dfca 100644
--- a/packages/ai-cli/src/commands/decide.test.ts
+++ b/packages/ai-cli/src/commands/decide.test.ts
@@ -14,7 +14,7 @@ writeFileSync(
 import { appendFileSync } from "node:fs";
 let calls = 0;
 globalThis.fetch = async (url, init) => {
-  if (!String(url).endsWith('/evaluation-model')) throw new Error('Unexpected network request');
+  if (!String(url).endsWith('/decision-model')) throw new Error('Unexpected network request');
   appendFileSync(process.env.TEST_REQUESTS, JSON.stringify(JSON.parse(init.body)) + '\\n');
   calls++;
   const status = calls <= Number(process.env.TEST_FAIL_FIRST || 0) ? 503 : Number(process.env.TEST_STATUS || 200);
@@ -118,9 +118,9 @@ describe("decide CLI", () => {
     expect(result.exitCode).toBe(0);
     expect(result.stderr).toBe("");
     expect(result.requests).toHaveLength(1);
-    expect(result.requests[0].state).toBe(
-      "  Original ticket\n\nwith details\n"
-    );
+    expect(result.requests[0].stateParts).toEqual([
+      { type: "text", text: "  Original ticket\n\nwith details\n" },
+    ]);
     expect(Object.keys(result.requests[0].questions)).toHaveLength(3);
     expect(result.requests[0].questions.team.criteria).toEqual({
       billing: "billing",
@@ -179,9 +179,11 @@ describe("decide CLI", () => {
       { answers: { team: mixedAnswers.team, refund: mixedAnswers.refund } }
     );
     expect(result.exitCode).toBe(0);
-    expect(result.requests[0].state).toEqual([
-      { message: "Refund please" },
-      { account: "123" },
+    expect(result.requests[0].stateParts).toEqual([
+      {
+        type: "json",
+        value: [{ message: "Refund please" }, { account: "123" }],
+      },
     ]);
     expect(result.requests[0].questions.team).toEqual(question);
     expect(result.requests[0].providerOptions).toEqual({
@@ -201,7 +203,7 @@ describe("decide CLI", () => {
     const result = await run(graphicArgs, "ticket", fixture);
     expect(result.exitCode).toBe(0);
 
-    const { experimental_evaluate } = await import("ai");
+    const { experimental_decide } = await import("ai");
     const { createGateway } = await import("@ai-sdk/gateway");
     const gateway = createGateway({
       apiKey: "test-key",
@@ -213,9 +215,9 @@ describe("decide CLI", () => {
         { preconnect: () => {} }
       ),
     });
-    const sdk = await experimental_evaluate({
-      model: gateway.evaluationModel("typesafe-ai/jev"),
-      state: result.requests[0].state,
+    const sdk = await experimental_decide({
+      model: gateway.decisionModel("typesafe-ai/jev"),
+      state: result.requests[0].stateParts,
       questions: result.requests[0].questions,
       maxRetries: 0,
     });
@@ -280,12 +282,46 @@ describe("decide CLI", () => {
     }
   );
 
+  test("--images adds ordered file parts after stdin and works without stdin", async () => {
+    const png = join(directory, "pixel.png");
+    writeFileSync(
+      png,
+      Buffer.from(
+        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
+        "base64"
+      )
+    );
+    const answers = { q: { type: "boolean", probability: 0.9 } };
+    const args = ["--boolean", "q=Is it a pixel?", "--images", png];
+    const withText = await run(args, "caption", { answers });
+    expect(withText.exitCode).toBe(0);
+    const parts = withText.requests[0].stateParts;
+    expect(parts.map((part: { type: string }) => part.type)).toEqual([
+      "text",
+      "file",
+    ]);
+    expect(parts[1].mediaType).toBe("image/png");
+    expect(parts[1].data).toEqual({
+      type: "data",
+      data: readFileSync(png).toString("base64"),
+    });
+
+    for (const input of ["", "\n"]) {
+      const alone = await run(args, input, { answers });
+      expect(alone.exitCode).toBe(0);
+      expect(alone.requests[0].stateParts).toHaveLength(1);
+      expect(alone.requests[0].stateParts[0].type).toBe("file");
+    }
+  });
+
   test("accepts empty JSON arrays as shared state", async () => {
     const result = await run(["--boolean", "q=Any requests present?"], "[]", {
       answers: { q: { type: "boolean", probability: 0 } },
     });
     expect(result.exitCode).toBe(0);
-    expect(result.requests[0].state).toEqual([]);
+    expect(result.requests[0].stateParts).toEqual([
+      { type: "json", value: [] },
+    ]);
   });
 
   test("invalid local inputs fail before any network request or stdout", async () => {
diff --git a/packages/ai-cli/src/commands/decide.ts b/packages/ai-cli/src/commands/decide.ts
index d279f9f..0ef19d8 100644
--- a/packages/ai-cli/src/commands/decide.ts
+++ b/packages/ai-cli/src/commands/decide.ts
@@ -5,6 +5,7 @@ import { gateway } from "@ai-sdk/gateway";
 import type { Command } from "../lib/command.js";
 import {
   buildQuestions,
+  decisionState,
   decodeEvaluationText,
   evaluateState,
   parseInputFormat,
@@ -15,12 +16,17 @@ import {
   type InputFormat,
   type QuestionOptions,
 } from "../lib/evaluation.js";
+import {
+  collectImageReference,
+  loadImageReferences,
+} from "../lib/image-references.js";
 import { fetchGatewayModels, resolveModels } from "../lib/models.js";
 import { readStdin } from "../lib/stdin.js";
 import { addTimeoutOption, timeoutMs } from "../lib/timeout.js";
 
 interface DecideOptions extends QuestionOptions {
   questions?: string;
+  images?: string[];
   model?: string;
   input: InputFormat;
   providerOptions?: string;
@@ -61,7 +67,7 @@ export function registerDecideCommand(program: Command) {
     .command("decide")
     .alias("evaluate")
     .description(
-      "Make decisions with named, typed questions against stdin; output answers and metadata as JSON"
+      "Make decisions with named, typed questions against stdin and images; output answers and metadata as JSON"
     )
     .option(
       "--boolean <id=question>",
@@ -92,6 +98,11 @@ export function registerDecideCommand(program: Command) {
       "--questions <path>",
       "JSON file of named questions with typed criteria"
     )
+    .option(
+      "-i, --images <path-or-url>",
+      "Image file part after stdin in the decision state (repeatable)",
+      collectImageReference
+    )
     .option(
       "-m, --model <model>",
       "Evaluation model ID or short name (default: typesafe-ai/jev)"
@@ -126,15 +137,24 @@ export function registerDecideCommand(program: Command) {
             await readTextFile(options.providerOptions, "provider-options")
           )
         : undefined;
-      if (process.stdin.isTTY)
-        throw new Error("Pipe text or a JSON state to stdin.");
-      const state = parseState(
-        decodeEvaluationText((await readStdin()) ?? new Uint8Array()),
-        options.input
+      const images = await loadImageReferences(options.images ?? [], "images");
+      if (process.stdin.isTTY && images.length === 0)
+        throw new Error(
+          "Pipe text or a JSON state to stdin, or pass --images."
+        );
+      const stdin = decodeEvaluationText(
+        (process.stdin.isTTY ? null : await readStdin()) ?? new Uint8Array()
+      );
+      const state = decisionState(
+        // Images may stand alone; blank stdin then adds no text part.
+        images.length > 0 && !stdin.trim()
+          ? undefined
+          : parseState(stdin, options.input),
+        images
       );
       const model = await resolveEvaluationModel(options.model);
       const result = await evaluateState(state, questions, {
-        model: gateway.evaluationModel(model),
+        model: gateway.decisionModel(model),
         timeoutMs: timeoutMs(options.timeout),
         maxRetries: options.maxRetries,
         providerOptions,
diff --git a/packages/ai-cli/src/lib/evaluation.test.ts b/packages/ai-cli/src/lib/evaluation.test.ts
index f8dc09e..426c564 100644
--- a/packages/ai-cli/src/lib/evaluation.test.ts
+++ b/packages/ai-cli/src/lib/evaluation.test.ts
@@ -1,8 +1,9 @@
-import type { Experimental_EvaluationModel as EvaluationModel } from "ai";
+import type { Experimental_DecisionModel as DecisionModel } from "ai";
 import { describe, expect, test } from "vitest";
 
 import {
   buildQuestions,
+  decisionState,
   decodeEvaluationText,
   evaluateState,
   parseInputFormat,
@@ -14,9 +15,9 @@ import {
   type QuestionOptions,
 } from "./evaluation.js";
 
-type Model = Exclude<EvaluationModel, string>;
-type Call = Parameters<Model["doEvaluate"]>[0];
-type Result = Awaited<ReturnType<Model["doEvaluate"]>>;
+type Model = Extract<Exclude<DecisionModel, string>, { doDecide: unknown }>;
+type Call = Parameters<Model["doDecide"]>[0];
+type Result = Awaited<ReturnType<Model["doDecide"]>>;
 
 function harness(respond: (call: Call) => Result | Promise<Result>) {
   const calls: Call[] = [];
@@ -25,7 +26,7 @@ function harness(respond: (call: Call) => Result | Promise<Result>) {
     provider: "test",
     modelId: "test/evaluation",
     supportedQuestionTypes: ["boolean", "choice", "score"],
-    async doEvaluate(call) {
+    async doDecide(call) {
       calls.push(call);
       return respond(call);
     },
@@ -67,12 +68,12 @@ describe("evaluate evaluation", () => {
       { message: "I was charged twice. Refund the extra charge." },
       { account: "123" },
     ];
-    const result = await evaluateState(state, mixed, {
+    const result = await evaluateState(decisionState(state), mixed, {
       ...options,
       providerOptions: { gateway: { order: ["typesafe-ai"] } },
     });
     expect(calls).toHaveLength(1);
-    expect(calls[0].state).toBe(state);
+    expect(calls[0].state).toEqual([{ type: "json", value: state }]);
     expect(calls[0].questions).toBe(mixed);
     expect(calls[0].providerOptions).toEqual({
       gateway: { order: ["typesafe-ai"] },
diff --git a/packages/ai-cli/src/lib/evaluation.ts b/packages/ai-cli/src/lib/evaluation.ts
index 529c4e4..9c16c36 100644
--- a/packages/ai-cli/src/lib/evaluation.ts
+++ b/packages/ai-cli/src/lib/evaluation.ts
@@ -1,11 +1,14 @@
 import {
-  experimental_evaluate as evaluate,
-  type Experimental_EvaluationModel as EvaluationModel,
-  type Experimental_EvaluationQuestion as EvaluationQuestion,
+  experimental_decide as decide,
+  type Experimental_DecisionModel as DecisionModel,
+  type Experimental_DecisionQuestion as DecisionQuestion,
+  type Experimental_DecisionState as DecisionState,
   type JSONValue,
 } from "ai";
 
-export type Questions = Record<string, EvaluationQuestion>;
+import type { ImageReference } from "./image-references.js";
+
+export type Questions = Record<string, DecisionQuestion>;
 type JSONObject = { [key: string]: JSONValue };
 export type State = string | JSONObject | JSONValue[];
 export type InputFormat = "auto" | "text" | "json";
@@ -229,17 +232,41 @@ export function parseMaxRetries(value: string): number {
   return retries;
 }
 
+/** Combine stdin state and images into one ordered decision state. */
+export function decisionState(
+  state: State | undefined,
+  images: ImageReference[] = []
+): DecisionState {
+  if (state === undefined && images.length === 0)
+    throw new Error("Pipe text or a JSON state to stdin, or pass --images.");
+  // A bare array is ambiguous with SDK state parts, so wrap it as JSON.
+  if (images.length === 0)
+    return Array.isArray(state) ? [{ type: "json", value: state }] : state!;
+  return [
+    ...(state === undefined
+      ? []
+      : typeof state === "string"
+        ? [{ type: "text" as const, text: state }]
+        : [{ type: "json" as const, value: state }]),
+    ...images.map((image) => ({
+      type: "file" as const,
+      data: typeof image === "string" ? new URL(image) : image,
+      mediaType: "image",
+    })),
+  ];
+}
+
 export async function evaluateState(
-  state: State,
+  state: DecisionState,
   questions: Questions,
   options: {
-    model: EvaluationModel;
+    model: DecisionModel;
     timeoutMs: number;
     maxRetries?: number;
     providerOptions?: Record<string, JSONObject>;
   }
 ) {
-  return evaluate({
+  return decide({
     model: options.model,
     state,
     questions,
diff --git a/skills/ai-cli/SKILL.md b/skills/ai-cli/SKILL.md
index 7c717f9..2cb4f7d 100644
--- a/skills/ai-cli/SKILL.md
+++ b/skills/ai-cli/SKILL.md
@@ -156,7 +156,9 @@ ask more questions in the same request.
 - Score returns a fractional position on ordered levels, starting at zero, and
   a distribution when available. Jev uses the probability-weighted mean.
 
-The command calls AI SDK's `experimental_evaluate`: stdin maps to `state`,
+Add images with `-i, --images <path-or-url>` (repeatable); they follow stdin as file parts in the same state, and stdin is optional when images are given.
+
+The command calls AI SDK's `experimental_decide`: stdin maps to `state`,
 and typed flags build its named `questions`. `--choices` creates a Choice
 `criteria` map; `--levels` creates a Score `criteria` array. The file form uses
 the SDK question schema directly. Jev is the default evaluation model; other
@@ -207,6 +209,7 @@ Files and inline questions can be combined; duplicate IDs are errors.
 --score <id=question>      Ordered-score question (repeatable)
 --levels <id=low,...,high> Score levels for the named question (repeatable)
 --questions <path>        JSON file of named typed questions
+-i, --images <path-or-url> Image after stdin in the state (repeatable)
 -m, --model <id>          One evaluation model (default: typesafe-ai/jev)
 --input <format>          auto, text, or json (default: auto)
 --provider-options <path> JSON object of provider names to option objects
```
