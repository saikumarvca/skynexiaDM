# 10 — Events, Audit and Observability

## 1. Purpose

SkyNexiaDM uses activity logs, client events, notifications and operational logs for different purposes. They must remain distinct.

## 2. Event categories

### Domain activity

Records a meaningful business action such as:
- review allocated
- review shared
- review posted
- task reassigned
- campaign status changed

Domain activity is part of business history.

### Audit activity

Records privileged/security-sensitive operations such as:
- login/logout
- role/permission change
- client preview start/end
- user activation/deactivation
- administrative visibility changes

Audit records should identify actor, action, target, time and outcome.

### Client-visible event

A sanitized projection intended for external client users.

It is never the raw internal audit record.

### Notification

A user-facing delivery artifact derived from another event/state.

### Operational log

Runtime diagnostic information used by operators/developers.

Operational logs are not business history.

## 3. Required audit fields

Where applicable:

- timestamp
- actor user id
- actor display name
- actor role/account type
- action code
- target entity type
- target entity id
- client id when relevant
- result: success/failure
- request/correlation id where available
- safe metadata

Never log passwords, session tokens, API secrets, full authorization headers or other credentials.

## 4. Event immutability

Business/audit history should be append-oriented.

Corrections should generally produce a compensating/new entry instead of silently rewriting historical meaning.

## 5. Client-event sanitization

A client-visible projection must omit:

- internal notes
- private staff comments
- secrets
- unrelated client identifiers
- infrastructure/debug errors
- staff identity where product policy does not permit disclosure

## 6. Duplicate protection

Event creation associated with idempotent actions/backfills should use a stable source id, unique key or equivalent duplicate guard.

## 7. Correlation

Recommended: assign/propagate a request id through:

```text
HTTP request
 -> domain mutation
 -> database write
 -> external integration call
 -> audit/event log
 -> error log
```

This enables operators to trace one failed workflow without exposing sensitive payloads.

## 8. Logging levels

Recommended:

- DEBUG — local diagnostic detail
- INFO — normal operational milestones
- WARN — recoverable abnormal condition
- ERROR — failed operation requiring investigation

Production logging should be structured rather than relying only on free-form console messages.

## 9. Health signals

Production should expose or otherwise provide verifiable signals for:

- process running
- application ready
- database connectivity
- critical configuration presence

Readiness should fail when the application cannot safely serve normal requests.

## 10. Metrics

Recommended baseline metrics:

- request count
- request latency
- error rate
- login failure rate
- database operation failures
- cron run success/failure
- integration delivery failures
- review transition counts
- client portal API errors

Do not use high-cardinality secrets/personal data as metric labels.

## 11. Alert conditions

Recommended alerts:

- repeated 5xx errors
- repeated authentication subsystem failures
- MongoDB connectivity loss
- cron failure over expected schedule
- integration failure spike
- unexpected client-isolation/security test regression during release validation

## 12. Retention

Audit/business history retention must be deliberate. If pruning is later introduced, retention windows must be documented by record type and must not remove evidence required for unresolved business/audit needs.
