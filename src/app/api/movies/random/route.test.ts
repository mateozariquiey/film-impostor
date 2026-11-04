import { NextRequest } from 'next/server';
import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';

const reply = (data: unknown) => new Response(JSON.stringify(data));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

/** De la URL que pide el navegador a la que llega a TMDB, sin simular nada por el medio. */
function stubTmdb() {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockImplementation(async (url: string) =>
        url.includes('keywords')
            ? reply({ keywords: [] })
            : reply({
                  total_pages: 1,
                  results: [
                      { id: 603, title: 'The Matrix', genre_ids: [878], poster_path: null },
                      { id: 680, title: 'Pulp Fiction', genre_ids: [80], poster_path: null },
                  ],
              }),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

const get = (query: string) => GET(new NextRequest(`http://localhost/api/movies/random?${query}`));

it('lleva el idioma y el género a TMDB, y no repite lo que le piden excluir', async () => {
    const fetchMock = stubTmdb();
    const res = await get('lang=en&genre=878&exclude=603');
    const tmdb = new URL(fetchMock.mock.calls[0][0]).searchParams;
    expect(tmdb.get('language')).toBe('en-US');
    expect(tmdb.get('with_genres')).toBe('878');
    expect(await res.json()).toMatchObject({ id: 680, genre: 'Crime' });
});

it('sin idioma sigue en español, para las versiones ya guardadas en el móvil', async () => {
    const fetchMock = stubTmdb();
    await get('');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('language')).toBe('es-ES');
});

it('rechaza un género que no existe', async () => {
    stubTmdb();
    expect((await get('genre=1')).status).toBe(400);
});
