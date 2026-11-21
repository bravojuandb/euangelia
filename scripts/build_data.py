"""Build public/data/<gospel>.json from the downloaded sources.

Usage: python3 scripts/build_data.py [--sources DIR] [--out DIR] [--check]

Run scripts/fetch_sources.py first. Rows follow the Greek (modern) verse
numbering; each source is re-keyed to it with the operations listed per book,
written in the source's own numbering:

  ("merge", c, a, b)      verses c:a..c:b form one verse c:a; later verses move up
  ("split", c, v, marks)  verse c:v is cut where marks[source] begins; later verses move down
  ("to_next", c)          the last verse of chapter c becomes (c+1):1

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
from parsers import parse_clementine, parse_sblgnt, parse_torres_amat, parse_wujek  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

BOOKS = {
    "matthew": {
        "name": "Matthew",
        "vulgate_ops": [("split", 17, 14, {"latin": "dicens : Domine", "spanish": "le dijo: Señor"})],
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
    },
    "mark": {
        "name": "Mark",
        "vulgate_ops": [
            ("split", 4, 40, {"latin": "et timuerunt", "spanish": "Y quedaron sobrecogidos"}),
            ("to_next", 8),
        ],
        "polish_ops": [("to_next", 8)],
        "spanish_missing": [],
        "spanish_fixes": {
            "7:2": [("discí- pulos", "discípulos")],
            "11:17": [("escrito:Mi", "escrito: Mi")],
            "13:2": [("mag- níficos", "magníficos")],
        },
        "polish_fixes": {},
    },
    "luke": {
        "name": "Luke",
        "vulgate_ops": [],
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
    },
    "john": {
        "name": "John",
        "vulgate_ops": [
            ("merge", 6, 51, 52),
            ("split", 11, 56, {"latin": "Dederant autem pontifices", "spanish": "Pero los pontífices"}),
        ],
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
    },
}

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

    # Every source must cover the same verses, except those the Greek omits.
    for name, texts in (("spanish", spanish), ("polish", polish)):
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
            "book": cfg["name"],
            "chapter": chapter,
            "verse": verse,
            "greek": greek.get(k, ""),
            "latin": latin[k],
            "spanish": spanish[k],
            "polski": polish[k],
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
    for a, b in (("latin", "greek"), ("spanish", "latin"), ("polski", "latin")):
        ratios = [(row, len(row[a]) / len(row[b])) for row in rows if row[a] and row[b]]
        median = statistics.median(ratio for _, ratio in ratios)
        flagged += [
            f"{a}/{b} {row['chapter']}:{row['verse']}"
            for row, ratio in ratios
            if not 0.5 < ratio / median < 2.0
        ]
    return flagged


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
            path = args.out / f"{gospel}.json"
            path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"{report[0]} -> {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")


if __name__ == "__main__":
    main()
