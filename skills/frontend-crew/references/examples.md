# Dispatch examples

## Crew — new App Router form

User: "Add a profile email form that saves through a server action."

```
Shape: Crew
Goal: A signed-in user can change their email. Invalid input stays on the page with field errors. Success refreshes the profile.
House rules: TypeScript, Zod, React, Next.js, Tests
Corner cases: empty, loading, error, unauthorized, zod-invalid, zod-empty-string, double-submit, cache-after-mutation
Implementer: nextjs-app-router-developer
Then: Types ∥ Tests, then Grader
```

Implementer gets the goal and fences — not "create `EmailForm.tsx`, then `updateEmail.ts`, then wire `page.tsx`."

## Pair — Zod schema bug

User: "The age filter crashes when the query string is `?age=`."

```
Shape: Pair
Goal: `?age=` and missing `age` render the unfiltered list. Non-numeric `age` shows a field error, not a 500.
Corner cases: search-params, zod-invalid, zod-empty-string, zod-coerce
Implementer + tests in one brief, then Grader
```

## Split crew — independent surfaces

User: "Add empty states to the orders table and the invoices table."

```
Shape: Split crew
Two implementers (one path each)
One Types, one Tests, one Grader after both land
```

If both tables share a component, one implementer owns that file.

## Solo

User: "Fix the typo in the settings heading."

```
Shape: Solo
Orchestrator edits the string. No crew.
```

## Loop after FAIL

Grader returns:

```
FAIL
- zod-invalid: submit handler calls schema.parse and the page crashes
- double-submit: Save stays clickable while the action is pending
```

Spawn a **new** implementer with only that list. Do not resume the grader to patch it. Re-run Types, Tests, Grader.
