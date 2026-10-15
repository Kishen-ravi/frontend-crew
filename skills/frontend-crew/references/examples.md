# Dispatch examples

## Crew — new App Router form

User: "Add a profile email form that saves through a server action."

```
Shape: Crew
Goal: A signed-in user can change their own email. Invalid input stays on the page with field errors. Success shows the new value.
Acceptance: 1) valid email saves and shows after reload 2) invalid email shows a field error 3) another user's id cannot be targeted
Versions: next 16.4.1, react 19.3.1, zod 4.6.7, typescript 5.9.3
Stack guidelines: typescript, react, nextjs, zod
Checklist: gate-*, work-*, ts-no-any, ts-contracts, react-effects-sync-only, react-boundary-props,
  next-server-default, next-async-request-apis, next-action-results, next-invalidate-after-mutation,
  zod-boundary, zod-safe-parse, zod-inferred-types, zod-allowed-fields, zod-error-mapping,
  sec-authz, sec-minimal-data, sec-error-exposure, a11y-name, a11y-errors, test-*
Corner cases: empty, loading, error, unauthorized, zod-invalid, zod-empty-string, double-submit, cache-after-mutation
Implementer: nextjs-app-router-developer
Then: Types ∥ Tests, then Reviewer, then Grader
```

The implementer gets the goal and the fences, not "create `EmailForm.tsx`, then `updateEmail.ts`, then wire `page.tsx`."

## Pair — Zod schema bug

User: "The age filter crashes when the query string is `?age=`."

```
Shape: Pair
Goal: `?age=` and a missing `age` render the unfiltered list. A non-numeric `age` shows a field error, not a 500.
Checklist: gate-*, work-*, zod-boundary, zod-safe-parse, zod-form-coercion, next-async-request-apis, test-regression
Corner cases: search-params, zod-invalid, zod-empty-string, zod-coerce
Implementer + tests in one brief, then Grader (doing the reviewer's job too)
```

## Split crew — independent surfaces

User: "Add empty states to the orders table and the invoices table."

```
Shape: Split crew
Two implementers (one path each)
One Types ∥ one Tests, then one Reviewer, then one Grader, after both land
```

If both tables share a component, one implementer owns that file.

## Review — existing branch

User: "Review this branch before I merge it."

```
Shape: Review
Base: the branch point (git merge-base HEAD main)
Reviewer: scan-diff --base <merge-base>, lint, and judge the checklist ids for the touched surfaces
Grader: re-run the gates, then return a verdict with the checklist
Report FAIL rows to the user; fix only if they ask
```

## Solo

User: "Fix the typo in the settings heading."

```
Shape: Solo
Orchestrator edits the string. No crew.
```

## Loop after FAIL

The grader returns:

```
| zod-safe-parse    | FAIL | actions.ts:12 schema.parse throws on invalid input; page crashes |
| zod-form-coercion | FAIL | schemas.ts:8 z.coerce.boolean() maps radio "false" to true |
| gate-tests        | FAIL | PrefsForm.test.tsx:17 it.only; 1 passed, 1 skipped |
Verdict: FAIL
```

Spawn a **new** implementer with only those rows. Do not resume the grader to patch them. Re-run Types / Tests for the touched rows, then the Reviewer, then the Grader.

## Pre-existing failure, then BLOCKED

```
Baseline: typecheck exit 2 — lib/legacy.ts(4,9) TS2322
After:    typecheck exit 2 — the same single error; legacy.ts is not in the diff
→ gate-typecheck PASS; listed under Pre-existing

gate-build UNVERIFIED — next build needs DATABASE_URL, not available
All other rows PASS
Verdict: BLOCKED — needs a build with DATABASE_URL set (or the user's decision to accept it)
```

Report it as BLOCKED with that exact need. Do not report it as done.
