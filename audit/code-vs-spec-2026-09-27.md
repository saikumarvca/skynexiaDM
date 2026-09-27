# SkyNexiaDM Code-vs-Spec Audit — 2026-09-27

Audited implementation: `main@d549a25fd5c27779c0be55196ad2697a53a1a902`.

## Executive summary

The client portal is the strongest audited area: CLIENT route confinement, authenticated client scoping, cross-client 404 behavior, preview read-only behavior and preview auditing all have direct implementation and regression-test evidence.

The highest-risk gaps are in internal review mutations:

- `mark-shared` and `mark-posted` authenticate a session but do not use the granular review permission/hierarchy scope helpers.
- those endpoints do not validate the current lifecycle state before transition.
- `mark-posted` creates a new PostedReview without an idempotency guard.
- `PostedReview.allocationId` is indexed but not unique.
- the posted transition updates multiple collections without an atomic primary-state boundary.
- `GET /api/review-allocations` is unpaginated.
- the proxy excludes `/api/health`, but no health route was found.
- no GitHub Actions runs are attached to the audited main commit, so release commands cannot be marked executed.

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
| SKY-SCOPE-002 | PARTIAL | Partner scope helpers exist, but critical review mutations bypass them and dedicated cross-partner tests were not found. |
| SKY-SCOPE-003 | PARTIAL | Partner employee assignment filtering exists in helpers, but coverage/testing is incomplete. |
| SKY-ARCH-001 | PARTIAL | Client-safe DTO split and latest Mongoose bundle fix exist; no CI build evidence is attached to main. |
| SKY-API-001 | PARTIAL | Shared Zod validation is used by sampled mutations; universal mutation coverage was not established. |
| SKY-API-002 | PASS | Client portal uses explicit DTOs that exclude internal notes, permissions, secrets and raw documents. |
| SKY-API-003 | FAIL | Review-allocation GET is an unbounded list endpoint. |
| SKY-API-004 | PASS | Cross-client review IDs return 404; isolation test covers both directions. |
| SKY-REV-001 | FAIL | mark-shared/mark-posted do not validate allowed current state. |
| SKY-REV-002 | PARTIAL | mark-shared logs activity, but authorization/scope/state controls are incomplete. |
| SKY-REV-003 | FAIL | No duplicate posted-review guard; allocationId is not unique; repeated posting can create duplicates. |
| SKY-REV-004 | NOT TESTED | Reassignment history was not directly verified in this baseline. |
| SKY-EVT-001 | PASS | ClientEvent visibility model plus client change-log isolation is implemented/tested. |
| SKY-EVT-002 | PARTIAL | Sanitized DTO/projection architecture exists; dedicated sanitization-content test was not found. |
| SKY-EVT-003 | PASS | Backfill skips mapped logs and unique `sourceLogId + clientId` index guards duplicate mapping. |
| SKY-DATA-001 | PARTIAL | Backfill is batched/idempotent with counters; no dry-run mode was found. |
| SKY-DATA-002 | NOT TESTED | No tested backup/restore evidence was found in the inspected repository. |
| SKY-NFR-001 | NOT TESTED | `pnpm lint` exists; no workflow execution evidence on audited commit. |
| SKY-NFR-002 | NOT TESTED | `pnpm check-types` exists; no workflow execution evidence on audited commit. |
| SKY-NFR-003 | NOT TESTED | `pnpm build` exists; no workflow execution evidence on audited commit. |
| SKY-NFR-004 | NOT TESTED | client-portal test suite exists; no attached run evidence on audited commit. |
| SKY-OBS-001 | PARTIAL | Client login/preview/update actions use TeamActivityLog; universal privileged-action coverage is not established. |
| SKY-OBS-002 | PARTIAL | Inspected logs avoid credentials, but no automated secret-log check was found. |
| SKY-OPS-001 | PARTIAL | Operational guidance now exists, but there is no CI/CD release/rollback evidence on main. |

## High-priority findings

### F-001 — Review mutation authorization/scope gap — High

Affected:
- `frontend/app/api/review-allocations/[id]/mark-shared/route.ts`
- `frontend/app/api/review-allocations/[id]/mark-posted/route.ts`

Both use `requireSessionApi()` only. They do not call `requireAnyPermissionApi()` or apply `buildReviewScopeFilter()` to the target allocation.

**Remediation:** require the relevant review permission, resolve hierarchy context, and fetch/update through a scoped query.

### F-002 — Review state machine not enforced — High

The same transition routes overwrite lifecycle state without verifying the previous state.

Examples currently not explicitly blocked:
- Posted -> Shared
- Cancelled -> Posted
- Posted -> Posted

**Remediation:** central transition table + stable conflict response + regression tests.

### F-003 — Duplicate PostedReview risk — High

`mark-posted` creates a PostedReview before any duplicate check. `PostedReview.allocationId` has a normal index, not a unique one.

**Remediation:** unique invariant/upsert or guarded create, plus retry/concurrency tests.

### F-004 — Multi-collection posted transition can become inconsistent — High/Medium

Primary state spans PostedReview, ReviewAllocation and ReviewDraft, with further Review/activity side effects, but no transaction or explicit reconciliation strategy is present.

**Remediation:** transactional primary writes where supported, or a documented idempotent reconciliation workflow.

### F-005 — Unbounded review-allocation listing — Medium

`GET /api/review-allocations` fetches all matching records and performs some filtering in application memory.

**Remediation:** server pagination, max page size, DB-side filters, pagination metadata.

### F-006 — Partner scope needs a dedicated regression suite — Medium

The hierarchy and scope helpers are meaningful, but the inspected tests focus on CLIENT isolation.

**Remediation:** Partner A vs B and partner-employee assignment tests across clients, team, reviews and tasks.

### F-007 — Health/readiness route missing — Medium

`proxy.ts` explicitly excludes `/api/health`, but `frontend/app/api/health/route.ts` was not found.

**Remediation:** liveness/readiness endpoint with DB readiness and no secret/config leakage.

### F-008 — Release gates not evidenced in CI — Medium

Scripts exist for lint, typecheck, build and portal tests, but the audited commit has no associated GitHub Actions runs.

**Remediation:** mandatory PR/main workflow and retained check evidence.

### F-009 — Backup/restore evidence absent — Medium

No tested restore runbook/evidence was found.

**Remediation:** document backup method, retention, RPO/RTO and perform a non-production restore drill.

### F-010 — API error contract is not fully normalized — Low/Medium

The repo uses both `lib/api/validation.ts`, `lib/api-errors.ts`, and direct error responses.

**Remediation:** converge high-risk APIs on one safe error envelope and stable machine codes.

## Overall assessment

The architecture is credible and the client portal shows strong defensive design. The immediate engineering priority should be review-workflow hardening rather than adding more feature breadth. Complete SKY-AUDIT-001 through SKY-AUDIT-003 before materially expanding review operations.
