import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  addDays,
  easterSunday,
  lectionaryEntry,
  liturgicalDay,
  parseISODate,
  toISODate,
} from "./liturgy.js";

const lectionary = JSON.parse(
  readFileSync(new URL("../public/data/lectionary.json", import.meta.url), "utf8"),
);

const keyOf = (date, options) => liturgicalDay(date, options).key;

test("Easter Sunday", () => {
  const known = {
    1818: "1818-03-22",
    1943: "1943-04-25",
    2019: "2019-04-21",
    2024: "2024-03-31",
    2025: "2025-04-20",
    2026: "2026-04-05",
    2027: "2027-03-28",
    2038: "2038-04-25",
  };
  for (const [year, date] of Object.entries(known)) {
    assert.equal(toISODate(easterSunday(Number(year))), date);
  }
});

test("dates", () => {
  assert.equal(parseISODate("2026-02-30"), null);
  assert.equal(parseISODate("2026-2-3"), null);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-03-01", -1), "2024-02-29");
});

test("Sunday cycle", () => {
  assert.equal(liturgicalDay("2025-11-29").cycle, "C");
  assert.equal(liturgicalDay("2025-11-30").cycle, "A");
  assert.equal(liturgicalDay("2026-11-28").cycle, "A");
  assert.equal(liturgicalDay("2026-11-29").cycle, "B");
  assert.equal(liturgicalDay("2027-12-25").cycle, "C");
});

test("Advent and Christmas", () => {
  assert.equal(keyOf("2026-11-29"), "advent-1");
  assert.equal(keyOf("1994-11-28"), "advent-1-mon");
  assert.equal(keyOf("2026-11-30"), "11-30"); // Saint Andrew
  assert.equal(keyOf("2026-12-16"), "advent-3-wed");
  assert.equal(keyOf("2026-12-17"), "dec-17");
  assert.equal(keyOf("2026-12-20"), "advent-4");
  assert.equal(keyOf("2026-12-25"), "christmas");
  assert.equal(keyOf("2026-12-26"), "12-26");
  assert.equal(keyOf("2026-12-27"), "holy-family"); // Sunday: Saint John gives way
  assert.equal(keyOf("2026-12-29"), "dec-29");
  assert.equal(keyOf("2022-12-30"), "holy-family"); // Christmas on a Sunday
  assert.equal(keyOf("2027-01-01"), "mary-mother-of-god");
  assert.equal(keyOf("2027-01-02"), "jan-2");
  assert.equal(keyOf("2027-01-03"), "christmas-2");
  assert.equal(keyOf("2027-01-06"), "epiphany");
  assert.equal(keyOf("2027-01-07"), "after-epiphany-1");
  assert.equal(keyOf("2027-01-09"), "after-epiphany-3");
  assert.equal(keyOf("2027-01-10"), "baptism");
  assert.equal(keyOf("2027-01-11"), "ot-1-mon");
});

test("Epiphany on a Sunday", () => {
  const options = { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true };
  assert.equal(keyOf("2027-01-03", options), "epiphany");
  assert.equal(keyOf("2027-01-04", options), "after-epiphany-1");
  assert.equal(keyOf("2027-01-09", options), "after-epiphany-6");
  assert.equal(keyOf("2027-01-10", options), "baptism");
  // Epiphany on January 8: the Baptism of the Lord is on Monday the 9th.
  assert.equal(keyOf("2023-01-07", options), "jan-7");
  assert.equal(keyOf("2023-01-08", options), "epiphany");
  assert.equal(keyOf("2023-01-09", options), "baptism");
  assert.equal(keyOf("2023-01-10", options), "ot-1-tue");
  assert.equal(keyOf("2023-01-15", options), "ot-2");
});

