import type { Decade, Locale, Movie, MovieFilters, Popularity } from '@/types';
import { pickRandom, randomIndex } from '@/lib/game';
import { hintGenreName } from '@/lib/genres';
import { TMDB_LANGUAGES } from '@/lib/locale';
import { pickFresh } from '@/lib/recentMovies';

// Este módulo solo se usa desde las rutas de /api, así que la clave nunca llega al navegador.

const BASE_URL = 'https://api.themoviedb.org/3';

/** Cada página de TMDB trae 20 películas: 5 páginas son el top 100. */
const MAX_PAGES: Record<Popularity, number> = {
    TOP_100: 5,
    TOP_500: 25,
    HARDCORE: 100,
    CLASSICS: 15,
};

const MAX_PAGES_FOR_SINGLE_YEAR = 10;
const POOL_PAGES = 3;
/** Cuántas páginas se miran, como mucho, buscando una película que no haya salido ya. */
const MAX_PAGE_TRIES = 5;
const MAX_KEYWORDS = 5;

export class TmdbConfigError extends Error {}
export class TmdbRequestError extends Error {}
export class NoMoviesError extends Error {}

interface TmdbMovie {
    id: number;
    title: string;
    genre_ids?: number[];
    poster_path: string | null;
    release_date?: string;
}

interface TmdbDiscoverResponse {
    page: number;
    total_pages: number;
    results: TmdbMovie[];
}

interface TmdbKeywordsResponse {
    keywords?: { id: number; name: string }[];
}

function getApiKey(): string {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new TmdbConfigError('Falta la variable de entorno TMDB_API_KEY');
    return key;
}

async function fetchFromTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams({ api_key: getApiKey(), ...params });
    const res = await fetch(`${BASE_URL}${endpoint}?${query}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new TmdbRequestError(`TMDB respondió ${res.status} en ${endpoint}`);
    return res.json() as Promise<T>;
}

function decadeRange(decade: Decade, today: Date): { from: string; to: string } {
    const currentYear = today.getFullYear();
    if (decade === 'ALL') return { from: '1970-01-01', to: `${currentYear}-12-31` };

    const start = { '80s': 1980, '90s': 1990, '00s': 2000, '10s': 2010, '20s': 2020 }[decade];
    const end = Math.min(start + 9, currentYear);
    return { from: `${start}-01-01`, to: `${end}-12-31` };
}

/** Parámetros de /discover/movie según los filtros elegidos. */
export function buildDiscoverParams(filters: MovieFilters, today = new Date()): Record<string, string> {
    const params: Record<string, string> = {
        // Los clásicos se ordenan por número de votos; el resto, por popularidad actual.
        sort_by: filters.popularity === 'CLASSICS' ? 'vote_count.desc' : 'popularity.desc',
        include_adult: 'false',
        include_video: 'false',
        'vote_count.gte': '300',
    };

    if (filters.genre !== undefined) params.with_genres = String(filters.genre);

    if (filters.year !== undefined) {
        params.primary_release_year = String(filters.year);
    } else {
        const { from, to } = decadeRange(filters.decade, today);
        params['primary_release_date.gte'] = from;
        params['primary_release_date.lte'] = to;
    }
    return params;
}

export function maxPagesFor(filters: MovieFilters): number {
    const max = MAX_PAGES[filters.popularity];
    return filters.year !== undefined ? Math.min(max, MAX_PAGES_FOR_SINGLE_YEAR) : max;
}

export function toMovie(raw: TmdbMovie, locale: Locale, filteredGenre?: number, keywords: string[] = []): Movie {
    return {
        id: raw.id,
        title: raw.title,
        genre: hintGenreName(raw.genre_ids, filteredGenre, locale),
        posterPath: raw.poster_path,
        releaseYear: raw.release_date ? raw.release_date.slice(0, 4) : null,
        keywords,
    };
}

function discover(filters: MovieFilters, page: number, locale: Locale): Promise<TmdbDiscoverResponse> {
    return fetchFromTmdb<TmdbDiscoverResponse>('/discover/movie', {
        ...buildDiscoverParams(filters),
        // Con el idioma, TMDB da el título traducido y un poster_path que busca primero un cartel en él.
        language: TMDB_LANGUAGES[locale],
        page: String(page),
    });
}

export async function getKeywords(movieId: number): Promise<string[]> {
    try {
        const data = await fetchFromTmdb<TmdbKeywordsResponse>(`/movie/${movieId}/keywords`);
        return (data.keywords ?? []).slice(0, MAX_KEYWORDS).map((k) => k.name);
    } catch {
        // Las palabras clave son solo una pista: si fallan, la partida sigue sin ellas.
        return [];
    }
}

/**
 * Una película al azar que no esté en `recent`, ordenada de la más antigua a la más reciente.
 * Se miran páginas hasta dar con una. Si no la hay, por filtros estrictos o tras muchas partidas,
 * sale la que hace más tiempo que salió de entre las vistas, en lugar de quedarse sin película.
 */
export async function getRandomMovie(filters: MovieFilters, locale: Locale = 'es', recent: readonly number[] = []): Promise<Movie> {
    let lastPage = maxPagesFor(filters);
    let page = randomIndex(lastPage) + 1;
    const tried = new Set<number>();
    const found: TmdbMovie[] = [];

    while (true) {
        tried.add(page);
        const data = await discover(filters, page, locale);
        found.push(...data.results);
        if (found.some((movie) => !recent.includes(movie.id)) || tried.size >= MAX_PAGE_TRIES) break;

        // Con filtros estrictos puede haber menos páginas de las previstas: se sigue dentro del rango real.
        lastPage = Math.min(lastPage, data.total_pages);
        const left = Array.from({ length: lastPage }, (_, i) => i + 1).filter((other) => !tried.has(other));
        if (left.length === 0) break;
        page = pickRandom(left);
    }
    if (found.length === 0) throw new NoMoviesError('No hay películas con esos filtros');

    const raw = pickFresh(found, recent);
    return toMovie(raw, locale, filters.genre, await getKeywords(raw.id));
}

export async function getMoviePool(filters: MovieFilters, locale: Locale = 'es'): Promise<Movie[]> {
    const pages = Array.from({ length: POOL_PAGES }, (_, i) => discover(filters, i + 1, locale));
    const results = (await Promise.all(pages)).flatMap((page) => page.results);
    const unique = new Map(results.map((raw) => [raw.id, toMovie(raw, locale, filters.genre)]));
    return [...unique.values()];
}
