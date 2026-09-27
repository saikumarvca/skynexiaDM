# Tests

Two layers, both on Node's built-in `node:test` runner (no Jest/Vitest):

| Command                   | What it runs                                   | Needs                        |
| ------------------------- | ---------------------------------------------- | ---------------------------- |
| `pnpm test:unit`          | `tests/unit/**/*.test.ts` (pure modules)       | nothing                      |
| `pnpm test:client-portal` | `tests/client-portal/*.test.mjs` (HTTP + DB)   | MongoDB, `AUTH_SECRET`       |
| `pnpm test`               | both, in that order                            |                              |

CI runs both on every push that touches `frontend/` (`.github/workflows/frontend-ci.yml`),
with a throwaway MongoDB service for the integration job.

## Unit tests (`tests/unit`)

TypeScript files executed through `tsx`, so `@/` imports resolve. They cover
code that has no Next.js or database dependency:

- `session-token.test.ts` — HMAC session/preview tokens: tampering, expiry,
  wrong secret, issued-at + revocation (`isSessionRevoked`), and that the Node
  signer (`lib/session-token.ts`) and the edge verifier (`lib/session-edge.ts`)
  agree.
- `date-range.test.ts` — portal date presets, custom ranges, span cap,
  previous-period window.
- `dto.test.ts` — paging clamps.
- `update-schema.test.ts` — request bodies for staff-managed client updates.
- `login-schema.test.ts` — request bodies for staff-managed client logins and
  the temporary-password format.

Keep new unit tests free of model imports: `models/*.ts` use
`import * as mongoose`, which only works through the Next.js bundler.

## Client-portal integration tests (`tests/client-portal`)

`run.mjs` seeds a dedicated database, starts the app on port 3199 (using the
production build when `.next/BUILD_ID` exists, `next dev` otherwise), runs the
`*.test.mjs` files one at a time in alphabetical order, then stops the app.

```sh
# uses MONGODB_URI / AUTH_SECRET from .env.local; the database name gets a
# _client_portal_test suffix and is DROPPED on every run
pnpm test:client-portal

# faster and closer to production: build first
pnpm build && pnpm test:client-portal

# see the app's stdout too
TEST_VERBOSE=1 pnpm test:client-portal

# point at your own test database / already running app
TEST_MONGODB_URI=mongodb://localhost:27017/skynexia_test BASE_URL=http://localhost:3152 pnpm test:client-portal
```

The runner refuses to seed any database whose name does not end in `_test`.

### Fixtures (`seed.mjs`, `helpers.mjs`)

Session tokens carry an issued-at in whole seconds, so a test that revokes
sessions (password change, reset, deactivation, sign-out-everywhere) waits
past the next second boundary first (`nextSecond()`), otherwise the token
issued in the same second as the revocation legitimately survives.

Two clients, **Alpha Dental** (A) and **Beta Motors** (B), each with their own
reviews, events, updates and notifications, plus internal accounts:

| Login             | Role / purpose                                             |
| ----------------- | ---------------------------------------------------------- |
| `portal-admin`    | ADMIN                                                      |
| `portal-manager`  | MANAGER without `manage_clients` (must be refused)         |
| `portal-accounts` | MANAGER with `manage_clients`                              |
| `alpha`           | CLIENT login for A, used by read-only checks               |
| `alpha-owner`     | second CLIENT login for A, for tests that mutate the account |
| `beta`            | CLIENT login for B                                         |
| `inactive`        | deactivated CLIENT login                                   |

All passwords are `PASSWORD` in `helpers.mjs`. Ids are fixed (`FIXTURE_IDS`) so
tests can assert on exact records. Anything a test creates or changes should
be cleaned up or use data no other file asserts on, since files share one
seeded database.

### What each file covers

- `account` — notification read state, password change (revokes other
  sessions, re-issues the current cookie), "sign out other devices", logout,
  deactivation.
- `auth` — client sign-in paths, wrong portal, anonymous redirects.
- `hardening` — forged/expired cookies, paging clamps, filter junk, search
  limits, login rate limit, security headers, `/api/health`.
- `isolation` — every portal endpoint only returns the caller's client.
- `logins` — staff create a client login (temporary password, shown once),
  first sign-in is confined to the password page until a new password is
  set, staff password reset and deactivation revoke sessions immediately,
  logins are scoped to their client.
- `permissions` — client sessions are refused on internal APIs and pages;
  staff need `manage_clients`.
- `preview` — staff preview of a client portal is read-only, audited, and
  bound to the session that started it.
- `staff-portal` — staff management APIs: logins list, event feed, update
  create/edit/publish/remove.
- `visibility` — INTERNAL vs CLIENT_VISIBLE events, live activity mapping,
  published updates.
