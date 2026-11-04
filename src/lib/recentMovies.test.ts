import { describe, expect, it } from 'vitest';
import { addRecentMovie, MAX_RECENT_MOVIES, parseExcludeParam, parseRecentMovies, pickFresh } from './recentMovies';

const movies = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe('pickFresh', () => {
    it('elige solo entre las que no han salido', () => {
        for (let i = 0; i < 20; i++) expect(pickFresh(movies, [1, 3]).id).toBe(2);
    });

    it('si han salido todas, la que hace más tiempo', () => {
        expect(pickFresh(movies, [3, 1, 2]).id).toBe(3);
    });

    it('con una sola película, esa, aunque acabe de salir', () => {
        expect(pickFresh([{ id: 1 }], [1]).id).toBe(1);
    });
});

describe('addRecentMovie', () => {
    it('la añade al final y no la duplica', () => {
        expect(addRecentMovie([1, 2, 3], 1)).toEqual([2, 3, 1]);
    });

    it('olvida las más antiguas al llegar al límite', () => {
        const full = Array.from({ length: MAX_RECENT_MOVIES }, (_, i) => i + 1);
        const next = addRecentMovie(full, 999);
        expect(next).toHaveLength(MAX_RECENT_MOVIES);
        expect(next[0]).toBe(2);
        expect(next.at(-1)).toBe(999);
    });
});

describe('leer la lista', () => {
    it('descarta lo que no sea válido', () => {
        expect(parseRecentMovies(null)).toEqual([]);
        expect(parseRecentMovies('no es JSON')).toEqual([]);
        expect(parseRecentMovies('{"a":1}')).toEqual([]);
        expect(parseRecentMovies('[1,"2",null,-3,4.5]')).toEqual([1, -3]);
    });

    it('la API solo admite ID de TMDB, y no más que el límite', () => {
        expect(parseExcludeParam(null)).toEqual([]);
        expect(parseExcludeParam('603,abc,-4,,680')).toEqual([603, 680]);
        const many = Array.from({ length: MAX_RECENT_MOVIES + 50 }, (_, i) => i + 1).join(',');
        expect(parseExcludeParam(many)).toHaveLength(MAX_RECENT_MOVIES);
    });
});
