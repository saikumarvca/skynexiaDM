# 09 — Module Contracts

## 1. Purpose

This specification defines ownership boundaries between SkyNexiaDM modules so features do not become tightly coupled as the application grows.

Each module owns its domain state and exposes behaviour through explicit service/API boundaries. Other modules may reference identifiers or consume DTOs/events, but should not mutate another module's records by bypassing its workflow rules.

## 2. Module contract template

Every major module should have:

- owned entities
- permitted callers
- public API/service surface
- required permissions
- scope rules
- emitted audit/domain events
- inbound dependencies
- failure semantics
- tests

## 3. Clients

**Owns:** Client and client profile/configuration data.

**Responsibilities:**
- create/update/archive clients
- maintain contact/business metadata
- expose client-scoped lookup DTOs
- provide review destinations and portal linkage context

**Must not:**
- directly change review lifecycle state
- expose one client's details through another client's session

**Security:** client operations require appropriate client-management permission plus hierarchy scope.

## 4. Reviews

**Owns:** ReviewDraft, ReviewAllocation, PostedReview and review activity.

**Responsibilities:**
- enforce review state transitions
- maintain allocation ownership/history
- preserve posting evidence
- emit review activity/client events

**Must not:**
- rely on UI-only validation for transitions
- directly trust caller-supplied client ownership

## 5. Team and partner hierarchy

**Owns:** TeamMember, TeamRole, PartnerAgency and hierarchy metadata.

**Responsibilities:**
- define permission context
- resolve main/partner account type
- provide centralized scope helpers

**Must not:**
- duplicate scope logic independently in each feature module

## 6. Client portal

**Owns:** client-facing presentation contracts, read state, preview handling, client DTO policy.

**Consumes:** approved client-scoped data from reviews, events, updates, notifications and analytics.

**Must not:**
- import internal-only DTOs directly
- trust URL/body client identifiers to select tenancy

## 7. Campaigns and budget operations

**Owns:** Campaign, CampaignSpendEntry, BudgetAlert.

**Responsibilities:**
- campaign lifecycle
- spend/budget calculations
- alert thresholds

**Security:** campaign queries are client/hierarchy scoped.

## 8. Leads

**Owns:** Lead and LeadActivity.

**Responsibilities:**
- lead pipeline state
- activity history
- integration-created lead ingestion

Transitions must be explicit and auditable when material.

## 9. Content and publishing

**Owns:** ContentItem, ScheduledPost, PostMetrics.

**Responsibilities:**
- content repository
- scheduling
- provider publishing orchestration
- publish outcome tracking

Provider credentials are server-only.

## 10. SEO

**Owns:** Keyword, KeywordHistory, Competitor, CompetitorKeywordRank.

**Responsibilities:**
- keyword tracking
- rank history
- competitor observations

Analytics should read normalized historical records rather than overwriting previous observations.

## 11. Tasks and time

**Owns:** Task and TimeEntry.

Tasks maintain assignment/status/priority/deadline state. Time entries retain attributable work records and must remain scoped to permitted client/work context.

## 12. Finance

**Owns:** Invoice and ItemMaster.

Finance features must preserve amounts, tax components and status history sufficiently for later audit. Any accounting-grade expansion requires its own explicit financial controls specification.

## 13. Reports

**Owns:** ReportSchedule and ReportSendLog.

Scheduled report execution must be retry-safe and record delivery success/failure without duplicating sends uncontrollably.

## 14. Integrations

**Owns:** Integration and IntegrationEvent.

Integration adapters must isolate provider-specific payloads and credentials from domain modules. Domain modules receive validated, normalized commands/data.

## 15. Notifications

Notifications are delivery/read-state records. They must not become the source of truth for the underlying business event.

## 16. Cross-module rule

When a workflow crosses modules:

1. authorize at the entry boundary
2. resolve scope once using central helpers
3. call domain-specific behaviour
4. commit canonical state
5. emit audit/domain event
6. derive secondary notifications/client feed entries

Secondary side effects must never silently redefine primary business state.
