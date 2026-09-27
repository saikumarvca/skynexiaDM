# SkyNexiaDM Specification Index

This directory defines the intended behaviour and system boundaries of SkyNexiaDM.

The specification is normative: when implementation and documentation disagree, changes should either bring the implementation back into conformance or explicitly update the relevant specification.

## Documents

| File | Purpose |
|---|---|
| [00-product-spec.md](00-product-spec.md) | Product goals, actors, scope, capabilities and exclusions |
| [01-system-architecture.md](01-system-architecture.md) | Runtime architecture, boundaries, data flow and module rules |
| [02-domain-model.md](02-domain-model.md) | Core entities, relationships and invariants |
| [03-auth-access-control.md](03-auth-access-control.md) | Authentication, roles, permissions and scope isolation |
| [04-api-contracts.md](04-api-contracts.md) | API conventions, validation, errors and route families |
| [05-client-portal.md](05-client-portal.md) | Authenticated client portal requirements |
| [06-review-operations.md](06-review-operations.md) | Review lifecycle, allocation, sharing, posting and evidence |
| [07-nfr-production-readiness.md](07-nfr-production-readiness.md) | Security, reliability, performance, observability and deployment requirements |
| [08-acceptance-criteria.md](08-acceptance-criteria.md) | Release gates and end-to-end acceptance scenarios |

## Status vocabulary

- **Required** — must be satisfied for the related feature to be considered complete.
- **Recommended** — expected unless a documented trade-off exists.
- **Optional** — useful enhancement but not required for conformance.
- **Legacy** — supported for compatibility but should not be expanded without a migration plan.

## Change rule

Every material feature change should identify which specification sections it changes. Security, authorization, client isolation, and review-state transitions require an explicit test update.
