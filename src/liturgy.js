// The liturgical day of a date in the Roman Rite (the Missal of Paul VI),
// after the General Norms for the Liturgical Year and the Calendar (1969)
// and the General Roman Calendar, with its later changes.
//
// liturgicalDay("2026-11-24") gives the day's key in the Lectionary
// (public/data/lectionary.json), its Sunday cycle and a title, which i18n.js
// puts into words. Only what decides the Gospel is followed: memorials whose
// Gospel is that of the weekday are left out, and so are optional memorials.
//
// Dates are counted in whole days since 1970-01-01, so that time zones and
// summer time play no part.

const MS_PER_DAY = 86400000;
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Where the bishops have moved these days to a Sunday. The defaults are those
// of most countries: Epiphany kept on January 6, the Ascension and Corpus
// Christi on the following Sunday.
export const DEFAULT_OPTIONS = {
  epiphanyOnSunday: false,
  ascensionOnSunday: true,
  corpusChristiOnSunday: true,
};

// The table of precedence (General Norms, no. 59), by number: the smaller
// wins. Only the ranks that occur here are named.
const RANK = {
  triduum: 1,
  privileged: 2, // Christmas, Epiphany, Ascension, Pentecost; the Sundays of
  // Advent, Lent and Easter; Ash Wednesday; Holy Week; the Easter Octave
  solemnity: 3,
  lordFeast: 5,
  sunday: 6, // Sundays of Christmastide and of Ordinary Time
  feast: 7,
  privilegedWeekday: 9, // December 17–24, the Christmas Octave, Lent
  memorial: 10,
  weekday: 13,
};

// The saints' days that change the Gospel, by month and day. Their key in the
// Lectionary is the date: "06-24".
const SANCTORAL = {
  "01-25": RANK.feast, // The Conversion of Saint Paul
  "02-02": RANK.lordFeast, // The Presentation of the Lord
  "02-22": RANK.feast, // The Chair of Saint Peter
  "03-19": RANK.solemnity, // Saint Joseph
  "03-25": RANK.solemnity, // The Annunciation of the Lord
  "04-25": RANK.feast, // Saint Mark
  "05-03": RANK.feast, // Saints Philip and James
  "05-14": RANK.feast, // Saint Matthias
  "05-31": RANK.feast, // The Visitation
  "06-11": RANK.memorial, // Saint Barnabas
  "06-24": RANK.solemnity, // The Nativity of Saint John the Baptist
  "06-29": RANK.solemnity, // Saints Peter and Paul
  "07-03": RANK.feast, // Saint Thomas
  "07-22": RANK.feast, // Saint Mary Magdalene
  "07-25": RANK.feast, // Saint James
  "07-26": RANK.memorial, // Saints Joachim and Anne
  "07-29": RANK.memorial, // Saints Martha, Mary and Lazarus
  "08-06": RANK.lordFeast, // The Transfiguration of the Lord
  "08-10": RANK.feast, // Saint Lawrence
  "08-15": RANK.solemnity, // The Assumption
  "08-24": RANK.feast, // Saint Bartholomew
  "08-29": RANK.memorial, // The Passion of Saint John the Baptist
  "09-08": RANK.feast, // The Nativity of the Blessed Virgin Mary
  "09-14": RANK.lordFeast, // The Exaltation of the Holy Cross
  "09-15": RANK.memorial, // Our Lady of Sorrows
  "09-21": RANK.feast, // Saint Matthew
  "09-29": RANK.feast, // Saints Michael, Gabriel and Raphael
  "10-02": RANK.memorial, // The Holy Guardian Angels
  "10-18": RANK.feast, // Saint Luke
  "10-28": RANK.feast, // Saints Simon and Jude
  "11-01": RANK.solemnity, // All Saints
  "11-02": RANK.solemnity, // All Souls
  "11-09": RANK.lordFeast, // The Dedication of the Lateran Basilica
  "11-30": RANK.feast, // Saint Andrew
  "12-08": RANK.solemnity, // The Immaculate Conception
  "12-26": RANK.feast, // Saint Stephen
  "12-27": RANK.feast, // Saint John
  "12-28": RANK.feast, // The Holy Innocents
};

