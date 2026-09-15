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

The script prints JSON: package manager, stack flags, and the commands to run. Use those commands as-is.

If you cannot run it, open the nearest `package.json` and pick scripts in this order:

**Typecheck:** `typecheck` → `ts:check` → `tsc` → `npx tsc --noEmit` when `typescript` is a dependency.

**Tests:** `test` → `test:unit` → `vitest` / `jest` / `playwright` scripts that already exist.

**Lint:** run `lint` when the types or tests specialist would otherwise miss an error the repo treats as blocking. Lint is not a substitute for typecheck.

## Rules

- Do not invent a runner. If the repo uses Vitest, do not add Jest.
- Prefer the targeted form the repo already uses (`vitest run path`, `pnpm test -- path`) when only some files changed.
- `tsc --noEmit` must see the same `tsconfig` the app uses. Do not pass a fresh config.
- Next.js apps: if `next typegen` / `next --turbopack typegen` is in scripts or required for route types, run it before `tsc`.
- Capture the full command and exit code for the grader and the final report.
- A skipped test suite is a failed done bar, not a pass.
- If typecheck or tests cannot run (missing install, broken toolchain), stop and report the blocker. Do not skip to "looks fine."

## Install

If `node_modules` is missing, install with the detected package manager (`pnpm install`, `npm install`, `yarn install`, `bun install`). Do not mix managers.
