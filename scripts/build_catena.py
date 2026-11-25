"""Build the commentary of the Fathers from the Catena Aurea.

Usage: python3 scripts/build_catena.py [--check]

Reads the Catena Aurea of Saint Thomas Aquinas, in the English of the Oxford
edition (1841–1845, edited by John Henry Newman), as fetched by
fetch_sources.py into scripts/sources/catena/: one HTML file per chapter,
and CCEL's plain text of the volume on Matthew for chapter 15, which the
HTML lacks.

The Catena divides each chapter into passages. Each passage gives the
verses of the Gospel (the lemma), in the Authorized Version and its verse
numbering, which is the reader's; then the Fathers' words on them, in the
order Saint Thomas chained them. A passage may give its verses one by one,
each followed by the words on it. Every excerpt is tied here to the verses
of the lemma before it; a passage runs on to the next one, so verses whose
lemma the transcription lost (Matthew 5:15-16) stay with the passage that
comments on them.

Writes public/data/<gospel>/catena.json:

    {"fathers": ["Chrysostom", "Augustine", …],
     "comments": [[father, chapter, verse, chapter, verse, cite, [paragraph, …]], …]}

`father` indexes `fathers` ("" if no attribution can be established);
the four numbers are the verses commented on; `cite` is the
work the excerpt is taken from, as the edition gives it ("Hom. in Matt.
15"), or "". Comments are in the order of the Catena. With --check, nothing
is written.
"""

import argparse
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ROOT / "scripts" / "sources" / "catena"
DATA = ROOT / "public" / "data"

CHAPTERS = {"matthew": 28, "mark": 16, "luke": 24, "john": 21}
FROM_TEXT = {("matthew", 15)}

# The English transcription omits these names. The Latin edition in
# Corpus Thomisticum identifies them at 85337, 85736 and 86150 respectively.
ATTRIBUTIONS = {
    "matthew": {(1, 6): ("The Evangelist has now finished", "Gloss")},
    "luke": {(1, 30): ("When the angel saw that she was troubled", "Bede")},
    "john": {(19, 23): ("On Pilate giving sentence", "Augustine")},
}

# The Oxford translation transcribed by CCEL confirms these readings.
MATTHEW_ERRATA = (
    ((1, 1), "in Hebrewa;", "in Hebrew;"),
    ((1, 1), "of the earth he blessed", "of the earth be blessed"),
    ((1, 1), "will lore him", "will love him"),
    ((15, 39), "Greek textp.", "Greek text."),
    ((15, 39), "It mill be fair weather", "It will be fair weather"),
)

# The Fathers' names as the HTML prints them (in capitals), where a plain
# change of case would not give their usual English name.
NAMES = {
    "GREGORY": "Gregory the Great",
    "LEO": "Leo the Great",
    "CHRYSOLOGUS": "Peter Chrysologus",
    "DAMASCENE": "John Damascene",
    "TITUS BOSTRENSIS": "Titus of Bostra",
    "ISIDORE OF PELEUSIUM": "Isidore of Pelusium",
    "CLEMENT OF ALEXENDRIA": "Clement of Alexandria",
    "PETRUS ALFONSUS": "Petrus Alphonsi",
    "SEVERIANUS": "Severian",
    "THE COUNCIL OF EPHESUS": "Council of Ephesus",
    "GLOSS": "Gloss",
}

# The abbreviations of CCEL's text (Matthew 15).
ABBREVIATIONS = {
    "Jerome": "Jerome",
    "Chrys.": "Chrysostom",
    "Pseudo-Chrys.": "Pseudo-Chrysostom",
    "Remig.": "Remigius",
    "Raban.": "Rabanus",
    "Aug.": "Augustine",
    "Origen": "Origen",
    "Hilary": "Hilary",
    "Bede": "Bede",
    "Greg.": "Gregory the Great",
    "Ambrose": "Ambrose",
    "Gloss.": "Gloss",
    "Gloss": "Gloss",
}

# The citation of the source work that opens most excerpts: "(Hom. in Matt. 15)".
LEADING_CITE = re.compile(r"^\(([^()]{1,120})\)\s*")

# A lemma line: "13. Ye are…", "Ver. 1. The book…", "3–6. And Judas…",
# "43.Ye have…", "24 And to offer…", "28.—and blessed…", "16:1. The Pharisees…",
# "32. (For after…", "33, And his disciples…".
LEMMA = re.compile(r"^(?:Ver\.\s*)?(?:(\d+):)?(\d+)(?:\s*[–-]\s*(\d+))?\s*[.,]?\s*—?\s*(?=[A-Za-z“‘\"'(])")
# An excerpt the HTML did not mark up: "PSEUDO-ORIGEN. (Hom.…) Christ having…".
PLAIN_AUTHOR = re.compile(r"^([A-Z][A-Z' -]{2,}[A-Z])\s*\.\s+")
HEADING = re.compile(r"^(\d+):(\d+)(?:\s*[–-]\s*(?:(\d+):)?(\d+))?$")


