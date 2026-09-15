#!/usr/bin/env node
/**
 * Detect package manager, stack, and verify commands from package.json.
 * Run from the application repo (or pass a path). Prints JSON to stdout.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const startDir = resolve(process.argv[2] ?? process.cwd());

function findPackageJson(dir) {
  let current = dir;
  while (true) {
    const candidate = join(current, "package.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function detectPackageManager(root) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock")))
    return "bun";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
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
  return Boolean(
    pkg.dependencies?.[name] ||
      pkg.devDependencies?.[name] ||
      pkg.peerDependencies?.[name],
  );
}

const packageJsonPath = findPackageJson(startDir);
if (!packageJsonPath) {
  console.log(
    JSON.stringify(
      {
        error: "package.json not found",
        searchedFrom: startDir,
        typecheck: null,
        test: null,
        lint: null,
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
const manager = detectPackageManager(root);
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
const typegenName = firstScript(scripts, ["typegen", "next:typegen"]);

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
  nextTypegen: typegenName ? `${prefix} ${typegenName}` : null,
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
