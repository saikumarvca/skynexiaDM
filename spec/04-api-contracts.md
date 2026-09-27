# 04 — API Contracts

## 1. API style

SkyNexiaDM uses Next.js App Router route handlers under `frontend/app/api/`.

APIs are JSON-first except where explicitly returning files such as CSV exports.

## 2. Route families

Major families include:

- `/api/auth/*`
- `/api/clients/*`
- `/api/review-drafts/*`
- `/api/review-allocations/*`
- `/api/review-analytics/*`
- `/api/tasks/*`
- `/api/campaigns/*`
- `/api/leads/*`
- `/api/content-bank/*`
- `/api/seo/*`
- `/api/team/*`
- `/api/partner-agencies/*`
- `/api/client/*`
- `/api/integrations/*`
- `/api/cron/*`

## 3. Validation

Required:

- validate request body/query/path inputs
- use shared Zod schemas where practical
- reject malformed MongoDB identifiers before database operations when possible
- normalize enum values at a single boundary
- reject unsupported fields rather than silently trusting them for security-sensitive mutations

## 4. Status codes

Recommended baseline:

| Code | Meaning |
|---|---|
| 200 | successful read/update |
| 201 | successful creation |
| 204 | successful no-content operation |
| 400 | invalid input/business request |
| 401 | no valid authentication |
| 403 | authenticated but not authorized |
| 404 | resource absent or intentionally hidden by scope |
| 409 | state/version/uniqueness conflict |
| 422 | semantically invalid input when distinguished from 400 |
| 429 | rate limited |
| 500 | unexpected server failure |

For cross-client resource probing, returning 404 is preferred where it avoids leaking existence.

## 5. Error shape

New APIs should converge on a stable shape:

```json
{
  "error": "Human-readable message",
  "code": "STABLE_MACHINE_CODE",
  "details": {}
}
```

`details` is optional and must not include secrets or stack traces.

## 6. Pagination

List endpoints should use server-side pagination.

Recommended response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "total": 0,
  "totalPages": 0
}
```

Client portal list endpoints must cap page size; the existing portal convention uses a maximum of 100.

## 7. Filtering/sorting

- filters must be explicitly supported
- arbitrary query-to-Mongo passthrough is prohibited
- sort fields should be allow-listed
- date ranges must have deterministic timezone semantics

## 8. DTOs

Required for client-facing and sensitive endpoints.

DTOs must not expose:

- password hashes
- secret/API credentials
- internal notes unless explicitly intended
- raw audit metadata
- unrelated team identities
- Mongoose internals

## 9. Mutation safety

State-changing endpoints should:

- authenticate and authorize first
- validate current state
- update atomically where practical
- make duplicate/retry behaviour explicit
- append activity/audit evidence
- return the resulting canonical state

## 10. Machine endpoints

Cron, webhook and integration endpoints must have distinct authentication from human browser sessions and must document retry/idempotency behaviour.
