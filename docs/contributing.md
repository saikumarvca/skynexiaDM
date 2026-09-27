# Contributing to SkyNexiaDM

## 1. Branching

Use focused branches such as:

```text
feature/<scope>
fix/<scope>
docs/<scope>
refactor/<scope>
```

Keep unrelated changes out of the same branch.

## 2. Before coding

Identify:

- actor(s)
- affected client/agency scope
- required permissions
- domain records touched
- API/page contracts
- relevant specification sections

## 3. Implementation rules

- prefer existing helpers over duplicate auth/query logic
- use Zod/shared validation
- keep privileged modules server-only
- use explicit DTOs at sensitive boundaries
- preserve audit/activity history
- do not silently change status vocabulary
- maintain backward compatibility unless migration is intentional and documented

## 4. Commit quality

A commit message should explain the reason for the change, not only the files edited.

Good:

```text
Fix client event filter bundle boundary

Move client-safe constants out of the server module so the change-log
filter cannot pull Mongoose into the browser bundle.
```

## 5. Pull-request checklist

- [ ] behaviour matches spec
- [ ] auth and scope reviewed
- [ ] input validated
- [ ] lint passes
- [ ] typecheck passes
- [ ] build passes
- [ ] relevant automated tests pass
- [ ] sensitive workflow manually smoke-tested
- [ ] documentation updated
- [ ] migration/backfill documented if applicable

## 6. Spec changes

If a feature intentionally changes product behaviour, update the relevant `spec/` file in the same PR.

Do not use implementation drift as an undocumented specification change.

## 7. Security-sensitive changes

Authentication, permissions, scope filters, client APIs, webhooks, password/session code and review evidence handling require extra review and targeted tests.
