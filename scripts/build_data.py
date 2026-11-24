"""Build public/data/<gospel>/ from the downloaded sources.

Usage: python3 scripts/build_data.py [--sources DIR] [--out DIR] [--check]

Run scripts/fetch_sources.py first. Rows follow the Greek (modern) verse
numbering, which the King James Version already uses; each other source is
re-keyed to it with the operations listed per book, written in the source's
own numbering (the Douay-Rheims and Martini follow the Vulgate's, like the
Latin, and so does the Crampon in Mark):

  ("merge", c, a, b)      verses c:a..c:b form one verse c:a; later verses move up
  ("split", c, v, marks)  verse c:v is cut where marks[source] begins; later verses move down
  ("to_next", c)          the last verse of chapter c becomes (c+1):1

Each Gospel gets a folder with verses.json, the list of [chapter, verse] in
reading order, and one file per text, named after it (greek.json, latin.json,
torres-amat.json, wujek.json, crampon.json, martini.json, kjv.json,
douay-rheims.json): a list of strings in the same order, "" where a text
lacks the verse. The reader downloads only the texts it shows.

The script stops if a correction or a split mark no longer matches the text
exactly once. --check prints the report without writing files; it includes a
per-verse length comparison between the languages, where a run of outliers
would point to a misaligned stretch.
"""

import argparse
import json
import pathlib
import re
import statistics
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from parsers import (  # noqa: E402
    parse_clementine,
    parse_crampon,
    parse_martini,
    parse_sblgnt,
    parse_torres_amat,
    parse_usfm,
    parse_wujek,
)

ROOT = pathlib.Path(__file__).resolve().parent.parent

BOOKS = {
    "matthew": {
        "vulgate_ops": [("split", 17, 14, {"latin": "dicens : Domine", "spanish": "le dijo: Señor"})],
        "douay_ops": [("split", 17, 14, {"douay": "saying: Lord"})],
        "martini_ops": [("split", 17, 14, {"martini": "dicendo: Signore"})],
        # This edition joins 17:14-15 as the Vulgate does, and divides 17:27 in two.
        "crampon_ops": [
            ("split", 17, 14, {"crampon": "il lui dit : « Seigneur"}),
            ("merge", 17, 26, 27),
        ],
        "polish_ops": [],
        # The 1836 printing skips from 14:11 "...en una fuente," to 14:13.
        "spanish_missing": ["14:12"],
        "spanish_fixes": {
            "3:3": [("di- ciendo", "diciendo")],
            "5:12": [("grande:—la", "grande la")],
            "15:2": [("tradi- cion", "tradicion")],
            "17:26": [("por tí. }", "por tí.")],
            "23:25": [("corazon'", "corazon")],
            "23:36": [("presente.{", "presente.")],
            "24:33": [("ya' á", "ya á")],
            "26:35": [("discípulos..", "discípulos.")],
        },
        "polish_fixes": {},
        "martini_missing": [],
        # Reading slips in the digital text, in the Vulgate numbering.
        "martini_fixes": {
            "17:23": [("accontarono", "accostarono")],
            "19:13": [("|oro", "loro")],
            "28:2": [("l'Angolo", "l'Angelo")],
        },
    },
    "mark": {
        "vulgate_ops": [
            ("split", 4, 40, {"latin": "et timuerunt", "spanish": "Y quedaron sobrecogidos"}),
            ("to_next", 8),
        ],
        "douay_ops": [("split", 4, 40, {"douay": "And they feared exceedingly"}), ("to_next", 8)],
        "martini_ops": [("split", 4, 40, {"martini": "Ed essi furono ripieni"}), ("to_next", 8)],
        "crampon_ops": [("split", 4, 40, {"crampon": "Et ils furent saisis"}), ("to_next", 8)],
        "polish_ops": [("to_next", 8)],
        "spanish_missing": [],
        "spanish_fixes": {
            "7:2": [("discí- pulos", "discípulos")],
            "11:17": [("escrito:Mi", "escrito: Mi")],
            "13:2": [("mag- níficos", "magníficos")],
        },
        "polish_fixes": {},
        "martini_missing": [],
        "martini_fixes": {},
    },
    "luke": {
        "vulgate_ops": [],
        "douay_ops": [],
        "martini_ops": [],
        "crampon_ops": [],
        # The Wikisource transcription of Wujek splits three verses in two.
        "polish_ops": [("merge", 3, 28, 29), ("merge", 4, 42, 43), ("merge", 19, 47, 48)],
        "spanish_missing": [],
        "spanish_fixes": {
            "3:1": [("Phi- lippo", "Philippo")],
            "6:15": [("Alpheo'", "Alpheo")],
            "8:1": [("ciu- dades", "ciudades")],
            "8:10": [("habla'", "habla")],
            "9:3": [("defenderos'", "defenderos")],
        },
        "polish_fixes": {"12:57": [("57 Przeczże", "Przeczże")]},
        "martini_missing": [],
        "martini_fixes": {"10:13": [("Silone", "Sidone")]},
    },
    "john": {
        "vulgate_ops": [
            ("merge", 6, 51, 52),
            ("split", 11, 56, {"latin": "Dederant autem pontifices", "spanish": "Pero los pontífices"}),
        ],
        # This edition already divides 11:56-57 as the Greek does.
        "douay_ops": [("merge", 6, 51, 52)],
        "martini_ops": [("merge", 6, 51, 52)],
        "crampon_ops": [],
        "polish_ops": [],
        "spanish_missing": [],
        "spanish_fixes": {
            "1:1": [("era 'ya el Verbo", "era ya el Verbo")],
            "4:45": [("fue bien' recibido", "fue bien recibido")],
            "7:18": [("fraude.{{np}", "fraude.")],
            "11:26": [("¿Crees tú esto=", "¿Crees tú esto?")],
            "11:56": [("aun' no ha venido", "aun no ha venido")],
            "12:1": [("á Be- thania", "á Bethania")],
            "15:22": [("en mí';", "en mí;")],
            "17:11": [("naturaleza'.", "naturaleza.")],
            "17:22": [("'alimentándolos", "alimentándolos")],
            "18:27": [("y a] punto", "y al punto")],
        },
        "polish_fixes": {},
        # Parola Viva's text ends 11:56 at "…alla festa?": the sentence the
        # Greek numbers 11:57 is missing.
        "martini_missing": ["11:57"],
        "martini_fixes": {"11:55": [("parificarsi", "purificarsi")]},
    },
}

