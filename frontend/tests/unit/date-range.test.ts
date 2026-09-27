import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_RANGE_DAYS,
  eachDay,
  parseClientDateRange,
  pctChange,
} from "@/lib/client-portal/date-range";

// A fixed "now" in the middle of the day so UTC-day boundaries are unambiguous.
const NOW = new Date("2026-03-15T12:34:56.000Z");
const parse = (params: Parameters<typeof parseClientDateRange>[0]) =>
  parseClientDateRange({ ...params, now: NOW });

describe("presets", () => {
  test("7d / 30d / 90d end today and span exactly N days", () => {
    for (const [key, days] of [["7d", 7], ["30d", 30], ["90d", 90]] as const) {
      const r = parse({ range: key });
      assert.equal(r.key, key);
      assert.equal(r.days, days);
      assert.equal(r.toIso, "2026-03-15");
      assert.equal(eachDay(r).length, days);
      assert.equal(eachDay(r).at(-1), "2026-03-15");
    }
    assert.equal(parse({ range: "7d" }).fromIso, "2026-03-09");
  });

  test("month runs from the 1st to today; prev_month covers the whole previous month", () => {
    const month = parse({ range: "month" });
    assert.equal(month.fromIso, "2026-03-01");
    assert.equal(month.toIso, "2026-03-15");
    assert.equal(month.days, 15);

    const prev = parse({ range: "prev_month" });
    assert.equal(prev.fromIso, "2026-02-01");
    assert.equal(prev.toIso, "2026-02-28");
    assert.equal(prev.days, 28);
  });

  test("prev_month in January rolls back a year", () => {
    const r = parseClientDateRange({ range: "prev_month", now: new Date("2026-01-10T00:00:00Z") });
    assert.equal(r.fromIso, "2025-12-01");
    assert.equal(r.toIso, "2025-12-31");
  });

  test("unknown or missing range falls back to 30d", () => {
    assert.equal(parse({}).key, "30d");
    assert.equal(parse({ range: "1y" }).key, "30d");
    assert.equal(parse({ range: null }).days, 30);
  });
});

describe("custom ranges", () => {
  test("uses the given bounds, inclusive", () => {
    const r = parse({ range: "custom", from: "2026-02-01", to: "2026-02-10" });
    assert.equal(r.key, "custom");
    assert.equal(r.days, 10);
    assert.equal(r.label, "2026-02-01 to 2026-02-10");
    assert.equal(r.from.toISOString(), "2026-02-01T00:00:00.000Z");
    assert.equal(r.to.toISOString(), "2026-02-10T23:59:59.999Z");
  });

  test("swaps reversed bounds", () => {
    const r = parse({ range: "custom", from: "2026-02-10", to: "2026-02-01" });
    assert.equal(r.fromIso, "2026-02-01");
    assert.equal(r.toIso, "2026-02-10");
  });

  test("fills a missing bound (to = today, from = 30 days before to)", () => {
    const onlyFrom = parse({ range: "custom", from: "2026-03-10" });
    assert.equal(onlyFrom.toIso, "2026-03-15");
    const onlyTo = parse({ range: "custom", to: "2026-03-10" });
    assert.equal(onlyTo.fromIso, "2026-02-09");
    assert.equal(onlyTo.days, 30);
  });

  test("ignores malformed dates and falls back to 30d when both are bad", () => {
    const r = parse({ range: "custom", from: "15/03/2026", to: "yesterday" });
    assert.equal(r.key, "30d");
    const half = parse({ range: "custom", from: "2026-02-30", to: "2026-03-01" });
    assert.equal(half.toIso, "2026-03-01", "invalid calendar date is dropped");
  });

  test("caps the span at MAX_RANGE_DAYS, keeping the end date", () => {
    const r = parse({ range: "custom", from: "2020-01-01", to: "2026-03-01" });
    assert.equal(r.days, MAX_RANGE_DAYS);
    assert.equal(r.toIso, "2026-03-01");
    assert.equal(eachDay(r).length, MAX_RANGE_DAYS);
  });
});

describe("previous window", () => {
  test("is the same length and ends the day before the range starts", () => {
    for (const range of ["7d", "30d", "month", "prev_month"] as const) {
      const r = parse({ range });
      assert.equal(eachDay({ ...r, from: r.previousFrom, to: r.previousTo }).length, r.days, `${range}: previous window length`);
      assert.equal(r.previousTo.toISOString().slice(11), "23:59:59.999Z");
      assert.equal(
        r.previousTo.toISOString(),
        new Date(r.from.getTime() - 1).toISOString(),
        `${range}: previous window ends right before the range`,
      );
    }
  });
});

test("pctChange rounds and returns null for a zero baseline", () => {
  assert.equal(pctChange(0, 0), null);
  assert.equal(pctChange(5, 0), null);
  assert.equal(pctChange(150, 100), 50);
  assert.equal(pctChange(50, 100), -50);
  assert.equal(pctChange(2, 3), -33);
});
