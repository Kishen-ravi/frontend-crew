# Next.js guidelines

Load when the change touches the App Router (`app/`), Server Actions, Route Handlers, `proxy.ts` / `middleware.ts`, caching, or `next.config.*`.

**MUST** ids go into the checklist ([standards-checklist.md](standards-checklist.md)). A confirmed violation is **FAIL**. **SHOULD** items are advisories.

## Sources: version-matched first

1. **Bundled docs.** Next.js 16.2+ ships docs for the installed version at `node_modules/next/dist/docs/` (`detect-verify` → `nextBundledDocs`). Read the relevant guide there before writing or reviewing Next.js code. An `AGENTS.md` block written by `next dev` may say the same.
2. On older versions, use https://nextjs.org/docs with the version selector. Appending `.md` to a docs URL returns Markdown.
3. Key guides:
   - Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
   - Data security: https://nextjs.org/docs/app/guides/data-security
   - Error handling: https://nextjs.org/docs/app/getting-started/error-handling
   - `use cache`: https://nextjs.org/docs/app/api-reference/directives/use-cache
   - Production checklist: https://nextjs.org/docs/app/guides/production-checklist
   - CSP: https://nextjs.org/docs/app/guides/content-security-policy

## Version notes

Use only APIs the installed `next` has. `unstable_*` and `experimental.*` APIs are allowed only when the repo already enables or uses them: `forbidden()` / `unauthorized()` need `experimental.authInterrupts`, and taint needs `experimental.taint`.

| Installed | What changes for review |
|---|---|
| 15.x | `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are async. `fetch` and GET Route Handlers are not cached by default. |
| 16.x | Synchronous access to request APIs is **removed**: await them and type `params` / `searchParams` as Promises (or use the generated `PageProps<'/route'>` / `LayoutProps` / `RouteContext` from `next typegen`). Turbopack is the default. `middleware.ts` is deprecated in favour of `proxy.ts`. `next lint` and the `eslint` config key are removed; lint runs through the ESLint CLI with `eslint-config-next`. `revalidateTag(tag)` with one argument is deprecated; pass a cache-life profile (`'max'`), or use `updateTag(tag)` for read-your-writes. `updateTag` and `refresh()` work in Server Actions only. Parallel-route slots need `default.js`. |
| 16.x with `cacheComponents: true` | `'use cache'` / `cacheLife` / `cacheTag` are the caching model. Cached functions take and return serializable values and cannot read `cookies()`, `headers()`, or `searchParams`, even indirectly. |
| 16.3+ | `error.tsx` receives `retry` (preferred over `reset`). `next dev` may manage an agent-rules block in `AGENTS.md`. |

## MUST

| Id | Rule |
|---|---|
| `next-server-default` | Components are Server Components by default. Put `"use client"` on the smallest leaf that needs state, effects, browser APIs, or handlers. Do not mark a page or layout client-side to host one widget. |
| `next-server-only-code` | A `"use client"` module never imports DB clients, secrets, or server-only modules. New server-only modules follow the repo's pattern (`import "server-only"`, a Data Access Layer). |
| `next-async-request-apis` | On 15+, `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are awaited and typed as async. |
| `next-action-results` | Server Actions return typed results. Expected failures (validation, auth, conflict) are returned values, used with `useActionState`, not thrown. |
| `next-control-flow-throws` | `redirect()`, `notFound()`, `forbidden()`, and `unauthorized()` are not swallowed. Call them outside `try`, or call `unstable_rethrow(err)` first in the `catch`. |
| `next-invalidate-after-mutation` | After a mutation, invalidate what shows the data, using the API for the installed version: `revalidatePath`, `revalidateTag(tag, profile)` (16), `updateTag` for read-your-writes, or the repo's helper. The next read must show the write. |
| `next-cache-scope` | Cached work (`'use cache'`, cached `fetch`, `unstable_cache`) never reads request-specific APIs inside the cached scope, and never stores per-user data under a key shared across users. Read the user outside and pass it in as an argument, or use `'use cache: private'` where the installed version supports it. |
| `next-error-files` | Routes that can fail or miss have the right boundary: `error.tsx` is a Client Component, missing resources call `notFound()`, and `global-error` renders its own `<html>` and `<body>`. |

### Security ids in Next.js code

The `sec-*` ids are defined in [house-rules.md](house-rules.md). In Next.js they mean:

| Id | In Next.js |
|---|---|
| `sec-authz` | Every Server Action and Route Handler authenticates **and** authorizes inside itself. Actions are public POST endpoints, so a check on the page that renders the form does not protect the action. Prefer the repo's Data Access Layer. |
| `sec-minimal-data` | Props passed to Client Components and Server Action return values are DTOs with only the fields the UI uses, never ORM rows. |
| `sec-secrets` | `NEXT_PUBLIC_*` values are inlined into the client bundle, so only publishable values use the prefix. Secrets are read only in server modules. |
| `sec-error-exposure` | Action results and Route Handler responses carry safe messages. In production `error.tsx` receives a generic message for server errors; do not render `error.message` from client-side failures. |

## SHOULD

- Fetch on the server and in parallel (`Promise.all`) when requests are independent. Server Components do not call their own Route Handlers.
- Stream with `loading.tsx` / `<Suspense>` around slow, request-time data.
- Use `next/link`, `next/image`, `next/font`, and `next/script` as the repo already does.
- Use metadata APIs for titles and OG data.
- Keep heavy, interaction-only libraries out of the initial client bundle (dynamic import).
- Add a CSP and rate limits for expensive actions when the task touches them.

## Optional Next.js skills

Load one only when the task matches and its prerequisites are met. Inspect its installed copy first. The Next.js docs say framework knowledge should come from the bundled docs, and skills from workflows.

| Skill | Install | Use when | Prerequisites |
|---|---|---|---|
| `next-dev-loop` | `npx skills add vercel/next.js --skill next-dev-loop` | Runtime proof that a change works in a running app (compile issues, runtime errors, routes, behaviour) | Next.js 16.3+ on Turbopack, a running `next dev`, `agent-browser` ≥ 0.31.1. If any are missing, record runtime behaviour as **UNVERIFIED**. Do not substitute grep. |
| `next-bundle-optimizer` | `npx skills add vercel/next.js --skill next-bundle-optimizer` | The task is about client bundle size or route startup | `next analyze` available, and a sandbox that allows binding ports. Audit mode by default; fix mode only when asked. |

## Automated checks

| Check | Proves |
|---|---|
| `next typegen` then typecheck | Route types, async `params` / `searchParams` typing (`PageProps`) |
| `next build` | Server/client boundary and serialization errors, `'use cache'` violations under `cacheComponents`, missing `default.js` |
| ESLint with `eslint-config-next` | Next lint rules (for example `no-async-client-component`) |
| `scan-diff.mjs` (`public-secret`, `build-errors-ignored`, `unchecked-json`) | Added-line leads |
