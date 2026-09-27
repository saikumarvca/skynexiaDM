# 11 — Data Lifecycle, Migration and Recovery

## 1. Purpose

This specification defines how SkyNexiaDM data is created, changed, archived, migrated, backed up and recovered.

## 2. Data classifications

### Security-sensitive
- password hashes
- session/auth secrets
- integration credentials
- provider tokens

### Client-sensitive
- contact information
- client operational records
- review/customer context
- invoices
- client-visible/private events

### Internal operational
- team assignments
- internal notes
- audit/activity records
- workload/performance data

### Public/low sensitivity
Only information deliberately published externally belongs here.

## 3. Creation

New records must:

- validate required fields
- derive ownership/scope server-side where security-sensitive
- initialize lifecycle status deterministically
- create required indexes/unique guards through schema definitions

## 4. Update

Updates should be field allow-listed for sensitive models.

Mass assignment of request bodies into persistence models is prohibited for privileged/security-sensitive fields.

## 5. Archive and deletion

Prefer archive/soft-delete for records that contribute to business history.

Hard deletion should be reserved for records where:
- history is not required
- dependent records are handled
- authorization is explicit
- legal/operational retention policy permits deletion

## 6. Referential integrity

MongoDB does not automatically enforce relational integrity across collections.

Application logic must prevent or deliberately handle:
- orphaned client references
- deleted users still owning active assignments
- deleted partner agencies with active employees
- posted review records losing evidence links

## 7. Migration principles

Every schema/data migration should define:

- source version/shape
- target version/shape
- affected collections
- forward steps
- verification query/check
- rollback/compensation plan
- idempotency strategy
- expected duration/volume risk

## 8. Backfills

Backfill scripts should support when practical:

- dry run
- bounded batches
- resume/retry
- deterministic selection
- changed/skipped/error counters
- stable duplicate guards

They must never fabricate missing business facts merely to satisfy a schema.

## 9. Index changes

Index changes must consider:

- collection size
- deployment impact
- uniqueness conflicts
- query-plan requirements
- rollback implications

New high-volume list/filter routes should document required indexes.

## 10. Backup

Production deployment should define:

- MongoDB backup mechanism
- backup frequency
- retention window
- restore permissions
- location/account ownership

A backup strategy is incomplete unless restoration has been tested.

## 11. Recovery

Recovery procedure should identify:

1. incident scope
2. affected database/environment
3. latest safe restore point
4. expected data loss window
5. restore steps
6. application compatibility with restored schema
7. validation checks
8. reopen criteria

## 12. Recovery objectives

Until measured production requirements are finalized, the project should explicitly record chosen RPO/RTO for production rather than assume zero loss/zero downtime.

Definitions:
- RPO — maximum acceptable data-loss window
- RTO — maximum acceptable service-restoration time

## 13. Export and portability

Exports must preserve scope and authorization. A CSV/report export must not bypass record-level security simply because it is generated asynchronously or in bulk.

## 14. Test environment

Automated tests must use isolated data and must never run destructive cleanup against production databases.
