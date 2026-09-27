# 06 — Review Operations Specification

## 1. Purpose

Review operations manage reusable review content and the operational lifecycle that moves a review from draft through assignment, sharing, posting and historical evidence.

## 2. Core records

- ReviewDraft
- ReviewAllocation
- PostedReview
- ReviewActivityLog
- ClientEvent
- Review / ReviewUsage for legacy compatibility

## 3. Canonical lifecycle

The intended workflow is:

```text
Available
  -> Allocated
  -> Shared
  -> Posted/Used
  -> Historical evidence
```

Optional side paths such as recycle, archive, cancellation or reassignment must be explicit transitions rather than arbitrary field edits.

## 4. Draft requirements

A draft must retain:

- owning client
- review text
- subject/label
- language/category
- tone/rating metadata where used
- current status
- creation provenance

Reusable drafts must not be marked unavailable permanently unless the workflow deliberately consumes them.

## 5. Allocation requirements

An allocation must identify enough context to determine:

- client
- source draft
- responsible assignee or unassigned state
- current lifecycle stage
- relevant customer/contact context
- platform/destination where applicable
- transition timestamps

## 6. Shared transition

Marking a review shared should:

1. verify authorization and scope
2. verify current state supports the transition
3. persist the shared state/timestamp
4. append review activity
5. create client-visible activity only when policy allows
6. create notification/event side effects where configured

## 7. Posted transition

Marking a review posted should capture the operational proof required by the current workflow, such as:

- platform
- posted timestamp
- destination/profile
- evidence/proof reference
- rating if applicable

It should also:

- finalize relevant allocation state
- update draft status where required
- append activity
- update analytics source data
- emit approved client event/notification
- preserve idempotency against accidental double-posting

## 8. Reassignment

Reassignment must preserve history.

Do not overwrite prior assignee context without an activity entry sufficient to explain the change.

## 9. Unassigned state

The application may represent unassigned work using a dedicated pseudo-client/value in UI helpers. Persistence semantics must remain unambiguous and must not create a real client accidentally.

## 10. Analytics

Review analytics may include:

- allocated count
- shared count
- posted count
- conversion rates
- lead time from shared to posted
- platform breakdown
- rating breakdown
- daily progress
- per-member operational progress

Analytics must use the same business state definitions as operational tables.

## 11. Client visibility

Client-facing review data must not expose:

- internal notes
- hidden comments
- internal assignee names unless explicitly allowed
- unrelated client/team data

## 12. Required tests

- valid lifecycle progression
- invalid transition rejection
- reassignment history
- unassigned handling
- cross-client isolation
- duplicate post protection
- client event visibility policy
- analytics consistency with source records
