// The words of the Gospel of the day, keyed by interface language like
// i18n.js: the names of the liturgical days, the Lectionary's announcement of
// the Gospel, and references in each language's style. Names follow the
// Missal in that language. French text uses no-break spaces (U+00A0) before
// ; : ! ? and inside « ».

import { LANG } from "./config.js";

const ROMAN = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function roman(number) {
  let rest = number;
  let result = "";
  for (const [value, numeral] of ROMAN) {
    while (rest >= value) {
      result += numeral;
      rest -= value;
    }
  }
  return result;
}

const ENGLISH_ORDINALS = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
  "Thirteenth",
  "Fourteenth",
  "Fifteenth",
  "Sixteenth",
  "Seventeenth",
  "Eighteenth",
  "Nineteenth",
];
const ENGLISH_TENS = { 2: "Twent", 3: "Thirt" };

function englishOrdinal(number) {
  if (number < 20) {
    return ENGLISH_ORDINALS[number];
  }
  const tens = ENGLISH_TENS[Math.floor(number / 10)];
  const ones = number % 10;
  return ones ? `${tens}y-${ENGLISH_ORDINALS[ones]}` : `${tens}ieth`;
}

const frenchOrdinal = (number, feminine) =>
  number === 1 ? (feminine ? "1re" : "1er") : `${number}e`;

const capitalize = (text) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

// A day number's date, written in the language.
function formatDate(lang, n, options) {
  return new Intl.DateTimeFormat(lang, { ...options, timeZone: "UTC" }).format(
    new Date(n * 86400000),
  );
}

function weekdayName(lang, weekday) {
  // 1970-01-04 was a Sunday: day 3.
  return capitalize(formatDate(lang, 3 + weekday, { weekday: "long" }));
}

function monthDayName(lang, month, day) {
  return formatDate(lang, Math.round(Date.UTC(2001, month - 1, day) / 86400000), {
    day: "numeric",
    month: "long",
  });
}

// "1:16, 18-21, 24a", "26:14-27:66", "15:26-27; 16:12-15" in a language's
// style: `chapter` between chapter and verse, `item` between verses,
// `across` in a range into another chapter.
function referenceFormatter({ chapter, item, across }) {
  return (ref) =>
    ref
      .split("; ")
      .map((group) => {
        const [c, items] = group.split(/:(.*)/s);
        const verses = items
          .split(", ")
          .map((part) => part.replace(/-(\d+):(\d+\w?)$/, `${across}$1${chapter}$2`));
        return `${c}${chapter}${verses.join(item)}`;
      })
      .join("; ");
}

const commaStyle = referenceFormatter({ chapter: ", ", item: ". ", across: " – " });

// The Latin and Greek columns announce the Gospel as their own liturgies do.
export const COLUMN_WORDS = {
  [LANG.latin]: {
    incipit: {
      matthew: "Lectio sancti Evangelii secundum Matthaeum",
      mark: "Lectio sancti Evangelii secundum Marcum",
      luke: "Lectio sancti Evangelii secundum Lucam",
      john: "Lectio sancti Evangelii secundum Ioannem",
    },
    books: { matthew: "Mt", mark: "Mc", luke: "Lc", john: "Io" },
    reference: commaStyle,
  },
  [LANG.greekText]: {
    incipit: {
      matthew: "Ἐκ τοῦ κατὰ Ματθαῖον ἁγίου Εὐαγγελίου τὸ ἀνάγνωσμα",
      mark: "Ἐκ τοῦ κατὰ Μᾶρκον ἁγίου Εὐαγγελίου τὸ ἀνάγνωσμα",
      luke: "Ἐκ τοῦ κατὰ Λουκᾶν ἁγίου Εὐαγγελίου τὸ ἀνάγνωσμα",
      john: "Ἐκ τοῦ κατὰ Ἰωάννην ἁγίου Εὐαγγελίου τὸ ἀνάγνωσμα",
    },
    books: { matthew: "Μτ", mark: "Μκ", luke: "Λκ", john: "Ἰω" },
    reference: commaStyle,
  },
};

const SEASONS_ES = {
  advent: ["de Adviento", "de Adviento"],
  lent: ["de Cuaresma", "de Cuaresma"],
  easter: ["de Pascua", "de Pascua"],
  ordinary: ["del Tiempo Ordinario", "del Tiempo Ordinario"],
};

