#!/usr/bin/env node
/**
 * Detect package manager, stack, and verify commands from package.json.
 * Run from the application repo (or pass a path). Prints JSON to stdout.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const startDir = resolve(process.argv[2] ?? process.cwd());

// Never look above the repository: a stray ~/node_modules or ~/AGENTS.md is not this app's.
function repoTop(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

// Yields each ancestor of dir, innermost first, stopping at the repo top.
function* ancestors(dir, top) {
  let current = dir;
  while (true) {
    yield current;
    if (current === top) return;
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function findUp(dir, top, relativePath) {
  for (const current of ancestors(dir, top)) {
    const candidate = join(current, relativePath);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function detectPackageManager(pkg, root, top) {
  // Corepack field wins when present, e.g. "pnpm@9.1.0".
  const declared = /^(npm|pnpm|yarn|bun)(@|$)/.exec(pkg.packageManager ?? "")?.[1];
  if (declared) return declared;
  // Workspaces keep one lockfile at the workspace root, so look up from the app.
  for (const current of ancestors(root, top)) {
    if (existsSync(join(current, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(current, "yarn.lock"))) return "yarn";
    if (existsSync(join(current, "bun.lockb")) || existsSync(join(current, "bun.lock"))) return "bun";
    if (existsSync(join(current, "package-lock.json"))) return "npm";
  }
  return "npm";
}

function runPrefix(manager) {
  if (manager === "npm") return "npm run";
  if (manager === "yarn") return "yarn";
  if (manager === "bun") return "bun run";
  return "pnpm";
}

function firstScript(scripts, names) {
  return names.find((name) => scripts[name]);
}

function hasDep(pkg, name) {
  return Boolean(declaredVersion(pkg, name));
}

function declaredVersion(pkg, name) {
  return (
    pkg.dependencies?.[name] ??
    pkg.devDependencies?.[name] ??
    pkg.peerDependencies?.[name] ??
    null
  );
}

// Walk up so hoisted installs in monorepos resolve to the version the app actually uses.
function installedVersion(dir, top, name) {
  const manifest = findUp(dir, top, join("node_modules", name, "package.json"));
  if (!manifest) return null;
  try {
    return JSON.parse(readFileSync(manifest, "utf8")).version ?? null;
  } catch {
    return null;
  }
}

const top = repoTop(startDir);
const packageJsonPath = findUp(startDir, top, "package.json");
if (!packageJsonPath) {
  console.log(
    JSON.stringify(
      {
        error: "package.json not found",
        searchedFrom: startDir,
        typecheck: null,
        test: null,
        lint: null,
        build: null,
        versions: {},
        instructionFiles: [],
        stack: {},
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

const root = dirname(packageJsonPath);
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const scripts = pkg.scripts ?? {};
const manager = detectPackageManager(pkg, root, top);
const prefix = runPrefix(manager);

const typecheckName = firstScript(scripts, [
  "typecheck",
  "type-check",
  "ts:check",
  "tsc",
]);
const testName = firstScript(scripts, [
  "test",
  "test:unit",
  "test:ci",
  "vitest",
  "jest",
]);
const lintName = firstScript(scripts, ["lint", "eslint"]);
const buildName = firstScript(scripts, ["build"]);
const typegenName = firstScript(scripts, ["typegen", "next:typegen"]);

const versionedPackages = ["react", "react-dom", "next", "typescript", "zod", "eslint"];
const versions = Object.fromEntries(
  versionedPackages
    .map((name) => [name, { declared: declaredVersion(pkg, name), installed: installedVersion(root, top, name) }])
    .filter(([, entry]) => entry.declared || entry.installed),
);

// Repo instructions outrank the skill's defaults; agents must read these before working.
// They accumulate across ancestors (workspace root plus app), so collect every hit, app-level first.
const instructionNames = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursor/rules",
  ".cursorrules",
  ".github/copilot-instructions.md",
];
const instructionFiles = [];
for (const dir of ancestors(root, top)) {
  for (const name of instructionNames) {
    const candidate = join(dir, name);
    if (!existsSync(candidate)) continue;
    if (statSync(candidate).isDirectory()) {
      // Cursor project rules live as files inside .cursor/rules.
      for (const entry of readdirSync(candidate).sort()) instructionFiles.push(join(candidate, entry));
    } else {
      instructionFiles.push(candidate);
    }
  }
}

const hasTypescript = hasDep(pkg, "typescript") || existsSync(join(root, "tsconfig.json"));

const typecheck = typecheckName
  ? `${prefix} ${typecheckName}`
  : hasTypescript
    ? "npx tsc --noEmit"
    : null;

const result = {
  root,
  packageManager: manager,
  typecheck,
  typecheckScript: typecheckName ?? null,
  test: testName ? `${prefix} ${testName}` : null,
  testScript: testName ?? null,
  lint: lintName ? `${prefix} ${lintName}` : null,
  build: buildName ? `${prefix} ${buildName}` : null,
  nextTypegen: typegenName ? `${prefix} ${typegenName}` : null,
  versions,
  instructionFiles,
  // Next.js 16.2+ ships version-matched docs here; prefer them over memory or web docs.
  nextBundledDocs: findUp(root, top, join("node_modules", "next", "dist", "docs")),
  stack: {
    typescript: hasTypescript,
    react: hasDep(pkg, "react"),
    next: hasDep(pkg, "next"),
    zod: hasDep(pkg, "zod"),
    vitest: hasDep(pkg, "vitest"),
    jest: hasDep(pkg, "jest"),
    playwright: hasDep(pkg, "@playwright/test") || hasDep(pkg, "playwright"),
    testingLibrary: hasDep(pkg, "@testing-library/react"),
  },
};

console.log(JSON.stringify(result, null, 2));
