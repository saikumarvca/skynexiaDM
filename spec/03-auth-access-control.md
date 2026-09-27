# 03 — Authentication and Access Control

## 1. Authentication modes

SkyNexiaDM currently supports distinct access modes:

1. Internal authenticated session
2. CLIENT authenticated session
3. Admin client-preview session
4. Legacy token-authenticated client portal
5. Cron/integration machine credentials

These modes must not be treated as interchangeable.

## 2. Session rules

The primary authenticated session uses the `dm_session` cookie.

Required properties:

- signed/tamper-resistant session token
- secure production cookie settings
- expiration
- server-side user revalidation for protected mutations
- inactive users rejected
- logout clears the session

## 3. Internal users

Internal access is permission-based.

Route handlers must use the existing permission helpers rather than ad-hoc role comparisons where granular permissions apply.

Administrative-only actions may additionally require ADMIN.

## 4. CLIENT users

Required rules:

- role is `CLIENT`
- account carries a `clientId`
- the user sees only that client
- CLIENT sessions are confined to `/client/*` and `/api/client/*`
- internal pages/APIs reject CLIENT users
- client APIs derive scope from authenticated context
- caller-provided client IDs must never widen scope
- client responses use explicit DTOs
- preview mode cannot mutate client data

## 5. Partner hierarchy

Partner scope is assignment-based.

### Main Admin

May access all records allowed by application permissions.

### Main Employee

May access records permitted by role plus any configured assignment restrictions.

### Partner Agency

May access only partner-linked/assigned records.

### Partner Employee

May access only directly assigned records and any deliberately inherited partner-agency scope defined by the domain helper.

## 6. Authorization sequence

Protected API handlers should follow this order:

1. authenticate request
2. load active user
3. verify permission
4. resolve hierarchy/client context
5. construct scope filter
6. load target record using scope
7. validate mutation
8. perform mutation
9. emit audit/activity event

Loading a record before scope enforcement and then checking afterward should be avoided when a scoped query can enforce isolation directly.

## 7. Preview mode

Admin client preview:

- uses a separate preview token/cookie
- does not replace the admin session
- is read-only
- is time-limited
- start/end should be audited
- protected mutation endpoints return a clear forbidden response

## 8. Password/security requirements

Required:

- bcrypt or equivalent adaptive password hashing
- no plaintext password storage/logging
- no password returned by API
- rate limiting or equivalent brute-force protection on login
- password-change events audited where supported

## 9. Security acceptance tests

At minimum:

- unauthenticated internal API -> 401
- unauthenticated protected page -> login redirect
- CLIENT -> internal API -> forbidden
- internal user -> client API without preview -> forbidden
- Client A cannot read Client B object by guessed id
- Partner A cannot read Partner B assignment
- preview mutation -> forbidden
