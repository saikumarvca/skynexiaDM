import test from "node:test";
import assert from "node:assert/strict";
import {
  decideMarkPosted,
  decideMarkShared,
} from "@/lib/reviews/review-state-machine";

test("mark shared allows Assigned and is idempotent when already shared", () => {
  assert.deepEqual(decideMarkShared("Assigned"), { kind: "transition" });
  assert.deepEqual(decideMarkShared("Shared with Customer"), {
    kind: "idempotent",
  });
});

test("mark shared rejects backward or terminal transitions", () => {
  for (const status of ["Unassigned", "Posted", "Used", "Cancelled"] as const) {
    assert.equal(decideMarkShared(status).kind, "invalid", status);
  }
});

test("mark posted allows Shared and is idempotent when already posted", () => {
  assert.deepEqual(decideMarkPosted("Shared with Customer"), {
    kind: "transition",
  });
  assert.deepEqual(decideMarkPosted("Posted"), { kind: "idempotent" });
});

test("mark posted rejects out-of-order transitions", () => {
  for (const status of ["Unassigned", "Assigned", "Used", "Cancelled"] as const) {
    assert.equal(decideMarkPosted(status).kind, "invalid", status);
  }
});
