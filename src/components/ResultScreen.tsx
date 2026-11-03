import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { posterUrl } from "@/lib/posters";
import { FilmStrip } from "./FilmStrip";
import { FitTitle } from "./FitTitle";
import styles from "./ResultScreen.module.css";

const ARM_AFTER_RELEASE_MS = 350;
const ARM_FALLBACK_MS = 3000;

/** Se enciende la luz: la única pantalla en blanco y con color de toda la partida. */
export function ResultScreen() {
  const { players, movie, playAgain, resetGame, isLoading } = useGame();
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
    <div className={`pantalla positivo ${styles.resultado}`}>
      <div className={styles.cartel}>
        {hasPoster ? (
          <Image
            src={posterUrl(movie.posterPath!, "w500")}
            alt={`Cartel de ${movie.title}`}
            fill
            sizes="(min-width: 480px) 480px, 100vw"
            unoptimized
            priority
            className={styles.imagen}
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className={styles.sinCartel} aria-hidden>
            <FitTitle text={movie.title} />
          </div>
        )}
      </div>

      <h1 ref={heading} tabIndex={-1} className={styles.frase}>
        Jugador {impostor + 1} era el impostor.
      </h1>
      <p className={styles.peli}>
        La película era <strong>{movie.title}</strong>
        {movie.releaseYear && ` (${movie.releaseYear})`}.
      </p>
      <FilmStrip count={players.length} current={impostor} inverted />

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
        <p className={styles.credito}>Datos y carteles de TMDB.</p>
      </div>
      <span className={styles.destello} aria-hidden />
    </div>
  );
}
