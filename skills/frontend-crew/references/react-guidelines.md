# React guidelines

Load when the change touches components, hooks, or JSX.

**MUST** ids go into the checklist ([standards-checklist.md](standards-checklist.md)). A confirmed violation is **FAIL**. **SHOULD** items are advisories.

## Sources

- Rules of React: https://react.dev/reference/rules
- You Might Not Need an Effect: https://react.dev/learn/you-might-not-need-an-effect
- Rendering lists (keys): https://react.dev/learn/rendering-lists
- Lint rules: https://react.dev/reference/eslint-plugin-react-hooks
- React Compiler: https://react.dev/learn/react-compiler/introduction
- `useMemo`: https://react.dev/reference/react/useMemo
- RSC serializable props: https://react.dev/reference/rsc/use-client#serializable-types
- Form APIs: https://react.dev/reference/react/useActionState

## Version notes

Use only APIs the installed `react` exports (`versions.react`).

| Installed | What changes for review |
|---|---|
| 18.x | No `useActionState`, `use`, or ref-as-prop. `forwardRef` is still required. |
| 19.x | `useActionState`, `useFormStatus` (react-dom), `useOptimistic`, `use`, form `action`. `ref` is a prop, so new code does not need `forwardRef`. `<Context>` works as a provider. |
| 19.2+ | `useEffectEvent` and `<Activity>`. Confirm the installed version exports them before using them. |
| `eslint-plugin-react-hooks` 6–7 | Compiler-derived rules ship in `recommended`: `purity`, `immutability`, `refs`, `set-state-in-render`, `set-state-in-effect`, `static-components`, `use-memo`, `preserve-manual-memoization`, `globals`, `error-boundaries`, plus `rules-of-hooks` and `exhaustive-deps`. |

**React Compiler.** It is on when the repo has `babel-plugin-react-compiler` or Next.js `reactCompiler: true`. With it on, new code does not add `memo` / `useMemo` / `useCallback` except as a documented escape hatch, and existing memoization stays unless the task is about it.

## MUST

| Id | Rule |
|---|---|
| `react-hooks-rules` | Hooks are called at the top level of components and custom hooks only. Never call them conditionally, in loops, after an early return, or in callbacks. Never call component functions directly or pass hooks around as values. |
| `react-pure-render` | Render is idempotent. Nothing mutates props, state, hook arguments or returns, or values already passed to JSX (for example `props.items.sort()`; use `toSorted()` or a copy). No side effects, no `Math.random()` / `Date.now()` / locale-dependent output in render, and no ref reads or writes during render. |
| `react-no-set-state-in-render` | No unconditional `setState` during render. |
| `react-effects-sync-only` | Effects synchronise with external systems only. Compute derived values during render. Logic caused by a user action goes in the handler. Reset state on an identity change with `key`. No chains of effects. Mirroring a prop into state through an effect is a violation. |
| `react-effect-deps` | Dependency arrays are complete. Do not silence `exhaustive-deps` or any hooks rule with a suppression comment; restructure, or use `useEffectEvent` where the installed version has it. |
| `react-effect-fetch` | Fetching inside an effect is a last resort, used only when no server component, server action, or repo data library fits. When it is used, it ignores or aborts stale responses and handles loading and error states. |
| `react-keys` | Keys are stable and unique among siblings, taken from data ids. No index keys for lists that insert, delete, filter, or reorder. Never `Math.random()`. |
| `react-static-components` | No component definitions inside another component's body. They remount on every render and lose state and focus. |
| `react-conditional-render` | No `{count && <X />}` where `count` can be `0` or `NaN`; use a boolean or a ternary. |
| `react-boundary-props` | Props from a Server Component to a Client Component are serializable: primitives, plain objects, arrays, `Date`, `Map`, `Set`, typed arrays, Promises, `FormData`, and Server Functions. Not allowed: other functions, class instances, symbols, or JSX that closes over server state. |

## SHOULD

- Keep state minimal and colocated. Lift it only when it is shared.
- Use React 19 form primitives (`useActionState` for results, `useFormStatus` / `isPending` for pending UI, `useOptimistic`) over hand-rolled pending state.
- Composition: prefer `children` and compound components over boolean-prop proliferation when you are designing a reusable component API. See `vercel-composition-patterns`, below.
- Memoize without the compiler only with a reason: an expensive calculation, props to a `memo` child, or a value used as an effect dependency. An unjustified `useMemo` is an advisory, never a FAIL.

## Optional Vercel skills

Load one only when the task matches. Inspect its installed copy before relying on it. Install: `npx skills add vercel-labs/agent-skills`.

| Skill | Use for | Status in this crew |
|---|---|---|
| `vercel-react-best-practices` | Performance work on React/Next.js code | Only its correctness and security rules can become MUST, and those are already covered above and in [house-rules.md](house-rules.md) (`server-auth-actions`, `rerender-derived-state-no-effect`, `rendering-conditional-render`, `server-no-shared-module-state`). Its performance rules are advisories. |
| `vercel-composition-patterns` | Designing or refactoring a reusable component API | Advisories only. Its `react19-*` rules apply only on React 19+. |

## Automated checks

| Check | Proves |
|---|---|
| `eslint-plugin-react-hooks` via the repo's lint script | `react-hooks-rules`, `react-pure-render` (partly), `react-no-set-state-in-render`, `react-effects-sync-only` (`set-state-in-effect`), `react-effect-deps`, `react-static-components` — but only when the rules are enabled in the repo's config. A clean lint run proves nothing if the rule is disabled or suppressed. |
| `scan-diff.mjs` (`lint-suppress`, `index-key`, `dangerous-html`) | Added-line leads |
| `next build` / framework build | `react-boundary-props` serialization errors at build time |
| Tests with Testing Library | Observable state transitions; `getByRole` / `getByLabelText` also prove accessible names |
