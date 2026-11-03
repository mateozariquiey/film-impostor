import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { posterUrl } from "@/lib/posters";
import { HoldButton } from "./HoldButton";
import { QuitButton } from "./QuitButton";
import styles from "./TableScreen.module.css";

const REVEAL_IMPOSTOR_MS = 1200;

/** La conversación. El móvil descansa hasta que el grupo decide ver el resultado. */
export function TableScreen() {
  const { movie, revealImpostor } = useGame();
  const [tooShort, setTooShort] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Carga el cartel ahora para que aparezca al instante en el resultado.
    if (movie?.posterPath) new Image().src = posterUrl(movie.posterPath, "w500");
  }, [movie]);

  return (
    <div className="pantalla">
      <div className={styles.barra}>
        <QuitButton />
      </div>
      <h1 ref={heading} tabIndex={-1} className={`titulo ${styles.encabezado}`}>
        Móvil a la mesa
      </h1>
      <div className={styles.reglas}>
        <p>Cada uno da una pista, sin decir el título.</p>
        <p>Después, preguntad y votad quién disimula.</p>
        <p>Antes de ver el resultado, el impostor puede intentar adivinar la película.</p>
        <p className="secundario">
          Si la adivina o el grupo falla la votación, gana el impostor. Si no, gana el grupo.
        </p>
      </div>
      <div className={styles.pie}>
        <p className={`secundario ${styles.aviso}`} role="status">
          {tooShort ? "Deja el dedo hasta que se llene el botón." : ""}
        </p>
        <HoldButton
          className={`accion ${styles.mantener}`}
          durationMs={REVEAL_IMPOSTOR_MS}
          onRelease={(completed) => setTooShort(!completed)}
          onComplete={revealImpostor}
        >
          <span>Mantén para ver quién era</span>
        </HoldButton>
      </div>
    </div>
  );
}
