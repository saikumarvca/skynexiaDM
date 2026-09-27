# SkyNexiaDM

SkyNexiaDM is a digital-marketing operations platform for managing clients, campaigns, reviews, content, leads, tasks, analytics, reporting, team operations, integrations, and client-facing review progress.

The application lives primarily under `frontend/` and is built with Next.js 16, React 19, TypeScript, MongoDB/Mongoose, Tailwind CSS, and server-side API route handlers.

## Documentation

- [Specification index](spec/README.md)
- [Documentation index](docs/README.md)
- [Existing detailed frontend reference](frontend/README.md)

## Specification set

1. [Product specification](spec/00-product-spec.md)
2. [System architecture](spec/01-system-architecture.md)
3. [Domain model](spec/02-domain-model.md)
4. [Authentication and access control](spec/03-auth-access-control.md)
5. [API contracts](spec/04-api-contracts.md)
6. [Client portal](spec/05-client-portal.md)
7. [Review operations](spec/06-review-operations.md)
8. [Non-functional requirements](spec/07-nfr-production-readiness.md)
9. [Acceptance criteria](spec/08-acceptance-criteria.md)
10. [Module contracts](spec/09-module-contracts.md)
11. [Events, audit & observability](spec/10-events-audit-observability.md)
12. [Data lifecycle & recovery](spec/11-data-lifecycle.md)
13. [Requirement traceability](spec/12-requirement-traceability.md)

## Engineering docs

- [Local development](docs/local-development.md)
- [Deployment and operations](docs/deployment-operations.md)
- [Testing and quality](docs/testing-quality.md)
- [Contributing](docs/contributing.md)

## Current application entry point

```bash
cd frontend
pnpm install
pnpm dev
```

Default development port: `3152`.

> The `frontend/README.md` remains the detailed implementation reference. The files under `spec/` define intended system behaviour and acceptance boundaries; the files under `docs/` explain how to work with and operate the repository.
