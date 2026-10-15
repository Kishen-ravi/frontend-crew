# Standards checklist

Every non-solo change gets one checklist. The orchestrator builds it, the Reviewer and Grader fill it, and the final report includes it.

## Statuses

| Status | Meaning | Evidence required |
|---|---|---|
| **PASS** | Verified to hold. | Command plus exit code, a test name, or `file:line` reasoning. |
| **FAIL** | A confirmed violation of a MUST rule, a gate item, or an acceptance criterion. | `file:line`, or command output, and what breaks. |
| **N/A** | The rule cannot apply to this change. | One line saying why. |
| **UNVERIFIED** | It could not be settled. | Which method would settle it, and why that method was unavailable. |

- **UNVERIFIED is not a soft PASS.** "Didn't check" is not a reason. A rule that can be settled by reading the code must be read and marked PASS or FAIL.
- **Advisories** (SHOULD items) are not checklist rows. List them under *Advisories*. They never make a verdict FAIL.
- **Prefer tools.** Use a command when one proves the item (see each guideline file's *Automated checks*). A clean lint run proves a rule only if that rule is enabled and not suppressed in the diff.

## Building the checklist

Always include the gate items. Then add the MUST ids from every section the change touches.

| The change touches | Add MUST ids from |
|---|---|
| Any file | house rules: *All work* |
| `.ts` / `.tsx`, `tsconfig*` | [typescript-guidelines.md](typescript-guidelines.md) |
| Components, hooks, JSX | [react-guidelines.md](react-guidelines.md) and house rules: *Accessibility* |
| `app/`, Server Actions, Route Handlers, `proxy` / `middleware`, caching, `next.config.*` | [nextjs-guidelines.md](nextjs-guidelines.md) and house rules: *Security* |
| Forms, params, request bodies, env, external data, Zod schemas | [zod-guidelines.md](zod-guidelines.md) and house rules: *Security* |
| Anything with behavior | house rules: *Tests* |
| A performance goal | `perf-measured` |

Within a section, drop ids the change cannot reach; they never appear as rows, so there is no need to mark them N/A. Applicable corner cases come from [corner-cases.md](corner-cases.md) and go through `gate-corner-cases`.

## Gate items (always present)

| Id | PASS when |
|---|---|
| `gate-acceptance` | Each acceptance criterion is met, with evidence per criterion. |
| `gate-typecheck` | The project typecheck (after `next typegen` when the repo uses it) reports no failure introduced by this change. |
| `gate-lint` | The project lint reports no failure introduced by this change, and the diff adds no suppression. N/A only if the repo has no lint setup. |
| `gate-tests` | The relevant tests ran, including the new ones, and exited 0, with no focused or skipped tests added. |
| `gate-build` | The production build succeeded. Required when the change touches routes, layouts, server/client boundaries, caching, config, env, or dependencies; otherwise N/A with a reason. |
| `gate-scan` | `scan-diff.mjs` reports 0 violations, and every review lead is resolved (fixed, or justified at the line). |
| `gate-diff` | Every changed file is intended (`work-traceable`): no stray files, formatting churn, or lockfile changes without a matching dependency change. |
| `gate-corner-cases` | Every applicable corner case is handled and tested, or marked N/A with a reason. |

## Pre-existing failures

A failure is **pre-existing** only if all three hold:
- it appears in the baseline run (taken before the change) with the same message;
- it is not on a line the change added or modified;
- the change does not make it worse (more errors in the same place counts as worse).

Pre-existing failures do not FAIL a gate item. List them under *Pre-existing* with the baseline evidence. Anything else is a **regression**. When there is no baseline, treat a failure as a regression until the base ref proves otherwise.

## Verdict

| Verdict | When |
|---|---|
| **PASS** | Every row is PASS or N/A. |
| **FAIL** | At least one row is FAIL. |
| **BLOCKED** | No FAIL, and at least one row is UNVERIFIED. Name the missing tool, access, or decision. |

Only PASS means done. Never report BLOCKED work as done, and never mark a row PASS without the evidence it needs.

## Template

```
Checklist — «goal»
Versions: react «x», next «x», typescript «x», zod «x»
| Id | Status | Evidence |
|---|---|---|
| gate-acceptance | | |
| gate-typecheck | | «command» → exit «n» |
| gate-lint | | |
| gate-tests | | |
| gate-build | | |
| gate-scan | | |
| gate-diff | | |
| gate-corner-cases | | «ids» |
| «must-id» | | |

Pre-existing: «failure — baseline evidence» or none
Advisories: «SHOULD item — file:line» or none
Verdict: PASS | FAIL | BLOCKED
```
