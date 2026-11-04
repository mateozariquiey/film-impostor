import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { impostorsOf } from "@/lib/game";
import { posterUrl } from "@/lib/posters";
import { TitleLines } from "./TitleLines";
import styles from "./ResultScreen.module.css";

const ARM_AFTER_RELEASE_MS = 350;
const ARM_FALLBACK_MS = 3000;

/** El cartel se destapa igual que se llenó el botón que lo pidió, y su color es la única luz de la pantalla. */
export function ResultScreen() {
  const { players, movie, names, playAgain, resetGame, isLoading } = useGame();
  const { t } = useLocale();
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
  const impostors = impostorsOf(players);
  const hasPoster = movie.posterPath !== null && !posterFailed;

  return (
    <div className={`pantalla ${styles.resultado}`}>
      {hasPoster && (
        <div
          className={styles.ambiente}
          style={{ backgroundImage: `url(${posterUrl(movie.posterPath!, "w185")})` }}
          aria-hidden
        />
      )}
      {hasPoster && (
        <div className={styles.cartel}>
          <Image
            src={posterUrl(movie.posterPath!, "w500")}
            alt={t.result.poster(movie.title)}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized
            priority
            onError={() => setPosterFailed(true)}
          />
        </div>
      )}

      <h1
        ref={heading}
        tabIndex={-1}
        className={`cartelon ${styles.era}`}
        data-dos={impostors.length === 2 || undefined}
      >
        {impostors.length === 2 ? t.result.were(impostors[0], impostors[1], names) : t.result.was(impostors[0], names)}
      </h1>
      <p className={styles.peli} data-sin-cartel={hasPoster ? undefined : true}>
        {t.result.movieWas}
        <strong>{hasPoster ? movie.title : <TitleLines title={movie.title} partClassName={styles.parte} />}</strong>
        {movie.releaseYear && ` (${movie.releaseYear})`}
        {/* Con cartel es una frase. Sin él, el título va grande y el año queda en su propia línea. */}
        {hasPoster && "."}
      </p>

      <div className={styles.acciones} inert={!armed}>
        <button
          type="button"
          className="accion"
          disabled={isLoading}
          aria-busy={isLoading}
          onClick={() => void playAgain()}
        >
          {isLoading ? t.result.searching : t.result.another}
        </button>
        <button type="button" className="enlace" onClick={resetGame}>
          {t.result.settings}
        </button>
      </div>
    </div>
  );
}
