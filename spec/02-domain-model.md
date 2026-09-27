# 02 — Domain Model

## 1. Core entity groups

### Identity and access

- User
- TeamMember
- TeamRole
- PartnerAgency
- TeamAssignment
- TeamActivityLog

### Client domain

- Client
- ContactBookEntry
- ClientEvent
- ClientUpdate
- Notification
- PortalApproval
- PortalComment

### Review domain

- ReviewDraft
- ReviewAllocation
- PostedReview
- Review
- ReviewUsage
- ReviewActivityLog
- ReviewRequest
- ReviewTemplate

### Marketing delivery

- Campaign
- CampaignSpendEntry
- BudgetAlert
- ContentItem
- ScheduledPost
- PostMetrics
- Keyword
- KeywordHistory
- Competitor
- CompetitorKeywordRank
- Lead
- LeadActivity
- Task
- TimeEntry

### Finance/reporting/integrations

- Invoice
- ItemMaster
- ReportSchedule
- ReportSendLog
- Integration
- IntegrationEvent

## 2. Main relationships

```text
Client
 ├─ ReviewDraft
 │   └─ ReviewAllocation
 │       └─ PostedReview
 │           └─ ReviewActivityLog / ClientEvent
 ├─ Campaign
 ├─ Lead
 ├─ Task
 ├─ ContentItem
 ├─ Keyword
 ├─ Invoice
 ├─ TimeEntry
 ├─ ClientUpdate
 └─ Notification

User
 ├─ TeamMember
 │   └─ TeamRole
 └─ CLIENT -> exactly one Client

PartnerAgency
 └─ TeamMember (partner users/employees)
```

## 3. Domain invariants

### Client

- A client is owned by the main agency.
- External CLIENT users reference exactly one client.
- Client deletion/archive behaviour must not silently orphan critical audit history.

### User

- Email is unique.
- Passwords are stored only as secure hashes.
- Inactive users cannot authenticate.
- CLIENT users do not inherit internal TeamRole permissions.

### Team hierarchy

Account types include:

- MAIN_EMPLOYEE
- PARTNER_AGENCY
- PARTNER_EMPLOYEE

Partner-linked users must have scope metadata sufficient to determine allowed records.

### ReviewDraft

A review draft represents reusable review content before final posting evidence.

Typical states include:

- Available
- Allocated
- Shared
- Used
- Archived

State names used in code and UI must remain consistent or be mapped explicitly.

### ReviewAllocation

An allocation binds a draft to a real execution context, including assignee and client/customer workflow.

It is the operational record used to progress a review toward posting.

### PostedReview

A posted review records the completed outcome. It should preserve the destination/platform, posting date and proof/evidence information required by the workflow.

### ClientEvent

ClientEvent is a normalized client-facing activity feed.

Only events marked `CLIENT_VISIBLE` may appear in client APIs.

Internal notes, sensitive operator details and unrelated-client information must never be copied into client-visible descriptions.

## 4. Data integrity rules

Required:

- foreign identifiers must be validated before use
- critical unique keys should be indexed
- client-scoped collections should have indexes beginning with `clientId` where common query patterns need it
- soft-deleted records should be excluded by default where the model uses soft deletion
- activity/audit records should be append-oriented
- backfill scripts must be idempotent

## 5. DTO rule

API response objects are contracts, not raw database documents.

DTOs should:

- whitelist fields
- normalize dates/ids
- omit internal notes and secret fields
- avoid exposing Mongoose metadata
- avoid exposing internal assignee/team identities to client users unless explicitly approved
