import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { HoldButton } from "./HoldButton";
import { PlayerDots } from "./PlayerDots";
import { QuitButton } from "./QuitButton";
import styles from "./TurnScreen.module.css";

/** Lo que hay que mantener para contar como visto: basta para leer un título. */
const SEEN_AFTER_MS = 500;
const LONG_TITLE = 64;

/**
 * El turno de un jugador. Toda la pantalla es la zona de mantener y el papel solo existe en la
 * página mientras dura el gesto. Todos los estados comparten el mismo esqueleto: el número del
 * jugador, un título en el mismo sitio y una nota, así que el impostor y el grupo no se distinguen
 * de lejos.
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
        <PlayerDots count={players.length} current={currentPlayerIndex} />
        <QuitButton />
      </div>

      <div className={styles.papel} aria-live="polite">
        <h1 ref={heading} tabIndex={-1} className={styles.quien}>
          {name ? (
            <>
              <span className="secundario">{t.turn.whoseTurn}</span>{" "}
              <span
                className={`numeral ${styles.numero} ${styles.nombre}`}
                style={{ "--letras": name.length } as React.CSSProperties}
              >
                {name}
              </span>{" "}
              <span className="solo-lector">{t.turn.playerOf(number, players.length)}</span>
            </>
          ) : (
            <>
              <span className="secundario">{t.turn.player}</span>{" "}
              <span className={`numeral ${styles.numero}`}>{number}</span>{" "}
              <span className="solo-lector">{t.turn.ofTotal(players.length)}</span>
            </>
          )}
        </h1>
        {visible && movie ? (
          <div className={styles.revelado}>
            <p className={titleClass(isImpostor ? null : movie.title)}>
              {isImpostor ? t.turn.youAreImpostor : <TitleLines title={movie.title} />}
            </p>
            {isImpostor ? (
              <ImpostorHints />
            ) : (
              <p className={styles.nota}>{t.turn.giveClues}</p>
            )}
          </div>
        ) : seen ? (
          <>
            <p className={titleClass(null)}>{t.turn.hidden}</p>
            <p className={styles.nota}>{t.turn.seeAgain}</p>
          </>
        ) : (
          <>
            <p className={titleClass(null)}>{t.turn.takePhone}</p>
            <p className={styles.nota}>{tooShort ? t.turn.holdLonger : t.turn.holdNote}</p>
          </>
        )}
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
        {seen ? (
          <button type="button" className="accion" onClick={nextPlayer}>
            {isLast ? t.turn.leaveOnTable : t.turn.passTo(number, names)}
          </button>
        ) : (
          // Solo enseña dónde pulsar: el botón de verdad es toda la pantalla.
          <span className="accion-sec" aria-hidden>
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

/** El mismo tamaño para todos los papeles. Solo cede un título que no cabría. */
function titleClass(title: string | null) {
  const tooLong = title !== null && title.length > LONG_TITLE;
  return `${styles.titular} ${tooLong ? "titulo" : "enorme"}`;
}

/** Un título con subtítulo corta la línea tras los dos puntos, donde se leería en un cartel. */
function TitleLines({ title }: { title: string }) {
  return title.split(/(?<=: )/).map((part, index) => (
    <span key={index} className={styles.parte}>
      {part}
    </span>
  ));
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
