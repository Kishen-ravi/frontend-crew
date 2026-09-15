# Corner cases

The orchestrator picks ids that apply. The implementer handles them. The tests specialist covers them. The grader tries to find an applicable id that was skipped.

Mark an id **N/A** with one line when it cannot happen for this change.

## UI states

| Id | Must handle |
|---|---|
| `empty` | Zero items, blank field, missing optional data. |
| `loading` | First load and slower-than-cached load. No flash of the wrong body. |
| `error` | Request / action / render failure with a recoverable UI. |
| `not-found` | Unknown id or slug. The right 404, not a crash. |
| `unauthorized` | Signed-out or forbidden user. No leaked data. |
| `stale` | Data changed after paint (revalidate, refetch, or explicit stale UI). |

## Input and Zod

| Id | Must handle |
|---|---|
| `zod-invalid` | Invalid body, form, or query. Field-level errors, no crash. |
| `zod-extra` | Extra keys stripped or rejected per the schema. |
| `zod-coerce` | Strings that should be numbers/booleans/dates at the boundary. |
| `zod-empty-string` | `""` vs omitted vs `null` for optional fields. |
| `double-submit` | Second click / enter while the first request is in flight. |
| `partial-form` | Submit with only some fields filled, including defaults. |

## Routing and Next.js

| Id | Must handle |
|---|---|
| `search-params` | Missing, malformed, unknown, and duplicated query keys. |
| `route-params` | Wrong type, encoded characters, extra segments. |
| `back-forward` | Browser history after a mutation; UI matches the URL. |
| `parallel-nav` | Click another link before the first navigation settles. |
| `cache-after-mutation` | List/detail shows the new value after create/update/delete. |

## React runtime

| Id | Must handle |
|---|---|
| `hydration` | Server HTML matches the first client render. No date/random/locale drift. |
| `rsc-boundary` | No non-serializable props into a client child. |
| `suspense` | Fallback is meaningful; streamed content does not replace the wrong slot. |
| `race` | Out-of-order responses; the latest intent wins. |

## Browser

| Id | Must handle |
|---|---|
| `keyboard` | Tab order, Enter/Space on controls, Escape on overlays. |
| `focus` | Focus moves into a dialog and returns on close. |
| `reduced-motion` | Motion is optional or respected when the repo already handles it. |
| `narrow` | Layout and actions work at a mobile width if the change is visual. |

## Data

| Id | Must handle |
|---|---|
| `pagination-end` | Last page, empty next page, out-of-range page number. |
| `concurrency` | Two tabs or two users mutating the same record. |
| `env-missing` | Required env absent — fail loud at boot, not mid-request. |
| `flag-off` | Feature flag or entitlement disabled. |
