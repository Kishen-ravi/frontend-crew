import { equal, match } from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "detect-verify.mjs");

function run(cwd) {
  const stdout = execFileSync(process.execPath, [script, cwd], {
    encoding: "utf8",
  });
  return JSON.parse(stdout);
}

function runFail(cwd) {
  try {
    execFileSync(process.execPath, [script, cwd], {
      encoding: "utf8",
    });
    throw new Error("expected non-zero exit");
  } catch (error) {
    equal(error.status, 2);
    return JSON.parse(error.stdout);
  }
}

test("reads scripts, lockfile, and stack from a Next app", () => {
  const dir = mkdtempSync(join(tmpdir(), "frontend-crew-"));
  writeFileSync(join(dir, "pnpm-lock.yaml"), "");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "demo",
      scripts: { typecheck: "tsc --noEmit", test: "vitest run", typegen: "next typegen" },
      dependencies: { react: "19.0.0", next: "15.0.0", zod: "3.24.0" },
      devDependencies: { typescript: "5.7.0", vitest: "3.0.0" },
    }),
  );

  try {
    const result = run(dir);
    equal(result.packageManager, "pnpm");
    equal(result.typecheck, "pnpm typecheck");
    equal(result.test, "pnpm test");
    equal(result.nextTypegen, "pnpm typegen");
    equal(result.stack.react, true);
    equal(result.stack.next, true);
    equal(result.stack.zod, true);
    equal(result.stack.typescript, true);
    equal(result.stack.vitest, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("falls back to tsc when typescript exists without a script", () => {
  const dir = mkdtempSync(join(tmpdir(), "frontend-crew-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "demo",
      devDependencies: { typescript: "5.7.0" },
    }),
  );

  try {
    const result = run(dir);
    equal(result.packageManager, "npm");
    equal(result.typecheck, "npx tsc --noEmit");
    equal(result.test, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("exits 2 when package.json is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "frontend-crew-empty-"));
  try {
    const result = runFail(dir);
    match(result.error, /package.json not found/);
    equal(result.typecheck, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
