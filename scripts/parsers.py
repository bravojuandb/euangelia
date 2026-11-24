"""Parsers for the downloaded source texts.

Each parser returns a dict {"C:V": text} in the source's own verse
numbering. The Wikisource parsers also return a log of the places where the
transcription's verse anchors had to be corrected.
"""

import html
import re
import unicodedata

NBSP = " "


def _key(chapter, verse):
    return f"{chapter}:{verse}"


# --- SBL Greek New Testament ------------------------------------------------

# Variation-unit signs of the SBLGNT apparatus. The double brackets ⟦ ⟧ are
# kept: they mark passages as later additions.
_APPARATUS_SIGNS = str.maketrans("", "", "⸀⸁⸂⸃⸄⸅")


def parse_sblgnt(text):
    """SBLGNT plain text: a title line, then "John 1:1<TAB>text" per verse."""
    verses = {}
    for line in text.splitlines():
        m = re.match(r"^\S+ (\d+):(\d+)\t(.*)$", line)
        if not m:
            continue  # book title
        clean = re.sub(r"\s+", " ", m.group(3).translate(_APPARATUS_SIGNS)).strip()
        verses[_key(int(m.group(1)), int(m.group(2)))] = unicodedata.normalize("NFC", clean)
    return verses


# --- Clementine Vulgate Project ---------------------------------------------


