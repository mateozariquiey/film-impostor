import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDiscoverParams, maxPagesFor, toMovie, getRandomMovie, getMoviePool, getKeywords, NoMoviesError, TmdbRequestError, TmdbConfigError } from './tmdb';

const today = new Date('2026-06-01');

describe('buildDiscoverParams', () => {
    it('limita la década actual al año en curso', () => {
        const params = buildDiscoverParams({ decade: '20s', popularity: 'TOP_100' }, today);
        expect(params['primary_release_date.gte']).toBe('2020-01-01');
        expect(params['primary_release_date.lte']).toBe('2026-12-31');
    });

    it('usa el año exacto en lugar de la década', () => {
        const params = buildDiscoverParams({ decade: '80s', popularity: 'TOP_100', year: 1999 }, today);
        expect(params.primary_release_year).toBe('1999');
        expect(params['primary_release_date.gte']).toBeUndefined();
    });

    it('ordena los clásicos por votos y el resto por popularidad', () => {
        expect(buildDiscoverParams({ decade: 'ALL', popularity: 'CLASSICS' }, today).sort_by).toBe('vote_count.desc');
        expect(buildDiscoverParams({ decade: 'ALL', popularity: 'TOP_500' }, today).sort_by).toBe('popularity.desc');
    });
});

describe('maxPagesFor', () => {
    it('reduce las páginas cuando se filtra por un solo año', () => {
        expect(maxPagesFor({ decade: 'ALL', popularity: 'HARDCORE' })).toBe(100);
        expect(maxPagesFor({ decade: 'ALL', popularity: 'HARDCORE', year: 2000 })).toBe(10);
    });
});

describe('toMovie', () => {
    it('traduce el primer género y extrae el año', () => {
        const movie = toMovie({ id: 1, title: 'Alien', genre_ids: [27, 878], poster_path: '/a.jpg', release_date: '1979-05-25' });
        expect(movie).toEqual({ id: 1, title: 'Alien', genre: 'Terror', posterPath: '/a.jpg', releaseYear: '1979', keywords: [] });
    });

    it('tolera datos incompletos', () => {
        const movie = toMovie({ id: 2, title: 'Sin datos', poster_path: null });
        expect(movie.genre).toBe('Género desconocido');
        expect(movie.releaseYear).toBeNull();
    });
});

const filters = { decade: 'ALL', popularity: 'TOP_100' } as const;
const rawMovie = { id: 1, title: 'Alien', genre_ids: [27], poster_path: null };
const reply = (data: unknown) => new Response(JSON.stringify(data));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

it('reintenta dentro del rango real si la página aleatoria está vacía', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(reply({ results: [], total_pages: 1 }))
        .mockResolvedValueOnce(reply({ results: [rawMovie], total_pages: 1 }))
        .mockResolvedValueOnce(reply({ keywords: [{ id: 1, name: 'space' }] }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await getRandomMovie(filters)).title).toBe('Alien');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('page')).toBe('1');
});

it('informa cuando no hay películas', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ results: [], total_pages: 0 })));
    await expect(getRandomMovie(filters)).rejects.toThrow(NoMoviesError);
});

it('distingue los errores de configuración de los fallos del proveedor', async () => {
    vi.stubEnv('TMDB_API_KEY', '');
    await expect(getRandomMovie(filters)).rejects.toThrow(TmdbConfigError);
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(getRandomMovie(filters)).rejects.toThrow(TmdbRequestError);
});

it('permite jugar aunque las palabras clave fallen', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    expect(await getKeywords(1)).toEqual([]);
});

it('elimina películas duplicadas entre las páginas de la selección', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => reply({ results: [rawMovie], total_pages: 3 })));
    expect(await getMoviePool(filters)).toHaveLength(1);
});
