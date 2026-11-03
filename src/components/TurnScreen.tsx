import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { prefersReducedMotion } from "@/lib/browser";
import { FilmStrip } from "./FilmStrip";
import { FitTitle } from "./FitTitle";
import { HoldButton } from "./HoldButton";
import { QuitButton } from "./QuitButton";
import styles from "./TurnScreen.module.css";

const REVEAL_MS = 700;
const REVEAL_REDUCED_MS = 150;

/**
 * El turno de un jugador. El papel solo existe en la página mientras se mantiene el dedo,
 * y el del impostor ocupa lo mismo y brilla igual que el título: desde lejos no se distinguen.
 */
export function TurnScreen() {
  const { players, currentPlayerIndex, movie, nextPlayer } = useGame();
  const [held, setHeld] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [revealMs] = useState(() =>
    prefersReducedMotion() ? REVEAL_REDUCED_MS : REVEAL_MS,
  );
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const number = currentPlayerIndex + 1;
  const isImpostor = players[currentPlayerIndex].role === "impostor";
  const isLast = number === players.length;
  const visible = held || readerOpen;

  return (
    <div
      className={`pantalla ${styles.turno}`}
      data-held={visible || undefined}
    >
      <div className={styles.arriba}>
        <FilmStrip count={players.length} done={currentPlayerIndex} current={currentPlayerIndex} />
        <QuitButton />
      </div>
      <p className="solo-lector">
        Turno {number} de {players.length}
      </p>

      <div className={styles.quien}>
        <span className={styles.numero} aria-hidden>
          {number}
        </span>
        <h1 ref={heading} tabIndex={-1}>
          Jugador {number}, coge el móvil. Es solo para tus ojos.
        </h1>
      </div>

      <div className={styles.fotograma} aria-live="polite">
        {visible && movie ? (
          <>
            <FitTitle text={isImpostor ? "Eres el impostor" : movie.title} />
            {isImpostor ? (
              <ImpostorHints />
            ) : (
              <p className={styles.nota}>
                Esta es tu película. Da pistas sin regalársela al impostor.
              </p>
            )}
            <span
              className={styles.revelado}
              style={{ "--duracion": `${revealMs}ms` } as React.CSSProperties}
              aria-hidden
            />
          </>
        ) : (
          <p className={styles.vacio}>
            Tu papel se revela aquí mientras mantienes el dedo.
          </p>
        )}
      </div>

      <div className={styles.siguiente}>
        {seen ? (
          <button
            type="button"
            className="accion-sec"
            style={{ visibility: visible ? "hidden" : undefined }}
            onClick={nextPlayer}
          >
            {isLast ? "Ya lo he visto, a jugar" : `Ya lo he visto, le toca al ${number + 1}`}
          </button>
        ) : (
          <p className="texto-tenue">Cuando lo veas, podrás pasar el móvil.</p>
        )}
      </div>

      <HoldButton
        label="Mantén para revelar"
        heldLabel="Suelta para ocultar"
        hint="Al soltar desaparece al instante"
        tooShort="Deja el dedo un momento, hasta que aparezca"
        durationMs={revealMs}
        onHoldChange={setHeld}
        onComplete={() => setSeen(true)}
      />
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
    return (
      <p className={styles.nota}>
        Sin pistas esta vez. Escucha a los demás y sigue la conversación.
      </p>
    );
  return (
    <dl className={styles.pistas}>
      {hints.includes("GENRE") && (
        <div>
          <dt>Género</dt>
          <dd>{movie.genre}</dd>
        </div>
      )}
      {hints.includes("YEAR") && (
        <div>
          <dt>Año</dt>
          <dd>{movie.releaseYear ?? "Desconocido"}</dd>
        </div>
      )}
      {hints.includes("KEYWORDS") && (
        <div>
          <dt>Claves</dt>
          <dd>
            {movie.keywords.length
              ? movie.keywords.slice(0, 3).join(", ")
              : "Sin palabras clave"}
          </dd>
        </div>
      )}
    </dl>
  );
}
