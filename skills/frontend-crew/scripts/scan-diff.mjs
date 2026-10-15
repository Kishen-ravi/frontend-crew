#!/usr/bin/env node
/**
 * Scan only the lines a change adds for suppressions, weakened type safety, and
 * likely leaks. Run from the application repo (or pass a path). Prints JSON.
 *
 *   node scan-diff.mjs [path] [--base <ref>]
 *
 * Compares the working tree (staged + unstaged + untracked) against --base
 * (default HEAD). Exit 1 when any "violation" is found, 2 on usage/git errors.
 * "review" findings are leads for the reviewer, not verdicts.
 */

import { execFileSync } from "node:child_process";
import { openSync, readSync, closeSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

function usage(message) {
  console.log(JSON.stringify({ error: message, usage: "scan-diff.mjs [path] [--base <ref>]" }, null, 2));
  process.exit(2);
}

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
let base = "HEAD";
if (baseIndex !== -1) {
  base = args[baseIndex + 1];
  if (!base || base.startsWith("--")) usage("--base needs a git ref");
}
const positional = args.filter(
  (arg, i) => !arg.startsWith("--") && (baseIndex === -1 || i !== baseIndex + 1),
);
if (positional.length > 1) usage(`unexpected argument: ${positional[1]}`);
const startDir = resolve(positional[0] ?? process.cwd());

const CODE = /\.(c|m)?(t|j)sx?$/;
const TEST = /\.(test|spec)\.(c|m)?(t|j)sx?$/;
const TEXT = /\.(c|m)?(t|j)sx?$|\.(json|jsonc|md|mdx|ya?ml|toml|env|css|scss|html|txt|svg)$|(^|\/)\.env(\.|$)/;
const MAX_UNTRACKED_BYTES = 2 * 1024 * 1024;
const LOCKFILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
]);

