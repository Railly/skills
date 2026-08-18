# Round 008: Register before-after

Status: accepted
Date: 2026-08-18
Scope: register a repeated personal workflow as an experimental skill

## Decision question

Hunter repeatedly asks for browser-openable before/after artifacts after implementation work. The recurring job is not deep code explanation. It is making a behavioral or quantitative change visible enough to reproduce, appreciate, test, and screenshot.

## Evidence considered

Private Codex sessions were reviewed for recurring request shapes. Only generalized, public-safe patterns enter this repository:

- Side-by-side bug and fix behavior using two real builds or a deterministic reproduction.
- A concise benchmark relationship with exact before/after values beneath it.
- A feature tour with a small simulator and real-boundary proof.
- An absolute local HTML path and direct `open` command.

The Kitty keyboard feature in wterm supplied the current dogfood artifact. Earlier wterm sessions supplied independent visual and benchmark examples. The private transcripts and internal project details remain outside this repository.

## Boundary

`before-after` owns visual comparison and evidence presentation. `explain-diff` remains the long-form teaching artifact for subsystem background, literate code walkthroughs, and quizzes. `performance-proof` owns performance claims, and `review-gate` owns shipping review.

## Decision

- Add `skills/.experimental/before-after/`.
- Use the experimental distribution channel.
- Record maturity as `dogfooded` on Hunter's direct report of repeated personal use, with no baseline comparison yet.
- Bundle a deterministic scaffold using the official Vercel report foundation.
- Add method evals for visual behavior, benchmark deltas, and feature tours.

## Evidence gap

The method has repeated real use but no public case or baseline comparison in this repository. A future round should compare it against no skill and `explain-diff` on transfer holdouts, with human review of the rendered pages.
