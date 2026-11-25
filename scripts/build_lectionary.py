"""Build the Gospel of each day from scripts/lectionary.tsv.

Usage: python3 scripts/build_lectionary.py [--check]

Every reference is checked against public/data/<gospel>/verses.json: the
verses must exist and each range must run forward. The result is written to
public/data/lectionary.json, one entry per key:

    "ot-34-tue": {"main": 0, "options": [
        {"gospel": "luke", "ref": "21:5-11", "segments": [[21, 5, 21, 11]]}
    ]}

`ref` is the reference as the Lectionary prints it, without the book;
`segments` are the verses to show, as [chapter, verse, chapter, verse] ranges
of whole verses; `labels` (when present) name the Mass or the form; `main` is
the option shown first. With --check, nothing is written.
"""

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "lectionary.tsv"
DATA = ROOT / "public" / "data"

BOOKS = {"Mt": "matthew", "Mk": "mark", "Lk": "luke", "Jn": "john"}

# The labels src/i18n.js names under `liturgy.labels`.
LABELS = {
    "vigil", "night", "dawn", "day", "evening", "procession", "passion",
    "chrism", "supper", "short", "yearA", "optional",
}

KEY = re.compile(
    r"^(?:[a-z]+(?:-[a-z]+)*(?:-\d+)?(?:-[a-z]+)?|\d\d-\d\d)(?:@[ABC])?$"
)
VERSE = r"(\d+)([abc]?)"
# "5-11", "5", "12a", "33b-45", and a range into a later chapter, "14-27:66".
ITEM = re.compile(rf"^{VERSE}(?:-(?:(\d+):)?{VERSE})?$")


class LectionaryError(Exception):
    pass


def parse_reference(text):
    """'Mt 1:16, 18-21, 24a' → ('matthew', '1:16, 18-21, 24a', segments)."""
    book, _, rest = text.partition(" ")
    if book not in BOOKS or not rest:
        raise LectionaryError(f"unknown book in {text!r}")
    segments = []
    for group in rest.split("; "):
        chapter_text, sep, items = group.partition(":")
        if not sep or not chapter_text.isdigit():
            raise LectionaryError(f"no chapter in {text!r}")
        chapter = int(chapter_text)
        for item in items.split(", "):
            match = ITEM.match(item)
            if not match:
                raise LectionaryError(f"cannot read {item!r} in {text!r}")
            first, _, end_chapter, last, _ = match.groups()
            start = (chapter, int(first))
            end = (int(end_chapter) if end_chapter else chapter, int(last or first))
            if end < start:
                raise LectionaryError(f"backward range {item!r} in {text!r}")
            if segments and start <= tuple(segments[-1][2:]):
                raise LectionaryError(f"{item!r} overlaps or goes back in {text!r}")
            segments.append([*start, *end])
            # A range into a later chapter carries on in that chapter.
            chapter = end[0]
    return BOOKS[book], rest, segments


def parse_option(token):
    main = token.startswith("*")
    token = token.removeprefix("*")
    labels = []
    if ":" in token.split(" ", 1)[0]:
        label_text, token = token.split(":", 1)
        labels = label_text.split(",")
        unknown = [label for label in labels if label not in LABELS]
        if unknown:
            raise LectionaryError(f"unknown label {unknown[0]!r}")
    gospel, ref, segments = parse_reference(token)
    option = {"gospel": gospel, "ref": ref, "segments": segments}
    if labels:
        option["labels"] = labels
    return main, option


def read_source(path):
    entries = {}
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.startswith("#"):
            continue
        key, *tokens = line.split("\t")
        try:
            if not KEY.match(key):
                raise LectionaryError(f"bad key {key!r}")
            if key in entries:
                raise LectionaryError(f"{key} appears twice")
            if not tokens:
                raise LectionaryError(f"{key} has no Gospel")
            options, mains = [], []
            for index, token in enumerate(tokens):
                main, option = parse_option(token)
                options.append(option)
                if main:
                    mains.append(index)
            if len(mains) > 1:
                raise LectionaryError(f"{key} marks two Gospels as first")
        except LectionaryError as error:
            raise LectionaryError(f"{path.name}:{number}: {error}") from None
        entries[key] = {"main": mains[0] if mains else 0, "options": options}
    return entries


def check_verses(entries):
    """Every verse of every segment must be a row of its Gospel."""
    rows = {}
    for gospel in BOOKS.values():
        verses = json.loads((DATA / gospel / "verses.json").read_text(encoding="utf-8"))
        rows[gospel] = {tuple(verse): index for index, verse in enumerate(verses)}
    problems = []
    for key, entry in entries.items():
        for option in entry["options"]:
            known = rows[option["gospel"]]
            for c1, v1, c2, v2 in option["segments"]:
                for place in ((c1, v1), (c2, v2)):
                    if place not in known:
                        problems.append(f"{key}: {option['gospel']} {place[0]}:{place[1]} does not exist")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="check only; write nothing")
    args = parser.parse_args()

    try:
        entries = read_source(SOURCE)
    except LectionaryError as error:
        sys.exit(str(error))
    problems = check_verses(entries)
    if problems:
        sys.exit("\n".join(problems))

    options = sum(len(entry["options"]) for entry in entries.values())
    print(f"{len(entries)} days, {options} Gospels")
    if not args.check:
        out = DATA / "lectionary.json"
        out.write_text(
            json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
