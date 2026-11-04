import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { toPlayer } from "@/lib/game";
import { PlayerDots } from "./PlayerDots";
import styles from "./ResumeScreen.module.css";

/** Al volver a una partida guardada. No enseña ningún papel: solo a quién le toca. */
export function ResumeScreen() {
  const { phase, players, currentPlayerIndex, names, continueGame, resetGame } = useGame();
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
        Partida a medias
      </h1>
      <p className={styles.nota}>
        {atTable
          ? "Ya lo habíais visto todos. Falta votar y ver quién era."
          : `Le toca ${toPlayer(currentPlayerIndex, names)}. Los papeles siguen ocultos.`}
      </p>
      <div className={styles.pie}>
        <button type="button" className="accion" onClick={continueGame}>
          Seguir
        </button>
        <button type="button" className={`enlace ${styles.otra}`} onClick={resetGame}>
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
}