export function dayNumber(year, month, day) {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function civilDate(n) {
  const date = new Date(n * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

// 0 for Sunday … 6 for Saturday. Day 0 was a Thursday.
export function weekdayOf(n) {
  return (((n + 4) % 7) + 7) % 7;
}

function nextSunday(n) {
  return n + 7 - weekdayOf(n);
}

function sundayOnOrAfter(n) {
  return n + ((7 - weekdayOf(n)) % 7);
}

function sundayOnOrBefore(n) {
  return n - weekdayOf(n);
}

const pad = (number) => String(number).padStart(2, "0");

export function toISODate(n) {
  const { year, month, day } = civilDate(n);
  return `${year}-${pad(month)}-${pad(day)}`;
}

// "2026-11-24" → its day number, or null if it is not a date.
export function parseISODate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? "");
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const n = dayNumber(year, month, day);
  return toISODate(n) === text ? n : null;
}

// Today where the reader is.
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso, days) {
  return toISODate(parseISODate(iso) + days);
}

// Easter Sunday in the Gregorian calendar (the "anonymous" algorithm, as
// given by Meeus), as a day number.
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayNumber(year, month, day);
}

// The movable days of a civil year.
function yearDates(year, options) {
  const easter = easterSunday(year);
  const christmas = dayNumber(year, 12, 25);
  const adventStart = sundayOnOrBefore(dayNumber(year, 12, 24)) - 21;

  const epiphany = options.epiphanyOnSunday
    ? sundayOnOrAfter(dayNumber(year, 1, 2))
    : dayNumber(year, 1, 6);
  // After an Epiphany kept on January 7 or 8, the Baptism is the next day.
  const baptism =
    options.epiphanyOnSunday && epiphany >= dayNumber(year, 1, 7)
      ? epiphany + 1
      : nextSunday(epiphany);

  // The Sunday within the Octave of Christmas, or December 30 when there is none.
  const octaveSunday = sundayOnOrAfter(dayNumber(year, 12, 26));
  const holyFamily =
    octaveSunday <= dayNumber(year, 12, 31) ? octaveSunday : dayNumber(year, 12, 30);

  return {
    epiphany,
    baptism,
    ashWednesday: easter - 46,
    firstSundayOfLent: easter - 42,
    palmSunday: easter - 7,
    easter,
    ascension: options.ascensionOnSunday ? easter + 42 : easter + 39,
    pentecost: easter + 49,
    trinity: easter + 56,
    corpusChristi: options.corpusChristiOnSunday ? easter + 63 : easter + 60,
    sacredHeart: easter + 68,
    christTheKing: adventStart - 7,
    adventStart,
    christmas,
    holyFamily,
  };
}

const named = (key, rank, extra = {}) => ({
  key,
  rank,
  title: { kind: "named", id: key },
  ...extra,
});

