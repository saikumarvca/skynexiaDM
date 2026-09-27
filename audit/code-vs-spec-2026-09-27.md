# SkyNexiaDM Code-vs-Spec Audit — 2026-09-27

Re-audited implementation baseline: `claude/specs-review-improvise-rkte3a`, integrated with the specification/docs on `integration/specs-audit-hardening`. The Claude branch is four commits ahead of `main@d549a25fd5c27779c0be55196ad2697a53a1a902`.

## Executive summary

The client portal is the strongest audited area: CLIENT route confinement, authenticated client scoping, cross-client 404 behavior, preview read-only behavior and preview auditing all have direct implementation and regression-test evidence.

The highest-risk gaps are in internal review mutations:

- review mutation routes now enforce granular review permissions and hierarchy scope at the database query/write boundary.
- explicit review allocation transition decisions now gate Shared and Posted lifecycle changes.
- repeated mark-posted requests are idempotent and converge on one deterministic canonical PostedReview.
- posted completion uses a recoverable guarded-write sequence compatible with standalone MongoDB CI, so retries repair draft state instead of duplicating the completed record.
- `GET /api/review-allocations` is unpaginated.
- health/readiness is now implemented with a MongoDB ping, timeout, no-store response and 200/503 readiness semantics.
- GitHub Actions now defines lint, typecheck, unit-test, production-build and client-portal integration jobs; successful execution still needs to be verified from an actual workflow run.

## Requirement matrix

| Requirement | Status | Evidence / finding |
|---|---|---|
| SKY-PROD-001 | PARTIAL | `Client.ownerAgencyId` exists but is nullable; main-agency ownership is not enforced by the model. |
| SKY-PROD-002 | PARTIAL | Ownership and partner assignment are separate fields, but no dedicated integration test proves assignment never changes ownership. |
| SKY-AUTH-001 | PASS | Login rejects inactive users; `auth.test.mjs` verifies it. |
| SKY-AUTH-002 | PARTIAL | CLIENT access requires `clientId` at runtime, but schema permits a CLIENT record with null clientId. |
| SKY-AUTH-003 | PASS | `proxy.ts` blocks CLIENT from internal APIs; `permissions.test.mjs` verifies it. |
| SKY-AUTH-004 | PASS | Internal sessions are blocked from client APIs except bound preview context; tests verify this. |
| SKY-SCOPE-001 | PASS | Client scope comes from authenticated User.clientId; isolation tests prove caller clientId cannot widen scope. |
| SKY-SCOPE-002 | PASS | Partner A/B regression tests verify client, team, review and task isolation plus foreign review mutation denial. |
| SKY-SCOPE-003 | PASS | Partner employee regression tests verify review/task visibility is constrained to directly assigned work. |
| SKY-ARCH-001 | PARTIAL | Client-safe DTO split and the Mongoose bundle fix exist; CI now performs a production build, but a successful workflow run still needs verification. |
| SKY-API-001 | PARTIAL | Shared Zod validation is used by sampled mutations; universal mutation coverage was not established. |
| SKY-API-002 | PASS | Client portal uses explicit DTOs that exclude internal notes, permissions, secrets and raw documents. |
| SKY-API-003 | PASS | Review-allocation GET now uses server-side page/pageSize bounds (max 100), DB-side filters, total and totalPages; integration tests pass. |
| SKY-API-004 | PASS | Cross-client review IDs return 404; isolation test covers both directions. |
| SKY-REV-001 | PASS | Explicit state-machine helpers gate mark-shared/mark-posted, generic PATCH cannot bypass lifecycle transitions, and unit/integration tests were added. |
| SKY-REV-002 | PASS | mark-shared is permission/scoped, state-guarded, idempotent when already shared, and appends activity only on the actual transition. |
| SKY-REV-003 | PASS | mark-posted claims Shared→Posted conditionally, uses a deterministic canonical PostedReview id/upsert, makes retries idempotent, and repairs draft state on retry. |
| SKY-REV-004 | NOT TESTED | Reassignment history was not directly verified in this baseline. |
| SKY-EVT-001 | PASS | ClientEvent visibility model plus client change-log isolation is implemented/tested. |
| SKY-EVT-002 | PARTIAL | Sanitized DTO/projection architecture exists; dedicated sanitization-content test was not found. |
| SKY-EVT-003 | PASS | Backfill skips mapped logs and unique `sourceLogId + clientId` index guards duplicate mapping. |
| SKY-DATA-001 | PARTIAL | Backfill is batched/idempotent with counters; no dry-run mode was found. |
| SKY-DATA-002 | NOT TESTED | No tested backup/restore evidence was found in the inspected repository. |
| SKY-NFR-001 | NOT TESTED | CI now includes `pnpm lint`; execution result has not yet been verified. |
| SKY-NFR-002 | NOT TESTED | CI now includes `pnpm check-types`; execution result has not yet been verified. |
| SKY-NFR-003 | NOT TESTED | CI now performs `pnpm build` before portal integration tests; execution result has not yet been verified. |
| SKY-NFR-004 | NOT TESTED | CI now runs unit and client-portal integration suites against MongoDB; execution result has not yet been verified. |
| SKY-OBS-001 | PARTIAL | Client login/preview/update actions use TeamActivityLog; universal privileged-action coverage is not established. |
| SKY-OBS-002 | PARTIAL | Inspected logs avoid credentials, but no automated secret-log check was found. |
| SKY-OPS-001 | PARTIAL | Health/readiness and CI definitions now exist; deployment rollback evidence and a verified successful pipeline remain outstanding. |

