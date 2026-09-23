import { useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { fetchMoviePool } from "@/lib/api";
import type { Movie, MovieFilters } from "@/types";
import { Button } from "./ui/Button";

interface Props {
  filters: MovieFilters;
  onClose: () => void;
}

export function PoolSelectionScreen({ filters, onClose }: Props) {
  const { customPool, setCustomPool } = useGame();
  const [candidates, setCandidates] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMoviePool(filters)
      .then((movies) => {
        if (cancelled) return;
        setCandidates(movies);
        setSelectedIds(
          new Set((customPool.length ? customPool : movies).map((m) => m.id)),
        );
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "No se han podido cargar las películas",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, customPool]);

  const toggleMovie = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const canSave = !loading && !error && selectedIds.size > 0;
  const saveAndClose = () => {
    if (!canSave) return;
    setCustomPool(candidates.filter((movie) => selectedIds.has(movie.id)));
    onClose();
  };

  return (
    <section className="pool-screen">
      <header className="pool-header">
        <button
          onClick={onClose}
          className="back-button"
          aria-label="Volver sin guardar"
        >
          <ArrowLeft size={20} aria-hidden /> Volver
        </button>
        <p aria-live="polite">
          {selectedIds.size} de {candidates.length} seleccionadas
        </p>
      </header>
      <h1 className="screen-title">
        Solo las que
        <br />
        conozcáis.
      </h1>
      <p className="lead">
        Revisad la lista juntos. Toca una película para dejarla fuera de la
        partida.
      </p>
      {loading && (
        <p className="loading-message" role="status">
          <Loader2 className="loading-spinner" size={20} aria-hidden /> Buscando
          películas…
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}. Vuelve y prueba otra vez.
        </p>
      )}
      {!loading && !error && candidates.length === 0 && (
        <p className="empty-message">
          No hay películas con estos filtros. Vuelve y prueba otros.
        </p>
      )}
      {!loading && !error && (
        <ul className="movie-grid">
          {candidates.map((movie) => {
            const isSelected = selectedIds.has(movie.id);
            return (
              <li key={movie.id}>
                <button
                  onClick={() => toggleMovie(movie.id)}
                  aria-pressed={isSelected}
                  className={clsx(
                    "movie-choice",
                    !isSelected && "movie-excluded",
                  )}
                >
                  <span className="movie-art">
                    {movie.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${movie.posterPath}`}
                        alt=""
                        fill
                        sizes="(min-width: 800px) 220px, 45vw"
                        unoptimized
                        className="movie-poster"
                      />
                    ) : (
                      <span className="poster-placeholder" aria-hidden>
                        {movie.title}
                      </span>
                    )}
                    <span className="movie-check">
                      {isSelected ? (
                        <Check size={17} aria-hidden />
                      ) : (
                        <X size={17} aria-hidden />
                      )}
                    </span>
                  </span>
                  <span className="movie-name">{movie.title}</span>
                  <span className="movie-year">
                    {movie.releaseYear ?? "Año desconocido"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <footer className="pool-footer">
        {!loading &&
          !error &&
          candidates.length > 0 &&
          selectedIds.size === 0 && <p>Selecciona al menos una película.</p>}
        <Button onClick={saveAndClose} disabled={!canSave}>
          Guardar selección ({selectedIds.size})
        </Button>
      </footer>
    </section>
  );
}
