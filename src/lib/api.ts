import type { Movie, MovieFilters } from '@/types';
import { filtersToSearchParams } from '@/lib/filters';

// Cliente de la API propia (/api/movies). El navegador nunca habla directamente con TMDB.

async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Error ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export function fetchRandomMovie(filters: MovieFilters): Promise<Movie> {
    return getJson(`/api/movies/random?${filtersToSearchParams(filters)}`);
}

export function fetchMoviePool(filters: MovieFilters): Promise<Movie[]> {
    return getJson(`/api/movies/pool?${filtersToSearchParams(filters)}`);
}

export function fetchKeywords(movieId: number): Promise<string[]> {
    return getJson(`/api/movies/${movieId}/keywords`);
}