// The day of the Proper of Seasons, before any saint's day is weighed.
function temporalDay(n, options) {
  const { year, month, day } = civilDate(n);
  const weekday = weekdayOf(n);
  const dow = WEEKDAY_KEYS[weekday];
  const dates = yearDates(year, options);

  if (n >= dates.adventStart && n < dates.christmas) {
    const week = Math.floor((n - dates.adventStart) / 7) + 1;
    if (weekday === 0) {
      return {
        key: `advent-${week}`,
        rank: RANK.privileged,
        title: { kind: "sunday", season: "advent", week },
      };
    }
    if (month === 12 && day >= 17) {
      return {
        key: `dec-${day}`,
        rank: RANK.privilegedWeekday,
        title: { kind: "seasonDate", season: "advent", month, day },
      };
    }
    return {
      key: `advent-${week}-${dow}`,
      rank: RANK.weekday,
      title: { kind: "weekday", season: "advent", week, weekday },
    };
  }
  if (n >= dates.christmas) {
    return christmastide(n, year, options);
  }
  if (n <= dates.baptism) {
    return christmastide(n, year - 1, options);
  }
  if (n < dates.ashWednesday) {
    return ordinaryTime(Math.floor((n - sundayOnOrBefore(dates.baptism)) / 7) + 1, weekday);
  }
  if (n < dates.firstSundayOfLent) {
    if (n === dates.ashWednesday) {
      return named("ash-wed", RANK.privileged);
    }
    return {
      key: `ash-${dow}`,
      rank: RANK.privilegedWeekday,
      title: { kind: "afterAshWednesday", weekday },
    };
  }
  if (n < dates.palmSunday) {
    const week = Math.floor((n - dates.firstSundayOfLent) / 7) + 1;
    if (weekday === 0) {
      return {
        key: `lent-${week}`,
        rank: RANK.privileged,
        title: { kind: "sunday", season: "lent", week },
      };
    }
    return {
      key: `lent-${week}-${dow}`,
      rank: RANK.privilegedWeekday,
      title: { kind: "weekday", season: "lent", week, weekday },
    };
  }
  if (n < dates.easter) {
    switch (n - dates.palmSunday) {
      case 0:
        return named("palm", RANK.privileged);
      case 4:
        return named("holy-thu", RANK.triduum);
      case 5:
        return named("good-fri", RANK.triduum);
      case 6:
        // No Mass by day; the Easter Vigil is kept in the night that follows.
        return {
          key: "easter-vigil",
          rank: RANK.triduum,
          title: { kind: "named", id: "holy-sat" },
        };
      default:
        return { key: `holy-${dow}`, rank: RANK.privileged, title: { kind: "holyWeek", weekday } };
    }
  }
  if (n <= dates.pentecost) {
    if (n === dates.easter) {
      return named("easter-1", RANK.triduum);
    }
    if (n < dates.easter + 7) {
      return {
        key: `easter-1-${dow}`,
        rank: RANK.privileged,
        title: { kind: "easterOctave", weekday },
      };
    }
    if (n === dates.ascension) {
      return named("ascension", RANK.privileged);
    }
    if (n === dates.pentecost) {
      return named("pentecost", RANK.privileged);
    }
    const week = Math.floor((n - dates.easter) / 7) + 1;
    if (weekday === 0) {
      return {
        key: `easter-${week}`,
        rank: RANK.privileged,
        title: { kind: "sunday", season: "easter", week },
      };
    }
    return {
      key: `easter-${week}-${dow}`,
      rank: RANK.weekday,
      title: { kind: "weekday", season: "easter", week, weekday },
    };
  }

  // Ordinary Time after Pentecost, counted back from Christ the King, the
  // Sunday of the Thirty-Fourth Week.
  if (n === dates.trinity) {
    return named("trinity", RANK.solemnity);
  }
  if (n === dates.corpusChristi) {
    return named("corpus-christi", RANK.solemnity);
  }
  if (n === dates.sacredHeart) {
    return named("sacred-heart", RANK.solemnity);
  }
  if (n === dates.christTheKing) {
    return named("christ-the-king", RANK.solemnity);
  }
  return ordinaryTime(34 - (dates.christTheKing - sundayOnOrBefore(n)) / 7, weekday);
}

function ordinaryTime(week, weekday) {
  if (weekday === 0) {
    return {
      key: `ot-${week}`,
      rank: RANK.sunday,
      title: { kind: "sunday", season: "ordinary", week },
    };
  }
  return {
    key: `ot-${week}-${WEEKDAY_KEYS[weekday]}`,
    rank: RANK.weekday,
    title: { kind: "weekday", season: "ordinary", week, weekday },
  };
}

// From Christmas Day, in `year`, to the Baptism of the Lord.
function christmastide(n, year, options) {
  const dates = yearDates(year, options);
  const next = yearDates(year + 1, options);
  const { month, day } = civilDate(n);
  const weekday = weekdayOf(n);

  if (n === dates.christmas) {
    return named("christmas", RANK.privileged);
  }
  if (n === dates.holyFamily) {
    return named("holy-family", RANK.lordFeast);
  }
  if (month === 12) {
    const octaveDay = day - 24;
    return {
      // December 26–28 are always kept as feasts, which outrank this day.
      key: day >= 29 ? `dec-${day}` : null,
      rank: RANK.privilegedWeekday,
      title: { kind: "christmasOctave", day: octaveDay },
    };
  }
  if (day === 1) {
    return named("mary-mother-of-god", RANK.solemnity);
  }
  if (n === next.epiphany) {
    return named("epiphany", RANK.privileged);
  }
  if (n === next.baptism) {
    return named("baptism", RANK.lordFeast);
  }
  if (n < next.epiphany) {
    if (weekday === 0) {
      return named("christmas-2", RANK.sunday);
    }
    return {
      key: `jan-${day}`,
      rank: RANK.weekday,
      title: { kind: "seasonDate", season: "christmas", month, day },
    };
  }
  // The weekdays after Epiphany: by date (January 7–12) where Epiphany is
  // kept on January 6, by weekday where it is kept on a Sunday.
  if (options.epiphanyOnSunday) {
    return {
      key: `after-epiphany-${weekday}`,
      rank: RANK.weekday,
      title: { kind: "afterEpiphany", weekday },
    };
  }
  return {
    key: `after-epiphany-${n - next.epiphany}`,
    rank: RANK.weekday,
    title: { kind: "seasonDate", season: "christmas", month, day },
  };
}

