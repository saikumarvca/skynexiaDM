# 12 — Requirement Traceability Matrix

## 1. Purpose

This matrix gives stable requirement identifiers that can be referenced from issues, commits, pull requests and automated tests.

## 2. Core requirements

| ID | Requirement | Primary spec | Verification |
|---|---|---|---|
| SKY-PROD-001 | Main agency remains owner of clients | 00 | scope/integration test |
| SKY-PROD-002 | Partner assignment does not transfer client ownership | 00, 03 | scope test |
| SKY-AUTH-001 | Inactive users cannot authenticate | 03 | auth test |
| SKY-AUTH-002 | CLIENT user is linked to exactly one client | 03, 05 | model/API test |
| SKY-AUTH-003 | CLIENT cannot access internal API families | 03, 05 | route test |
| SKY-AUTH-004 | Internal user cannot use client API without authorized preview/client context | 03, 05 | route test |
| SKY-SCOPE-001 | Client scope is derived server-side | 03, 05 | cross-client test |
| SKY-SCOPE-002 | Partner agency cannot access another partner's records | 03 | cross-partner test |
| SKY-SCOPE-003 | Partner employee access is assignment constrained | 03 | assignment test |
| SKY-ARCH-001 | Browser bundle must not import Mongoose/server DB modules | 01 | build/bundle regression |
| SKY-API-001 | External mutation input is validated | 04 | API tests |
| SKY-API-002 | Sensitive APIs return explicit DTOs | 04 | response contract tests |
| SKY-API-003 | Lists are paginated/bounded | 04 | API tests |
| SKY-API-004 | Cross-scope probing does not leak existence | 04, 05 | 404 isolation tests |
| SKY-REV-001 | Review state transitions are explicit | 06 | state-machine tests |
| SKY-REV-002 | Mark-shared produces activity history | 06 | workflow test |
| SKY-REV-003 | Mark-posted preserves evidence and prevents accidental duplication | 06 | workflow/idempotency test |
| SKY-REV-004 | Reassignment preserves history | 06 | workflow test |
| SKY-EVT-001 | INTERNAL events never appear in client feed | 05, 10 | visibility test |
| SKY-EVT-002 | Client events are sanitized projections | 05, 10 | DTO/content test |
| SKY-EVT-003 | Idempotent backfills do not duplicate events | 10, 11 | repeat-run test |
| SKY-DATA-001 | Backfills are deterministic and verifiable | 11 | dry/repeat run evidence |
| SKY-DATA-002 | Production backup/restore process is documented | 11 | operations evidence |
| SKY-NFR-001 | Lint passes for release | 07 | CI/build evidence |
| SKY-NFR-002 | Typecheck passes for release | 07 | CI/build evidence |
| SKY-NFR-003 | Production build succeeds | 07 | CI/build evidence |
| SKY-NFR-004 | Client portal regression suite passes | 07 | test evidence |
| SKY-OBS-001 | Privileged operations are auditable | 10 | audit tests/log review |
| SKY-OBS-002 | Logs do not contain credentials | 10 | code/log review |
| SKY-OPS-001 | Deployment has smoke checks and rollback reference | 07 | release record |

## 3. Pull-request usage

Material PRs should list affected requirement IDs, for example:

```text
Requirements:
- SKY-AUTH-003
- SKY-SCOPE-001
- SKY-API-004
```

## 4. Test naming

Where practical, automated tests should include the requirement id in the test title or adjacent comment:

```text
SKY-SCOPE-001: Client A cannot read Client B review
```

## 5. Status tracking

This file defines requirements, not current implementation compliance.

A separate audit may classify each requirement as:

- PASS
- PARTIAL
- FAIL
- NOT TESTED
- NOT APPLICABLE

That audit must be evidence-based and tied to a commit SHA.
