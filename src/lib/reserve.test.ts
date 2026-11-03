import { describe, expect, it } from 'vitest';
import { RESERVE_MOVIES } from './reserve';

describe('lista de reserva', () => {
    it('tiene películas suficientes y sin repetir', () => {
        expect(RESERVE_MOVIES.length).toBeGreaterThanOrEqual(30);
        expect(new Set(RESERVE_MOVIES.map((movie) => movie.title)).size).toBe(RESERVE_MOVIES.length);
        expect(new Set(RESERVE_MOVIES.map((movie) => movie.id)).size).toBe(RESERVE_MOVIES.length);
    });

    it('da las pistas de género y año a todas', () => {
        for (const movie of RESERVE_MOVIES) {
            expect(movie.genre).not.toBe('');
            expect(movie.releaseYear).toMatch(/^\d{4}$/);
        }
    });
});
