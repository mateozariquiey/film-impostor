import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { ApiError, fetchMoviePool, type ApiErrorKind } from "@/lib/api";
import { posterUrl } from "@/lib/posters";
import type { Movie, MovieFilters } from "@/types";
import styles from "./MovieListScreen.module.css";

interface Props {
  filters: MovieFilters;
  onClose: () => void;
}

type LoadState = "loading" | "ready" | ApiErrorKind;

const ERRORS: Record<ApiErrorKind, string> = {
  offline: "No hay conexión, así que no se puede cargar la lista.",
  server: "TMDB no responde, así que no se puede cargar la lista.",
  "no-movies": "No hay películas con estos filtros. Vuelve y prueba con otra época.",
};

/** Lista de películas candidatas: se tachan las que el grupo no conoce. */
export function MovieListScreen({ filters, onClose }: Props) {
  const { customPool, setCustomPool } = useGame();
  const [candidates, setCandidates] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [load, setLoad] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  const onLoaded = useEffectEvent((movies: Movie[]) => {
    setCandidates(movies);
    setSelectedIds(
      new Set((customPool.length ? customPool : movies).map((movie) => movie.id)),
    );
    setLoad(movies.length > 0 ? "ready" : "no-movies");
  });

  useEffect(() => {
    let cancelled = false;
    fetchMoviePool(filters)
      .then((movies) => {
        if (!cancelled) onLoaded(movies);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad(error instanceof ApiError ? error.kind : "server");
      });
    return () => {
      cancelled = true;
    };
  }, [filters, attempt]);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const count = selectedIds.size;
  return (
    <div className={`pantalla ${styles.lista}`}>
      <button type="button" className={styles.volver} onClick={onClose}>
        <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden>
          <path
            d="M6 1L1 6l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver sin cambios
      </button>
      <h1 ref={heading} tabIndex={-1} className="titulo">
        Tachad las que no conozcáis
      </h1>

      {load === "loading" && (
        <>
          <p className={`secundario ${styles.estado}`} role="status">
            Cargando películas…
          </p>
          <ul className={styles.filas} aria-hidden>
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index} className={styles.fila}>
                <span className={styles.cartel} />
              </li>
            ))}
          </ul>
        </>
      )}

      {load !== "loading" && load !== "ready" && (
        <div className={styles.error} role="alert">
          <p>{ERRORS[load]}</p>
          {load !== "no-movies" && (
            <button
              type="button"
              className="accion-sec"
              onClick={() => {
                setLoad("loading");
                setAttempt(attempt + 1);
              }}
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {load === "ready" && (
        <>
          <p className={`secundario ${styles.estado}`} aria-live="polite">
            {count} de {candidates.length} en juego
          </p>
          <ul className={styles.filas}>
            {candidates.map((movie) => (
              <li key={movie.id}>
                <MovieRow
                  movie={movie}
                  selected={selectedIds.has(movie.id)}
                  onToggle={() => toggle(movie.id)}
                />
              </li>
            ))}
          </ul>
          <div className={styles.pie}>
            <button
              type="button"
              className="accion"
              disabled={count === 0}
              onClick={() => {
                setCustomPool(candidates.filter((movie) => selectedIds.has(movie.id)));
                onClose();
              }}
            >
              {count === 0
                ? "Deja al menos una"
                : count === 1
                  ? "Usar solo esta"
                  : `Usar estas ${count}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MovieRow({
  movie,
  selected,
  onToggle,
}: {
  movie: Movie;
  selected: boolean;
  onToggle: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className={styles.fila}
      aria-pressed={!selected}
      aria-label={`Tachar ${movie.title}`}
      data-tachada={!selected || undefined}
      onClick={onToggle}
    >
      <span className={styles.cartel}>
        {movie.posterPath && !failed && (
          <Image
            src={posterUrl(movie.posterPath, "w342")}
            alt=""
            fill
            sizes="44px"
            unoptimized
            onError={() => setFailed(true)}
          />
        )}
      </span>
      <span className={styles.texto}>
        <span className={styles.titulo}>{movie.title}</span>
        {movie.releaseYear && <span className="secundario"> {movie.releaseYear}</span>}
      </span>
    </button>
  );
}