def parse_clementine(text):
    """Clementine Vulgate Project book file: "C:V text" per line.

    Removes the project's layout markup ([ ] around verse sections, / line
    breaks, \\ paragraph marks) and repairs œ/Œ that were mis-decoded from
    Windows-1252 as U+009C/U+008C.
    """
    verses = {}
    for line in text.splitlines():
        if not line.strip():
            continue
        m = re.match(r"^(\d+):(\d+) (.*)$", line)
        if not m:
            raise ValueError(f"unexpected line: {line!r}")
        clean = m.group(3).replace("\u009c", "œ").replace("\u008c", "Œ")
        clean = re.sub(r"[\[\]/\\]", " ", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        key = _key(int(m.group(1)), int(m.group(2)))
        if key in verses:
            raise ValueError(f"duplicate verse {key}")
        verses[key] = clean
    return verses


# --- King James Version (1769 text), eBible.org USFM ------------------------

# \w word|strong="G1234"\w* : a word tagged with its Strong's number. Inside
# another style the markers take a plus sign: \+w ... \+w*.
_USFM_WORD = re.compile(r"\\\+?w\s+([^|\\]*?)(?:\|[^\\]*)?\\\+?w\*")
# Character styles whose text is kept as plain text: \add (words the
# translators printed in italics), \wj (words of Jesus) and \nd (LORD,
# printed in small capitals).
_USFM_STYLE = re.compile(r"\\\+?(?:add|wj|nd)\*|\\\+?(?:add|wj|nd)\s")


def parse_usfm(text):
    """USFM book file as published by eBible.org: \\c N opens a chapter,
    \\v N a verse. Paragraph marks (\\p and the printed ¶) are dropped."""
    verses = {}
    chapter = None
    for m in re.finditer(r"\\c\s+(\d+)|\\v\s+(\d+)\s+(.*?)(?=\\c\s|\\v\s|\Z)", text, flags=re.S):
        if m.group(1):
            chapter = int(m.group(1))
            continue
        clean = _USFM_WORD.sub(r"\1", m.group(3))
        clean = _USFM_STYLE.sub("", clean)
        clean = re.sub(r"\\p\b|¶", " ", clean)
        if "\\" in clean:
            raise ValueError(f"unhandled USFM marker in {chapter}:{m.group(2)}: {clean!r}")
        clean = re.sub(r"\s+", " ", clean).strip()
        key = _key(chapter, int(m.group(2)))
        if key in verses:
            raise ValueError(f"duplicate verse {key}")
        verses[key] = unicodedata.normalize("NFC", clean)
    return verses


# --- Bible Crampon (1923), fr.wikisource -------------------------------------


def parse_crampon(page_html):
    """Rendered Wikisource HTML of a book of the Bible Crampon (1923).

    Each verse opens with <span id="C-V"> holding its number. The text runs
    to the next verse, or to a chapter number, a section heading or the
    notes, whichever comes first. Footnote calls are dropped; the drop cap
    that opens a chapter is joined to the rest of its word.
    """
    t = page_html
    i = t.find('<ol class="references"')
    if i != -1:
        t = t[:i]
    t = re.sub(r'<sup[^>]*class="reference"[^>]*>.*?</sup>', "", t, flags=re.S)
    t = re.sub(r'<sup class="verset-num".*?</sup>', "", t, flags=re.S)
    t = re.sub(r'<span[^>]*class="pagenum[^"]*"[^>]*>.*?</span>', "", t, flags=re.S)

    marker_re = re.compile(r'<span id="(\d+)-(\d+)">')
    # Section headings come as headings, as indented or centred blocks, or as
    # a paragraph opening with a numbered title in small capitals.
    stop_re = re.compile(
        r'<span id="CH\d+"|<div style="margin-left|<div class="alinea|<h[1-6]\b'
        r'|<div style="text-align:center|<p><span class="sc">'
    )

    marks = list(marker_re.finditer(t))
    verses = {}
    for idx, m in enumerate(marks):
        end = marks[idx + 1].start() if idx + 1 < len(marks) else len(t)
        segment = t[m.end():end]
        stop = stop_re.search(segment)
        if stop:
            segment = segment[: stop.start()]
        text = re.sub(r"</?(?:p|div|br|li|dd|dt)\b[^>]*>", " ", segment)
        text = re.sub(r"<[^>]+>", "", text)
        text = html.unescape(text).replace(NBSP, " ").replace(" ", " ")
        text = re.sub(r"\s+", " ", text).strip()
        # The drop cap and the rest of its word are separate blocks: "A u".
        text = re.sub(r"^([A-ZÀ-Ý]) (?=[a-zà-ÿ])", r"\1", text)
        # French spacing around «» ; : ! ? is kept, as printed.
        key = _key(int(m.group(1)), int(m.group(2)))
        if key in verses:
            raise ValueError(f"duplicate verse {key}")
        verses[key] = unicodedata.normalize("NFC", text)
    return verses


# --- Antonio Martini (1769-1781), Parola Viva open data ---------------------


def parse_martini(chapters):
    """Parola Viva's chapter files for one book: a list of
    {"c": chapter, "v": [{"n": verse, "t": text}, …]}."""
    verses = {}
    for chapter in chapters:
        for verse in chapter["v"]:
            key = _key(int(chapter["c"]), int(verse["n"]))
            if key in verses:
                raise ValueError(f"duplicate verse {key}")
            text = re.sub(r"\s+", " ", verse["t"]).strip()
            verses[key] = unicodedata.normalize("NFC", text)
    return verses


# --- Torres Amat (1836), es.wikisource --------------------------------------


def parse_torres_amat(page_html):
    """Rendered Wikisource HTML of La Sagrada Biblia, tr. Torres Amat (1836).

    Verse anchors look like <span title="1:1" id="1:1" ...>1</span>, but the
    transcription has slips: some anchors carry a wrong or empty number and
    some verses have no anchor, only their number in the running text. So
    verses are numbered by sequence: an anchor labelled 1 opens the next
    chapter, any other verse is the previous one plus one, and a bare number
    in the text that equals the next expected verse starts that verse. When a
    label runs ahead of the sequence and the next anchor agrees with it, the
    verses in between are missing from the text ("gaps").
    """
    t = page_html
    # {{np}} marks where a paragraph continues on the next scanned page; it is
    # an empty <div>, which would otherwise end the verse and drop the rest.
    t = re.sub(r'<div class="np"></div>', " ", t)
    t = re.sub(r'<sup[^>]*class="reference"[^>]*>.*?</sup>', "", t, flags=re.S)
    t = re.sub(r'<span[^>]*class="pagenum[^"]*"[^>]*>\s*</span>', "", t)
    t = re.sub(r'(<span[^>]*\bid="\d+:\d*"[^>]*>)\s*\d*\s*</span>', r"\1</span>", t)

    marker_re = re.compile(r'<span[^>]*\bid="(\d+):(\d*)"[^>]*>')
    stop_re = re.compile(r"<div\b|<center\b|<table\b|<h[1-6]\b|<ol\b")

    def clean(segment):
        segment = re.sub(r"</?(?:p|br|li|dd|dt)\b[^>]*>", " ", segment)
        text = re.sub(r"<[^>]+>", "", segment)
        text = html.unescape(text).replace(NBSP, " ")
        text = re.sub(r"\s+", " ", text).strip()
        # Space left before punctuation where a footnote marker was removed.
        return re.sub(r"\s+([,.;:!?)»])", r"\1", text)

    marks = list(marker_re.finditer(t))
    verses = {}
    log = {"relabelled": [], "without_anchor": [], "gaps": []}
    chapter, verse = 0, 0
    for idx, m in enumerate(marks):
        end = marks[idx + 1].start() if idx + 1 < len(marks) else len(t)
        segment = t[m.end():end]
        stop = stop_re.search(segment)
        if stop:
            segment = segment[: stop.start()]
        label = (int(m.group(1)), int(m.group(2) or 0))
        next_label = int(marks[idx + 1].group(2) or 0) if idx + 1 < len(marks) else 0
        if label[1] == 1:
            chapter, verse = chapter + 1, 1
        elif label[1] > verse + 1 and next_label == label[1] + 1:
            log["gaps"].append(f"{chapter}:{verse + 1}-{label[1] - 1}")
            verse = label[1]
        else:
            verse += 1
        if label != (chapter, verse):
            log["relabelled"].append(f"{label[0]}:{label[1]} -> {chapter}:{verse}")

        rest = clean(segment)
        while True:
            bare = re.search(rf"(?<!\S){verse + 1}(?=\s)", rest)
            if not bare:
                break
            verses[_key(chapter, verse)] = rest[: bare.start()].strip()
            verse += 1
            log["without_anchor"].append(_key(chapter, verse))
            rest = rest[bare.end():].strip()
        key = _key(chapter, verse)
        if key in verses:
            raise ValueError(f"duplicate verse {key}")
        verses[key] = rest
    return verses, log


# --- Biblia Wujka (1923), pl.wikisource -------------------------------------


def parse_wujek(page_html):
    """Rendered Wikisource HTML of Biblia Wujka (1923), a "(całość)" page.

    Some anchors carry the previous chapter's number (Matthew 2:1 is "1:1"),
    so verses are numbered by sequence: a verse labelled 1 opens the next
    chapter, any other verse is the previous one plus one.
    """
    t = page_html
    for marker in ('<div class="references', '<ol class="references', '<div class="mw-references'):
        i = t.find(marker)
        if i != -1:
            t = t[:i]
    # The {{Korekta}} template keeps the misprinted form in a display:none span
    # next to the corrected one.
    hidden_re = re.compile(r"<span[^>]*display:\s*none[^>]*>[^<]*</span>")
    log = {"misprints_corrected": len(hidden_re.findall(t)), "relabelled": []}
    t = hidden_re.sub("", t)
    t = re.sub(r'<sup[^>]*class="reference"[^>]*>.*?</sup>', "", t, flags=re.S)
    t = re.sub(r'<span[^>]*class="ws-pagenum[^"]*"[^>]*>.*?</span>', "", t, flags=re.S)
    # Verse-number superscripts (<sup>2&#160;</sup>) right after the anchor.
    t = re.sub(r'(<span[^>]*id="\d+:\d+"[^>]*>)\s*<sup>[^<]*</sup>', r"\1", t)

    marker_re = re.compile(r'<span[^>]*\bid="(\d+):(\d+)"[^>]*>')
    # Chapter headings, chapter summaries and the end of the text also end a verse.
    stop_re = re.compile(
        r'<div class="center"|<div style="font-size:85%|<h[1-6]\b|<table\b|</div>\s*</div>\s*$'
    )

    marks = list(marker_re.finditer(t))
    verses = {}
    chapter, verse = 0, 0
    for idx, m in enumerate(marks):
        end = marks[idx + 1].start() if idx + 1 < len(marks) else len(t)
        segment = t[m.end():end]
        stop = stop_re.search(segment)
        if stop:
            segment = segment[: stop.start()]
        # Block-level tags separate words; inline tags do not, e.g. the drop
        # cap <span><b>N</b></span>a must become "Na".
        text = re.sub(r"</?(?:p|div|br|li|ol|ul|dl|dd|dt)\b[^>]*>", " ", segment)
        text = re.sub(r"<[^>]+>", "", text)
        text = html.unescape(text).replace(NBSP, " ")
        text = re.sub(r"\s+", " ", text).strip()
        label = (int(m.group(1)), int(m.group(2)))
        if label[1] == 1:
            chapter, verse = chapter + 1, 1
        else:
            verse += 1
        if label != (chapter, verse):
            log["relabelled"].append(f"{label[0]}:{label[1]} -> {chapter}:{verse}")
        key = _key(chapter, verse)
        if key in verses:
            raise ValueError(f"duplicate verse {key}")
        verses[key] = text
    return verses, log
