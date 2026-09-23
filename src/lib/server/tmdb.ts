import type { Decade, Movie, MovieFilters, Popularity } from '@/types';
import { randomIndex } from '@/lib/game';

// Este módulo solo se usa desde las rutas de /api, así que la clave nunca llega al navegador.

const BASE_URL = 'https://api.themoviedb.org/3';

/** TMDB devuelve los géneros como IDs. Nombres en español de la lista oficial. */
const GENRES: Record<number, string> = {
    28: 'Acción',
    12: 'Aventura',
    16: 'Animación',
    35: 'Comedia',
    80: 'Crimen',
    99: 'Documental',
    18: 'Drama',
    10751: 'Familia',
    14: 'Fantasía',
    36: 'Historia',
    27: 'Terror',
    10402: 'Música',
    9648: 'Misterio',
    10749: 'Romance',
    878: 'Ciencia ficción',
    10770: 'Película de TV',
    53: 'Suspense',
    10752: 'Bélica',
    37: 'Western',
};

/** Cada página de TMDB trae 20 películas: 5 páginas son el top 100. */
const MAX_PAGES: Record<Popularity, number> = {
    TOP_100: 5,
    TOP_500: 25,
    HARDCORE: 100,
    CLASSICS: 15,
};

const MAX_PAGES_FOR_SINGLE_YEAR = 10;
const POOL_PAGES = 3;
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
    const query = new URLSearchParams({ api_key: getApiKey(), language: 'es-ES', ...params });
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

export function toMovie(raw: TmdbMovie, keywords: string[] = []): Movie {
    const genreId = raw.genre_ids?.[0];
    return {
        id: raw.id,
        title: raw.title,
        genre: (genreId !== undefined && GENRES[genreId]) || 'Género desconocido',
        posterPath: raw.poster_path,
        releaseYear: raw.release_date ? raw.release_date.slice(0, 4) : null,
        keywords,
    };
}

function discover(filters: MovieFilters, page: number): Promise<TmdbDiscoverResponse> {
    return fetchFromTmdb<TmdbDiscoverResponse>('/discover/movie', {
        ...buildDiscoverParams(filters),
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

export async function getRandomMovie(filters: MovieFilters): Promise<Movie> {
    const maxPages = maxPagesFor(filters);
    let data = await discover(filters, randomIndex(maxPages) + 1);

    // Con filtros estrictos puede haber menos páginas de las previstas: se repite dentro del rango real.
    if (data.results.length === 0 && data.total_pages > 0) {
        data = await discover(filters, randomIndex(Math.min(maxPages, data.total_pages)) + 1);
    }
    if (data.results.length === 0) throw new NoMoviesError('No hay películas con esos filtros');

    const raw = data.results[randomIndex(data.results.length)];
    return toMovie(raw, await getKeywords(raw.id));
}

export async function getMoviePool(filters: MovieFilters): Promise<Movie[]> {
    const pages = Array.from({ length: POOL_PAGES }, (_, i) => discover(filters, i + 1));
    const results = (await Promise.all(pages)).flatMap((page) => page.results);
    const unique = new Map(results.map((raw) => [raw.id, toMovie(raw)]));
    return [...unique.values()];
}
