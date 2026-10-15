# House rules

Fences for every change, plus the index of per-stack guidelines. Apply a stack file only when that package is installed. When the repo's own instructions (`AGENTS.md`, `CLAUDE.md`, lint config, tsconfig) are stricter, follow the repo.

## How to read the rules

- **Precedence:** repo instructions → docs for the installed version → these files → model memory. If guidance here conflicts with the installed version's docs, the docs win; report the conflict.
- **MUST** rules have ids. They go into the checklist ([standards-checklist.md](standards-checklist.md)), and a confirmed violation is **FAIL**.
- **SHOULD** items are advisories. Report them, but never fail work on an advisory alone, and never turn a style preference into a MUST.
- Apply only the rules the change touches. Do not apply unrelated optimizations or refactors.

## Stack guidelines (load only what applies)

| Package installed and touched | Load |
|---|---|
| `typescript` | [typescript-guidelines.md](typescript-guidelines.md) |
| `react` | [react-guidelines.md](react-guidelines.md) |
| `next` | [nextjs-guidelines.md](nextjs-guidelines.md) |
| `zod`, or any untrusted input | [zod-guidelines.md](zod-guidelines.md) |

## All work — MUST

| Id | Rule |
|---|---|
| `work-traceable` | Every changed file and line traces to the goal. No drive-by refactors, renames, formatting of untouched code, or edits to unrelated files. |
| `work-no-new-deps` | No new dependency unless the goal cannot be met with the platform, the framework, or installed packages. A required dependency is named and justified in the report. Lockfile changes match it. |
| `work-no-suppression` | Never make a check pass by weakening it: no type, lint, or test suppressions, no skipped or focused tests, no loosened config, and no deleted assertions. |
| `work-errors-surfaced` | Failures are typed and shown or logged server-side. Never swallowed. |

## Security — MUST

| Id | Rule |
|---|---|
| `sec-authz` | Authorization is enforced on the server for every read of non-public data and every mutation, scoped to the specific resource (ownership or role). Identity comes from the session, never from client input. Client-side checks are UX only. |
| `sec-minimal-data` | Responses, props, and action results carry only what the client needs. No full records, tokens, hashes, or internal fields. |
| `sec-secrets` | Secrets never reach client code, client-bundled env vars, logs, error messages, or committed files. |
| `sec-xss` | No `dangerouslySetInnerHTML`, `innerHTML`, or `javascript:` / data URLs built from untrusted input, unless it passes through the repo's sanitizer. |
| `sec-error-exposure` | Clients never see stack traces, DB errors, or raw exception messages. Log details server-side; show a safe message. |
| `sec-open-redirect` | Redirect targets taken from input are relative paths or on an allowlist. |

## Accessibility — MUST

| Id | Rule |
|---|---|
| `a11y-semantic` | Use native elements for their role: `<button>` for actions, `<a href>` for navigation, form controls inside `<form>`. Use ARIA only when no native element fits. |
| `a11y-name` | Every interactive control and meaningful image has an accessible name. A placeholder is not a label. Decorative images use `alt=""`. |
| `a11y-keyboard` | Everything clickable is reachable and operable by keyboard, in a logical order. Overlays close on Escape. |
| `a11y-focus` | Focus moves into dialogs and returns on close. Focus is not lost after a route or content change the user caused. |
| `a11y-errors` | Validation errors are text, programmatically tied to their field (`aria-describedby`, `aria-invalid`, or the repo's form component that does this), and announced. Async results (saved, failed) use a live region or move focus. |

**SHOULD:** colour contrast meets WCAG AA; motion respects `prefers-reduced-motion`; headings form an outline. Use `eslint-plugin-jsx-a11y` and Testing Library `getByRole` / `getByLabelText` where the repo has them.

## Performance

Advisories by default: avoid request waterfalls, keep client JavaScript small, and use the framework's image, font, and link components. See the SHOULD lists in the stack files.

| Id | Rule |
|---|---|
| `perf-measured` | **Only when the task is about performance.** Claims are backed by a before/after measurement with the same method (bundle analyzer, profiler, Web Vitals). No unmeasured "optimizations". |

## Tests — MUST

| Id | Rule |
|---|---|
| `test-runner-existing` | Use the repo's runner and patterns (Vitest, Jest, Playwright, Testing Library). Do not add a second runner. |
| `test-behavior` | New or changed behavior is covered through observable behavior, not private internals. |
| `test-failure-paths` | Expected failures and every applicable corner case have a test. Inputs are the real values the boundary receives (for example form strings). |
| `test-regression` | A bug fix ships with a test that fails without the fix. |
| `test-real-run` | The suite actually ran the new tests: no `.only`, no new `.skip` / `.todo`, no test without an assertion. |
| `test-no-self-mock` | Do not mock the unit under test. Mock only boundaries (network, clock, flags), and only the way the repo already does. |
