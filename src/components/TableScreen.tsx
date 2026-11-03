import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { posterUrl } from "@/lib/posters";
import { FilmStrip } from "./FilmStrip";
import { HoldButton } from "./HoldButton";
import { QuitButton } from "./QuitButton";
import styles from "./TableScreen.module.css";

const REVEAL_IMPOSTOR_MS = 1400;

/** La conversación. El móvil descansa hasta que el grupo decide ver el resultado. */
export function TableScreen() {
  const { players, movie, revealImpostor } = useGame();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Carga el cartel ahora para que aparezca al instante en el resultado.
    if (movie?.posterPath) new Image().src = posterUrl(movie.posterPath, "w500");
  }, [movie]);

  return (
    <div className="pantalla">
      <div className={styles.arriba}>
        <FilmStrip count={players.length} done={players.length} />
        <QuitButton />
      </div>
      <h1 ref={heading} tabIndex={-1} className={styles.grande}>
        Móvil a la mesa.
      </h1>
      <ol className={styles.pasos}>
        <li>Cada uno da una pista, sin decir el título.</li>
        <li>Preguntad y votad quién disimula.</li>
        <li>Antes de revelar, el impostor puede intentar adivinar la película.</li>
      </ol>
      <p className={styles.regla}>
        Si adivina el título o falla la votación, gana el impostor. Si no, ganáis
        los demás.
      </p>
      <HoldButton
        label="Mantén para revelar al impostor"
        tooShort="Deja el dedo hasta que se cierre el círculo"
        durationMs={REVEAL_IMPOSTOR_MS}
        showProgress
        onComplete={revealImpostor}
      />
    </div>
  );
}
