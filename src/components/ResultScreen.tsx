import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { posterUrl } from "@/lib/posters";
import { FilmStrip } from "./FilmStrip";
import { FitTitle } from "./FitTitle";
import styles from "./ResultScreen.module.css";

/** Se enciende la luz: la única pantalla en blanco y con color de toda la partida. */
export function ResultScreen() {
  const { players, movie, playAgain, resetGame, isLoading } = useGame();
  const [posterFailed, setPosterFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
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

      <div className={styles.acciones}>
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
