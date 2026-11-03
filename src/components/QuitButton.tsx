import { useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { Sheet } from "./Sheet";
import styles from "./QuitButton.module.css";

/** Abandonar una partida a medias, con confirmación. */
export function QuitButton() {
  const { resetGame } = useGame();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.salir}
        aria-label="Abandonar la partida"
        onClick={() => dialog.current?.showModal()}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </button>
      <Sheet ref={dialog} titleId="abandonar">
        <h2 id="abandonar" className="titular">
          ¿Abandonar la partida?
        </h2>
        <p>Se pierde el reparto y volvéis a los ajustes.</p>
        <button type="button" className="accion" onClick={resetGame}>
          Abandonar
        </button>
        <form method="dialog">
          <button className="accion-sec">Seguir jugando</button>
        </form>
      </Sheet>
    </>
  );
}
