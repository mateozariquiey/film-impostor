import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { posterUrl } from "@/lib/posters";
import { QUESTIONS } from "@/lib/questions";
import { HoldButton } from "./HoldButton";
import { Icon } from "./Icon";
import { PlayerSlots } from "./PlayerSlots";
import { PosterWall } from "./PosterWall";
import { QuitButton } from "./QuitButton";
import { Sheet } from "./Sheet";
import { TalkClock } from "./TalkClock";
import styles from "./TableScreen.module.css";

const REVEAL_IMPOSTOR_MS = 1200;

/** La conversación. El móvil descansa hasta que el grupo decide ver el resultado. */
export function TableScreen() {
  const { players, movie, names, firstPlayer, question, impostorCount, anotherQuestion, revealImpostor } = useGame();
  const { locale, t } = useLocale();
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const rules = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Carga el cartel ahora para que aparezca al instante en el resultado.
    if (movie?.posterPath) new Image().src = posterUrl(movie.posterPath, "w500");
  }, [movie]);

  // Empieza quien ha tocado en el sorteo y sigue en el orden en que se han pasado el móvil.
  const order = players.map((_, index) => (firstPlayer + index) % players.length);
  const columns = order.length > 6 ? 2 : 1;

  return (
    <div
      className={`pantalla ${styles.mesa}`}
      style={{ "--duracion": `${REVEAL_IMPOSTOR_MS}ms` } as React.CSSProperties}
    >
      <PosterWall players={players.length} className={styles.pared} />
      <div className={styles.barra}>
        <PlayerSlots count={players.length} current={players.length} starts={firstPlayer} />
        <QuitButton />
      </div>
      <h1 ref={heading} tabIndex={-1} className={`cartelon ${styles.encabezado}`}>
        {t.table.title}
      </h1>
      <ol
        className={`cartelon ${styles.orden}`}
        style={
          {
            "--columnas": columns,
            "--filas": Math.ceil(order.length / columns),
            "--tam-orden": columns === 2 ? "26px" : "clamp(26px, 8vw, 32px)",
          } as React.CSSProperties
        }
      >
        {order.map((index, position) => (
          <li key={index}>
            <span aria-hidden>{position + 1}</span>
            <span>{t.playerName(index, names)}</span>
          </li>
        ))}
      </ol>
      <div className={styles.pregunta}>
        <p className={styles.arrancar}>{t.table.starter}</p>
        <button type="button" className={styles.otra} aria-label={t.table.anotherQuestion} onClick={anotherQuestion}>
          <Icon name="again" />
        </button>
        <p className="cartelon" aria-live="polite">
          {QUESTIONS[question][locale]}
        </p>
      </div>
      <div className={styles.reglas}>
        <p>{t.table.shortRule(impostorCount)}</p>
        <button type="button" className="enlace" onClick={() => rules.current?.showModal()}>
          {t.table.howItEnds}
        </button>
      </div>
      <Sheet ref={rules} titleId="como-acaba">
        <h2 id="como-acaba" className="titulo">
          {t.table.howItEnds}
        </h2>
        <div className={styles.todasReglas}>
          {t.table.rules(impostorCount).map((rule) => (
            <p key={rule}>{rule}</p>
          ))}
        </div>
        <form method="dialog">
          <button className="accion">{t.rules.understood}</button>
        </form>
      </Sheet>
      <div className={styles.pie}>
        <TalkClock />
        <p className={`secundario ${styles.aviso}`} role="status">
          {tooShort ? t.table.tooShort : ""}
        </p>
        <HoldButton
          className={`accion ${styles.mantener}`}
          durationMs={REVEAL_IMPOSTOR_MS}
          onHoldChange={(held) => held && setTooShort(false)}
          onRelease={(completed) => setTooShort(!completed)}
          onComplete={revealImpostor}
        >
          <span className="mantener-icono">
            <Icon name="hold" />
          </span>
          <span data-texto={t.table.hold(impostorCount)}>{t.table.hold(impostorCount)}</span>
        </HoldButton>
      </div>
    </div>
  );
}
