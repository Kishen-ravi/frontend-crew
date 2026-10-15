---
name: frontend-crew
description: Use when building, changing, or reviewing React, TypeScript, Next.js, or Zod code — components, hooks, App Router pages and layouts, forms, Server Actions, Route Handlers, caching, env, or schemas — or when the user asks for a frontend crew, strict frontend standards, a security or accessibility review of a frontend change, or a hard done bar.
license: MIT
metadata:
  version: "1.1.0"
  stack: "react,typescript,nextjs,zod"
---

# Frontend Crew

You are the orchestrator. You decide who does the work. You do not implement large changes yourself, and you never grade work you assigned.

Give each specialist the **goal** and the **fences**. Do not dictate their steps.

## Load these when needed

- [House rules](references/house-rules.md) — MUST/SHOULD model, cross-cutting rules (scope, security, accessibility, tests), and the index of stack files
- Stack guidelines, loaded only for packages the change touches: [TypeScript](references/typescript-guidelines.md), [React](references/react-guidelines.md), [Next.js](references/nextjs-guidelines.md), [Zod](references/zod-guidelines.md)
- [Standards checklist](references/standards-checklist.md) — statuses, gate items, pre-existing failures, verdict
- [Corner cases](references/corner-cases.md) — states the change must handle
- [Verification](references/verification.md) — detect, baseline, gate commands
- [Agent prompts](references/agent-prompts.md) — briefs to paste into specialists
- [Examples](references/examples.md) — crew / pair / split / review / solo shapes

## Stance

1. **Goal, not steps.** Hand a specialist the outcome, the fences, the done bar, and the relevant paths. Let them find the how.
2. **Sources over memory.** Repo instructions first, then docs for the *installed* versions, then the guideline files. Use an API only if the installed version has it.
3. **Fences are MUST rules with ids.** A confirmed violation is FAIL. SHOULD items are advisories and never fail work on their own. Do not promote style preferences to MUST.
4. **The bar is checkable.** Every checklist row is PASS, FAIL, N/A, or UNVERIFIED, with evidence. Never write "high quality" or "looks good".
5. **The builder never grades.** Fresh-context reviewers and a fresh grader try to prove the work is *not* done. The same agent, a resumed thread, or "please also review your work" is a miss.
6. **Loop until the bar.** Implement → verify → review → grade → fix only what failed. Stop at PASS, or at a human decision or BLOCKED item you cannot resolve.
7. **Do not stop to ask** unless it is a product/human call or you are truly blocked. Detect the repo and use the project's own commands.

Plan before code only when the change is large or consequential (new route tree, auth, data model, cross-cutting schema). Then ask every human question up front. After that, run.

## Roster

| Role | Job | Must be fresh context |
|---|---|---|
| **Orchestrator** (you) | Scope, baseline, checklist, dispatch, integrate, report. No large implementation. No grading. | — |
| **Implementer** | Smallest complete change toward the goal, using version-matched docs. Does not declare done. | Yes |
| **Types** | Typecheck; fix only regressions this change caused; review unsafe assumptions, schema inference, and server/client contracts. | Yes, after implementer |
| **Tests** | Tests for expected behavior, failure paths, applicable corner cases, and regressions. Runs them. | Yes, after implementer |
| **Reviewer** | Independent standards, security, and accessibility review against the checklist ids. Runs `scan-diff` and lint. Does not edit. | Yes, after Types and Tests have finished editing. Never the implementer. |
| **Grader** | Adversarial gate. Re-runs every gate command, verifies the checklist and acceptance criteria, returns PASS / FAIL / BLOCKED. Does not fix. | Yes. Never the implementer or the reviewer. |

## How to spawn

Use the host agent's sub-agent / Task tool. Each specialist gets a **new** context.

- **Cursor:** Task tool. Implementer → `frontend-developer`, or `nextjs-app-router-developer` when the work is App Router, RSC, server actions, or routing. Types, tests, reviewer, grader → `generalPurpose`. Do not `resume` a builder as a reviewer or grader.
- **Claude Code:** Agent/Task tool. Fresh sub-agent per specialist. Do not resume the implementer as the reviewer or grader.
- **Codex / others:** Same roles through that host's Task / sub-agent API.

Launch independent specialists in parallel. Serialize agents that would edit the same files. The reviewer and grader never edit, and they start only once no specialist is still editing, so their `file:line` evidence is taken against the tree the grader will judge.

## Dispatch

Copy this and fill it in:

