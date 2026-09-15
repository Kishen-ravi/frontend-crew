# frontend-crew

[Agent Plugin](https://agent-plugins.org) that runs a small crew on React, TypeScript, Next.js, and Zod work.

Repo: [github.com/Kishen-ravi/frontend-crew](https://github.com/Kishen-ravi/frontend-crew)

The parent agent is the orchestrator. It decides who does what, hands each specialist the **goal** and the **fences**, and refuses to treat the work as done until a **separate** grader fails to poke a hole in it.

Typecheck and tests are part of the done bar, not a nicety.

## Install

### Skills CLI (Cursor, Claude Code, Codex, and other agents)

```bash
npx skills add Kishen-ravi/frontend-crew
```

Global (every project on this machine):

```bash
npx skills add Kishen-ravi/frontend-crew -g -y
```

Confirm:

```bash
npx skills list -g
```

### Cursor

This repo is both an [Agent Plugin](https://agent-plugins.org) (`plugin.json`) and a [Cursor Plugin](https://cursor.com/docs/plugins) (`.cursor-plugin/plugin.json`).

**From the Skills CLI** (fastest for a personal machine):

```bash
npx skills add Kishen-ravi/frontend-crew -g -y
```

Then start a new Agent chat. The skill is `frontend-crew`. You can also invoke it with `/frontend-crew`.

**As a local plugin** (full plugin bundle, including future Cursor components):

```bash
git clone https://github.com/Kishen-ravi/frontend-crew.git ~/.cursor/plugins/local/frontend-crew
```

Reload the window (`Developer: Reload Window`), then open **Customize** and confirm `frontend-crew` is listed.

**Team marketplace:** import [Kishen-ravi/frontend-crew](https://github.com/Kishen-ravi/frontend-crew) under Dashboard → Plugins → Add Marketplace.

**Official Marketplace:** submit this repo at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) if you want it listed publicly.

### Claude Code

Add this repo as a plugin marketplace, then install the plugin:

```text
/plugin marketplace add Kishen-ravi/frontend-crew
/plugin install frontend-crew@frontend-crew
/reload-plugins
```

Or from the shell:

```bash
claude plugin marketplace add Kishen-ravi/frontend-crew
claude plugin install frontend-crew@frontend-crew --scope user
```

Invoke with `/frontend-crew:frontend-crew`, or ask Claude to use `frontend-crew`.

The Skills CLI also copies the skill into Claude Code:

```bash
npx skills add Kishen-ravi/frontend-crew -g -y
```

### Codex

Add this repo as a plugin marketplace, then install the plugin:

```bash
codex plugin marketplace add Kishen-ravi/frontend-crew
codex plugin add frontend-crew@frontend-crew
```

Start a new Codex session. Invoke with `$frontend-crew` or `/skills`.

You can also ask Codex's skill installer to pull the repo:

```text
$skill-installer Kishen-ravi/frontend-crew
```

Or install only the skill via the Skills CLI:

```bash
npx skills add Kishen-ravi/frontend-crew -g -y
```

### From a clone

```bash
git clone https://github.com/Kishen-ravi/frontend-crew.git
npx skills add ./frontend-crew
```

## Use

In a chat on a frontend repo:

- `Use frontend-crew to add a login form with Zod on the server action.`
- `Have the frontend crew fix the empty state on the invoices table.`
- `frontend-crew: this PR needs types, tests, and a real done bar.`

The skill also triggers on ordinary frontend work (UI, App Router, forms, API routes, schemas) when it is installed.

## What happens

1. Detect the repo (`skills/frontend-crew/scripts/detect-verify.mjs`) — package manager, stack, typecheck/test commands.
2. Write a brief: goal, applicable house rules, corner-case ids, done bar.
3. Spawn an **implementer** (fresh context). Goal, not a recipe.
4. Spawn **types** and **tests** (fresh context). They run the project's real commands.
5. Spawn a **grader** (fresh context, never the builder). It tries to prove the work is not done.
6. Loop on FAIL with a new implementer until PASS, or until a human decision is required.

Trivial copy or typo fixes stay solo. Features, schema changes, and behavior bugs get the crew.

## Layout

```
frontend-crew/
├── plugin.json                         # Agent Plugins manifest (Cursor, Claude, Codex, others)
├── .cursor-plugin/plugin.json          # Cursor Plugin manifest
├── .claude-plugin/plugin.json          # Claude Code plugin manifest
├── .claude-plugin/marketplace.json     # Claude Code marketplace
├── .codex-plugin/plugin.json           # Codex compatibility manifest
├── .agents/plugins/marketplace.json    # Codex marketplace
├── skills/frontend-crew/
│   ├── SKILL.md                        # Orchestrator
│   ├── agents/openai.yaml              # Codex / ChatGPT skill UI
│   ├── scripts/detect-verify.mjs       # Detect stack + verify commands
│   └── references/
│       ├── house-rules.md
│       ├── corner-cases.md
│       ├── verification.md
│       ├── agent-prompts.md
│       └── examples.md
├── README.md
└── LICENSE
```

## Customize

Tighten [skills/frontend-crew/references/house-rules.md](skills/frontend-crew/references/house-rules.md) for your team (design system, testing library, auth helper). Keep the roster and the "builder never grades" rule — that is the point of the skill.

Detect-script checks (no extra install):

```bash
node --test skills/frontend-crew/scripts/detect-verify.test.mjs
```

## License

MIT
