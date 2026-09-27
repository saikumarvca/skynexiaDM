# 07 — Non-Functional Requirements and Production Readiness

## 1. Security

Required:

- production secrets only in server environment
- secure session cookies in production
- login rate limiting
- least-privilege API permissions
- client/partner scope enforcement at query boundaries
- validation on every external mutation boundary
- sanitized error responses
- no server-only packages in browser bundles
- dependencies reviewed for known critical vulnerabilities before release

## 2. Reliability

Required:

- predictable handling of database connection failures
- idempotent maintenance/backfill scripts where practical
- no partial workflow transition that silently loses state
- scheduled jobs safe to retry
- external integration failure must not corrupt core records

## 3. Performance

Recommended initial targets:

- common protected page server response p95 < 2s under normal expected load
- lightweight API reads p95 < 1s under normal expected load
- paginated list queries use indexes
- client bundles avoid importing Mongoose/server code
- no unbounded collection scans in high-traffic pages

Targets should be refined with production telemetry.

## 4. Capacity

List and analytics routes must define:

- pagination limits
- date-range limits where expensive
- export boundaries
- indexes supporting primary filters

## 5. Observability

Production should provide:

- structured server logs
- request/error correlation where possible
- authentication failure visibility without logging credentials
- cron/integration success/failure logs
- audit trail for privileged actions
- health/readiness signal for deployment checks

## 6. Accessibility

Required UI baseline:

- keyboard-reachable interactive controls
- visible focus
- form labels
- semantic buttons/links
- useful error text
- responsive layouts
- charts accompanied by readable values/legends where meaningful

## 7. Browser/runtime compatibility

Support current major evergreen browsers.

Mobile layouts must not require desktop-only viewport widths for critical workflows.

## 8. Build gates

Before production release:

```bash
cd frontend
pnpm lint
pnpm check-types
pnpm build
pnpm test:client-portal
```

If a command cannot run because infrastructure is unavailable, the release record must state that explicitly rather than treating it as passed.

## 9. Deployment safety

Recommended:

1. build from a clean checkout
2. validate required environment variables
3. run schema/backfill operations separately from app boot where practical
4. deploy
5. confirm health
6. run smoke tests
7. inspect error logs
8. retain rollback path

## 10. Data-change safety

For migrations/backfills:

- take or verify backup strategy
- make script resumable/idempotent
- support dry run when feasible
- report changed/skipped/error counts
- never invent missing business data silently

## 11. Production acceptance evidence

A release should retain:

- commit SHA
- build result
- typecheck/lint result
- test result
- migration/backfill result if applicable
- smoke-test checklist
- known warnings
- rollback reference
