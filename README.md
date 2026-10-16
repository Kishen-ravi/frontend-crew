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

Global (every project on this machine). Name the agents you use; without `-a`, the CLI tries every agent it detects, and some (for example PromptScript) have no global skills directory and fail the install:

```bash
npx skills add Kishen-ravi/frontend-crew -g -y -a claude-code -a cursor -a codex
```

Confirm:

```bash
npx skills list -g
```

### Cursor

This repo is both an [Agent Plugin](https://agent-plugins.org) (`plugin.json`) and a [Cursor Plugin](https://cursor.com/docs/plugins) (`.cursor-plugin/plugin.json`).

**From the Skills CLI** (fastest for a personal machine):

```bash
npx skills add Kishen-ravi/frontend-crew -g -y -a cursor
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
npx skills add Kishen-ravi/frontend-crew -g -y -a claude-code
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
npx skills add Kishen-ravi/frontend-crew -g -y -a codex
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

1. Detect the repo (`skills/frontend-crew/scripts/detect-verify.mjs`) — package manager, installed versions of React / Next.js / TypeScript / Zod, repo instruction files (`AGENTS.md`, `CLAUDE.md`), Next.js bundled docs, and typecheck / lint / test / build commands.
2. Run a baseline of those commands so pre-existing failures are not blamed on the change.
3. Write a brief: goal, acceptance criteria, the stack guidelines that apply, and a checklist of MUST rule ids and corner cases.
4. Spawn an **implementer** (fresh context). Goal, not a recipe. Version-matched docs over memory.
5. Spawn **types** and **tests** (fresh contexts), then a **standards/security reviewer** once they have finished editing. They run the project's real commands plus `scan-diff.mjs` and mark each checklist row PASS / FAIL / N/A / UNVERIFIED with evidence.
6. Spawn a **grader** (fresh context, never the builder). It re-runs the gates and returns PASS, FAIL, or BLOCKED (something could not be verified).
7. Loop on FAIL with a new implementer until PASS, or stop at BLOCKED / a human decision.

Trivial copy or typo fixes stay solo. Features, schema changes, and behavior bugs get the crew. Reviewing an existing branch uses reviewer + grader only.

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
│   ├── scripts/detect-verify.mjs       # Detect stack, versions, instructions, verify commands
│   ├── scripts/scan-diff.mjs           # Flag suppressions / weakened types / leaks on added lines
│   └── references/
│       ├── house-rules.md              # MUST/SHOULD model, scope, security, a11y, tests
│       ├── typescript-guidelines.md    # Stack rules, version notes, automated checks
│       ├── react-guidelines.md
│       ├── nextjs-guidelines.md
│       ├── zod-guidelines.md
│       ├── standards-checklist.md      # Statuses, gate items, pre-existing failures, verdict
│       ├── corner-cases.md
│       ├── verification.md
│       ├── agent-prompts.md
│       └── examples.md
├── README.md
└── LICENSE
```

## Customize

Tighten [house-rules.md](skills/frontend-crew/references/house-rules.md) and the stack guideline files for your team (design system, testing library, auth helper). Keep the MUST/SHOULD split, the roster, and the "builder never grades" rule — that is the point of the skill. When a framework releases a new major, update the *Version notes* table in the matching guideline file.

Script checks (no extra install):

```bash
node --test skills/frontend-crew/scripts/detect-verify.test.mjs skills/frontend-crew/scripts/scan-diff.test.mjs
```

## License

MIT
