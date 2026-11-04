import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { HoldButton } from "./HoldButton";
import { PlayerSlots } from "./PlayerSlots";
import { QuitButton } from "./QuitButton";
import { TitleLines } from "./TitleLines";
import styles from "./TurnScreen.module.css";

/** Lo que hay que mantener para contar como visto: basta para leer un título. */
const SEEN_AFTER_MS = 500;

/**
 * El turno de un jugador. Toda la pantalla es la zona de mantener y el papel solo existe en la
 * página mientras dura el gesto. Todos los estados son el mismo cartel: un rectángulo que se enciende
 * igual para todos. Lo grande es el nombre, que no es secreto, y el papel va a un tamaño que se lee
 * de cerca pero no desde el sofá: en una simulación con OCR, a 30 px ya se lee a veces a 2,5 m, y a 28 no.
 */
export function TurnScreen() {
  const { players, currentPlayerIndex, movie, names, nextPlayer } = useGame();
  const { t } = useLocale();
  const [held, setHeld] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const number = currentPlayerIndex + 1;
  const name = names[currentPlayerIndex];
  const isImpostor = players[currentPlayerIndex].role === "impostor";
  const isLast = number === players.length;
  const visible = held || readerOpen;

  return (
    <div className={`pantalla ${styles.turno}`} data-held={visible || undefined}>
      <div className={styles.barra}>
        <PlayerSlots count={players.length} current={currentPlayerIndex} />
        <QuitButton />
      </div>

      <div className={styles.papel} aria-live="polite">
        <div className={styles.cartel} data-cartel>
          {/* El nombre se ve el primero en el orden de lectura, pero va abajo: es lo grande del cartel porque no es secreto. */}
          <h1 ref={heading} tabIndex={-1} className={styles.quien}>
            {name ? (
              <>
                <span className={styles.etiqueta}>{t.turn.whoseTurn}</span>{" "}
                <span
                  className={`cartelon ${styles.nombre}`}
                  style={{ "--letras": Math.max(name.length, 3) } as React.CSSProperties}
                >
                  {name}
                </span>{" "}
                <span className="solo-lector">{t.turn.playerOf(number, players.length)}</span>
              </>
            ) : (
              <>
                <span className={styles.etiqueta}>{t.turn.player}</span>{" "}
                <span className={`cartelon ${styles.nombre}`} style={{ "--letras": 3 } as React.CSSProperties}>
                  {number}
                </span>{" "}
                <span className="solo-lector">{t.turn.ofTotal(players.length)}</span>
              </>
            )}
          </h1>
          {visible && movie ? (
            <div className={styles.revelado}>
              <p className={`cartelon ${styles.titular}`}>
                {isImpostor ? t.turn.youAreImpostor : <TitleLines title={movie.title} partClassName={styles.parte} />}
              </p>
              {isImpostor ? <ImpostorHints /> : <p className={styles.nota}>{t.turn.giveClues}</p>}
            </div>
          ) : seen ? (
            <div className={styles.revelado}>
              <p className={`cartelon ${styles.titular}`}>{t.turn.hidden}</p>
              <p className={styles.nota}>{t.turn.seeAgain}</p>
            </div>
          ) : (
            <div className={styles.revelado}>
              <p className={`cartelon ${styles.titular}`}>{t.turn.takePhone}</p>
              <p className={styles.nota}>{tooShort ? t.turn.holdLonger : t.turn.holdNote}</p>
            </div>
          )}
        </div>
      </div>

      <HoldButton
        className={styles.superficie}
        ariaLabel={t.turn.holdAria}
        durationMs={SEEN_AFTER_MS}
        onHoldChange={setHeld}
        onRelease={(completed) => setTooShort(!completed && !seen)}
        onComplete={() => setSeen(true)}
      />

      <div className={styles.pie}>
        {held ? (
          <span className={`aviso-pulsar ${styles.soltar}`} aria-hidden>
            {t.turn.releaseHint}
          </span>
        ) : seen ? (
          <button type="button" className="accion" onClick={nextPlayer}>
            {isLast ? t.turn.leaveOnTable : t.turn.passTo(number, names)}
          </button>
        ) : (
          // Solo enseña dónde pulsar: el botón de verdad es toda la pantalla.
          <span className="aviso-pulsar" aria-hidden>
            {t.turn.holdHint}
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
        {readerOpen ? t.turn.hideRole : t.turn.showRole}
      </button>
    </div>
  );
}

function ImpostorHints() {
  const { movie, hints, genreHintIsExtra } = useGame();
  const { t } = useLocale();
  if (!movie) return null;
  const genre = hints.includes("GENRE") ? movie.genre : null;
  const rest = hints.filter((hint) => hint !== "GENRE");
  if (!genre && rest.length === 0)
    return <p className={styles.nota}>{t.turn.noHints}</p>;
  return (
    <div className={styles.nota}>
      {genre && <p>{genreHintIsExtra ? t.turn.hintExtraGenre(genre) : t.turn.hintGenre(genre)}</p>}
      {hints.includes("YEAR") && <p>{t.turn.hintYear(movie.releaseYear)}</p>}
      {hints.includes("KEYWORDS") && <p>{t.turn.hintKeywords(movie.keywords.slice(0, 3))}</p>}
    </div>
  );
}
