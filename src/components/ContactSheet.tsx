import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { ApiError, fetchMoviePool, type ApiErrorKind } from "@/lib/api";
import { posterUrl } from "@/lib/posters";
import type { Movie, MovieFilters } from "@/types";
import styles from "./ContactSheet.module.css";

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

/** La hoja de contactos: se tachan a lápiz graso las películas que el grupo no conoce. */
export function ContactSheet({ filters, onClose }: Props) {
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
    // Se llega desde abajo del todo de los ajustes.
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
    <div className={`pantalla ${styles.hojaPantalla}`}>
      <button type="button" className={`enlace ${styles.volver}`} onClick={onClose}>
        Volver sin cambios
      </button>
      <h1 ref={heading} tabIndex={-1} className="titular">
        Tachad las que no conozcáis
      </h1>

      {load === "loading" && (
        <>
          <p className={styles.estado} role="status">
            Cargando la hoja de contactos…
          </p>
          <div className={styles.hoja} aria-hidden>
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className={styles.cuadro}>
                <span className={`${styles.imagen} ${styles.vacia}`} />
              </div>
            ))}
          </div>
        </>
      )}

      {load !== "loading" && load !== "ready" && (
        <div className={styles.error} role="alert">
          <p>{ERRORS[load]}</p>
          {load !== "no-movies" && (
            <button
              type="button"
              className="accion"
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
          <p className={styles.estado} aria-live="polite">
            {count} de {candidates.length} en juego
          </p>
          <ul className={styles.hoja}>
            {candidates.map((movie, index) => (
              <li key={movie.id}>
                <Frame
                  movie={movie}
                  number={index + 1}
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
                  ? "Jugar con esta"
                  : `Jugar con estas ${count}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Frame({
  movie,
  number,
  selected,
  onToggle,
}: {
  movie: Movie;
  number: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const [failed, setFailed] = useState(false);
  // Hasta que carga, el fondo de duotono sería un bloque de luz.
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      className={styles.cuadro}
      aria-pressed={!selected}
      aria-label={`Tachar ${movie.title}`}
      data-fuera={!selected || undefined}
      onClick={onToggle}
    >
      <span className={styles.imagen} data-vacia={!loaded || undefined}>
        {movie.posterPath && !failed && (
          <Image
            src={posterUrl(movie.posterPath, "w342")}
            alt=""
            fill
            sizes="(min-width: 480px) 150px, 33vw"
            unoptimized
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
        {!selected && (
          <svg viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden>
            <path d="M12 22C34 55 62 92 88 130M86 18C60 58 34 96 10 134" />
          </svg>
        )}
      </span>
      <span className={styles.titulo}>{movie.title}</span>
      <span className={styles.codigo} aria-hidden>
        {number}A
      </span>
    </button>
  );
}
