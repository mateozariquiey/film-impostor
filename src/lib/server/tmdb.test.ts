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

describe('género', () => {
    it('filtra por el género elegido, y sin él no filtra', () => {
        expect(buildDiscoverParams({ decade: 'ALL', popularity: 'TOP_100', genre: 27 }, today).with_genres).toBe('27');
        expect(buildDiscoverParams({ decade: 'ALL', popularity: 'TOP_100' }, today).with_genres).toBeUndefined();
    });

    it('da el nombre en el idioma de la partida', () => {
        const raw = { id: 1, title: 'Alien', genre_ids: [27], poster_path: null };
        expect(toMovie(raw, 'es').genre).toBe('Terror');
        expect(toMovie(raw, 'en').genre).toBe('Horror');
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
        const movie = toMovie({ id: 1, title: 'Alien', genre_ids: [27, 878], poster_path: '/a.jpg', release_date: '1979-05-25' }, 'es');
        expect(movie).toEqual({ id: 1, title: 'Alien', genre: 'Terror', posterPath: '/a.jpg', releaseYear: '1979', keywords: [] });
    });

    it('tolera datos incompletos', () => {
        const movie = toMovie({ id: 2, title: 'Sin datos', poster_path: null }, 'es');
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

it('pide los datos en español: de ahí salen el título y el cartel localizados', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    // Forma de /discover/movie según la documentación de TMDB, con el cartel que da para ese idioma.
    const fetchMock = vi.fn().mockImplementation(async () => reply({
        page: 1,
        total_pages: 1,
        results: [{ id: 603, title: 'Matrix', genre_ids: [28, 878], poster_path: '/cartel-es.jpg', release_date: '1999-03-30' }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const [movie] = await getMoviePool(filters);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('language')).toBe('es-ES');
    expect(movie).toMatchObject({ title: 'Matrix', posterPath: '/cartel-es.jpg' });
});

it('pide los datos en inglés si la partida va en inglés', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockImplementation(async () => reply({ results: [rawMovie], total_pages: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    await getMoviePool(filters, 'en');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('language')).toBe('en-US');
});

describe('no repetir películas', () => {
    const seen = { id: 1, title: 'Vista', poster_path: null };
    const seenBefore = { id: 2, title: 'Vista hace tiempo', poster_path: null };
    const fresh = { id: 3, title: 'Nueva', poster_path: null };

    function stubPages(pages: Record<number, unknown[]>) {
        vi.stubEnv('TMDB_API_KEY', 'test-key');
        const fetchMock = vi.fn().mockImplementation(async (url: string) => {
            const { pathname, searchParams } = new URL(url);
            if (pathname.includes('keywords')) return reply({ keywords: [] });
            return reply({ results: pages[Number(searchParams.get('page'))] ?? [], total_pages: Object.keys(pages).length });
        });
        vi.stubGlobal('fetch', fetchMock);
        return fetchMock;
    }

    it('no elige una que ya ha salido si en la página hay otra', async () => {
        stubPages({ 1: [seen, fresh] });
        for (let i = 0; i < 20; i++) expect((await getRandomMovie(filters, 'es', [1])).id).toBe(3);
    });

    it('sigue buscando en otras páginas si en esta ya han salido todas', async () => {
        stubPages({ 1: [seen], 2: [seenBefore], 3: [fresh] });
        for (let i = 0; i < 20; i++) expect((await getRandomMovie(filters, 'es', [1, 2])).id).toBe(3);
    });

    it('si se agotan, saca la que hace más tiempo que salió', async () => {
        stubPages({ 1: [seen, seenBefore] });
        expect((await getRandomMovie(filters, 'es', [2, 1])).id).toBe(2);
    });

    it('deja de buscar tras unas cuantas páginas', async () => {
        const pages = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [i + 1, [seen]]));
        const fetchMock = stubPages(pages);
        expect((await getRandomMovie({ ...filters, popularity: 'TOP_500' }, 'es', [1])).id).toBe(1);
        expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('discover')).length).toBe(5);
    });
});
