import { useEffect, useRef } from "react";
import { VERNACULAR_LANGUAGES } from "./config.js";

// Shown on the first visit: the reader picks the language to start in, each
// named in its own language, since the page cannot know yet which one its
// reader speaks; the one the browser prefers has the focus. A language with
// several translations starts in the one already chosen, or else its first.
// `current`: the translation chosen from the browser's languages.
// `onChoose(id)`: a translation was picked. `onClose()`: the window closed,
// by a choice or by Escape (which keeps `current`).
export function WelcomeDialog({ current, onChoose, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    dialog.querySelector("[data-current]")?.focus();
  }, []);

  const choose = (id) => {
    onChoose(id);
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      className="guide welcome-dialog"
      aria-labelledby="welcome-title"
      onClose={onClose}
    >
      <div className="welcome-body">
        <h2 id="welcome-title" className="welcome-title">
          Euangelia
        </h2>
        <ul className="welcome-choices">
          {VERNACULAR_LANGUAGES.map(({ lang, label, translations }) => {
            const chosen = translations.find((translation) => translation.id === current);
            return (
              <li key={lang}>
                <button
                  type="button"
                  className="welcome-choice"
                  lang={lang}
                  data-current={chosen ? true : undefined}
                  onClick={() => choose((chosen ?? translations[0]).id)}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
