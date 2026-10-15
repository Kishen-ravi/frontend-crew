# Verification

Run commands from the **application** repo root, not from this skill folder.

## Detect

Prefer:

```bash
node <frontend-crew-skill>/scripts/detect-verify.mjs
```

Optional path:

```bash
node <frontend-crew-skill>/scripts/detect-verify.mjs /absolute/path/to/app
```

The script prints JSON. Use its commands as-is.

| Field | Contents |
|---|---|
| `packageManager` | From the `packageManager` field, else the nearest lockfile up to the repo root (workspaces keep it at the root) |
| `typecheck` / `test` / `lint` / `build` / `nextTypegen` | Commands to run |
| `versions` | `declared` range and `installed` version for react, react-dom, next, typescript, zod, eslint |
| `instructionFiles` | `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, from the app directory up to the repo root (app-level first). Read every one; they outrank the skill. |
| `nextBundledDocs` | Version-matched Next.js docs (16.2+) |
| `stack` | Which libraries and test tools are present |

If `installed` is `null`, dependencies are not installed. Install them (see below) before trusting any version-specific rule.

If you cannot run the script, open the nearest `package.json` and pick scripts in this order:

- **Typecheck:** `typecheck` → `ts:check` → `tsc` → `npx tsc --noEmit` when `typescript` is a dependency.
- **Tests:** `test` → `test:unit` → `vitest` / `jest` / `playwright` scripts that already exist.
- **Lint:** `lint` → `eslint`.
- **Build:** `build`.

## Baseline (before any change)

Run typecheck, lint, and the relevant tests on the untouched tree, plus the build when `gate-build` will apply. Save command, exit code, and failures. The baseline is the only way to separate pre-existing failures from regressions ([standards-checklist.md](standards-checklist.md)). If the tree already had uncommitted user changes, record that; never stash or discard them.

If you need a baseline after the change has started, check out the base ref in a separate `git worktree` instead of touching the working tree.

## Gate commands

| Check | When | Notes |
|---|---|---|
| `nextTypegen` | Next.js with typed routes / `PageProps` | Run before typecheck. |
| Typecheck | Any `.ts` / `.tsx` change | Must use the app's own `tsconfig`. Do not pass a fresh config. |
| Lint | Repo has lint | Next.js 16 removed `next lint`. If the script still calls it, the failure is pre-existing; record it and do not migrate it as a drive-by. TypeScript 7 has no programmatic API until 7.1, so type-aware lint may not run; the items it proves are UNVERIFIED. |
| Tests | Always for behavior changes | Prefer the targeted form the repo already uses (`vitest run path`, `pnpm test -- path`), then the full suite before PASS when it is affordable. |
| Build | `gate-build` applies | Catches server/client boundary, serialization, and `'use cache'` errors that typecheck misses. |
| `node <skill>/scripts/scan-diff.mjs [repo] [--base <ref>]` | Always | Added-line scan. Exit 1 means violations; `review` findings need a decision. Use `--base` with the branch point when the work is already committed. Files listed under `skipped` (binary, or over 2 MB) were not scanned; confirm they belong in the change. |

## Runtime proof (optional)

When acceptance depends on behavior in a running app and the prerequisites exist, use `next-dev-loop` (see [nextjs-guidelines.md](nextjs-guidelines.md)) or the repo's Playwright setup. Without them, mark runtime-only criteria UNVERIFIED. Do not substitute guesses.

## Rules

- Do not invent a runner. If the repo uses Vitest, do not add Jest.
- Capture the full command, exit code, and pass/skip counts for the grader and the final report.
- A skipped or focused test is not a pass.
- Never claim a check passed unless it ran in this session and you saw the exit code.
- If a command cannot run (missing install, env, network, or a broken toolchain), mark it UNVERIFIED with the reason. The verdict is then BLOCKED, not PASS.

## Install

If `node_modules` is missing, install with the detected package manager and the frozen lockfile: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable` (Berry) or `--frozen-lockfile` (v1), `bun install --frozen-lockfile`. Do not mix managers. Only a goal that changes dependencies may update the lockfile.
