import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { HoldButton } from "./HoldButton";
import { QuitButton } from "./QuitButton";
import styles from "./TurnScreen.module.css";

/** Lo que hay que mantener para contar como visto: basta para leer un título. */
const SEEN_AFTER_MS = 500;

/**
 * El turno de un jugador. Toda la pantalla es la zona de mantener y el papel solo existe en la
 * página mientras dura el gesto. Todos los estados comparten el mismo esqueleto de texto: una
 * línea, un título y una nota, así que el impostor y el grupo no se distinguen de lejos.
 */
export function TurnScreen() {
  const { players, currentPlayerIndex, movie, nextPlayer } = useGame();
  const [held, setHeld] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const number = currentPlayerIndex + 1;
  const isImpostor = players[currentPlayerIndex].role === "impostor";
  const isLast = number === players.length;
  const visible = held || readerOpen;

  return (
    <div className={`pantalla ${styles.turno}`} data-held={visible || undefined}>
      <div className={styles.barra}>
        <QuitButton />
      </div>

      <div className={styles.papel} aria-live="polite">
        <h1 ref={heading} tabIndex={-1} className={`secundario ${styles.quien}`}>
          Jugador {number} de {players.length}
        </h1>
        {visible && movie ? (
          <div className={styles.revelado}>
            <p className="titulo">{isImpostor ? "Eres el impostor" : movie.title}</p>
            {isImpostor ? (
              <ImpostorHints />
            ) : (
              <p className={styles.nota}>Da pistas sin regalársela al impostor.</p>
            )}
          </div>
        ) : seen ? (
          <>
            <p className="titulo">Ya está oculto</p>
            <p className={styles.nota}>Para verlo otra vez, mantén el dedo.</p>
          </>
        ) : (
          <>
            <p className="titulo">Coge el móvil</p>
            <p className={styles.nota}>
              {tooShort
                ? "Mantén un momento más, hasta que te dé tiempo a leerlo."
                : "Tu papel se ve solo mientras mantienes el dedo. Que no mire nadie más."}
            </p>
          </>
        )}
      </div>

      <HoldButton
        className={styles.superficie}
        ariaLabel="Mantén pulsado para ver tu papel"
        durationMs={SEEN_AFTER_MS}
        onHoldChange={setHeld}
        onRelease={(completed) => setTooShort(!completed && !seen)}
        onComplete={() => setSeen(true)}
      />

      <div className={styles.pie}>
        {seen ? (
          <button type="button" className="accion" onClick={nextPlayer}>
            {isLast ? "Dejar el móvil en la mesa" : `Pasar el móvil al jugador ${number + 1}`}
          </button>
        ) : (
          // Solo enseña dónde pulsar: el botón de verdad es toda la pantalla.
          <span className="accion" aria-hidden>
            Mantén para ver tu papel
          </span>
        )}
      </div>

      <button
        type="button"
        className={`solo-lector ${styles.lector}`}
        onClick={() => {
          setReaderOpen(!readerOpen);
          setSeen(true);
        }}
      >
        {readerOpen ? "Ocultar mi papel" : "Mostrar mi papel sin mantener pulsado"}
      </button>
    </div>
  );
}

function ImpostorHints() {
  const { movie, hints } = useGame();
  if (!movie) return null;
  if (hints.length === 0)
    return <p className={styles.nota}>Sin pistas esta vez. Escucha y disimula.</p>;
  return (
    <div className={styles.nota}>
      {hints.includes("GENRE") && <p>Género: {movie.genre}</p>}
      {hints.includes("YEAR") && <p>Año: {movie.releaseYear ?? "desconocido"}</p>}
      {hints.includes("KEYWORDS") && (
        <p>
          Palabras clave:{" "}
          {movie.keywords.length ? movie.keywords.slice(0, 3).join(", ") : "ninguna"}
        </p>
      )}
    </div>
  );
}
