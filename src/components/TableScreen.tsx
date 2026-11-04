import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { posterUrl } from "@/lib/posters";
import { HoldButton } from "./HoldButton";
import { PlayerDots } from "./PlayerDots";
import { QuitButton } from "./QuitButton";
import styles from "./TableScreen.module.css";

const REVEAL_IMPOSTOR_MS = 1200;

/** La conversación. El móvil descansa hasta que el grupo decide ver el resultado. */
export function TableScreen() {
  const { players, movie, names, firstPlayer, revealImpostor } = useGame();
  const { t } = useLocale();
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Carga el cartel ahora para que aparezca al instante en el resultado.
    if (movie?.posterPath) new Image().src = posterUrl(movie.posterPath, "w500");
  }, [movie]);

  const starts = t.table.starts(firstPlayer, names);

  return (
    <div
      className={`pantalla ${styles.mesa}`}
      style={{ "--duracion": `${REVEAL_IMPOSTOR_MS}ms` } as React.CSSProperties}
    >
      <div className={styles.barra}>
        <PlayerDots count={players.length} current={players.length} starts={firstPlayer} />
        <QuitButton />
      </div>
      <h1 ref={heading} tabIndex={-1} className={`enorme ${styles.encabezado}`}>
        {t.table.title}
      </h1>
      <p className={styles.empieza}>
        {starts.before}
        <strong>{starts.name}</strong>
        {starts.after}
      </p>
      <div className={`franja ${styles.reglas}`}>
        {t.table.rules.map((rule) => (
          <p key={rule}>{rule}</p>
        ))}
      </div>
      <div className={styles.pie}>
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
          <span>{t.table.hold}</span>
        </HoldButton>
      </div>
    </div>
  );
}