function monthDay(n) {
  const { month, day } = civilDate(n);
  return `${pad(month)}-${pad(day)}`;
}

// A day is free for a transferred solemnity when nothing ranked 1–8 is kept on it.
function isFree(n, options) {
  if (temporalDay(n, options).rank <= 8) {
    return false;
  }
  const saint = SANCTORAL[monthDay(n)];
  return !saint || saint > 8;
}

// Where a solemnity of the year falls once moved off a day it cannot take
// (General Norms, no. 60), or its own date.
function solemnityDate(date, year, options) {
  const [month, day] = date.split("-").map(Number);
  const own = dayNumber(year, month, day);
  const temporal = temporalDay(own, options);
  // A solemnity of the Lord in the Proper of Seasons outranks a saint's.
  if (temporal.rank > RANK.solemnity) {
    return own;
  }
  const dates = yearDates(year, options);
  // Saint Joseph in Holy Week is kept on the Saturday before Palm Sunday.
  if (date === "03-19" && own >= dates.palmSunday && own < dates.easter + 7) {
    return dates.palmSunday - 1;
  }
  // The Nativity of Saint John the Baptist on the day of the Sacred Heart is
  // kept on the day before.
  if (date === "06-24" && own === dates.sacredHeart) {
    return own - 1;
  }
  let n = own + 1;
  while (!isFree(n, options)) {
    n += 1;
  }
  return n;
}

// The saint's day, if any, that a date keeps: its own, or a solemnity
// transferred to it.
function sanctoralDay(n, options) {
  const { year } = civilDate(n);
  for (const [date, rank] of Object.entries(SANCTORAL)) {
    if (rank === RANK.solemnity) {
      const kept = solemnityDate(date, year, options);
      if (kept === n) {
        return {
          key: date,
          rank,
          title: { kind: "named", id: date },
          transferred: kept !== dayNumber(year, ...date.split("-").map(Number)),
        };
      }
    }
  }
  const date = monthDay(n);
  const rank = SANCTORAL[date];
  if (rank && rank !== RANK.solemnity) {
    return { key: date, rank, title: { kind: "named", id: date } };
  }
  return null;
}

// The memorials of Mary that follow Pentecost.
function movableMemorial(n, options) {
  const { easter } = yearDates(civilDate(n).year, options);
  if (n === easter + 50) {
    return named("mary-mother-of-the-church", RANK.memorial);
  }
  if (n === easter + 69) {
    return named("immaculate-heart", RANK.memorial);
  }
  return null;
}

// The Sunday cycle of the liturgical year a day belongs to: A, B or C. The
// year that ends in a multiple of 3 is Year C.
export function sundayCycle(n) {
  const { year } = civilDate(n);
  const adventStart = sundayOnOrBefore(dayNumber(year, 12, 24)) - 21;
  const ending = n >= adventStart ? year + 1 : year;
  return ["C", "A", "B"][ending % 3];
}

export function liturgicalDay(iso, options = DEFAULT_OPTIONS) {
  const n = parseISODate(iso);
  if (n === null) {
    throw new Error(`not a date: ${iso}`);
  }
  const temporal = temporalDay(n, options);
  // The higher rank wins; on equal rank, the Proper of Seasons does.
  let day = temporal;
  for (const candidate of [sanctoralDay(n, options), movableMemorial(n, options)]) {
    if (candidate && candidate.rank < day.rank) {
      day = candidate;
    }
  }
  return {
    date: iso,
    weekday: weekdayOf(n),
    cycle: sundayCycle(n),
    key: day.key,
    title: day.title,
    transferred: Boolean(day.transferred),
  };
}

// The day's entry in the Lectionary: its own for the year's cycle, or the one
// for every year.
export function lectionaryEntry(lectionary, day) {
  return lectionary[`${day.key}@${day.cycle}`] ?? lectionary[day.key] ?? null;
}
