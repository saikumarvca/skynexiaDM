# 08 — Acceptance Criteria

This document provides release-level scenarios for the current SkyNexiaDM platform.

## A. Authentication

- [ ] Valid internal user can sign in.
- [ ] Inactive internal user cannot sign in.
- [ ] Valid CLIENT user reaches the client portal.
- [ ] CLIENT user cannot access internal pages/APIs.
- [ ] Internal user cannot use client APIs unless using authorized preview flow.
- [ ] Logout invalidates the active browser session.

## B. Client isolation

- [ ] Client A cannot read Client B dashboard/review/update/notification objects.
- [ ] Guessing a foreign object id does not disclose existence.
- [ ] Search returns only authenticated client's objects.
- [ ] Client APIs never accept a client id that widens authenticated scope.

## C. Partner hierarchy

- [ ] Main admin can see permitted records across the system.
- [ ] Partner agency sees only assigned/linked scope.
- [ ] Partner employee sees only own/allowed assignment scope.
- [ ] Partner user cannot enumerate another partner's team data.

## D. Review workflow

- [ ] Draft can be created/imported.
- [ ] Draft can be allocated.
- [ ] Allocation can be marked shared.
- [ ] Shared allocation can be marked posted.
- [ ] Posted evidence/history is retained.
- [ ] Invalid transition is rejected.
- [ ] Reassignment leaves an activity record.
- [ ] Analytics reflect source lifecycle counts.

## E. Client events

- [ ] Approved review activity can produce CLIENT_VISIBLE event.
- [ ] INTERNAL event never appears in client portal.
- [ ] Event text is sanitized.
- [ ] Backfill is idempotent.

## F. Admin preview

- [ ] Authorized internal user can start preview.
- [ ] Preview displays correct client.
- [ ] Preview state is visibly indicated.
- [ ] Preview mutation is rejected.
- [ ] Preview expiry/end works.
- [ ] Preview activity is auditable.

## G. API quality

- [ ] Invalid input receives 4xx, not an unhandled 500.
- [ ] Unauthorized request receives 401.
- [ ] Forbidden request receives 403 or scoped 404 as designed.
- [ ] List routes paginate.
- [ ] Client-facing responses use explicit DTOs.
- [ ] Secrets/password hashes never appear in responses.

## H. Build and regression gates

- [ ] `pnpm lint`
- [ ] `pnpm check-types`
- [ ] `pnpm build`
- [ ] `pnpm test:client-portal`
- [ ] critical workflow smoke tests pass

## I. Production readiness

- [ ] production environment variables validated
- [ ] MongoDB connectivity confirmed
- [ ] health/smoke checks pass after deployment
- [ ] cron endpoints authenticated
- [ ] integration credentials present where features are enabled
- [ ] rollback path identified
- [ ] known issues documented

## Definition of Done

A feature is Done only when implementation, authorization, tests, specification and operator documentation agree.