test("Lent, Holy Week and Easter", () => {
  assert.equal(keyOf("2026-02-17"), "ot-6-tue");
  assert.equal(keyOf("2026-02-18"), "ash-wed");
  assert.equal(keyOf("2026-02-19"), "ash-thu");
  assert.equal(keyOf("2026-02-22"), "lent-1"); // the Chair of Saint Peter gives way
  assert.equal(keyOf("2026-02-23"), "lent-1-mon");
  assert.equal(keyOf("2026-03-29"), "palm");
  assert.equal(keyOf("2026-03-30"), "holy-mon");
  assert.equal(keyOf("2026-04-02"), "holy-thu");
  assert.equal(keyOf("2026-04-03"), "good-fri");
  assert.equal(keyOf("2026-04-04"), "easter-vigil");
  assert.equal(keyOf("2026-04-05"), "easter-1");
  assert.equal(keyOf("2026-04-06"), "easter-1-mon");
  assert.equal(keyOf("2026-04-12"), "easter-2");
  assert.equal(keyOf("2026-04-27"), "easter-4-mon");
  assert.equal(keyOf("2026-05-14"), "05-14"); // Saint Matthias
  assert.equal(keyOf("2027-05-06"), "easter-6-thu");
  assert.equal(keyOf("2026-05-17"), "ascension");
  assert.equal(keyOf("2026-05-24"), "pentecost");
  const thursday = {
    epiphanyOnSunday: false,
    ascensionOnSunday: false,
    corpusChristiOnSunday: false,
  };
  assert.equal(keyOf("2027-05-06", thursday), "ascension");
  assert.equal(keyOf("2026-05-17", thursday), "easter-7");
  assert.equal(keyOf("2026-06-04", thursday), "corpus-christi");
});

test("Ordinary Time after Pentecost", () => {
  assert.equal(keyOf("2026-05-25"), "mary-mother-of-the-church");
  assert.equal(keyOf("2026-05-26"), "ot-8-tue");
  assert.equal(keyOf("2026-05-31"), "trinity");
  assert.equal(keyOf("2026-06-07"), "corpus-christi");
  assert.equal(keyOf("2026-06-12"), "sacred-heart");
  assert.equal(keyOf("2026-06-13"), "immaculate-heart");
  assert.equal(keyOf("2026-11-01"), "11-01"); // All Saints on a Sunday
  assert.equal(keyOf("2026-11-22"), "christ-the-king");
  assert.equal(keyOf("2026-11-24"), "ot-34-tue");
  assert.equal(keyOf("2025-06-10"), "ot-10-tue");
  assert.equal(keyOf("2028-08-06"), "08-06"); // the Transfiguration on a Sunday
});

test("transferred solemnities", () => {
  // The Annunciation in Holy Week, 2024, and on Easter Sunday, 2035.
  assert.equal(keyOf("2024-03-25"), "holy-mon");
  assert.deepEqual([keyOf("2024-04-08"), liturgicalDay("2024-04-08").transferred], ["03-25", true]);
  assert.equal(keyOf("2035-04-02"), "03-25");
  // Saint Joseph in Holy Week is kept on the Saturday before Palm Sunday.
  assert.equal(keyOf("2035-03-17"), "03-19");
  assert.equal(keyOf("2035-03-19"), "holy-mon");
  assert.equal(keyOf("2027-03-19"), "03-19"); // a Friday of Lent
  // The Immaculate Conception on a Sunday of Advent.
  assert.equal(keyOf("2024-12-08"), "advent-2");
  assert.equal(keyOf("2024-12-09"), "12-08");
  // Saint John the Baptist on the day of the Sacred Heart.
  assert.equal(keyOf("2022-06-24"), "sacred-heart");
  assert.equal(keyOf("2022-06-23"), "06-24");
});

test("every day from 1990 to 2100 has a Gospel", () => {
  const variants = [
    undefined,
    { epiphanyOnSunday: true, ascensionOnSunday: false, corpusChristiOnSunday: false },
  ];
  for (const options of variants) {
    for (let date = "1990-01-01"; date < "2101-01-01"; date = addDays(date, 1)) {
      const day = liturgicalDay(date, options);
      const entry = lectionaryEntry(lectionary, day);
      assert.ok(entry, `${date}: no Gospel for ${day.key} (${day.cycle})`);
    }
  }
});

test("every Gospel in the Lectionary is reached", () => {
  const reached = new Set();
  const variants = [
    undefined,
    { epiphanyOnSunday: true, ascensionOnSunday: false, corpusChristiOnSunday: false },
  ];
  for (const options of variants) {
    for (let date = "1990-01-01"; date < "2101-01-01"; date = addDays(date, 1)) {
      const day = liturgicalDay(date, options);
      reached.add(lectionary[`${day.key}@${day.cycle}`] ? `${day.key}@${day.cycle}` : day.key);
    }
  }
  const unreached = Object.keys(lectionary).filter((key) => !reached.has(key));
  assert.deepEqual(unreached, []);
});
