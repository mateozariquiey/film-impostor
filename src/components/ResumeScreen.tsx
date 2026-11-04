import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { PosterWall } from "./PosterWall";
import styles from "./ResumeScreen.module.css";

/** Al volver a una partida guardada. No enseña ningún papel: solo a quién le toca. */
export function ResumeScreen() {
  const { phase, players, currentPlayerIndex, names, impostorCount, continueGame, resetGame } = useGame();
  const { t } = useLocale();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const atTable = phase === "TABLE";

  return (
    <div className={`pantalla ${styles.reanudar}`}>
      <PosterWall seen={atTable ? players.length : currentPlayerIndex} className={styles.pared} />
      <h1 ref={heading} tabIndex={-1} className={`cartelon ${styles.titular}`}>
        {t.resume.title}
      </h1>
      <p className={styles.nota}>
        {atTable ? t.resume.atTable(impostorCount) : t.resume.turnOf(currentPlayerIndex, names)}
      </p>
      <div className={styles.pie}>
        <button type="button" className={`enlace ${styles.otra}`} onClick={resetGame}>
          {t.resume.restart}
        </button>
        <button type="button" className="accion accion-pie" onClick={continueGame}>
          {t.resume.continue}
        </button>
      </div>
    </div>
  );
}
