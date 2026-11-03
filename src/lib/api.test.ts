import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, errorKindFromStatus, fetchRandomMovie } from './api';

const FILTERS = { decade: 'ALL', popularity: 'TOP_100' } as const;

afterEach(() => vi.unstubAllGlobals());

describe('errores de la API propia', () => {
    it('distingue «sin películas» de un fallo del servidor', () => {
        expect(errorKindFromStatus(404)).toBe('no-movies');
        expect(errorKindFromStatus(500)).toBe('server');
        expect(errorKindFromStatus(502)).toBe('server');
    });

    it('trata como sin conexión una petición que no llega a ningún servidor', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        await expect(fetchRandomMovie(FILTERS)).rejects.toEqual(new ApiError('offline'));
    });
});
