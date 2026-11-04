import type { Decade, Hint, MovieFilters, Popularity } from '@/types';
import { isGenreId } from '@/lib/genres';

export const DECADES: readonly Decade[] = ['ALL', '80s', '90s', '00s', '10s', '20s'];
export const POPULARITIES: readonly Popularity[] = ['TOP_100', 'TOP_500', 'HARDCORE', 'CLASSICS'];
export const HINTS: readonly Hint[] = ['GENRE', 'YEAR', 'KEYWORDS'];

export const MIN_YEAR = 1900;

export function isDecade(value: unknown): value is Decade {
    return DECADES.includes(value as Decade);
}

export function isPopularity(value: unknown): value is Popularity {
    return POPULARITIES.includes(value as Popularity);
}

export function isHint(value: unknown): value is Hint {
    return HINTS.includes(value as Hint);
}

export function isValidYear(year: number, today = new Date()): boolean {
    return Number.isInteger(year) && year >= MIN_YEAR && year <= today.getFullYear();
}

/** Convierte los filtros en parámetros de URL para la API propia. */
export function filtersToSearchParams(filters: MovieFilters): URLSearchParams {
    const params = new URLSearchParams({
        decade: filters.decade,
        popularity: filters.popularity,
    });
    if (filters.year !== undefined) params.set('year', String(filters.year));
    if (filters.genre !== undefined) params.set('genre', String(filters.genre));
    return params;
}

/** Valida los parámetros recibidos por la API. Devuelve null si no son válidos. */
export function parseFilters(params: URLSearchParams, today = new Date()): MovieFilters | null {
    const decade = params.get('decade') ?? 'ALL';
    const popularity = params.get('popularity') ?? 'TOP_100';
    const yearParam = params.get('year');
    const genreParam = params.get('genre');

    if (!isDecade(decade) || !isPopularity(popularity)) return null;

    const filters: MovieFilters = { decade, popularity };
    if (yearParam) {
        const year = Number(yearParam);
        if (!isValidYear(year, today)) return null;
        filters.year = year;
    }
    if (genreParam) {
        const genre = Number(genreParam);
        if (!isGenreId(genre)) return null;
        filters.genre = genre;
    }
    return filters;
}
