# 05 — Client Portal Specification

## 1. Purpose

The authenticated client portal under `/client` gives a client visibility into its own review progress, approved activity, analytics, updates and notifications without exposing internal operational data.

## 2. Account model

A client account is a `User` with:

- `role = CLIENT`
- exactly one linked `clientId`
- no internal TeamRole permission inheritance

## 3. Required pages

- `/client/login`
- `/client/dashboard`
- `/client/reviews`
- `/client/reviews/[id]`
- `/client/review-analytics`
- `/client/change-log`
- `/client/updates`
- `/client/notifications`
- `/client/profile`

## 4. Required client API families

- `GET /api/client/dashboard`
- `GET /api/client/reviews`
- `GET /api/client/reviews/[id]`
- `GET /api/client/review-analytics`
- `GET /api/client/change-log`
- `GET /api/client/updates`
- `POST /api/client/updates/[id]/read`
- `GET /api/client/notifications`
- `GET /api/client/notifications/unread-count`
- `POST /api/client/notifications/[id]/read`
- `POST /api/client/notifications/read-all`
- `GET /api/client/profile`
- `POST /api/client/profile/password`
- `GET /api/client/search`

## 5. Isolation

Every client query must resolve the client from authenticated context.

A request such as:

```text
GET /api/client/reviews/<foreign-client-review-id>
```

must not reveal that the foreign record exists.

## 6. Dashboard

Dashboard should support defined date ranges such as:

- 7d
- 30d
- 90d
- current month
- previous month
- custom

It should present review progress and recent approved activity without internal-only annotations.

## 7. Change log

Only `ClientEvent.visibility = CLIENT_VISIBLE` is visible.

Permitted event descriptions must be sanitized of:

- internal notes
- unrelated client names
- sensitive employee details
- internal failure/debug text

## 8. Updates

Client updates support publish visibility and per-login read state.

Unpublished or deleted updates are not visible to the client.

## 9. Notifications

Client notifications are client-scoped and support:

- unread count
- mark single as read
- mark all as read

Where multiple active CLIENT logins exist for a client, notification behaviour must be explicitly consistent with the implementation's fan-out/read-state design.

## 10. Admin preview

Authorized internal users can preview the client portal.

Preview requirements:

- separate preview credential
- visible preview banner
- read-only mode
- no privilege crossover
- audited start/end
- expiry

## 11. Client portal acceptance

The portal is releasable only when:

- cross-client isolation tests pass
- client DTOs contain no internal-only fields
- browser bundles contain no server-only database dependencies
- preview writes are blocked
- CLIENT/internal route confinement is tested
