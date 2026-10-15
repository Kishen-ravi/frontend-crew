import { deepEqual, equal } from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "scan-diff.mjs");

function git(cwd, ...args) {
  execFileSync(
    "git",
    [
      "-c", "user.email=crew@example.com", "-c", "user.name=crew",
      "-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main",
      "-C", cwd, ...args,
    ],
    { stdio: "ignore" },
  );
}

function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "frontend-crew-scan-"));
  git(dir, "init", "-q");
  write(dir, files);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  return dir;
}

function write(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

function scan(dir, ...args) {
  try {
    return { status: 0, ...JSON.parse(execFileSync(process.execPath, [script, dir, ...args], { encoding: "utf8" })) };
  } catch (error) {
    return { status: error.status, ...JSON.parse(error.stdout) };
  }
}

const rules = (result) => result.findings.map((finding) => `${finding.rule}@${finding.file}:${finding.line}`);

test("flags only lines the change adds, not pre-existing ones", () => {
  const dir = repo({ "src/old.ts": "export const legacy: any = 1;\n" });
  try {
    write(dir, {
      "src/old.ts": "export const legacy: any = 1;\nexport const fresh = (x: unknown) => x as unknown as string;\n",
    });
    const result = scan(dir);
    equal(result.status, 1);
    deepEqual(rules(result), ["ts-double-assertion@src/old.ts:2"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scans untracked files, config weakening, suppressions, and leaks", () => {
  const dir = repo({ "package.json": "{}\n" });
  try {
    write(dir, {
      "tsconfig.json": '{ "compilerOptions": { "strict": false } }\n',
      "next.config.ts": "export default { typescript: { ignoreBuildErrors: true } };\n",
      "app/form.tsx": [
        "// @ts-ignore",
        "const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;",
        "// we accept any input here",
        "const rows: any[] = [];",
        "export const List = () => rows.map((r, i) => <li key={i}>{r}</li>);",
        "",
      ].join("\n"),
      "app/api/route.ts": "export async function POST(request: Request) { const body = await request.json(); return body; }\n",
      "app/form.test.tsx": 'it.only("renders", () => {});\nit.skip("saves", () => {});\n',
    });
    const result = scan(dir);
    equal(result.status, 1);
    deepEqual(rules(result).sort(), [
      "build-errors-ignored@next.config.ts:1",
      "index-key@app/form.tsx:5",
      "public-secret@app/form.tsx:2",
      "test-only@app/form.test.tsx:1",
      "test-skip@app/form.test.tsx:2",
      "ts-any@app/form.tsx:4",
      "ts-suppress@app/form.tsx:1",
      "tsconfig-weakened@tsconfig.json:1",
      "unchecked-json@app/api/route.ts:1",
    ]);
    equal(result.violations, 5);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("exits 0 with review-only findings and reports lockfile churn", () => {
  const dir = repo({ "package-lock.json": "{}\n", "src/a.ts": "export const a = 1;\n" });
  try {
    write(dir, {
      "package-lock.json": '{ "lockfileVersion": 3 }\n',
      "src/a.ts": "export const a = 1;\nexport const b = (m: Map<string, number>) => m.get('x')!;\n",
    });
    const result = scan(dir);
    equal(result.status, 0);
    deepEqual(rules(result).sort(), ["lockfile-changed@package-lock.json:null", "ts-non-null@src/a.ts:2"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("honors --base so committed branch work is scanned", () => {
  const dir = repo({ "src/a.ts": "export const a = 1;\n" });
  try {
    write(dir, { "src/a.ts": "export const a: any = 1;\n" });
    git(dir, "commit", "-qam", "change");
    equal(scan(dir).findings.length, 0);
    const result = scan(dir, "--base", "HEAD~1");
    deepEqual(rules(result), ["ts-any@src/a.ts:1"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ignores comments, strings, and non-test fit() calls", () => {
  const dir = repo({ "package.json": "{}\n" });
  try {
    write(dir, {
      "src/ok.ts": [
        "const x = 1; // note: any value works here",
        'const label = "Pick: any";',
        "const r = fit(data);",
        "/* legacy: any",
        "   still a comment: any */",
        "const y: any = 1;",
        "",
      ].join("\n"),
    });
    const result = scan(dir);
    deepEqual(rules(result), ["ts-any@src/ok.ts:6"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("parses paths regardless of git prefix and quotePath config, skips binaries", () => {
  const dir = repo({ "tsconfig.json": '{ "compilerOptions": { "strict": true } }\n' });
  try {
    git(dir, "config", "diff.noprefix", "true");
    git(dir, "config", "core.quotePath", "true");
    write(dir, {
      "tsconfig.json": '{ "compilerOptions": { "strict": false } }\n',
      "src/ü.ts": "const a: any = 1;\n",
    });
    mkdirSync(join(dir, "public"));
    writeFileSync(join(dir, "public/blob.bin"), Buffer.from([0, 1, 2, 3]));
    const result = scan(dir);
    deepEqual(rules(result).sort(), ["ts-any@src/ü.ts:1", "tsconfig-weakened@tsconfig.json:1"]);
    deepEqual(result.skipped, [{ file: "public/blob.bin", reason: "binary" }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects --base without a value", () => {
  const dir = repo({ "a.ts": "" });
  try {
    const result = scan(dir, "--base");
    equal(result.status, 2);
    equal(result.error, "--base needs a git ref");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("exits 2 outside a git repository", () => {
  const dir = mkdtempSync(join(tmpdir(), "frontend-crew-nogit-"));
  try {
    equal(scan(dir).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
