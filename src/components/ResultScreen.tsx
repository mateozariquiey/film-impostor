import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { thePlayer } from "@/lib/game";
import { posterUrl } from "@/lib/posters";
import { PlayerDots } from "./PlayerDots";
import styles from "./ResultScreen.module.css";

const ARM_AFTER_RELEASE_MS = 350;
const ARM_FALLBACK_MS = 3000;

/** Vuelve la luz normal de la app, y el cartel se destapa igual que se llenó el botón que lo pidió. */
export function ResultScreen() {
  const { players, movie, names, playAgain, resetGame, isLoading } = useGame();
  const [posterFailed, setPosterFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  // Se llega con el dedo aún pulsado justo donde quedan estos botones: al levantarlo no deben saltar.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setArmed(true), ARM_AFTER_RELEASE_MS);
    };
    const releases = ["pointerup", "pointercancel", "keyup"];
    releases.forEach((type) => window.addEventListener(type, arm, { once: true }));
    timer = window.setTimeout(() => setArmed(true), ARM_FALLBACK_MS);
    return () => {
      window.clearTimeout(timer);
      releases.forEach((type) => window.removeEventListener(type, arm));
    };
  }, []);

  if (!movie) return null;
  const impostor = players.findIndex((player) => player.role === "impostor");
  const hasPoster = movie.posterPath !== null && !posterFailed;

  return (
    <div className={`pantalla ${styles.resultado}`}>
      {hasPoster && (
        <div className={styles.cartel}>
          <Image
            src={posterUrl(movie.posterPath!, "w500")}
            alt={`Cartel de ${movie.title}`}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized
            priority
            onError={() => setPosterFailed(true)}
          />
        </div>
      )}

      <h1 ref={heading} tabIndex={-1} className={`enorme ${styles.era}`}>
        Era {thePlayer(impostor, names)}
      </h1>
      <PlayerDots count={players.length} impostor={impostor} />
      <p className={styles.peli} data-sin-cartel={hasPoster ? undefined : true}>
        La película era <strong>{movie.title}</strong>
        {movie.releaseYear && ` (${movie.releaseYear})`}.
      </p>

      <div className={styles.acciones} inert={!armed}>
        <button
          type="button"
          className="accion"
          disabled={isLoading}
          aria-busy={isLoading}
          onClick={() => void playAgain()}
        >
          {isLoading ? "Buscando película…" : "Otra película"}
        </button>
        <button type="button" className="enlace" onClick={resetGame}>
          Cambiar ajustes
        </button>
      </div>
    </div>
  );
}
