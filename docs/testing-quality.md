# Testing and Quality

## 1. Required static/build checks

Run from `frontend/`:

```bash
pnpm lint
pnpm check-types
pnpm build
```

## 2. Client portal regression suite

```bash
pnpm test:client-portal
```

The suite is expected to exercise isolated test data and cover core portal boundaries including authentication and cross-client isolation.

## 3. Test priorities

Highest priority:

1. authorization boundaries
2. client/partner scope isolation
3. review-state transitions
4. mutation idempotency
5. client-visible event sanitization
6. critical analytics consistency
7. server/client import boundaries

## 4. Manual smoke matrix

### Internal

- login/logout
- dashboard
- client CRUD/read
- review draft list
- review allocation list
- mark shared/post flow on safe test data
- team/permission-sensitive navigation

### Client

- login
- dashboard
- reviews
- analytics
- change log
- updates
- notifications
- profile/password

### Admin preview

- start preview
- view correct client
- verify banner
- confirm write attempts fail
- end/expire preview

## 5. Regression rule

Any bug caused by an authorization leak, invalid state transition, server/client bundle boundary, or client isolation defect should receive a regression test when practical.

## 6. Test data

Automated tests should not depend on production records.

Use isolated database names/fixtures and clean them up safely.

## 7. Release evidence

For production changes, retain:

- commit
- command/check results
- test result
- known warnings
- manual smoke status
- migration/backfill evidence where applicable