export const LITURGY = {
  es: {
    today: "Hoy",
    title: "Evangelio del día",
    previous: "Día anterior",
    next: "Día siguiente",
    date: "Fecha",
    options: "Evangelios de este día",
    inContext: "Leer en su contexto",
    transferred: "Trasladada a este día",
    incipit: {
      matthew: "Lectura del santo Evangelio según san Mateo",
      mark: "Lectura del santo Evangelio según san Marcos",
      luke: "Lectura del santo Evangelio según san Lucas",
      john: "Lectura del santo Evangelio según san Juan",
    },
    books: { matthew: "Mt", mark: "Mc", luke: "Lc", john: "Jn" },
    reference: commaStyle,
    labels: {
      vigil: "Misa de la vigilia",
      night: "Misa de la noche",
      dawn: "Misa de la aurora",
      day: "Misa del día",
      evening: "Misa vespertina",
      procession: "Procesión de ramos",
      passion: "Pasión",
      chrism: "Misa crismal",
      supper: "Misa de la Cena del Señor",
      short: "Forma breve",
      yearA: "Lecturas del ciclo A",
      optional: "Misa opcional de la semana",
    },
    sunday: (season, week) => `Domingo ${roman(week)} ${SEASONS_ES[season][0]}`,
    weekday: (season, week, day) => `${day} de la ${roman(week)} semana ${SEASONS_ES[season][1]}`,
    seasonDate: (season, date) =>
      `${date}, feria ${season === "advent" ? "de Adviento" : "de Navidad"}`,
    christmasOctave: (day) => `Día ${roman(day)} de la Octava de Navidad`,
    afterAshWednesday: (day) => `${day} después de Ceniza`,
    holyWeek: (day) => `${day} Santo`,
    easterOctave: (day) => `${day} de la Octava de Pascua`,
    afterEpiphany: (day) => `${day} después de la Epifanía`,
    names: {
      christmas: "Natividad del Señor",
      "holy-family": "La Sagrada Familia de Jesús, María y José",
      "mary-mother-of-god": "Santa María, Madre de Dios",
      "christmas-2": "Domingo II después de Navidad",
      epiphany: "Epifanía del Señor",
      baptism: "Bautismo del Señor",
      "ash-wed": "Miércoles de Ceniza",
      palm: "Domingo de Ramos en la Pasión del Señor",
      "holy-thu": "Jueves Santo",
      "good-fri": "Viernes Santo de la Pasión del Señor",
      "holy-sat": "Sábado Santo · Vigilia pascual",
      "easter-1": "Domingo de Pascua de la Resurrección del Señor",
      ascension: "Ascensión del Señor",
      pentecost: "Domingo de Pentecostés",
      trinity: "La Santísima Trinidad",
      "corpus-christi": "El Santísimo Cuerpo y Sangre de Cristo",
      "sacred-heart": "El Sagrado Corazón de Jesús",
      "christ-the-king": "Jesucristo, Rey del Universo",
      "mary-mother-of-the-church": "Bienaventurada Virgen María, Madre de la Iglesia",
      "immaculate-heart": "Inmaculado Corazón de la Bienaventurada Virgen María",
      "01-25": "La Conversión de san Pablo, apóstol",
      "02-02": "La Presentación del Señor",
      "02-22": "La Cátedra de san Pedro, apóstol",
      "03-19": "San José, esposo de la Bienaventurada Virgen María",
      "03-25": "La Anunciación del Señor",
      "04-25": "San Marcos, evangelista",
      "05-03": "Santos Felipe y Santiago, apóstoles",
      "05-14": "San Matías, apóstol",
      "05-31": "La Visitación de la Bienaventurada Virgen María",
      "06-11": "San Bernabé, apóstol",
      "06-24": "La Natividad de san Juan Bautista",
      "06-29": "Santos Pedro y Pablo, apóstoles",
      "07-03": "Santo Tomás, apóstol",
      "07-22": "Santa María Magdalena",
      "07-25": "Santiago, apóstol",
      "07-26": "San Joaquín y santa Ana, padres de la Bienaventurada Virgen María",
      "07-29": "Santos Marta, María y Lázaro",
      "08-06": "La Transfiguración del Señor",
      "08-10": "San Lorenzo, diácono y mártir",
      "08-15": "La Asunción de la Bienaventurada Virgen María",
      "08-24": "San Bartolomé, apóstol",
      "08-29": "El Martirio de san Juan Bautista",
      "09-08": "La Natividad de la Bienaventurada Virgen María",
      "09-14": "La Exaltación de la Santa Cruz",
      "09-15": "Nuestra Señora de los Dolores",
      "09-21": "San Mateo, apóstol y evangelista",
      "09-29": "Santos Miguel, Gabriel y Rafael, arcángeles",
      "10-02": "Los Santos Ángeles Custodios",
      "10-18": "San Lucas, evangelista",
      "10-28": "Santos Simón y Judas, apóstoles",
      "11-01": "Todos los Santos",
      "11-02": "Conmemoración de todos los fieles difuntos",
      "11-09": "La Dedicación de la Basílica de Letrán",
      "11-30": "San Andrés, apóstol",
      "12-08": "La Inmaculada Concepción de la Bienaventurada Virgen María",
      "12-26": "San Esteban, protomártir",
      "12-27": "San Juan, apóstol y evangelista",
      "12-28": "Los Santos Inocentes, mártires",
    },
  },

  en: {
    today: "Today",
    title: "Gospel of the Day",
    previous: "Previous day",
    next: "Next day",
    date: "Date",
    options: "Gospels of this day",
    inContext: "Read it in context",
    transferred: "Transferred to this day",
    incipit: {
      matthew: "A reading from the holy Gospel according to Matthew",
      mark: "A reading from the holy Gospel according to Mark",
      luke: "A reading from the holy Gospel according to Luke",
      john: "A reading from the holy Gospel according to John",
    },
    books: { matthew: "Mt", mark: "Mk", luke: "Lk", john: "Jn" },
    reference: referenceFormatter({ chapter: ":", item: ", ", across: "–" }),
    labels: {
      vigil: "Vigil Mass",
      night: "Mass during the Night",
      dawn: "Mass at Dawn",
      day: "Mass during the Day",
      evening: "Evening Mass",
      procession: "Procession with Palms",
      passion: "The Passion",
      chrism: "Chrism Mass",
      supper: "Mass of the Lord’s Supper",
      short: "Shorter form",
      yearA: "Year A readings",
      optional: "Optional Mass of the week",
    },
    sunday: (season, week) =>
      season === "ordinary"
        ? `${englishOrdinal(week)} Sunday in Ordinary Time`
        : `${englishOrdinal(week)} Sunday of ${{ advent: "Advent", lent: "Lent", easter: "Easter" }[season]}`,
    weekday: (season, week, day) =>
      season === "ordinary"
        ? `${day} of the ${englishOrdinal(week)} Week in Ordinary Time`
        : `${day} of the ${englishOrdinal(week)} Week of ${{ advent: "Advent", lent: "Lent", easter: "Easter" }[season]}`,
    seasonDate: (season, date) =>
      `${date}, ${season === "advent" ? "Advent" : "Christmas"} Weekday`,
    christmasOctave: (day) => `${englishOrdinal(day)} Day within the Octave of Christmas`,
    afterAshWednesday: (day) => `${day} after Ash Wednesday`,
    holyWeek: (day) => `${day} of Holy Week`,
    easterOctave: (day) => `${day} within the Octave of Easter`,
    afterEpiphany: (day) => `${day} after Epiphany`,
    names: {
      christmas: "The Nativity of the Lord",
      "holy-family": "The Holy Family of Jesus, Mary and Joseph",
      "mary-mother-of-god": "Mary, the Holy Mother of God",
      "christmas-2": "Second Sunday after the Nativity",
      epiphany: "The Epiphany of the Lord",
      baptism: "The Baptism of the Lord",
      "ash-wed": "Ash Wednesday",
      palm: "Palm Sunday of the Passion of the Lord",
      "holy-thu": "Holy Thursday",
      "good-fri": "Good Friday of the Passion of the Lord",
      "holy-sat": "Holy Saturday · The Easter Vigil",
      "easter-1": "Easter Sunday of the Resurrection of the Lord",
      ascension: "The Ascension of the Lord",
      pentecost: "Pentecost Sunday",
      trinity: "The Most Holy Trinity",
      "corpus-christi": "The Most Holy Body and Blood of Christ",
      "sacred-heart": "The Most Sacred Heart of Jesus",
      "christ-the-king": "Our Lord Jesus Christ, King of the Universe",
      "mary-mother-of-the-church": "The Blessed Virgin Mary, Mother of the Church",
      "immaculate-heart": "The Immaculate Heart of the Blessed Virgin Mary",
      "01-25": "The Conversion of Saint Paul the Apostle",
      "02-02": "The Presentation of the Lord",
      "02-22": "The Chair of Saint Peter the Apostle",
      "03-19": "Saint Joseph, Spouse of the Blessed Virgin Mary",
      "03-25": "The Annunciation of the Lord",
      "04-25": "Saint Mark, Evangelist",
      "05-03": "Saints Philip and James, Apostles",
      "05-14": "Saint Matthias, Apostle",
      "05-31": "The Visitation of the Blessed Virgin Mary",
      "06-11": "Saint Barnabas, Apostle",
      "06-24": "The Nativity of Saint John the Baptist",
      "06-29": "Saints Peter and Paul, Apostles",
      "07-03": "Saint Thomas, Apostle",
      "07-22": "Saint Mary Magdalene",
      "07-25": "Saint James, Apostle",
      "07-26": "Saints Joachim and Anne, Parents of the Blessed Virgin Mary",
      "07-29": "Saints Martha, Mary and Lazarus",
      "08-06": "The Transfiguration of the Lord",
      "08-10": "Saint Lawrence, Deacon and Martyr",
      "08-15": "The Assumption of the Blessed Virgin Mary",
      "08-24": "Saint Bartholomew, Apostle",
      "08-29": "The Passion of Saint John the Baptist",
      "09-08": "The Nativity of the Blessed Virgin Mary",
      "09-14": "The Exaltation of the Holy Cross",
      "09-15": "Our Lady of Sorrows",
      "09-21": "Saint Matthew, Apostle and Evangelist",
      "09-29": "Saints Michael, Gabriel and Raphael, Archangels",
      "10-02": "The Holy Guardian Angels",
      "10-18": "Saint Luke, Evangelist",
      "10-28": "Saints Simon and Jude, Apostles",
      "11-01": "All Saints",
      "11-02": "The Commemoration of All the Faithful Departed",
      "11-09": "The Dedication of the Lateran Basilica",
      "11-30": "Saint Andrew, Apostle",
      "12-08": "The Immaculate Conception of the Blessed Virgin Mary",
      "12-26": "Saint Stephen, the First Martyr",
      "12-27": "Saint John, Apostle and Evangelist",
      "12-28": "The Holy Innocents, Martyrs",
    },
  },

  fr: {
    today: "Aujourd’hui",
    title: "Évangile du jour",
    previous: "Jour précédent",
    next: "Jour suivant",
    date: "Date",
    options: "Évangiles de ce jour",
    inContext: "Lire dans son contexte",
    transferred: "Reportée à ce jour",
    incipit: {
      matthew: "Évangile de Jésus Christ selon saint Matthieu",
      mark: "Évangile de Jésus Christ selon saint Marc",
      luke: "Évangile de Jésus Christ selon saint Luc",
      john: "Évangile de Jésus Christ selon saint Jean",
    },
    books: { matthew: "Mt", mark: "Mc", luke: "Lc", john: "Jn" },
    reference: referenceFormatter({ chapter: ", ", item: ".", across: " – " }),
    labels: {
      vigil: "Messe de la veille au soir",
      night: "Messe de la nuit",
      dawn: "Messe de l’aurore",
      day: "Messe du jour",
      evening: "Messe du soir",
      procession: "Procession des rameaux",
      passion: "La Passion",
      chrism: "Messe chrismale",
      supper: "Messe en mémoire de la Cène du Seigneur",
      short: "Lecture brève",
      yearA: "Lectures de l’année A",
      optional: "Messe au choix de la semaine",
    },
    sunday: (season, week) =>
      `${frenchOrdinal(week, false)} dimanche ${{ advent: "de l’Avent", lent: "de Carême", easter: "de Pâques", ordinary: "du temps ordinaire" }[season]}`,
    weekday: (season, week, day) =>
      `${day} de la ${frenchOrdinal(week, true)} semaine ${{ advent: "de l’Avent", lent: "de Carême", easter: "de Pâques", ordinary: "du temps ordinaire" }[season]}`,
    seasonDate: (season, date) =>
      `${capitalize(date)}, férie ${season === "advent" ? "de l’Avent" : "du temps de Noël"}`,
    christmasOctave: (day) => `${frenchOrdinal(day, false)} jour dans l’octave de la Nativité`,
    afterAshWednesday: (day) => `${day} après les Cendres`,
    holyWeek: (day) => `${day} saint`,
    easterOctave: (day) => `${day} dans l’octave de Pâques`,
    afterEpiphany: (day) => `${day} après l’Épiphanie`,
    names: {
      christmas: "Nativité du Seigneur",
      "holy-family": "La Sainte Famille de Jésus, Marie et Joseph",
      "mary-mother-of-god": "Sainte Marie, Mère de Dieu",
      "christmas-2": "2e dimanche après la Nativité",
      epiphany: "Épiphanie du Seigneur",
      baptism: "Baptême du Seigneur",
      "ash-wed": "Mercredi des Cendres",
      palm: "Dimanche des Rameaux et de la Passion du Seigneur",
      "holy-thu": "Jeudi saint",
      "good-fri": "Vendredi saint, la Passion du Seigneur",
      "holy-sat": "Samedi saint · Veillée pascale",
      "easter-1": "Dimanche de Pâques, la Résurrection du Seigneur",
      ascension: "Ascension du Seigneur",
      pentecost: "Dimanche de la Pentecôte",
      trinity: "La Sainte Trinité",
      "corpus-christi": "Le Saint-Sacrement du Corps et du Sang du Christ",
      "sacred-heart": "Le Sacré-Cœur de Jésus",
      "christ-the-king": "Notre Seigneur Jésus Christ, Roi de l’univers",
      "mary-mother-of-the-church": "La Bienheureuse Vierge Marie, Mère de l’Église",
      "immaculate-heart": "Le Cœur immaculé de Marie",
      "01-25": "La Conversion de saint Paul, apôtre",
      "02-02": "La Présentation du Seigneur au Temple",
      "02-22": "La Chaire de saint Pierre, apôtre",
      "03-19": "Saint Joseph, époux de la Vierge Marie",
      "03-25": "L’Annonciation du Seigneur",
      "04-25": "Saint Marc, évangéliste",
      "05-03": "Saint Philippe et saint Jacques, apôtres",
      "05-14": "Saint Matthias, apôtre",
      "05-31": "La Visitation de la Vierge Marie",
      "06-11": "Saint Barnabé, apôtre",
      "06-24": "La Nativité de saint Jean le Baptiste",
      "06-29": "Saint Pierre et saint Paul, apôtres",
      "07-03": "Saint Thomas, apôtre",
      "07-22": "Sainte Marie Madeleine",
      "07-25": "Saint Jacques, apôtre",
      "07-26": "Saint Joachim et sainte Anne, parents de la Vierge Marie",
      "07-29": "Sainte Marthe, sainte Marie et saint Lazare",
      "08-06": "La Transfiguration du Seigneur",
      "08-10": "Saint Laurent, diacre et martyr",
      "08-15": "L’Assomption de la Vierge Marie",
      "08-24": "Saint Barthélemy, apôtre",
      "08-29": "Le Martyre de saint Jean Baptiste",
      "09-08": "La Nativité de la Vierge Marie",
      "09-14": "La Croix glorieuse",
      "09-15": "Notre-Dame des Douleurs",
      "09-21": "Saint Matthieu, apôtre et évangéliste",
      "09-29": "Saint Michel, saint Gabriel et saint Raphaël, archanges",
      "10-02": "Les Saints Anges gardiens",
      "10-18": "Saint Luc, évangéliste",
      "10-28": "Saint Simon et saint Jude, apôtres",
      "11-01": "Tous les Saints",
      "11-02": "Commémoration de tous les fidèles défunts",
      "11-09": "Dédicace de la basilique du Latran",
      "11-30": "Saint André, apôtre",
      "12-08": "L’Immaculée Conception de la Vierge Marie",
      "12-26": "Saint Étienne, premier martyr",
      "12-27": "Saint Jean, apôtre et évangéliste",
      "12-28": "Les Saints Innocents, martyrs",
    },
  },

  it: {
    today: "Oggi",
    title: "Vangelo del giorno",
    previous: "Giorno precedente",
    next: "Giorno seguente",
    date: "Data",
    options: "Vangeli di questo giorno",
    inContext: "Leggi nel suo contesto",
    transferred: "Trasferita a questo giorno",
    incipit: {
      matthew: "Dal Vangelo secondo Matteo",
      mark: "Dal Vangelo secondo Marco",
      luke: "Dal Vangelo secondo Luca",
      john: "Dal Vangelo secondo Giovanni",
    },
    books: { matthew: "Mt", mark: "Mc", luke: "Lc", john: "Gv" },
    reference: referenceFormatter({ chapter: ",", item: ".", across: "–" }),
    labels: {
      vigil: "Messa vespertina nella vigilia",
      night: "Messa della notte",
      dawn: "Messa dell’aurora",
      day: "Messa del giorno",
      evening: "Messa vespertina",
      procession: "Processione delle palme",
      passion: "La Passione",
      chrism: "Messa crismale",
      supper: "Messa nella Cena del Signore",
      short: "Forma breve",
      yearA: "Letture dell’anno A",
      optional: "Messa facoltativa della settimana",
    },
    sunday: (season, week) =>
      `${roman(week)} domenica ${{ advent: "di Avvento", lent: "di Quaresima", easter: "di Pasqua", ordinary: "del tempo ordinario" }[season]}`,
    weekday: (season, week, day) =>
      `${day} della ${roman(week)} settimana ${{ advent: "di Avvento", lent: "di Quaresima", easter: "di Pasqua", ordinary: "del tempo ordinario" }[season]}`,
    seasonDate: (season, date) =>
      `${date}, feria ${season === "advent" ? "di Avvento" : "del tempo di Natale"}`,
    christmasOctave: (day) => `${roman(day)} giorno fra l’ottava di Natale`,
    afterAshWednesday: (day) => `${day} dopo le Ceneri`,
    holyWeek: (day) => `${day} santo`,
    easterOctave: (day) => `${day} fra l’ottava di Pasqua`,
    afterEpiphany: (day) => `${day} dopo l’Epifania`,
    names: {
      christmas: "Natale del Signore",
      "holy-family": "Santa Famiglia di Gesù, Maria e Giuseppe",
      "mary-mother-of-god": "Maria Santissima Madre di Dio",
      "christmas-2": "II domenica dopo Natale",
      epiphany: "Epifania del Signore",
      baptism: "Battesimo del Signore",
      "ash-wed": "Mercoledì delle Ceneri",
      palm: "Domenica delle Palme: Passione del Signore",
      "holy-thu": "Giovedì santo",
      "good-fri": "Venerdì santo: Passione del Signore",
      "holy-sat": "Sabato santo · Veglia pasquale",
      "easter-1": "Domenica di Pasqua: Risurrezione del Signore",
      ascension: "Ascensione del Signore",
      pentecost: "Domenica di Pentecoste",
      trinity: "Santissima Trinità",
      "corpus-christi": "Santissimo Corpo e Sangue di Cristo",
      "sacred-heart": "Sacratissimo Cuore di Gesù",
      "christ-the-king": "Nostro Signore Gesù Cristo Re dell’universo",
      "mary-mother-of-the-church": "Beata Vergine Maria Madre della Chiesa",
      "immaculate-heart": "Cuore Immacolato della Beata Vergine Maria",
      "01-25": "Conversione di san Paolo apostolo",
      "02-02": "Presentazione del Signore",
      "02-22": "Cattedra di san Pietro apostolo",
      "03-19": "San Giuseppe, sposo della Beata Vergine Maria",
      "03-25": "Annunciazione del Signore",
      "04-25": "San Marco evangelista",
      "05-03": "Santi Filippo e Giacomo apostoli",
      "05-14": "San Mattia apostolo",
      "05-31": "Visitazione della Beata Vergine Maria",
      "06-11": "San Barnaba apostolo",
      "06-24": "Natività di san Giovanni Battista",
      "06-29": "Santi Pietro e Paolo apostoli",
      "07-03": "San Tommaso apostolo",
      "07-22": "Santa Maria Maddalena",
      "07-25": "San Giacomo apostolo",
      "07-26": "Santi Gioacchino e Anna, genitori della Beata Vergine Maria",
      "07-29": "Santi Marta, Maria e Lazzaro",
      "08-06": "Trasfigurazione del Signore",
      "08-10": "San Lorenzo, diacono e martire",
      "08-15": "Assunzione della Beata Vergine Maria",
      "08-24": "San Bartolomeo apostolo",
      "08-29": "Martirio di san Giovanni Battista",
      "09-08": "Natività della Beata Vergine Maria",
      "09-14": "Esaltazione della Santa Croce",
      "09-15": "Beata Vergine Maria Addolorata",
      "09-21": "San Matteo apostolo ed evangelista",
      "09-29": "Santi Michele, Gabriele e Raffaele arcangeli",
      "10-02": "Santi Angeli Custodi",
      "10-18": "San Luca evangelista",
      "10-28": "Santi Simone e Giuda apostoli",
      "11-01": "Tutti i Santi",
      "11-02": "Commemorazione di tutti i fedeli defunti",
      "11-09": "Dedicazione della Basilica Lateranense",
      "11-30": "Sant’Andrea apostolo",
      "12-08": "Immacolata Concezione della Beata Vergine Maria",
      "12-26": "Santo Stefano, primo martire",
      "12-27": "San Giovanni apostolo ed evangelista",
      "12-28": "Santi Innocenti martiri",
    },
  },

  pl: {
    today: "Dziś",
    title: "Ewangelia dnia",
    previous: "Poprzedni dzień",
    next: "Następny dzień",
    date: "Data",
    options: "Ewangelie tego dnia",
    inContext: "Czytaj w kontekście",
    transferred: "Przeniesiona na ten dzień",
    incipit: {
      matthew: "Słowa Ewangelii według świętego Mateusza",
      mark: "Słowa Ewangelii według świętego Marka",
      luke: "Słowa Ewangelii według świętego Łukasza",
      john: "Słowa Ewangelii według świętego Jana",
    },
    books: { matthew: "Mt", mark: "Mk", luke: "Łk", john: "J" },
    reference: commaStyle,
    labels: {
      vigil: "Msza wigilijna",
      night: "Msza w nocy",
      dawn: "Msza o świcie",
      day: "Msza w dzień",
      evening: "Msza wieczorna",
      procession: "Procesja z palmami",
      passion: "Męka Pańska",
      chrism: "Msza Krzyżma",
      supper: "Msza Wieczerzy Pańskiej",
      short: "Krótsza forma",
      yearA: "Czytania z roku A",
      optional: "Msza do wyboru w tym tygodniu",
    },
    sunday: (season, week) =>
      `${roman(week)} Niedziela ${{ advent: "Adwentu", lent: "Wielkiego Postu", easter: "Wielkanocna", ordinary: "zwykła" }[season]}`,
    weekday: (season, week, day) =>
      `${day} ${roman(week)} tygodnia ${{ advent: "Adwentu", lent: "Wielkiego Postu", easter: "wielkanocnego", ordinary: "zwykłego" }[season]}`,
    seasonDate: (season, date) =>
      `${date}, dzień powszedni ${season === "advent" ? "Adwentu" : "okresu Narodzenia Pańskiego"}`,
    christmasOctave: (day) => `${roman(day)} dzień w oktawie Narodzenia Pańskiego`,
    afterAshWednesday: (day) => `${day} po Popielcu`,
    holyWeek: (_day, weekday) =>
      ["", "Wielki Poniedziałek", "Wielki Wtorek", "Wielka Środa"][weekday],
    easterOctave: (day) => `${day} w oktawie Wielkanocy`,
    afterEpiphany: (day) => `${day} po Objawieniu Pańskim`,
    names: {
      christmas: "Narodzenie Pańskie",
      "holy-family": "Świętej Rodziny Jezusa, Maryi i Józefa",
      "mary-mother-of-god": "Świętej Bożej Rodzicielki Maryi",
      "christmas-2": "II Niedziela po Narodzeniu Pańskim",
      epiphany: "Objawienie Pańskie",
      baptism: "Chrzest Pański",
      "ash-wed": "Środa Popielcowa",
      palm: "Niedziela Palmowa Męki Pańskiej",
      "holy-thu": "Wielki Czwartek",
      "good-fri": "Wielki Piątek Męki Pańskiej",
      "holy-sat": "Wielka Sobota · Wigilia Paschalna",
      "easter-1": "Niedziela Zmartwychwstania Pańskiego",
      ascension: "Wniebowstąpienie Pańskie",
      pentecost: "Niedziela Zesłania Ducha Świętego",
      trinity: "Najświętszej Trójcy",
      "corpus-christi": "Najświętszego Ciała i Krwi Chrystusa",
      "sacred-heart": "Najświętszego Serca Pana Jezusa",
      "christ-the-king": "Jezusa Chrystusa, Króla Wszechświata",
      "mary-mother-of-the-church": "Najświętszej Maryi Panny, Matki Kościoła",
      "immaculate-heart": "Niepokalanego Serca Najświętszej Maryi Panny",
      "01-25": "Nawrócenie św. Pawła, Apostoła",
      "02-02": "Ofiarowanie Pańskie",
      "02-22": "Katedry św. Piotra, Apostoła",
      "03-19": "Św. Józefa, Oblubieńca Najświętszej Maryi Panny",
      "03-25": "Zwiastowanie Pańskie",
      "04-25": "Św. Marka, Ewangelisty",
      "05-03": "Św. Apostołów Filipa i Jakuba",
      "05-14": "Św. Macieja, Apostoła",
      "05-31": "Nawiedzenie Najświętszej Maryi Panny",
      "06-11": "Św. Barnaby, Apostoła",
      "06-24": "Narodzenie św. Jana Chrzciciela",
      "06-29": "Św. Apostołów Piotra i Pawła",
      "07-03": "Św. Tomasza, Apostoła",
      "07-22": "Św. Marii Magdaleny",
      "07-25": "Św. Jakuba, Apostoła",
      "07-26": "Św. Joachima i Anny, rodziców Najświętszej Maryi Panny",
      "07-29": "Św. Marty, Marii i Łazarza",
      "08-06": "Przemienienie Pańskie",
      "08-10": "Św. Wawrzyńca, diakona i męczennika",
      "08-15": "Wniebowzięcie Najświętszej Maryi Panny",
      "08-24": "Św. Bartłomieja, Apostoła",
      "08-29": "Męczeństwo św. Jana Chrzciciela",
      "09-08": "Narodzenie Najświętszej Maryi Panny",
      "09-14": "Podwyższenie Krzyża Świętego",
      "09-15": "Najświętszej Maryi Panny Bolesnej",
      "09-21": "Św. Mateusza, Apostoła i Ewangelisty",
      "09-29": "Św. Archaniołów Michała, Gabriela i Rafała",
      "10-02": "Świętych Aniołów Stróżów",
      "10-18": "Św. Łukasza, Ewangelisty",
      "10-28": "Św. Apostołów Szymona i Judy Tadeusza",
      "11-01": "Wszystkich Świętych",
      "11-02": "Wspomnienie wszystkich wiernych zmarłych",
      "11-09": "Rocznica poświęcenia Bazyliki Laterańskiej",
      "11-30": "Św. Andrzeja, Apostoła",
      "12-08": "Niepokalane Poczęcie Najświętszej Maryi Panny",
      "12-26": "Św. Szczepana, pierwszego męczennika",
      "12-27": "Św. Jana, Apostoła i Ewangelisty",
      "12-28": "Świętych Młodzianków, męczenników",
    },
  },
};

// The title of a liturgical day (from liturgy.js), in words.
export function dayTitle(lang, title) {
  const words = LITURGY[lang];
  const day = title.weekday === undefined ? "" : weekdayName(lang, title.weekday);
  switch (title.kind) {
    case "named":
      return words.names[title.id];
    case "sunday":
      return words.sunday(title.season, title.week);
    case "weekday":
      return words.weekday(title.season, title.week, day);
    case "seasonDate":
      return words.seasonDate(title.season, monthDayName(lang, title.month, title.day));
    case "christmasOctave":
      return words.christmasOctave(title.day);
    case "afterAshWednesday":
      return words.afterAshWednesday(day);
    case "holyWeek":
      return words.holyWeek(day, title.weekday);
    case "easterOctave":
      return words.easterOctave(day);
    case "afterEpiphany":
      return words.afterEpiphany(day);
    default:
      throw new Error(`unknown day: ${title.kind}`);
  }
}

// The full date, as a calendar in the language prints it.
export function longDate(lang, iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return formatDate(lang, Math.round(Date.UTC(year, month - 1, day) / 86400000), {
    dateStyle: "full",
  });
}