# The texts written for each Gospel, named as the reader asks for them.
TEXT_FIELDS = (
    "greek",
    "latin",
    "torres-amat",
    "wujek",
    "crampon",
    "martini",
    "kjv",
    "douay-rheims",
)

# The 1836 edition closes some paragraphs with a dash after the last verse.
TRAILING_DASH = re.compile(r"\s*—$")


def key(chapter, verse):
    return f"{chapter}:{verse}"


def split_key(k):
    chapter, verse = k.split(":")
    return int(chapter), int(verse)


def verses_of(texts, chapter):
    return sorted(v for c, v in map(split_key, texts) if c == chapter)


def apply_ops(texts, ops, source):
    texts = dict(texts)
    # Apply from the end of the book backwards so that each operation's
    # numbers still refer to the source numbering.
    position = lambda op: (op[1], op[2] if op[0] != "to_next" else float("inf"))  # noqa: E731
    for op in sorted(ops, key=position, reverse=True):
        if op[0] == "merge":
            _, c, a, b = op
            parts = [texts[key(c, a)]] + [texts.pop(key(c, v)) for v in range(a + 1, b + 1)]
            texts[key(c, a)] = " ".join(parts)
            for v in [v for v in verses_of(texts, c) if v > b]:
                texts[key(c, v - (b - a))] = texts.pop(key(c, v))
        elif op[0] == "split":
            _, c, v, marks = op
            text, mark = texts[key(c, v)], marks[source]
            if text.count(mark) != 1 or text.startswith(mark):
                raise SystemExit(f"{source}: split mark {mark!r} not found once in {c}:{v}")
            for w in sorted((w for w in verses_of(texts, c) if w > v), reverse=True):
                texts[key(c, w + 1)] = texts.pop(key(c, w))
            i = text.find(mark)
            texts[key(c, v)], texts[key(c, v + 1)] = text[:i].strip(), text[i:].strip()
        elif op[0] == "to_next":
            _, c = op
            last = verses_of(texts, c)[-1]
            for w in sorted(verses_of(texts, c + 1), reverse=True):
                texts[key(c + 1, w + 1)] = texts.pop(key(c + 1, w))
            texts[key(c + 1, 1)] = texts.pop(key(c, last))
    return texts


def apply_fixes(texts, fixes, source):
    texts = dict(texts)
    for k, pairs in fixes.items():
        for old, new in pairs:
            if texts[k].count(old) != 1:
                raise SystemExit(f"{source} fix {old!r} not found once in {k}")
            texts[k] = texts[k].replace(old, new)
    return texts


def wikisource_html(path):
    return json.loads(path.read_text(encoding="utf-8"))["parse"]["text"]


