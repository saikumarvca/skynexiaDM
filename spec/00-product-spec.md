# 00 — Product Specification

## 1. Product definition

SkyNexiaDM is an internal digital-marketing operations system with controlled client access. It centralizes the operational work needed to manage clients, reputation/reviews, campaigns, content, leads, tasks, analytics, reporting, integrations, team allocation and supporting finance/administration workflows.

It is not intended to be an unrestricted public multi-tenant SaaS platform. The primary operating organization remains the main agency.

## 2. Primary goals

SkyNexiaDM must:

1. Give the main agency one operational workspace for client delivery.
2. Maintain strong client and role isolation.
3. Provide a complete review-management lifecycle from draft to posted evidence.
4. Support partner-agency and partner-employee execution without transferring client ownership.
5. Give clients a read-mostly portal showing only their own approved information.
6. Preserve auditable operational history.
7. Remain maintainable as modules grow.

## 3. Actors

| Actor | Description |
|---|---|
| Main Admin | Full internal administrative access |
| Main Employee | Internal user with permission-based access |
| Partner Agency | Execution partner restricted to assigned scope |
| Partner Employee | User restricted to own/agency-assigned work |
| Client User | External authenticated user linked to exactly one client |
| System/Cron | Scheduled or automated process with narrowly scoped credentials |
| Public Portal Visitor | Token-authenticated user of legacy `/portal/[token]` flows |

## 4. Core capability areas

Required product areas are:

- Client and contact management
- Review drafts, allocations, sharing, posting and evidence
- Campaign and budget operations
- Lead pipeline
- Content bank and scheduled publishing
- SEO and competitor tracking
- Tasks, assignments and team workload
- Time tracking
- Invoicing and receivables support
- Analytics and reporting
- Notifications and updates
- Integrations and webhooks
- Internal admin and audit tooling
- Partner-agency hierarchy
- Authenticated client portal

## 5. Client ownership rule

Clients belong to the main agency.

Partner agencies and partner employees may receive visibility or work assignments, but those assignments do not transfer ownership of the client record.

## 6. Client portal rule

A CLIENT account must be linked to exactly one client. Client-facing APIs must derive client scope from the authenticated account/session, never from a caller-supplied client identifier.

## 7. Review operations as a first-class domain

The review workflow is a core differentiator and must support:

- reusable review drafts
- allocation to a team member
- customer/contact context
- shared state
- posted state
- destination/platform tracking
- posted proof/evidence
- activity history
- analytics
- client-visible events
- archive/recycle handling where supported

## 8. Out of scope unless separately specified

The following are not assumed complete merely because adjacent modules exist:

- full email-marketing automation platform
- proposal-to-contract/e-sign lifecycle
- enterprise digital-asset-management governance
- full native ad-platform campaign editing
- public self-service tenant registration
- unrestricted client write access
- formal legal/compliance certification

## 9. Product quality bar

A feature is complete only when:

- authorization rules are explicit
- input is validated
- relevant actions are auditable
- failure states are handled
- client/agency isolation is tested
- UI and API behaviour agree
- documentation/specification is updated
