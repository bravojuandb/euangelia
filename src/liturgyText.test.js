import assert from "node:assert/strict";
import { test } from "node:test";
import { longDate } from "./liturgyText.js";

test("The date of the last revision in each interface language", () => {
  const date = "2026-11-27";
  assert.equal(longDate("es", date, "long"), "27 de noviembre de 2026");
  assert.equal(longDate("en", date, "long"), "November 27, 2026");
  assert.equal(longDate("fr", date, "long"), "27 novembre 2026");
  assert.equal(longDate("it", date, "long"), "27 novembre 2026");
  assert.equal(longDate("pl", date, "long"), "27 listopada 2026");
});

test("The first and last days of a year keep their day in any time zone", () => {
  assert.equal(longDate("en", "2026-01-01", "long"), "January 1, 2026");
  assert.equal(longDate("en", "2026-12-31", "long"), "December 31, 2026");
});