def build(gospel, cfg, sources):
    greek = parse_sblgnt((sources / "gr" / f"{gospel}.txt").read_text(encoding="utf-8-sig"))
    latin = parse_clementine((sources / "la" / f"{gospel}.lat").read_text(encoding="utf-8-sig"))
    latin = apply_ops(latin, cfg["vulgate_ops"], "latin")

    spanish, spanish_log = parse_torres_amat(wikisource_html(sources / "es" / f"{gospel}.json"))
    spanish = apply_fixes(spanish, cfg["spanish_fixes"], "spanish")
    spanish = {k: TRAILING_DASH.sub("", v) for k, v in spanish.items()}
    for k in cfg["spanish_missing"]:
        spanish[k] = ""
    spanish = apply_ops(spanish, cfg["vulgate_ops"], "spanish")

    polish, polish_log = parse_wujek(wikisource_html(sources / "pl" / f"{gospel}.json"))
    polish = apply_fixes(polish, cfg["polish_fixes"], "polish")
    polish = apply_ops(polish, cfg["polish_ops"], "polish")

    french = parse_crampon(wikisource_html(sources / "fr" / f"{gospel}.json"))
    french = apply_ops(french, cfg["crampon_ops"], "crampon")

    italian = parse_martini(json.loads((sources / "it" / f"{gospel}.json").read_text(encoding="utf-8")))
    italian = apply_fixes(italian, cfg["martini_fixes"], "martini")
    italian = apply_ops(italian, cfg["martini_ops"], "martini")
    for k in cfg["martini_missing"]:
        italian[k] = ""

    kjv = parse_usfm((sources / "kjv" / f"{gospel}.usfm").read_text(encoding="utf-8-sig"))
    douay = parse_usfm((sources / "dra" / f"{gospel}.usfm").read_text(encoding="utf-8-sig"))
    douay = apply_ops(douay, cfg["douay_ops"], "douay")

    # Every source must cover the same verses, except those the Greek omits.
    named = (
        ("spanish", spanish),
        ("polish", polish),
        ("french", french),
        ("italian", italian),
        ("kjv", kjv),
        ("douay", douay),
    )
    for name, texts in named:
        if set(texts) != set(latin):
            missing = sorted(set(latin) - set(texts), key=split_key)[:8]
            extra = sorted(set(texts) - set(latin), key=split_key)[:8]
            raise SystemExit(f"{gospel}: {name} verses differ from Latin: missing {missing}, extra {extra}")
    if set(greek) - set(latin):
        raise SystemExit(f"{gospel}: Greek has verses Latin lacks: {sorted(set(greek) - set(latin))}")

    rows = []
    for k in sorted(latin, key=split_key):
        chapter, verse = split_key(k)
        rows.append({
            "chapter": chapter,
            "verse": verse,
            "greek": greek.get(k, ""),
            "latin": latin[k],
            "torres-amat": spanish[k],
            "wujek": polish[k],
            "crampon": french[k],
            "martini": italian[k],
            "kjv": kjv[k],
            "douay-rheims": douay[k],
        })

    report = [
        f"{gospel}: {len(rows)} verses",
        f"  Greek omits: {[k for k in sorted(latin, key=split_key) if k not in greek]}",
        f"  Spanish relabelled: {spanish_log['relabelled']}",
        f"  Spanish gaps in the text: {spanish_log['gaps']}",
        f"  Spanish verses without anchor: {len(spanish_log['without_anchor'])}",
        f"  Polish relabelled: {polish_log['relabelled']}",
        f"  Polish misprints corrected: {polish_log['misprints_corrected']}",
        f"  Length outliers: {length_outliers(rows)}",
    ]
    return rows, report


def length_outliers(rows):
    flagged = []
    pairs = (
        ("latin", "greek"),
        ("torres-amat", "latin"),
        ("wujek", "latin"),
        ("crampon", "greek"),
        ("martini", "latin"),
        ("kjv", "greek"),
        ("douay-rheims", "latin"),
    )
    for a, b in pairs:
        ratios = [(row, len(row[a]) / len(row[b])) for row in rows if row[a] and row[b]]
        median = statistics.median(ratio for _, ratio in ratios)
        flagged += [
            f"{a}/{b} {row['chapter']}:{row['verse']}"
            for row, ratio in ratios
            if not 0.5 < ratio / median < 2.0
        ]
    return flagged


def write_gospel(rows, folder):
    """Writes verses.json and one file per text, one entry per line."""
    folder.mkdir(parents=True, exist_ok=True)
    pairs = ",\n".join(json.dumps([row["chapter"], row["verse"]]) for row in rows)
    (folder / "verses.json").write_text(f"[\n{pairs}\n]\n", encoding="utf-8")
    for field in TEXT_FIELDS:
        texts = [row[field] for row in rows]
        (folder / f"{field}.json").write_text(
            json.dumps(texts, ensure_ascii=False, indent=0) + "\n", encoding="utf-8"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    here = pathlib.Path(__file__).resolve().parent
    parser.add_argument("--sources", type=pathlib.Path, default=here / "sources")
    parser.add_argument("--out", type=pathlib.Path, default=ROOT / "public" / "data")
    parser.add_argument("--check", action="store_true", help="report only, do not write files")
    args = parser.parse_args()

    for gospel, cfg in BOOKS.items():
        rows, report = build(gospel, cfg, args.sources)
        if args.check:
            print("\n".join(report))
        else:
            folder = args.out / gospel
            write_gospel(rows, folder)
            print(f"{report[0]} -> {folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder}/")


if __name__ == "__main__":
    main()
