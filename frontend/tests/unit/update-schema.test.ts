/**
 * Request bodies for staff-managed client updates. The PATCH schema must not
 * inject defaults: zod 4 keeps `.default()` under `.partial()`, which once
 * made a title edit publish a draft and reset its category.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { clientUpdatePatchSchema, clientUpdateSchema } from "@/lib/client-portal/update-schema";

describe("clientUpdateSchema (create)", () => {
  test("applies defaults and trims text", () => {
    const parsed = clientUpdateSchema.parse({ title: "  Hello  ", body: " world " });
    assert.equal(parsed.title, "Hello");
    assert.equal(parsed.body, "world");
    assert.equal(parsed.category, "ANNOUNCEMENT");
    assert.equal(parsed.isPublished, true);
  });

  test("rejects blank, oversized and unknown fields", () => {
    assert.equal(clientUpdateSchema.safeParse({ title: "   ", body: "x" }).success, false);
    assert.equal(clientUpdateSchema.safeParse({ title: "x".repeat(161), body: "x" }).success, false);
    assert.equal(clientUpdateSchema.safeParse({ title: "t", body: "b", clientId: "1" }).success, false);
    assert.equal(clientUpdateSchema.safeParse({ title: "t", body: "b", category: "GOSSIP" }).success, false);
  });

  test("only accepts http(s) links", () => {
    const ok = (linkUrl: unknown) => clientUpdateSchema.safeParse({ title: "t", body: "b", linkUrl }).success;
    assert.equal(ok("https://example.com/report"), true);
    assert.equal(ok("http://example.com"), true);
    assert.equal(ok(""), true, "empty string means no link");
    assert.equal(ok(null), true);
    assert.equal(ok("javascript:alert(1)"), false);
    assert.equal(ok("ftp://example.com"), false);
    assert.equal(ok("example.com"), false);
  });
});

describe("clientUpdatePatchSchema (edit)", () => {
  test("keeps only the fields that were sent", () => {
    assert.deepEqual(clientUpdatePatchSchema.parse({ title: "New title" }), { title: "New title" });
    assert.deepEqual(clientUpdatePatchSchema.parse({ isPublished: false }), { isPublished: false });
    assert.deepEqual(clientUpdatePatchSchema.parse({}), {});
  });

  test("still validates the fields it receives", () => {
    assert.equal(clientUpdatePatchSchema.safeParse({ title: "" }).success, false);
    assert.equal(clientUpdatePatchSchema.safeParse({ category: "GOSSIP" }).success, false);
    assert.equal(clientUpdatePatchSchema.safeParse({ isPublished: "yes" }).success, false);
    assert.equal(clientUpdatePatchSchema.safeParse({ linkUrl: "javascript:void(0)" }).success, false);
    assert.equal(clientUpdatePatchSchema.safeParse({ clientId: "1" }).success, false, "strict");
  });
});
