import type { AllocationStatus } from "@/models/ReviewAllocation";

export type ReviewTransitionDecision =
  | { kind: "transition" }
  | { kind: "idempotent" }
  | { kind: "invalid"; from: AllocationStatus; to: AllocationStatus };

export function decideMarkShared(
  status: AllocationStatus,
): ReviewTransitionDecision {
  if (status === "Assigned") return { kind: "transition" };
  if (status === "Shared with Customer") return { kind: "idempotent" };
  return { kind: "invalid", from: status, to: "Shared with Customer" };
}

export function decideMarkPosted(
  status: AllocationStatus,
): ReviewTransitionDecision {
  if (status === "Shared with Customer") return { kind: "transition" };
  if (status === "Posted") return { kind: "idempotent" };
  return { kind: "invalid", from: status, to: "Posted" };
}
