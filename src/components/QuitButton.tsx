import { useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Sheet } from "./Sheet";
import styles from "./QuitButton.module.css";

/** Abandonar una partida a medias, con confirmación. */
export function QuitButton() {
  const { resetGame } = useGame();
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.salir}
        aria-label={t.quit.aria}
        onClick={() => dialog.current?.showModal()}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path
            d="M3 3l12 12M15 3L3 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <Sheet ref={dialog} titleId="abandonar">
        <h2 id="abandonar" className={styles.titulo}>
          {t.quit.title}
        </h2>
        <p className={styles.texto}>{t.quit.text}</p>
        <button type="button" className="accion" onClick={resetGame}>
          {t.quit.confirm}
        </button>
        <form method="dialog">
          <button className={`accion-sec ${styles.seguir}`}>{t.quit.keepPlaying}</button>
        </form>
      </Sheet>
    </>
  );
}
