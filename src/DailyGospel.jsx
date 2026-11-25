import { addDays } from "./liturgy.js";
import { dayTitle, LITURGY, longDate } from "./liturgyText.js";
import { FIRST_DAILY_DATE, isDailyDate, LAST_DAILY_DATE } from "./settings.js";

const capitalize = (text) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

// The day being read, with the days before and after it and today.
export function DailyNav({ lang, date, today, onGoTo }) {
  const words = LITURGY[lang];
  return (
    <div className="reader-nav-row daily-nav">
      <span className="nav-label" aria-hidden="true">
        {words.date}
      </span>
      <button
        type="button"
        className="chapter-chip"
        aria-label={words.previous}
        title={words.previous}
        disabled={date === FIRST_DAILY_DATE}
        onClick={() => onGoTo(addDays(date, -1))}
      >
        ‹
      </button>
      <input
        className="reference-input date-input"
        type="date"
        min={FIRST_DAILY_DATE}
        max={LAST_DAILY_DATE}
        aria-label={words.date}
        value={date}
        onChange={(event) => {
          if (isDailyDate(event.target.value)) {
            onGoTo(event.target.value);
          }
        }}
      />
      <button
        type="button"
        className="chapter-chip"
        aria-label={words.next}
        title={words.next}
        disabled={date === LAST_DAILY_DATE}
        onClick={() => onGoTo(addDays(date, 1))}
      >
        ›
      </button>
      <button
        type="button"
        className="reference-submit"
        disabled={date === today}
        onClick={() => onGoTo(today)}
      >
        {words.today}
      </button>
    </div>
  );
}

// The name of the day and, when it has several, a choice of its Gospels.
export function DailyHeading({ lang, day, entry, chosen, onChoose, contextHref }) {
  const words = LITURGY[lang];
  const reference = (option) => `${words.books[option.gospel]} ${words.reference(option.ref)}`;
  const hasMemorialOption = entry.options.some((option) => option.memorial);
  return (
    <header className="daily-heading">
      <p className="daily-date">{capitalize(longDate(lang, day.date))}</p>
      <h2 className="daily-title">{dayTitle(lang, day.title)}</h2>
      {day.transferred && <p className="daily-note">{words.transferred}</p>}
      {entry.options.length > 1 && (
        <div className="segmented daily-options" role="group" aria-label={words.options}>
          {entry.options.map((option, i) => {
            const labels = option.labels?.map((label) => words.labels[label]) ?? [];
            if (option.memorial) {
              labels.unshift(words.names[option.memorial]);
            } else if (hasMemorialOption && i === entry.main) {
              labels.unshift(words.weekdayGospel);
            }
            return (
              <button
                key={`${i}-${option.ref}`}
                type="button"
                className="segment"
                aria-pressed={i === chosen}
                onClick={() => onChoose(i)}
              >
                {labels.length ? (
                  <>
                    <span>{labels.join(" · ")}</span>
                    <span className="segment-edition">{reference(option)}</span>
                  </>
                ) : (
                  <span>{reference(option)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <a className="text-button daily-context" href={contextHref}>
        {words.inContext}
      </a>
    </header>
  );
}
