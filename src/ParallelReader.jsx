import { Fragment, useMemo } from "react";
import { bindPunctuation } from "./text.js";

// Consecutive rows of the same chapter, each group under its divider.
function groupByChapter(rows) {
  const groups = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last?.chapter === row.chapter) {
      last.rows.push(row);
    } else {
      groups.push({ chapter: row.chapter, rows: [row] });
    }
  }
  return groups;
}

// The rows that follow left-out verses, as in a Gospel read with omissions.
function rowsAfterGaps(rows) {
  const after = new Set();
  rows.forEach((row, i) => {
    if (i > 0 && row.index !== rows[i - 1].index + 1) {
      after.add(row.index);
    }
  });
  return after;
}

const gap = (
  <div className="verse-gap" aria-hidden="true">
    · · ·
  </div>
);

// The texts side by side, one row per verse.
// `rows`: { chapter, verse, index } in reading order, where `index` is the
// verse's position in the Gospel's texts.
// `columns`: { id, label, note, code, textLang, textClass, texts, missing,
// dividerLang, divider(chapter) }.
// `missing`: the note for a verse a column's text lacks, unless the column
// has its own.
// `heading` (optional): one { lang, title, reference } per column, to head
// the text as a reading is announced.
// `notes` (optional): a commentary on some verses. `notes.label(row)` names
// the commentary on a row (its marker's label), or is null for a row
// without one; `notes.open` is the index of the row whose commentary is
// shown, under it, by `notes.render(row)`; `notes.onToggle(row)` opens or
// closes it.
function ParallelReader({ rows, columns, target, onToggleVerse, missing, heading, notes }) {
  const groups = useMemo(() => groupByChapter(rows), [rows]);
  const gaps = useMemo(() => rowsAfterGaps(rows), [rows]);

  return (
    <div className="parallel-reader" style={{ "--columns": columns.length }}>
      <div className="folio-rule" aria-hidden="true" />
      {columns.map((column) => (
        <div key={column.id} className="parallel-header">
          <span className="parallel-header-label">{column.label}</span>
          <span className="parallel-header-note">{column.note}</span>
        </div>
      ))}

      {heading && (
        <header className="pericope-heading">
          {heading.map((cell, i) => (
            <div key={columns[i].id} className="pericope-heading-cell" lang={cell.lang}>
              <p className="pericope-incipit">{cell.title}</p>
              <p className="pericope-reference">{cell.reference}</p>
            </div>
          ))}
        </header>
      )}

      {groups.map((group) => (
        <section
          key={`chapter-${group.chapter}`}
          className="chapter-section"
          aria-labelledby={`chapter-${group.chapter}`}
        >
          {gaps.has(group.rows[0].index) && gap}
          <h2 id={`chapter-${group.chapter}`} className="chapter-divider">
            {columns.map((column) => (
              <span key={column.id} lang={column.dividerLang}>
                {column.divider(group.chapter)}
              </span>
            ))}
          </h2>

          {group.rows.map((row, i) => {
            const isTarget = target?.chapter === row.chapter && target?.verse === row.verse;
            const noteLabel = notes?.label(row) ?? null;
            const noteOpen = noteLabel !== null && notes.open === row.index;
            return (
              <Fragment key={`verse-${row.chapter}-${row.verse}`}>
                {i > 0 && gaps.has(row.index) && gap}
                <div
                  id={`verse-${row.chapter}-${row.verse}`}
                  className={`parallel-verse-row ${isTarget ? "is-target" : ""}`}
                  data-verse={row.verse}
                  onClick={() => onToggleVerse(row)}
                >
                  {columns.map((column, c) => {
                    const text = column.texts[row.index];
                    return (
                      <article key={column.id} className="parallel-cell">
                        <span className="verse-number">{row.verse}</span>
                        <span className="cell-lang" aria-hidden="true">
                          {column.code}
                        </span>
                        {c === 0 && noteLabel !== null && (
                          <button
                            type="button"
                            className="note-marker"
                            aria-label={noteLabel}
                            title={noteLabel}
                            aria-expanded={noteOpen}
                            onClick={(event) => {
                              // Opening the commentary is not a click on the verse.
                              event.stopPropagation();
                              notes.onToggle(row);
                            }}
                          >
                            †
                          </button>
                        )}
                        {text ? (
                          <p className={`verse ${column.textClass}`} lang={column.textLang}>
                            {bindPunctuation(text)}
                          </p>
                        ) : (
                          <p className="verse verse-missing">{column.missing ?? missing}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
                {noteOpen && notes.render(row)}
              </Fragment>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export default ParallelReader;
