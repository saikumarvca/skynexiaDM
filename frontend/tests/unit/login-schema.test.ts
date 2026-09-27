import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  TEMP_PASSWORD_ALPHABET,
  createClientLoginSchema,
  formatTemporaryPassword,
  updateClientLoginSchema,
} from "@/lib/client-portal/login-schema";

describe("createClientLoginSchema", () => {
  test("normalises the email and defaults sendInvite", () => {
    const parsed = createClientLoginSchema.parse({ email: "  Owner@Client.COM " });
    assert.equal(parsed.email, "owner@client.com");
    assert.equal(parsed.sendInvite, true);
    assert.equal(parsed.name, undefined);
  });

  test("rejects bad emails, blank names and unknown fields", () => {
    assert.equal(createClientLoginSchema.safeParse({ email: "nope" }).success, false);
    assert.equal(createClientLoginSchema.safeParse({ email: "a@b.co", name: "  " }).success, false);
    assert.equal(createClientLoginSchema.safeParse({ email: "a@b.co", role: "ADMIN" }).success, false);
    assert.equal(createClientLoginSchema.safeParse({ email: "a@b.co", password: "x" }).success, false);
    assert.equal(createClientLoginSchema.safeParse({}).success, false);
  });
});

describe("updateClientLoginSchema", () => {
  test("needs at least one field and nothing else", () => {
    assert.equal(updateClientLoginSchema.safeParse({}).success, false);
    assert.equal(updateClientLoginSchema.safeParse({ isActive: false }).success, true);
    assert.equal(updateClientLoginSchema.safeParse({ name: "New" }).success, true);
    assert.equal(updateClientLoginSchema.safeParse({ isActive: "no" }).success, false);
    assert.equal(updateClientLoginSchema.safeParse({ clientId: "1" }).success, false);
    assert.equal(updateClientLoginSchema.safeParse({ email: "x@y.z" }).success, false, "email is not editable");
  });
});

describe("formatTemporaryPassword", () => {
  test("is 4 groups of 4 from the look-alike-free alphabet", () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, i) => i * 37);
    const pw = formatTemporaryPassword(bytes);
    assert.match(pw, /^[^-]{4}-[^-]{4}-[^-]{4}-[^-]{4}$/);
    for (const ch of pw.replace(/-/g, "")) assert.ok(TEMP_PASSWORD_ALPHABET.includes(ch), ch);
    assert.ok(!/[0OIl1]/.test(pw));
    assert.equal(pw.length, 19);
  });

  test("depends on the input bytes", () => {
    const a = formatTemporaryPassword(Uint8Array.from({ length: 16 }, () => 3));
    const b = formatTemporaryPassword(Uint8Array.from({ length: 16 }, () => 9));
    assert.notEqual(a, b);
    assert.equal(a, formatTemporaryPassword(Uint8Array.from({ length: 16 }, () => 3)), "deterministic");
  });
});
