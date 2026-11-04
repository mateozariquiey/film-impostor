import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { PlayerDots } from "./PlayerDots";
import styles from "./ResumeScreen.module.css";

/** Al volver a una partida guardada. No enseña ningún papel: solo a quién le toca. */
export function ResumeScreen() {
  const { phase, players, currentPlayerIndex, names, continueGame, resetGame } = useGame();
  const { t } = useLocale();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const atTable = phase === "TABLE";

  return (
    <div className="pantalla">
      <div className={styles.barra}>
        <PlayerDots count={players.length} current={atTable ? players.length : currentPlayerIndex} />
      </div>
      <h1 ref={heading} tabIndex={-1} className={`enorme ${styles.titular}`}>
        {t.resume.title}
      </h1>
      <p className={styles.nota}>
        {atTable ? t.resume.atTable : t.resume.turnOf(currentPlayerIndex, names)}
      </p>
      <div className={styles.pie}>
        <button type="button" className="accion" onClick={continueGame}>
          {t.resume.continue}
        </button>
        <button type="button" className={`enlace ${styles.otra}`} onClick={resetGame}>
          {t.resume.restart}
        </button>
      </div>
    </div>
  );
}
