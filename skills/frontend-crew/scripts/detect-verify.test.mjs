import { deepEqual, equal, match } from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "detect-verify.mjs");

// Each fixture is its own git repo so lookups never leak into whatever surrounds tmpdir.
function fixture(prefix = "frontend-crew-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  execFileSync("git", ["-C", dir, "init", "-q"], { stdio: "ignore" });
  return dir;
}

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
  const dir = fixture();
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

test("reports installed versions, build script, instruction files, and bundled Next docs", () => {
  const dir = fixture();
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "demo",
      scripts: { build: "next build" },
      dependencies: { next: "^16.2.0", zod: "^4.0.0" },
    }),
  );
  writeFileSync(join(dir, "AGENTS.md"), "# rules");
  mkdirSync(join(dir, "node_modules", "next", "dist", "docs"), { recursive: true });
  writeFileSync(
    join(dir, "node_modules", "next", "package.json"),
    JSON.stringify({ name: "next", version: "16.4.1" }),
  );

  try {
    const result = run(dir);
    equal(result.build, "npm run build");
    deepEqual(result.versions.next, { declared: "^16.2.0", installed: "16.4.1" });
    deepEqual(result.versions.zod, { declared: "^4.0.0", installed: null });
    equal(result.versions.react, undefined);
    deepEqual(result.instructionFiles, [join(dir, "AGENTS.md")]);
    equal(result.nextBundledDocs, join(dir, "node_modules", "next", "dist", "docs"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolves a workspace: root lockfile, hoisted install, stacked instructions, rules dir", () => {
  const dir = fixture();
  const app = join(dir, "apps", "web");
  mkdirSync(join(app, ".cursor", "rules"), { recursive: true });
  writeFileSync(join(dir, "pnpm-lock.yaml"), "");
  writeFileSync(join(dir, "AGENTS.md"), "# org rules");
  writeFileSync(join(app, "CLAUDE.md"), "# app notes");
  writeFileSync(join(app, ".cursor", "rules", "ui.mdc"), "");
  mkdirSync(join(dir, "node_modules", "zod"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "zod", "package.json"), JSON.stringify({ version: "4.6.7" }));
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({ name: "web", scripts: { test: "vitest run" }, dependencies: { zod: "^4" } }),
  );

  try {
    const result = run(app);
    equal(result.packageManager, "pnpm");
    equal(result.test, "pnpm test");
    equal(result.versions.zod.installed, "4.6.7");
    deepEqual(result.instructionFiles, [
      join(app, "CLAUDE.md"),
      join(app, ".cursor", "rules", "ui.mdc"),
      join(dir, "AGENTS.md"),
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("honors the corepack packageManager field over lockfiles", () => {
  const dir = fixture();
  writeFileSync(join(dir, "package-lock.json"), "{}");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "demo", packageManager: "bun@1.2.0" }));
  try {
    equal(run(dir).packageManager, "bun");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("falls back to tsc when typescript exists without a script", () => {
  const dir = fixture();
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
  const dir = fixture("frontend-crew-empty-");
  try {
    const result = runFail(dir);
    match(result.error, /package.json not found/);
    equal(result.typecheck, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
