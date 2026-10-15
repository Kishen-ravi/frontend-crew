# Zod guidelines

Load when the change touches untrusted input or a Zod schema: forms, Server Actions, Route Handlers, `params` / `searchParams`, env, external JSON.

**MUST** ids go into the checklist ([standards-checklist.md](standards-checklist.md)). A confirmed violation is **FAIL**. **SHOULD** items are advisories.

## Sources

- Zod 4 docs: https://zod.dev — API https://zod.dev/api, errors https://zod.dev/error-customization and https://zod.dev/error-formatting, codecs https://zod.dev/codecs
- Migration guide (v3 → v4): https://zod.dev/v4/changelog
- Versioning and import paths: https://zod.dev/v4/versioning
- Zod 3 docs: https://v3.zod.dev

## Version notes

Use the API of the installed major (`versions.zod`). Match the repo's import path (`"zod"`, `"zod/v4"`, `"zod/mini"`, `"zod/v3"`). Do not mix v3 and v4 schemas in one shape.

| Installed | What changes for review |
|---|---|
| 3.x | `message` / `errorMap` / `invalid_type_error` options. `error.flatten()` / `.format()`. `.strict()` / `.passthrough()`. `z.string().email()`. |
| 4.x | A single `error` option replaces `message` (deprecated) and `errorMap` / `invalid_type_error` / `required_error` (removed). Top-level formats: `z.email()`, `z.url()`, `z.uuid()`; method forms are deprecated. `z.strictObject` / `z.looseObject` replace `.strict()` / `.passthrough()`. `.default()` short-circuits on `undefined` and must match the **output** type; `.prefault()` keeps the old input-side behaviour. `z.coerce.*` input type is `unknown`. `z.record` needs a key and a value schema. `z.enum` takes TS enums (`nativeEnum` deprecated). `z.flattenError` / `z.treeifyError` / `z.prettifyError` replace `error.flatten()` / `.format()`. `z.stringbool()` parses `"true"` / `"false"` / `"on"` / `"off"` / … into booleans. |

## MUST

| Id | Rule |
|---|---|
| `zod-boundary` | Parse untrusted input at the trust boundary, before use: `FormData`, `searchParams`, route `params`, request bodies, headers and cookies read as data, env, webhook payloads, external API responses, `localStorage`. The server re-parses even when the client already validated. |
| `zod-safe-parse` | User-facing paths use `safeParse` (or `safeParseAsync`) and turn issues into a typed error result. `parse` only where a throw is the intended, handled control flow. Async refinements or transforms require the `*Async` variant. |
| `zod-inferred-types` | Types for parsed data come from the schema (`z.infer` / `z.output`; `z.input` for pre-parse values such as form defaults). No handwritten parallel type for the same shape. |
| `zod-form-coercion` | `FormData` values are strings, `File`s, or absent. Coercion must map every value the form can send to the intended result. `z.coerce.boolean()` turns `"false"` into `true`; use `z.stringbool()` (v4) or an explicit enum/transform. `z.coerce.number()` turns `""` into `0`; treat `""` as "not provided" before coercing when a field is optional. An unchecked checkbox is absent, not `"false"`. |
| `zod-allowed-fields` | The unknown-key policy matches intent. Never spread parsed input with extra keys (`.passthrough()` / `z.looseObject`) into a write. Writes take an explicit allowlist of fields. Identity and privilege fields (`userId`, `role`, `orgId`, prices) never come from client input. |
| `zod-error-mapping` | Show field errors next to their fields, in user language (`z.flattenError` / `z.treeifyError` in v4). Do not render raw issue arrays. |
| `zod-env` | Env vars this change adds or reads are covered by the repo's env schema, which is parsed once at startup and fails loud. |

## SHOULD

- No deprecated API for the installed major in new code (for example v4: `z.email()` over `z.string().email()`, `error` over `message`, `z.flattenError(err)` over `err.flatten()`, `z.looseObject` over `.passthrough()`).
- One schema per shape, shared by client and server. Derive variants with `.pick` / `.omit` / `.extend` / `.partial` rather than copying.
- Coerce and transform at the edge; core logic takes parsed types.
- Prefer `z.strictObject` when unexpected keys indicate a client bug worth surfacing.

## Automated checks

| Check | Proves |
|---|---|
| Typecheck | Removed APIs, `z.infer` mismatches, wrong `.default()` types (v4) |
| Tests | Each applicable corner case (`zod-invalid`, `zod-coerce`, `zod-empty-string`, `zod-extra`) has a test that feeds the real string the form would send |
| `scan-diff.mjs` `unchecked-json` | Added-line lead for unparsed `request.json()` |
