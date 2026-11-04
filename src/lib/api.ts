import type { Locale, Movie, MovieFilters } from '@/types';
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

function movieParams(filters: MovieFilters, locale: Locale): URLSearchParams {
    const params = filtersToSearchParams(filters);
    params.set('lang', locale);
    return params;
}

/** `recent` son las que ya han salido en este dispositivo, de la más antigua a la más reciente. */
export function fetchRandomMovie(filters: MovieFilters, locale: Locale, recent: readonly number[]): Promise<Movie> {
    const params = movieParams(filters, locale);
    const fromTmdb = recent.filter((id) => id > 0);
    if (fromTmdb.length > 0) params.set('exclude', fromTmdb.join(','));
    return getJson(`/api/movies/random?${params}`);
}

export function fetchMoviePool(filters: MovieFilters, locale: Locale): Promise<Movie[]> {
    return getJson(`/api/movies/pool?${movieParams(filters, locale)}`);
}

export function fetchKeywords(movieId: number): Promise<string[]> {
    return getJson(`/api/movies/${movieId}/keywords`);
}