// kind: "violation" fails the scan; "review" needs a human/agent judgement.
// code: match against the line with comments and string contents removed.
const RULES = [
  {
    id: "ts-any",
    kind: "violation",
    files: CODE,
    code: true,
    pattern: /:\s*any\b|\bas\s+any\b|<any>|\bany\[\]|Array<any>|,\s*any>/,
    message: "New `any`. Use a real type, `unknown` + narrowing, or a Zod schema.",
  },
  {
    id: "ts-double-assertion",
    kind: "violation",
    files: CODE,
    code: true,
    pattern: /\bas\s+unknown\s+as\b/,
    message: "`as unknown as` bypasses the type checker. Parse or narrow instead.",
  },
  {
    id: "ts-suppress",
    kind: "violation",
    files: CODE,
    pattern: /@ts-ignore|@ts-nocheck/,
    message: "Type error suppressed. Fix the error instead.",
  },
  {
    id: "ts-expect-error",
    kind: "review",
    files: CODE,
    pattern: /@ts-expect-error/,
    message: "`@ts-expect-error` needs a reason and must not hide an error in this change.",
  },
  {
    id: "ts-non-null",
    kind: "review",
    files: CODE,
    code: true,
    pattern: /[\w)\]]!(?=[.[);,]|$)/,
    message: "Non-null `!`. Allowed only with an adjacent control-flow proof.",
  },
  {
    id: "lint-suppress",
    kind: "review",
    files: CODE,
    pattern: /eslint-disable|biome-ignore|oxlint-disable/,
    message: "Lint rule suppressed. Fix the cause; a suppression needs a written reason.",
  },
  {
    id: "test-only",
    kind: "violation",
    files: TEST,
    code: true,
    pattern: /\b(it|test|describe)\.only\(|\bf(it|describe)\(/,
    message: "Focused test. The rest of the suite silently stops running.",
  },
  {
    id: "test-skip",
    kind: "review",
    files: TEST,
    code: true,
    pattern: /\b(it|test|describe)\.(skip|todo)\(|\bx(it|describe|test)\(/,
    message: "Skipped test. A skipped test is not a passing test.",
  },
  {
    id: "tsconfig-weakened",
    kind: "violation",
    files: /(^|\/)tsconfig[^/]*\.json$/,
    pattern:
      /"(strict|strictNullChecks|noImplicitAny|strictFunctionTypes|strictBindCallApply|strictPropertyInitialization|useUnknownInCatchVariables|alwaysStrict|noUncheckedIndexedAccess|exactOptionalPropertyTypes)"\s*:\s*false/,
    message: "Compiler safety flag turned off.",
  },
  {
    id: "build-errors-ignored",
    kind: "violation",
    files: /(^|\/)next\.config\.(c|m)?(j|t)s$/,
    code: true,
    pattern: /ignoreBuildErrors\s*:\s*true|ignoreDuringBuilds\s*:\s*true/,
    message: "Build configured to ignore type or lint errors.",
  },
  {
    id: "public-secret",
    kind: "review",
    files: TEXT,
    pattern: /NEXT_PUBLIC_\w*(SECRET|PRIVATE|PASSWORD|SERVICE_ROLE)/,
    message: "`NEXT_PUBLIC_*` values are inlined into the client bundle. Secrets must stay server-only.",
  },
  {
    id: "dangerous-html",
    kind: "review",
    files: CODE,
    code: true,
    pattern: /dangerouslySetInnerHTML/,
    message: "Raw HTML. Confirm the input is trusted or sanitized.",
  },
  {
    id: "index-key",
    kind: "review",
    files: CODE,
    code: true,
    pattern: /key=\{\s*(i|idx|index)\s*\}/,
    message: "Index key. Use a stable id unless the list is static.",
  },
  {
    id: "unchecked-json",
    kind: "review",
    files: CODE,
    code: true,
    pattern: /\b(request|req)\.json\(\)/,
    message: "Request body must be schema-parsed before use.",
  },
];

// Fixed prefixes and no path quoting so header parsing does not depend on the user's git config.
const GIT_CONFIG = ["-c", "core.quotePath=false", "-c", "diff.noprefix=false", "-c", "diff.mnemonicPrefix=false"];

function git(cwd, gitArgs) {
  return execFileSync("git", [...GIT_CONFIG, "-C", cwd, ...gitArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

// Blank out comments and string/template contents so rule patterns see only code.
// Tracks block comments across the lines of one file; good enough for leads, not a parser.
function stripCode(lines) {
  let inBlock = false;
  return lines.map((line) => {
    let out = "";
    let i = 0;
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf("*/", i);
        if (end === -1) return out;
        inBlock = false;
        i = end + 2;
        continue;
      }
      const two = line.slice(i, i + 2);
      if (two === "//") return out;
      if (two === "/*") {
        inBlock = true;
        i += 2;
        continue;
      }
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < line.length && line[j] !== ch) j += line[j] === "\\" ? 2 : 1;
        out += ch + ch;
        i = j + 1;
        continue;
      }
      out += ch;
      i += 1;
    }
    return out;
  });
}

function readTextPrefix(path) {
  const size = statSync(path).size;
  if (size > MAX_UNTRACKED_BYTES) return { skipped: `larger than ${MAX_UNTRACKED_BYTES} bytes` };
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(size);
    readSync(fd, buffer, 0, size, 0);
    if (buffer.subarray(0, 8192).includes(0)) return { skipped: "binary" };
    return { text: buffer.toString("utf8") };
  } finally {
    closeSync(fd);
  }
}

// Map each changed file to the line numbers and text of lines it adds.
function addedLines(root, skipped) {
  const added = new Map();
  const diff = git(root, [
    "diff",
    "--unified=0",
    "--no-color",
    "--no-ext-diff",
    "--src-prefix=a/",
    "--dst-prefix=b/",
    base,
    "--",
  ]);
  let file = null;
  let line = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("+++ ")) {
      file = raw === "+++ /dev/null" ? null : raw.slice("+++ b/".length);
      if (file && !added.has(file)) added.set(file, []);
    } else if (raw.startsWith("@@")) {
      line = Number(/\+(\d+)/.exec(raw)[1]);
    } else if (file && raw.startsWith("+")) {
      added.get(file).push({ line, text: raw.slice(1) });
      line += 1;
    }
  }
  const untracked = git(root, ["ls-files", "-z", "--others", "--exclude-standard"])
    .split("\0")
    .filter(Boolean);
  for (const path of untracked) {
    let result;
    try {
      result = readTextPrefix(join(root, path));
    } catch (error) {
      result = { skipped: error.code ?? String(error) };
    }
    if (result.skipped) {
      skipped.push({ file: path, reason: result.skipped });
      continue;
    }
    added.set(
      path,
      result.text.split("\n").map((content, i) => ({ line: i + 1, text: content })),
    );
  }
  return added;
}

let root;
try {
  root = git(startDir, ["rev-parse", "--show-toplevel"]).trim();
} catch {
  console.log(JSON.stringify({ error: "not a git repository", searchedFrom: startDir }, null, 2));
  process.exit(2);
}

const skipped = [];
let changes;
try {
  changes = addedLines(root, skipped);
} catch (error) {
  console.log(JSON.stringify({ error: `git diff failed against ${base}`, detail: String(error.stderr ?? error) }, null, 2));
  process.exit(2);
}

const findings = [];
for (const [file, lines] of changes) {
  if (LOCKFILES.has(basename(file))) {
    findings.push({
      rule: "lockfile-changed",
      kind: "review",
      file,
      line: null,
      message: "Lockfile changed. Confirm a dependency change was required by the goal.",
    });
    continue;
  }
  const code = CODE.test(file) ? stripCode(lines.map((entry) => entry.text)) : null;
  for (const rule of RULES) {
    if (!rule.files.test(file)) continue;
    lines.forEach(({ line, text }, index) => {
      const subject = rule.code && code ? code[index] : text;
      if (rule.pattern.test(subject)) {
        findings.push({ rule: rule.id, kind: rule.kind, file, line, text: text.trim(), message: rule.message });
      }
    });
  }
}

const violations = findings.filter((finding) => finding.kind === "violation").length;
console.log(
  JSON.stringify(
    {
      root,
      base,
      changedFiles: [...changes.keys()],
      skipped,
      violations,
      reviews: findings.length - violations,
      findings,
    },
    null,
    2,
  ),
);
process.exit(violations > 0 ? 1 : 0);