## High-priority findings

### F-001 — Review mutation authorization/scope gap — Resolved in integration branch

Affected:
- `frontend/app/api/review-allocations/[id]/mark-shared/route.ts`
- `frontend/app/api/review-allocations/[id]/mark-posted/route.ts`

Review mutation routes now use centralized permission/hierarchy scope resolution and carry the same scope filter into the guarded write itself. The generic allocation detail/PATCH route was also scoped so the workflow cannot be bypassed through a different endpoint.

### F-002 — Review state machine not enforced — Resolved in integration branch

A central state-machine helper now defines Shared/Posted transition decisions. Invalid backward/out-of-order changes return `409 CONFLICT`; repeated identical transitions are handled idempotently. Generic PATCH status changes are blocked from bypassing explicit workflow endpoints.

### F-003 — Duplicate PostedReview risk — Resolved in integration branch

`mark-posted` now conditionally claims the Shared→Posted transition and creates/reconciles the canonical PostedReview with a deterministic `_id` derived from the allocation id. Retries return the existing completed state instead of creating another canonical record.

### F-004 — Multi-collection posted transition can become inconsistent — Mitigated with recoverable saga

The posted flow now uses a guarded allocation claim followed by deterministic PostedReview reconciliation and repair-safe draft convergence. This deliberately avoids replica-set-only transactions so it works with the existing standalone MongoDB CI service; retries converge primary state. Legacy Review/activity projections remain secondary side effects.

### F-005 — Unbounded review-allocation listing — Resolved

`GET /api/review-allocations` now applies scope/client/draft/search/date filters before pagination, enforces a maximum page size of 100, and returns pagination metadata. The draft-table consumer was updated for the paginated response.

### F-006 — Partner scope regression suite — Resolved

Dedicated Partner A/B fixtures and tests now cover clients, team members, review allocations, tasks, foreign review mutation denial, partner-worker direct-assignment scope, and preservation of main-agency ownership.

### F-007 — Health/readiness endpoint — Resolved in newer branch

`frontend/app/api/health/route.ts` now provides a public, uncached readiness check with a MongoDB ping, a 2-second timeout, `200` when ready and `503` when degraded. It does not expose connection strings or secret configuration.

**Remaining work:** connect deployment smoke checks/monitoring to this endpoint and retain operational evidence.

### F-008 — CI release gates — Implemented, execution pending verification

`.github/workflows/frontend-ci.yml` now runs frozen-lockfile install, lint, typecheck, unit tests, production build and client-portal integration tests using a MongoDB service.

**Remaining work:** verify a successful workflow run on the integrated branch/PR and make required checks part of the merge policy.

### F-009 — Backup/restore evidence absent — Medium

No tested restore runbook/evidence was found.

**Remediation:** document backup method, retention, RPO/RTO and perform a non-production restore drill.

### F-010 — API error contract is not fully normalized — Low/Medium

The repo uses both `lib/api/validation.ts`, `lib/api-errors.ts`, and direct error responses.

**Remediation:** converge high-risk APIs on one safe error envelope and stable machine codes.

## Overall assessment

The architecture is credible and the client portal shows strong defensive design. The immediate engineering priority should be review-workflow hardening rather than adding more feature breadth. Complete SKY-AUDIT-001 through SKY-AUDIT-003 before materially expanding review operations.
