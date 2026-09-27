# Deployment and Operations

## 1. Pre-deployment

From `frontend/`:

```bash
pnpm install
pnpm lint
pnpm check-types
pnpm build
pnpm test:client-portal
```

Record failures explicitly. Do not convert skipped checks into successful checks.

## 2. Environment validation

At minimum verify:

- MongoDB connection string
- session/auth secrets
- application/base URL settings used by the deployment
- email provider credentials if enabled
- cron secret
- integration/social credentials for enabled providers
- client-portal support configuration if used

Never expose server secrets using public/browser-prefixed environment names.

## 3. Database changes

Before running backfills or one-time scripts:

1. identify affected collections
2. verify backup/restore strategy
3. run dry mode if supported
4. run against the intended database only
5. capture changed/skipped/error counts
6. verify representative records afterward

## 4. Start

The application package provides:

```bash
pnpm start
```

Default production app port from the package script is `3152`.

Production process supervision/reverse proxy configuration is environment-specific and should keep the Node process private behind the configured web server/load balancer where applicable.

## 5. Post-deployment smoke tests

Verify:

- login page loads
- internal login works
- dashboard loads
- client list loads
- review draft/allocation pages load
- a safe read-only analytics request works
- CLIENT login works
- client dashboard loads
- CLIENT cannot open an internal route
- logs show no repeating runtime exception

## 6. Client portal checks

When client portal code changes:

- validate CLIENT session confinement
- test Client A vs Client B isolation
- test preview mode
- test notification/update read actions
- test change-log visibility
- verify browser bundle does not contain server-only DB code

## 7. Cron/integration checks

- cron routes require expected bearer secret
- integration/webhook routes validate source credentials
- repeated deliveries do not create uncontrolled duplicates
- failed external calls produce actionable logs

## 8. Rollback

Before each material production release, identify:

- previous known-good commit
- application rollback method
- whether a database migration is backward compatible
- whether a data backfill requires compensating action

Application rollback alone is not sufficient when a non-backward-compatible data transformation has been applied.
