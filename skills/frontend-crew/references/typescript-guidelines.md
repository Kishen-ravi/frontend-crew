# TypeScript guidelines

Load when the change touches `.ts` / `.tsx` files or `tsconfig*.json`.

**MUST** ids go into the checklist ([standards-checklist.md](standards-checklist.md)). A confirmed violation is **FAIL**. **SHOULD** items are advisories: report them, never fail on them alone.

## Sources

Read the docs for the installed major (`versions.typescript` from `detect-verify.mjs`).

- Handbook — narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Everyday types (`any`, assertions, `!`): https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- TSConfig reference: https://www.typescriptlang.org/tsconfig/ (per flag: `#<flag>`)
- Release notes: https://www.typescriptlang.org/docs/handbook/release-notes/overview.html

## Version notes

| Installed | What changes for review |
|---|---|
| 5.x | `strict` is opt-in. Read the effective config with `tsc --showConfig`. Do not assume flags. |
| 6.0 | `strict` defaults to `true`. Deprecated: `baseUrl`, `moduleResolution: node`/`node10`, `target: es5`, `downlevelIteration`. Do not add deprecated options or `ignoreDeprecations` to dodge them. |
| 7.x | Native (Go) compiler, still the `typescript` package / `tsc` binary. 6.0 deprecations are hard errors. No programmatic API until 7.1, so tools that embed TypeScript (type-aware `typescript-eslint`, some editor plugins) may not run. If a tool cannot run, the item it proves is **UNVERIFIED**. Do not downgrade TypeScript to get it working. |

## MUST

| Id | Rule |
|---|---|
| `ts-strict-intact` | Do not weaken compiler safety. Do not turn off `strict` or any flag in its family. Do not turn off `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` when the repo has them on. Do not add `ignoreBuildErrors`, and do not add excludes that hide changed files. |
| `ts-no-any` | No new `any`: annotations, `as any`, `any[]`, `Record<string, any>`, generic defaults, or `catch (e: any)`. Use `unknown` and narrow, or parse with a schema. |
| `ts-no-unsafe-assertion` | No `as unknown as`. No `as T` on data the program did not produce (request bodies, JSON, storage, DOM values, third-party responses); parse it instead. `as const` and `satisfies` are fine. A narrowing `as` is allowed only when an invariant that proves it sits next to it. |
| `ts-non-null-proven` | A non-null `!` needs a proof in view: a preceding check, an invariant comment backed by code, or a test. Otherwise narrow and handle the missing case (for example `notFound()` or an empty state). |
| `ts-no-suppress` | No `@ts-ignore` / `@ts-nocheck`. `@ts-expect-error` only in tests that assert a type error, and only with a reason. |
| `ts-null-safety` | Nullable and optional values are narrowed before use. `?.` / `??` must not turn an error, not-found, or empty state into a silently wrong render or a wrong default write. |
| `ts-contracts` | Exported functions, Server Actions, Route Handlers, and component props have types that say what they accept and return. Expected failures are part of the return type (a discriminated union), not thrown strings. Do not let ORM/DB row types or internal fields leak through a public contract by inference. |
| `ts-exhaustive` | A `switch` or `if` chain over a union handles every member, and the default branch assigns to `never` where a new member should break the build. |

## SHOULD

- Discriminated unions over bags of optional fields.
- `satisfies` to check object literals without widening them.
- Type predicates (`x is T`) or assertion functions over repeated inline narrowing.
- Let inference type locals; annotate at module boundaries.
- `readonly` / `ReadonlyArray` for inputs a function must not mutate.

## Automated checks

| Check | Proves |
|---|---|
| Project typecheck (`detect-verify` → `typecheck`) | Compiler errors under the repo's real config |
| `tsc --showConfig` | Effective flags for `ts-strict-intact` |
| `scan-diff.mjs` (`ts-any`, `ts-double-assertion`, `ts-suppress`, `ts-non-null`, `tsconfig-weakened`) | Added-line leads; a reviewer confirms `ts-non-null` and `ts-expect-error` hits |
| `typescript-eslint` rules the repo already enables (`no-explicit-any`, `no-unsafe-*`, `switch-exhaustiveness-check`) | Use them when present. Do not add the plugin as part of an unrelated task. |
