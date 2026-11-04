import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { thePlayer } from "@/lib/game";
import { posterUrl } from "@/lib/posters";
import { HoldButton } from "./HoldButton";
import { PlayerDots } from "./PlayerDots";
import { QuitButton } from "./QuitButton";
import styles from "./TableScreen.module.css";

const REVEAL_IMPOSTOR_MS = 1200;

/** La conversación. El móvil descansa hasta que el grupo decide ver el resultado. */
export function TableScreen() {
  const { players, movie, names, firstPlayer, revealImpostor } = useGame();
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Carga el cartel ahora para que aparezca al instante en el resultado.
    if (movie?.posterPath) new Image().src = posterUrl(movie.posterPath, "w500");
  }, [movie]);

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
        Ya lo habéis visto todos
      </h1>
      <p className={styles.empieza}>
        Empieza <strong>{thePlayer(firstPlayer, names)}</strong>
      </p>
      <div className={`franja ${styles.reglas}`}>
        <p>Cada uno da una pista, sin decir el título.</p>
        <p>Después, preguntad y votad quién disimula.</p>
        <p>Antes de ver el resultado, el impostor puede intentar adivinar la película.</p>
        <p>Si la adivina o el grupo falla la votación, gana el impostor. Si no, gana el grupo.</p>
      </div>
      <div className={styles.pie}>
        <p className={`secundario ${styles.aviso}`} role="status">
          {tooShort ? "Deja el dedo hasta que se llene el botón." : ""}
        </p>
        <HoldButton
          className={`accion ${styles.mantener}`}
          durationMs={REVEAL_IMPOSTOR_MS}
          onHoldChange={(held) => held && setTooShort(false)}
          onRelease={(completed) => setTooShort(!completed)}
          onComplete={revealImpostor}
        >
          <span>Mantén para ver quién era</span>
        </HoldButton>
      </div>
    </div>
  );
}
