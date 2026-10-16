# Features

One file per feature a change can touch. Each file has four sections:

## Where it lives
Source paths and the user-facing entry point.

## How a user reaches it
The exact steps on the real surface.

## How to drive it
`bash .agents/verify/observe.sh <feature>` and what the driver checks.

## What usually lies
Signals that look like success but are not: green unit tests over a mock, a 200 with an error body, a screenshot of a stale build, an auth wall that produces no network traffic.
