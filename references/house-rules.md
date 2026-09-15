# House rules

Fences. Apply a section only when that package exists in the repo. Match existing local conventions when they are stricter than a rule here.

## All work

- Surgical diffs. Every changed line traces to the goal.
- No new dependency unless the goal cannot be met without it.
- No drive-by refactors, comment rewrites, or formatting of untouched code.
- Failures are typed and shown; do not swallow errors.

## TypeScript

- No new `any`. No `as unknown as`. No non-null `!` unless a test or control-flow proof sits next to it.
- Prefer `unknown` + narrowing, or a Zod schema, over assertions.
- Discriminated unions over bags of optional fields.
- Public functions have explicit return types when inference would leak a wide type.
- Exhaustive `switch` on unions (`never` default) where the repo already uses that pattern.
- `strict` stays on. Do not weaken `tsconfig` to make a change compile.

## Zod

- Parse untrusted input at the boundary: form values, `searchParams`, route `params`, request bodies, env, and external JSON.
- User-facing paths use `safeParse`. `parse` is allowed only when a thrown error is the intended control flow (for example a framework error boundary you already handle).
- Infer types from schemas (`z.infer<typeof schema>`). Do not maintain a parallel handmade type that can drift.
- Coerce and transform at the edge. Core logic takes already-parsed types.
- Field errors map to the UI; do not dump raw Zod issues into the page.
- Share one schema between client and server when both validate the same shape.
- Env schemas fail at startup with a readable message, not on first use in a request.

## React

- Treat Server Components as the default in an App Router app. Add `"use client"` only for state, effects, browser APIs, or event handlers that cannot live in a server action.
- Do not fetch in `useEffect` when an RSC, server action, or the repo's data library already covers it.
- Do not store derived values in state; compute during render.
- Lists have stable keys from data ids, not array indexes, unless the list is static.
- Conditional render uses `condition ? a : null` (or a ternary), not `count && <Component />`.
- Client components receive serializable props only. No functions, Dates, Maps, or class instances across the RSC boundary unless the repo already has a documented exception.
- Interactive controls are labelled. Keyboard and focus work. Use semantic HTML before ARIA.
- New UI includes loading, empty, and error UI when those states can happen.

## Next.js

- Validate `params` and `searchParams` with Zod before use.
- Server actions authenticate and authorize like any other mutation, then `safeParse` the input.
- After a mutation, invalidate with `revalidatePath` / `revalidateTag` (or the repo's cache helper). Do not assume the next read is fresh.
- Secrets stay on the server. `NEXT_PUBLIC_*` is only for values that may ship to the browser.
- Prefer `next/image`, `next/link`, and the App Router file conventions the repo already uses (`loading.tsx`, `error.tsx`, `not-found.tsx` when the route needs them).
- Do not add `use client` to a page just to use a small widget; split the widget instead.
- Route handlers and actions return typed, schema-checked data. Do not pass through unchecked `request.json()`.

## Tests

- Use the repo's runner (Vitest, Jest, Playwright, Testing Library). Do not add a second one.
- Test observable behavior and the applicable corner cases, not private internals.
- A behavior change ships with at least one failing-first test that would have caught the bug or locked the new behavior.
- Do not mock the unit under test. Mock only the boundary (network, time, clock, feature flag) when the repo already does.
