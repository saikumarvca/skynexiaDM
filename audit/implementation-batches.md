# SkyNexiaDM Audit Remediation Batches

These batches convert the 2026-09-27 audit into an implementation sequence.

## SKY-AUDIT-001 — Review Mutation Authorization & Scope

**Priority:** P0  
**Requirements:** SKY-SCOPE-002, SKY-SCOPE-003, SKY-REV-001

Update all review-allocation mutation endpoints so they:

- require the correct review permission
- resolve hierarchy context
- apply `buildReviewScopeFilter()`
- load/update the target through a scoped query
- return scoped 404/403 consistently
- distinguish manager vs worker-only behavior

Cover mark-shared, mark-posted, reassignment, cancel/recycle/archive and customer-correction mutations if present.

**Tests:** no-permission user, Partner A vs B, partner employee vs foreign assignment, allowed manager, admin.

**Exit gate:** every review mutation passes the shared authorization/scope matrix.

---

## SKY-AUDIT-002 — Review State Machine & Posted Idempotency

**Priority:** P0  
**Requirements:** SKY-REV-001, SKY-REV-003

Create one domain transition helper with explicit allowed transitions.

Confirm product policy, then encode a table such as:

```text
Unassigned -> Assigned
Assigned -> Shared with Customer | Cancelled
Shared with Customer -> Posted | Cancelled
Posted -> Used
Cancelled -> explicit recycle only
```

Required:
- reject invalid transitions with stable 409/422 code
- make repeated mark-posted safe
- enforce one canonical PostedReview per allocation
- add a unique allocation invariant if that matches product intent
- prevent draft status from moving backward accidentally

**Tests:** posted->posted retry, posted->shared rejection, cancelled->posted rejection, concurrent/repeated post.

---

## SKY-AUDIT-003 — Atomic Review Completion

**Priority:** P0/P1  
**Requirements:** SKY-REV-003, SKY-EVT-003

Define primary completion writes as:

- create/upsert PostedReview
- update ReviewAllocation
- update ReviewDraft

Use a MongoDB transaction where deployment supports it. Keep legacy Review bridging, notifications and event projections recoverable/idempotent secondary side effects.

If transactions are intentionally unavailable, implement a documented retry/reconciliation strategy.

**Test:** inject failure between writes and verify retry converges to one consistent final state.

---

## SKY-AUDIT-004 — Partner Scope Regression Suite

**Priority:** P1  
**Requirements:** SKY-SCOPE-002, SKY-SCOPE-003, SKY-PROD-002

Add executable tests proving:

- Partner Agency A cannot see B clients
- A cannot list B employees
- A cannot mutate B reviews/tasks
- Partner Employee sees only allowed/direct assignments
- partner user cannot escalate assignment to another agency
- main admin retains full permitted visibility
- partner assignment does not alter client ownership

---

## SKY-AUDIT-005 — Pagination & Query Hardening

**Priority:** P1  
**Requirement:** SKY-API-003

Start with `GET /api/review-allocations`.

Standard:
- page >= 1
- default page size 20/25
- max 100
- DB-side filters/sort
- total and totalPages
- index review for common filters

Then audit all list endpoints for unbounded `.find()`, large in-memory filtering and unbounded aggregations.

---

## SKY-AUDIT-006 — Health, Readiness & Observability

**Priority:** P1 — PARTIALLY IMPLEMENTED  
**Requirements:** SKY-OBS-001, SKY-OBS-002, SKY-OPS-001

Already implemented on the newer branch:
- `GET /api/health`
- MongoDB readiness ping with timeout
- safe 200/503 response with no configuration leakage

Remaining:
- request/correlation ID helper
- structured critical-route error logging
- cron run outcome logging/metrics
- deployment monitoring wired to health/readiness

---

## SKY-AUDIT-007 — CI Release Gates

**Priority:** P1 — IMPLEMENTATION PRESENT / VERIFY RUN  
**Requirements:** SKY-NFR-001 through SKY-NFR-004

`.github/workflows/frontend-ci.yml` now provides:
- frozen-lockfile install
- lint
- typecheck
- unit tests
- production build
- client-portal integration tests
- MongoDB service for integration testing

Remaining:
- verify a successful run on the integrated PR
- configure required branch checks if desired
- retain run evidence for release acceptance

**Exit gate:** all required jobs pass on the integration PR/main.

---

## SKY-AUDIT-008 — Client/Main Ownership Invariants

**Priority:** P2  
**Requirements:** SKY-PROD-001, SKY-PROD-002, SKY-AUTH-002

Required:
- define canonical main-agency identifier
- backfill appropriate null `ownerAgencyId`
- set owner on every client creation path
- prevent partner assignment endpoints from editing ownership
- reject CLIENT creation/update without clientId
- explicitly define whether non-CLIENT users may retain clientId

**Tests:** partner assignment preserves owner; CLIENT without clientId fails.

---

## SKY-AUDIT-009 — Migration, Backfill & Recovery Safety

**Priority:** P2  
**Requirements:** SKY-DATA-001, SKY-DATA-002

Standardize data-change scripts:
- dry-run
- batch size
- resume cursor
- deterministic selection
- changed/skipped/error counters

Add dry-run first to client-event backfill.

Document:
- MongoDB backup method
- frequency/retention
- restore procedure
- RPO/RTO
- a non-production restore drill

---

## SKY-AUDIT-010 — API Error Contract Normalization

**Priority:** P2  
**Requirements:** SKY-API-001, SKY-API-002

Converge high-risk APIs on:

```json
{
  "error": "Safe human-readable message",
  "code": "STABLE_MACHINE_CODE",
  "details": {}
}
```

Reconcile `lib/api/validation.ts` and `lib/api-errors.ts`, normalize authorization/not-found/conflict behavior, and never expose raw production exception text.

---

## Execution order

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008 -> 009 -> 010
```

Treat SKY-AUDIT-001 through SKY-AUDIT-003 as one review security/reliability hardening phase before adding more review feature breadth.