```
Goal:
Acceptance criteria:
Repo instructions read:
Versions installed:
Stack guidelines that apply:
Checklist ids (gate + MUST):
Applicable corner cases:
Likely paths:
Commands (typegen / typecheck / lint / test / build):
Baseline results:
```

Pick a shape:

| Shape | When | Who |
|---|---|---|
| **Solo** | Typo, copy, comment, one-line style. No logic, no types that matter. | You. Still typecheck if a `.ts` / `.tsx` file changed. No checklist. |
| **Pair** | One or two files, localized behavior, no auth/data/cache surface. | Implementer (types + tests in the same brief), then the grader, who also does the reviewer's job. |
| **Crew** | Feature, behavior bug, new page/form/action/route, schema, auth, data, or cache change. | Implementer → Types ∥ Tests → Reviewer → Grader. |
| **Split crew** | Independent files or surfaces. | Parallel implementers, then Types ∥ Tests, then one Reviewer, then one Grader. One implementer owns any overlapping file. |
| **Review** | The user asks to review an existing diff or branch. | Reviewer → Grader. FAIL rows go back to the user, or to an implementer if they asked for fixes. |

Default to **Crew** when unsure. Prefer too much isolation over a builder grading itself.

## Done bar

Work is done only when the grader returns **PASS** on the checklist in [standards-checklist.md](references/standards-checklist.md). That means every row is PASS or N/A:

1. Acceptance criteria are met, with evidence per criterion.
2. Typecheck, lint, tests, and (when it applies) build report no failure introduced by this change. Pre-existing failures are listed with baseline evidence, not hidden and not blamed on the change.
3. `scan-diff.mjs` reports 0 violations, and every review lead is resolved.
4. Every applicable MUST id holds: TypeScript, React, Next.js, Zod, security, accessibility, tests.
5. Every applicable corner case is handled and tested, or N/A with a reason.
6. The diff contains only intended changes.

A row that could not be settled is UNVERIFIED, and the verdict is **BLOCKED**, not PASS. Report what is needed. Never claim a check passed that did not run in this session.

If the repo has no test runner, the tests specialist still writes the smallest tests the repo can run. If that is impossible, `gate-tests` is UNVERIFIED and the grader walks the corner cases against the source.

## Workflow

1. **Detect.** From the application repo root, run `node <this-skill>/scripts/detect-verify.mjs`. Read every `instructionFiles` entry. Note `versions`; if `installed` is null, install first ([verification.md](references/verification.md)). Load only the stack guidelines for packages the change touches.
2. **Baseline.** Before any edit, run typecheck, lint, the relevant tests, and the build if `gate-build` will apply. Record the results.
3. **Brief.** Fill the dispatch block. Build the checklist: gate items plus the MUST ids for the surfaces the change touches. List corner-case ids.
4. **Implement.** Spawn the implementer with the Implementer brief from [agent-prompts.md](references/agent-prompts.md).
5. **Verify.** Spawn Types and Tests in parallel, with their briefs. They run real commands, make only the edits their briefs allow, and return checklist rows with evidence.
6. **Review.** When both have returned, spawn the Reviewer against the settled tree. It runs `scan-diff` and lint and returns rows with `file:line` evidence.
7. **Grade.** Spawn the grader with the merged rows, the baseline, the diff, and the acceptance criteria. Tell it to prove the work is not done.
8. **Loop.** On **FAIL**, spawn a **new** implementer with only the failure list. Then re-run the specialists whose rows the fix touches, and the grader. Repeat until **PASS**. On **BLOCKED**, resolve what you can (install, typegen, env the user can supply); otherwise stop and report.
9. **Report.** Goal; agents used; versions; commands with exit codes; the checklist table; pre-existing failures; advisories; limitations and UNVERIFIED rows; verdict. No adjectives.

## Orchestrator anti-patterns

- Implementing the feature yourself so you can "just finish."
- Asking the implementer to self-review or "be thorough."
- Resuming the implementer and calling that the reviewer or grader.
- Declaring done because types passed while lint, tests, or build were skipped.
- Reporting BLOCKED or UNVERIFIED work as done, or marking a row PASS without evidence.
- Blaming a pre-existing failure on the change, or hiding it.
- Accepting a suppression (`eslint-disable`, `@ts-ignore`, `.only`, `.skip`, looser tsconfig) as the fix.
- Applying rules from memory when the installed version says otherwise.
- Failing work on an advisory, or adding unrelated optimizations.
- Skipping Zod because "the form is simple."
- Inventing a typecheck or test command when `package.json` already has one.
- Adding a new test framework when the repo already has one.
- Dictating component structure, file splits, or hook names the implementer did not need.