class CatenaError(Exception):
    pass


def display_name(capitals):
    capitals = capitals.strip()
    if capitals in NAMES:
        return NAMES[capitals]
    words = capitals.title().split()
    small = {"Of", "The"}
    return " ".join(w.lower() if i and w in small else w for i, w in enumerate(words))


def clean(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text))).strip()


class Passage:
    """A run of lemma verses and the excerpts on them."""

    def __init__(self, start, end):
        self.start, self.end = start, end
        self.excerpts = []  # [father, cite, [paragraph, …]]


def excerpt(father, text):
    text = text.strip()
    cite = ""
    lead = LEADING_CITE.match(text)
    if lead:
        cite, text = lead.group(1).strip(), text[lead.end():]
    return [father, cite, [text] if text else []]


def read_html(path):
    """The passages of one chapter of the HTML, in the order of the Catena."""
    passages = []
    parts = re.split(r"<h3>(.*?)</h3>", path.read_text(encoding="utf-8"))
    for i in range(1, len(parts), 2):
        head = clean(parts[i])
        match = HEADING.match(head)
        if not match:
            raise CatenaError(f"{path}: cannot read the heading {head!r}")
        c1, v1, c2, v2 = match.groups()
        section_start = (int(c1), int(v1))
        section_end = (int(c2 or c1), int(v2 or v1))
        current = None
        lemma_run = False  # the previous line was a lemma line
        for raw in re.split(r"<br\s*/?>", parts[i + 1]):
            line = raw.strip()
            if not line or line.startswith(("</article", "<h1", "<h2", "<article")):
                continue
            author = re.match(r"^<strong>(.*?)</strong>\s*\.?\s*", line)
            if author:
                text = clean(line[author.end():])
                father = display_name(clean(author.group(1)))
            elif (plain := PLAIN_AUTHOR.match(clean(line))) and not LEMMA.match(clean(line)):
                text = clean(line)[plain.end():]
                father = display_name(plain.group(1))
            else:
                text = clean(line)
                lemma = LEMMA.match(text)
                lc = int(lemma.group(1) or section_start[0]) if lemma else None
                # After an excerpt, a numbered paragraph is a verse of the
                # passage only if the heading counts it; else it is the
                # Father's own numbering.
                if lemma and (
                    current is None
                    or not current.excerpts
                    or lemma_run
                    or section_start <= (lc, int(lemma.group(2))) <= section_end
                ):
                    first, last = int(lemma.group(2)), int(lemma.group(3) or lemma.group(2))
                    if lemma_run and current is not None:
                        current.end = max(current.end, (lc, last))
                    else:
                        current = Passage((lc, first), (lc, last))
                        passages.append(current)
                    lemma_run = True
                    continue
                # A paragraph without a name: it carries on the excerpt before
                # it, or, before any, is an excerpt whose name was lost.
                lemma_run = False
                if current is None:
                    current = Passage(section_start, section_end)
                    passages.append(current)
                if current.excerpts:
                    current.excerpts[-1][2].append(text)
                else:
                    current.excerpts.append(excerpt("", text))
                continue
            lemma_run = False
            if current is None:
                current = Passage(section_start, section_end)
                passages.append(current)
            current.excerpts.append(excerpt(father, text))
        if current is None:
            raise CatenaError(f"{path}: the passage {head} is empty")
    return passages


def read_text_chapter(path, chapter):
    """One chapter of CCEL's plain text of the Catena on Matthew."""
    text = path.read_text(encoding="utf-8", errors="replace")
    start = re.search(rf"^Chapter {chapter}\b.*$", text, flags=re.M)
    end = re.search(rf"^Chapter {chapter + 1}\b.*$", text, flags=re.M)
    if not start or not end:
        raise CatenaError(f"{path}: chapter {chapter} not found")
    body = text[start.end():end.start()]
    passages = []
    current = None
    lemma_run = False
    abbreviation = re.compile(
        r"^(" + "|".join(re.escape(a) for a in sorted(ABBREVIATIONS, key=len, reverse=True))
        + r")(?:\s+(interlin\.|ord\.))?(?:,\s*([^:]{1,80}))?:\s+"
    )
    for block in re.split(r"\n\s*\n|\n\s*_{10,}\s*\n", body):
        paragraph = re.sub(r"\s+", " ", block).strip().strip("_").strip()
        if not paragraph:
            continue
        lemma = re.match(r"^(\d+)[.,]\s+", paragraph)
        if lemma:
            verse = int(lemma.group(1))
            if lemma_run and current is not None:
                current.end = max(current.end, (chapter, verse))
            else:
                current = Passage((chapter, verse), (chapter, verse))
                passages.append(current)
            lemma_run = True
            continue
        lemma_run = False
        if current is None:
            raise CatenaError(f"{path}: text before the first lemma of chapter {chapter}")
        author = abbreviation.match(paragraph)
        if author:
            name, gloss, cite = author.groups()
            cite = ", ".join(part for part in (gloss, cite) if part)
            current.excerpts.append([ABBREVIATIONS[name], cite.strip(), [paragraph[author.end():]]])
        elif re.match(r"^[A-Z][\w.' -]{0,20}\.(?:,[^:]{0,60})?:\s", paragraph):
            raise CatenaError(f"{path}: unknown author in {paragraph[:60]!r}")
        elif current.excerpts:
            current.excerpts[-1][2].append(paragraph)
        else:
            current.excerpts.append(["", "", [paragraph]])
    # The chapter's last verse may be commented on with the next chapter's
    # first (15:39 with 16:1-4), where its lemma is given again.
    if passages and not passages[-1].excerpts:
        passages.pop()
    return passages


