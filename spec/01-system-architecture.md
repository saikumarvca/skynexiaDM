# 01 — System Architecture

## 1. Technology baseline

Current application baseline:

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB
- Mongoose
- Tailwind CSS
- Radix/shadcn-style UI primitives
- Zod validation
- Cookie-based authenticated sessions
- Next.js route handlers for server APIs

## 2. Repository boundary

The application is currently rooted under `frontend/`.

Major source areas:

```text
frontend/
  app/            pages, layouts and route handlers
  components/     reusable UI and domain components
  hooks/          frontend hooks
  lib/            server/client utilities and domain services
  models/         Mongoose models
  types/          shared TypeScript types
  scripts/        maintenance/bootstrap scripts
  tests/          automated test suites
  proxy.ts        edge/request routing and session protection
```

## 3. Layering rules

### Presentation layer

`app/`, `components/`, and `hooks/`.

Responsibilities:

- render UI
- gather user input
- present loading/error/empty states
- call server APIs or server-side data loaders

Client components must not import server-only modules such as Mongoose models, database connectors or secret-bearing helpers.

### Application/service layer

`lib/` and route handlers under `app/api/`.

Responsibilities:

- authorization
- validation
- orchestration
- workflow transitions
- DTO construction
- audit/event emission
- integration boundaries

### Persistence layer

`models/` plus MongoDB connection helpers.

Responsibilities:

- schema definitions
- indexes
- persistence constraints
- query operations

Raw Mongoose documents should not cross client-facing API boundaries.

## 4. Server/client separation

Modules that import Mongoose, Node-only libraries, secrets, filesystem APIs, or privileged credentials must be server-only.

Shared constants needed by both server and browser code should live in client-safe modules with no transitive server dependencies.

## 5. Request flow

Typical protected request:

```text
Browser
  -> proxy/session gate
  -> Next.js page or API route
  -> authenticated user lookup
  -> permission + hierarchy scope resolution
  -> input validation
  -> domain operation
  -> persistence
  -> audit/event side effects
  -> explicit DTO response
```

## 6. Authorization architecture

Authorization is layered:

1. Session validity
2. User activity/state
3. Role and permission checks
4. Agency/client hierarchy scope
5. Resource ownership/assignment checks
6. Mutation-specific business rules

A permission check without a scope check is insufficient for partner/client-sensitive data.

## 7. Integration architecture

External integrations must enter through explicit route handlers or service abstractions.

Requirements:

- validate source credentials/signatures/API keys
- validate payload shape
- record integration event or error where appropriate
- avoid exposing provider secrets to the browser
- make repeated webhook delivery safe where practical

## 8. Background operations

Cron routes and maintenance scripts must:

- use dedicated authentication
- be idempotent where practical
- log failures clearly
- avoid assuming interactive user context
- document required environment variables

## 9. Architecture constraints

Required:

- no direct browser access to MongoDB
- no secret-bearing environment variables exposed to client bundles
- no CLIENT access to internal API families
- no cross-client data leakage
- no partner-agency access outside assigned scope
- no uncontrolled state transition bypasses
