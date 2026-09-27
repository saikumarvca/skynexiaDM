# SkyNexiaDM Specification Index

This directory defines the intended behaviour, system boundaries, security invariants and production acceptance rules of SkyNexiaDM.

The specification is **normative**: when implementation and specification disagree, the team must either bring the implementation back into conformance or explicitly update the relevant specification in the same change.

## Specification set

| File | Purpose |
|---|---|
| [00-product-spec.md](00-product-spec.md) | Product goals, actors, scope, capabilities and exclusions |
| [01-system-architecture.md](01-system-architecture.md) | Runtime architecture, layering, data flow and server/client boundaries |
| [02-domain-model.md](02-domain-model.md) | Core entities, relationships, invariants and DTO rules |
| [03-auth-access-control.md](03-auth-access-control.md) | Authentication modes, RBAC, hierarchy scope and client isolation |
| [04-api-contracts.md](04-api-contracts.md) | API conventions, validation, errors, pagination and mutation safety |
| [05-client-portal.md](05-client-portal.md) | Authenticated client portal and preview-mode requirements |
| [06-review-operations.md](06-review-operations.md) | Review lifecycle, allocation, sharing, posting and evidence |
| [07-nfr-production-readiness.md](07-nfr-production-readiness.md) | Security, reliability, performance, accessibility, observability and deployment gates |
| [08-acceptance-criteria.md](08-acceptance-criteria.md) | Release-level end-to-end acceptance scenarios |
| [09-module-contracts.md](09-module-contracts.md) | Ownership boundaries and contracts between major functional modules |
| [10-events-audit-observability.md](10-events-audit-observability.md) | Domain activity, audit events, client events, logging, metrics and health signals |
| [11-data-lifecycle.md](11-data-lifecycle.md) | Data classification, deletion/archive, migrations, backup and recovery |
| [12-requirement-traceability.md](12-requirement-traceability.md) | Stable requirement IDs mapped to specifications and verification evidence |

## Specification hierarchy

Use the following order when resolving ambiguity:

1. Security and scope invariants
2. Domain invariants/state-machine rules
3. API contracts
4. Module contracts
5. UI behaviour
6. Operational recommendations

A UI behaviour must never override a security, scope or domain invariant.

## Requirement vocabulary

- **MUST / Required** — mandatory for conformance.
- **MUST NOT** — prohibited.
- **SHOULD / Recommended** — expected unless a documented trade-off exists.
- **MAY / Optional** — supported enhancement, not required for conformance.
- **Legacy** — maintained only for compatibility; do not expand without a migration plan.

## Stable requirement IDs

Cross-cutting requirements use IDs such as:

- `SKY-AUTH-003`
- `SKY-SCOPE-001`
- `SKY-REV-003`
- `SKY-NFR-004`

See [12-requirement-traceability.md](12-requirement-traceability.md).

Issues, PRs and tests should reference these IDs where practical.

## Change rule

Every material feature change should identify:

1. affected requirement IDs
2. affected actors and scope boundaries
3. data model/state changes
4. API/UI contract changes
5. tests added or updated
6. migration/backfill implications
7. operator/deployment impact

Security, authorization, client isolation, partner scope, state transitions and destructive data changes always require explicit verification evidence.

## Conformance

The presence of a requirement in this directory does **not** imply the current implementation already satisfies it.

A code audit should classify requirements as:

- PASS
- PARTIAL
- FAIL
- NOT TESTED
- NOT APPLICABLE

Conformance must be tied to a concrete commit SHA and evidence.
