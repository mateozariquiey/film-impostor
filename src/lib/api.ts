import type { Movie, MovieFilters } from '@/types';
import { filtersToSearchParams } from '@/lib/filters';

// Cliente de la API propia (/api/movies). El navegador nunca habla directamente con TMDB.

/** Qué ha fallado, para que la interfaz pueda proponer la salida adecuada. */
export type ApiErrorKind = 'offline' | 'no-movies' | 'server';

export class ApiError extends Error {
    constructor(public readonly kind: ApiErrorKind) {
        super(kind);
    }
}

export function errorKindFromStatus(status: number): ApiErrorKind {
    return status === 404 ? 'no-movies' : 'server';
}

async function getJson<T>(url: string): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url);
    } catch {
        // fetch solo rechaza si la petición no llega a ningún servidor.
        throw new ApiError('offline');
    }
    if (!res.ok) throw new ApiError(errorKindFromStatus(res.status));
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
