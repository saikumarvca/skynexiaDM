# Local Development

## Prerequisites

- Node.js compatible with the current Next.js 16 toolchain
- pnpm
- MongoDB instance
- required environment configuration

## Install

```bash
cd frontend
pnpm install
```

## Environment

Start from:

```text
frontend/.env.example
```

Create a local environment file supported by the app, typically `.env.local`, and provide the required MongoDB/session/application variables.

Do not commit real credentials.

## Run

```bash
pnpm dev
```

Default local URL:

```text
http://localhost:3152
```

## Useful commands

```bash
pnpm lint
pnpm check-types
pnpm build
pnpm test:client-portal
pnpm seed:user
pnpm grant:access
pnpm create:client-user
pnpm backfill:client-events
```

Some scripts require additional environment variables; inspect the script before running it against production data.

## Development rules

- Keep server-only imports out of client components.
- Reuse shared validation and auth helpers.
- Use scoped queries for partner/client-sensitive data.
- Return DTOs instead of raw database documents.
- Add tests for authorization and state transitions.
- Update the relevant `spec/` document when behaviour changes.

## Troubleshooting

### Browser bundle errors mentioning Mongoose

A client component likely imported a server-only module transitively. Move shared constants/types into a client-safe module and mark privileged modules server-only.

### User sees too few navigation items

Check TeamMember, TeamRole and permission assignment. The repository includes `pnpm grant:access` for controlled access repair.

### CLIENT can sign in but sees no data

Confirm the User is linked to the intended Client via `clientId`, and confirm the target client record still exists and is active for the expected workflow.
