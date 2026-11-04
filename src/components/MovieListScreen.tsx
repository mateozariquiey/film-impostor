import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { ApiError, fetchMoviePool, type ApiErrorKind } from "@/lib/api";
import { posterUrl } from "@/lib/posters";
import type { Movie, MovieFilters } from "@/types";
import styles from "./MovieListScreen.module.css";

interface Props {
  filters: MovieFilters;
  onClose: () => void;
}

type LoadState = "loading" | "ready" | ApiErrorKind;

/** Lista de películas candidatas: se tachan las que el grupo no conoce. */
export function MovieListScreen({ filters, onClose }: Props) {
  const { customPool, setCustomPool } = useGame();
  const { locale, t } = useLocale();
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
    fetchMoviePool(filters, locale)
      .then((movies) => {
        if (!cancelled) onLoaded(movies);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad(error instanceof ApiError ? error.kind : "server");
      });
    return () => {
      cancelled = true;
    };
  }, [filters, locale, attempt]);

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
        {t.list.cancel}
      </button>
      <h1 ref={heading} tabIndex={-1} className={`cartelon ${styles.encabezado}`}>
        {t.list.title}
      </h1>

      {load === "loading" && (
        <>
          <p className={`secundario ${styles.estado}`} role="status">
            {t.list.loading}
          </p>
          <ul className={styles.filas} aria-hidden>
            {Array.from({ length: 9 }, (_, index) => (
              <li key={index} className={styles.fila}>
                <span className={styles.cartel} />
              </li>
            ))}
          </ul>
        </>
      )}

      {load !== "loading" && load !== "ready" && (
        <div className={styles.error} role="alert">
          <p>{t.list.errors[load]}</p>
          {load !== "no-movies" && (
            <button
              type="button"
              className="accion-sec"
              onClick={() => {
                setLoad("loading");
                setAttempt(attempt + 1);
              }}
            >
              {t.list.retry}
            </button>
          )}
        </div>
      )}

      {load === "ready" && (
        <>
          <p className={`secundario ${styles.estado}`} aria-live="polite">
            {t.list.inPlay(count, candidates.length)}
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
              className="accion accion-pie"
              disabled={count === 0}
              onClick={() => {
                setCustomPool(candidates.filter((movie) => selectedIds.has(movie.id)));
                onClose();
              }}
            >
              {count === 0 ? t.list.keepOne : count === 1 ? t.list.useOne : t.list.useMany(count)}
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
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className={styles.fila}
      aria-pressed={!selected}
      aria-label={t.list.crossOff(movie.title)}
      data-tachada={!selected || undefined}
      onClick={onToggle}
    >
      <span className={styles.cartel}>
        {movie.posterPath && !failed && (
          <Image
            src={posterUrl(movie.posterPath, "w185")}
            alt=""
            fill
            sizes="(max-width: 480px) 34vw, 160px"
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
