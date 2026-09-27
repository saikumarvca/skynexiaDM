import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { clampPage, clampPageSize, paginate } from "@/lib/client-portal/dto";

describe("clampPage", () => {
  test("accepts positive integers and falls back otherwise", () => {
    assert.equal(clampPage("3"), 3);
    assert.equal(clampPage("1"), 1);
    assert.equal(clampPage("0"), 1);
    assert.equal(clampPage("-4"), 1);
    assert.equal(clampPage("abc"), 1);
    assert.equal(clampPage(""), 1);
    assert.equal(clampPage(null), 1);
    assert.equal(clampPage(null, 5), 5);
    assert.equal(clampPage("2.9"), 2, "parses as an integer");
  });
});

describe("clampPageSize", () => {
  test("bounds the page size between 1 and max", () => {
    assert.equal(clampPageSize("10"), 10);
    assert.equal(clampPageSize("100"), 100);
    assert.equal(clampPageSize("1000"), 100, "capped at the default max");
    assert.equal(clampPageSize("1000", 20, 25), 25, "custom max");
    assert.equal(clampPageSize("0"), 20);
    assert.equal(clampPageSize("-1"), 20);
    assert.equal(clampPageSize("NaN"), 20);
    assert.equal(clampPageSize(null), 20);
    assert.equal(clampPageSize(null, 50), 50);
  });
});

describe("paginate", () => {
  test("computes totalPages with a floor of 1", () => {
    assert.equal(paginate([], 1, 20, 0).totalPages, 1);
    assert.equal(paginate([], 1, 20, 20).totalPages, 1);
    assert.equal(paginate([], 1, 20, 21).totalPages, 2);
    assert.equal(paginate([], 3, 7, 50).totalPages, 8);
  });

  test("echoes the inputs", () => {
    const items = ["a", "b"];
    assert.deepEqual(paginate(items, 2, 2, 5), {
      items,
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3,
    });
  });
});
