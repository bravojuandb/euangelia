// The Fathers' words on a verse, from the Catena Aurea, shown under it in
// the reader. They are in English whatever the interface language.

// `comments`: [{ father, start: [chapter, verse], end: [chapter, verse], cite,
// paragraphs }], in the order of the Catena. `reference(start, end)` writes
// a passage's reference in the interface language; `words`: UI[lang].catena.
export function CommentaryPanel({ lang, comments, reference, words, onClose }) {
  // The Catena gives a passage, then the words on it: one heading per passage.
  const passages = [];
  for (const comment of comments) {
    const label = reference(comment.start, comment.end);
    const last = passages[passages.length - 1];
    if (last?.label === label) {
      last.comments.push(comment);
    } else {
      passages.push({ label, comments: [comment] });
    }
  }

  return (
    <aside className="commentary" aria-label={words.open(passages[0].label)}>
      <header className="commentary-header">
        <span className="commentary-title">Catena Aurea</span>
        <button
          type="button"
          className="commentary-close"
          aria-label={words.close}
          title={words.close}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {passages.map((passage, i) => (
        <section key={`${i}-${passage.label}`} className="commentary-passage">
          <h3 className="commentary-reference">{passage.label}</h3>
          {passage.comments.map((comment, i) => (
            <article key={i} className="commentary-excerpt" lang="en">
              <h4 className="commentary-father">
                {comment.father || <span lang={lang}>{words.unattributed}</span>}
                {comment.cite && <span className="commentary-cite"> · {comment.cite}</span>}
              </h4>
              {comment.paragraphs.map((paragraph, j) => (
                <p key={j}>{paragraph}</p>
              ))}
            </article>
          ))}
        </section>
      ))}
      <p className="commentary-note">{words.note}</p>
    </aside>
  );
}