def correct_excerpts(gospel, passages):
    for start, (opening, name) in ATTRIBUTIONS.get(gospel, {}).items():
        matches = [
            entry
            for passage in passages if passage.start == start
            for entry in passage.excerpts
            if not entry[0] and entry[2] and entry[2][0].startswith(opening)
        ]
        if len(matches) != 1:
            raise CatenaError(f"{gospel} {start}: unattributed excerpt {opening!r} not found once")
        matches[0][0] = name

    if gospel != "matthew":
        return
    for start, old, new in MATTHEW_ERRATA:
        matches = [
            (paragraphs, i)
            for passage in passages if passage.start == start
            for _, _, paragraphs in passage.excerpts
            for i, paragraph in enumerate(paragraphs) if old in paragraph
        ]
        if len(matches) != 1:
            raise CatenaError(f"matthew {start}: erratum {old!r} not found once")
        paragraphs, i = matches[0]
        if paragraphs[i].count(old) != 1:
            raise CatenaError(f"matthew {start}: erratum {old!r} appears more than once")
        paragraphs[i] = paragraphs[i].replace(old, new)


def build_gospel(gospel):
    verses = [tuple(v) for v in json.loads((DATA / gospel / "verses.json").read_text(encoding="utf-8"))]
    position = {verse: i for i, verse in enumerate(verses)}
    passages = []
    for chapter in range(1, CHAPTERS[gospel] + 1):
        if (gospel, chapter) in FROM_TEXT:
            passages += read_text_chapter(SOURCES / f"{gospel}.txt", chapter)
        else:
            passages += read_html(SOURCES / gospel / f"{chapter}.html")

    correct_excerpts(gospel, passages)

    problems = []
    for passage in passages:
        for place in (passage.start, passage.end):
            if place not in position:
                problems.append(f"{gospel} {place[0]}:{place[1]} is not a verse")
        if not passage.excerpts:
            problems.append(f"{gospel} {passage.start}: a lemma with no excerpt")
    if problems:
        raise CatenaError("\n".join(problems))

    # Each passage runs on to the start of the next one (in the Gospel's
    # order), so no verse is left without the passage that comments on it.
    starts = sorted({position[p.start] for p in passages})
    for passage in passages:
        first = position[passage.start]
        later = [s for s in starts if s > first]
        reach = (later[0] - 1) if later else len(verses) - 1
        passage.end = verses[max(position[passage.end], reach)]

    names = []
    index = {}
    comments = []
    for passage in passages:
        for father, cite, paragraphs in passage.excerpts:
            if father not in index:
                index[father] = len(names)
                names.append(father)
            comments.append([index[father], *passage.start, *passage.end, cite, paragraphs])
    return {"fathers": names, "comments": comments}, len(verses)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="check only; write nothing")
    args = parser.parse_args()

    if not SOURCES.is_dir():
        sys.exit(f"{SOURCES} is missing: run scripts/fetch_sources.py --only fathers")
    for gospel in CHAPTERS:
        try:
            catena, verse_count = build_gospel(gospel)
        except CatenaError as error:
            sys.exit(str(error))
        attributed = sum(1 for c in catena["comments"] if catena["fathers"][c[0]])
        print(
            f"{gospel}: {len(catena['comments'])} excerpts "
            f"({len(catena['comments']) - attributed} unattributed) "
            f"from {len([n for n in catena['fathers'] if n])} authors"
        )
        if not args.check:
            out = DATA / gospel / "catena.json"
            out.write_text(
                json.dumps(catena, ensure_ascii=False, separators=(",", ":")) + "\n",
                encoding="utf-8",
            )
    if not args.check:
        print("wrote public/data/<gospel>/catena.json")


if __name__ == "__main__":
    main()
