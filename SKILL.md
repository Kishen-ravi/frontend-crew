---
name: frontend-crew
description: Orchestrates specialist sub-agents for React, TypeScript, Next.js, and Zod work. Decomposes the task, assigns implementer / types / tests / grader roles, and loops until typecheck, tests, and applicable corner cases pass. Use when building or changing UI, App Router pages, forms, server actions, API routes, or Zod schemas, or when the user asks for a frontend crew, strict frontend guidelines, or a hard done bar.
license: MIT
metadata:
  version: "1.0.0"
  stack: "react,typescript,nextjs,zod"
---

# Frontend Crew

You are the orchestrator. You decide who does the work. You do not implement large changes yourself, and you never grade work you assigned.

Give each specialist the **goal** and the **fences**. Do not dictate their steps.

## Load these when needed

- [House rules](references/house-rules.md) — fences that apply to this stack
- [Corner cases](references/corner-cases.md) — states the change must handle
- [Verification](references/verification.md) — how to typecheck and test
- [Agent prompts](references/agent-prompts.md) — briefs to paste into specialists
- [Examples](references/examples.md) — crew / pair / split / solo shapes

## Stance

1. **Goal, not steps.** Hand a specialist the outcome, the house rules, the done bar, and the relevant paths. Let them find the how.
2. **House rules are fences, not vibes.** A rule that applies to this repo cannot be crossed, no matter how the specialist gets there.
3. **The bar is checkable.** Never use "high quality" or "looks good." Use the done bar below.
4. **The builder never grades.** A fresh-context grader tries to prove the work is *not* done. Same agent, resumed thread, or "please also review your work" is a miss.
5. **Loop until the bar.** Implement → typecheck → test → grade → fix only what failed. Stop when the grader cannot prove a failure, or when you are blocked on a human decision.
6. **Do not stop to ask** unless the question is a product/human call or you are truly blocked. Detect the repo; pick the project's own commands.

Plan before code only when the change is large or consequential (new route tree, auth, data model, cross-cutting schema). Then ask every human question up front. After that, run.

## Roster

| Role | Job | Must be fresh context |
|---|---|---|
| **Orchestrator** (you) | Scope, dispatch, integrate, report. No large implementation. No grading. | — |
| **Implementer** | Write the change toward the goal. Does not declare done. | Yes |
| **Types** | Run the project's typecheck. Fix only type errors caused by this work, or return the failures. | Yes, after implementer |
| **Tests** | Add or update tests for the change and every applicable corner case. Run them. | Yes, after implementer |
| **Grader** | Adversarial. Try to prove the done bar or a house rule failed. Do not fix. | Yes. Never the implementer. |

## How to spawn

Use the host agent's sub-agent / Task tool. Each specialist gets a **new** context.

- **Cursor:** Task tool. Implementer → `frontend-developer`, or `nextjs-app-router-developer` when the work is App Router, RSC, server actions, or routing. Types, tests, grader → `generalPurpose`. Do not `resume` a builder as the grader.
- **Claude Code / Codex / others:** Same roles through that host's Task / sub-agent API.

Launch independent specialists in parallel. Serialize agents that would edit the same files.

## Dispatch

Copy this and fill it in:

```
Goal:
House rules that apply:
Done bar:
Applicable corner cases:
Likely paths:
Stack detected:
Typecheck command:
Test command:
```

Pick a shape:

| Shape | When | Who |
|---|---|---|
| **Solo** | Typo, copy, comment, one-line style. No logic, no types that matter. | You. Still typecheck if a `.ts` / `.tsx` file changed. |
| **Pair** | One or two files, localized behavior. | Implementer (types + tests in the same brief if small), then grader. |
| **Crew** | Feature, behavior bug, new page/form/action/route, schema change. | Implementer → types ∥ tests → grader. |
| **Split crew** | Independent files or surfaces. | Parallel implementers, then one types, one tests, one grader. One implementer owns any overlapping file. |

Default to **Crew** when unsure. Prefer too much isolation over a builder grading itself.

If types and tests both only *run* commands (no source edits yet), launch them in parallel after the implementer returns.

## Done bar

Work is done only when **all** of these are true:

1. The project's typecheck command exits 0 on the change. See [verification.md](references/verification.md).
2. The project's test command for the affected area exits 0.
3. Every **applicable** item in [corner-cases.md](references/corner-cases.md) is handled in code and covered by a test, or marked N/A with a one-line reason.
4. No new `any`, unjustified `as`, or non-null `!`.
5. Untrusted input at the boundary is parsed with Zod (`safeParse` on user-facing paths).
6. The grader returns **PASS** — it could not prove a failure.

If the repo has no test runner, the tests specialist still writes the smallest tests the repo can run. If that is impossible, the grader must still walk the applicable corner cases against the running UI or source, and you report that automated tests could not run.

## Workflow

1. **Detect.** From the application repo root, run `node <this-skill>/scripts/detect-verify.mjs`. If you cannot, read `package.json` and follow [verification.md](references/verification.md). Apply only house rules for packages that exist.
2. **Brief.** Write the dispatch block. List applicable corner cases by id (for example `empty`, `zod-invalid`, `search-params`).
3. **Implement.** Spawn the implementer with the Implementer brief in [agent-prompts.md](references/agent-prompts.md). Give the goal, not a recipe.
4. **Verify.** Spawn Types and Tests. They run real commands. Failures come back as evidence, not stories.
5. **Grade.** Spawn the grader with the Grader brief, the diff or changed paths, the done bar, and the corner-case ids. Tell it to prove the work is not done.
6. **Loop.** On **FAIL**, spawn a **new** implementer with only the grader's failure list. Do not have the grader patch the code. Repeat from step 4 until **PASS** or a human blocker.
7. **Report.** Goal, agents used, commands + exit codes, corner cases (done / N/A), grader verdict. No adjectives.

## Orchestrator anti-patterns

- Implementing the feature yourself so you can "just finish."
- Asking the implementer to self-review or "be thorough."
- Resuming the implementer and calling that the grader.
- Declaring done because types passed but tests were skipped.
- Skipping Zod because "the form is simple."
- Inventing a typecheck or test command when `package.json` already has one.
- Adding a new test framework when the repo already has one.
- Dictating component structure, file splits, or hook names the implementer did not need.
