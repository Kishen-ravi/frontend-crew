# frontend-crew

An installable agent skill that runs a small crew on React, TypeScript, Next.js, and Zod work.

The parent agent is the orchestrator. It decides who does what, hands each specialist the **goal** and the **fences**, and refuses to treat the work as done until a **separate** grader fails to poke a hole in it.

Typecheck and tests are part of the done bar, not a nicety.

## Install

From this folder:

```bash
npx skills add .
```

From a clone path:

```bash
npx skills add /absolute/path/to/frontend-crew
```

After you push to GitHub:

```bash
npx skills add <your-github-user>/frontend-crew
```

Global install (available in every project on this machine):

```bash
npx skills add . -g -y
```

Confirm:

```bash
npx skills list
```

Works with agents that load [Agent Skills](https://github.com/agentskills/agentskills) (`SKILL.md` + optional references). Cursor, Claude Code, Codex, and others that speak that format will pick it up after install.

Detect-script checks (no extra install):

```bash
node --test scripts/detect-verify.test.mjs
```

## Use

In a chat on a frontend repo:

- "Use frontend-crew to add a login form with Zod on the server action."
- "Have the frontend crew fix the empty state on the invoices table."
- "frontend-crew: this PR needs types, tests, and a real done bar."

The skill also triggers on ordinary frontend work (UI, App Router, forms, API routes, schemas) when the agent has it installed.

## What happens

1. Detect the repo (`scripts/detect-verify.mjs`) — package manager, stack, typecheck/test commands.
2. Write a brief: goal, applicable house rules, corner-case ids, done bar.
3. Spawn an **implementer** (fresh context). Goal, not a recipe.
4. Spawn **types** and **tests** (fresh context). They run the project's real commands.
5. Spawn a **grader** (fresh context, never the builder). It tries to prove the work is not done.
6. Loop on FAIL with a new implementer until PASS, or until a human decision is required.

Trivial copy or typo fixes stay solo. Features, schema changes, and behavior bugs get the crew.

## Layout

```
frontend-crew/
├── SKILL.md                      # Orchestrator
├── scripts/detect-verify.mjs     # Detect stack + verify commands
└── references/
    ├── house-rules.md            # Fences for React / TS / Next / Zod
    ├── corner-cases.md           # States that must be handled
    ├── verification.md           # How to typecheck and test
    ├── agent-prompts.md          # Briefs to paste into specialists
    └── examples.md               # Dispatch shapes
```

## Customize

Tighten [references/house-rules.md](references/house-rules.md) for your team (design system, testing library, auth helper). Keep the roster and the "builder never grades" rule — that is the point of the skill.

## License

MIT
