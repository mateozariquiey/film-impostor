import { describe, expect, it } from 'vitest';
import type { Locale } from '@/types';
import { genreName } from './genres';
import { reserveMovies } from './reserve';

describe.each<Locale>(['es', 'en'])('lista de reserva en %s', (locale) => {
    const movies = reserveMovies(locale);

    it('tiene películas suficientes y sin repetir', () => {
        expect(movies.length).toBeGreaterThanOrEqual(30);
        expect(new Set(movies.map((movie) => movie.title)).size).toBe(movies.length);
        expect(new Set(movies.map((movie) => movie.id)).size).toBe(movies.length);
    });

    it('da las pistas de género y año a todas', () => {
        for (const movie of movies) {
            expect(movie.genre).not.toBe(genreName(undefined, locale));
            expect(movie.releaseYear).toMatch(/^\d{4}$/);
        }
    });
});

it('la misma película tiene el mismo ID en los dos idiomas, para que siga contando como vista', () => {
    const inSpanish = reserveMovies('es');
    const matrix = inSpanish.find((movie) => movie.title === 'Matrix');
    expect(reserveMovies('en').find((movie) => movie.id === matrix?.id)?.title).toBe('The Matrix');
});

it('en inglés no ofrece las que solo se conocen en España', () => {
    expect(reserveMovies('es').some((movie) => movie.title === 'Ocho apellidos vascos')).toBe(true);
    expect(reserveMovies('en').length).toBe(reserveMovies('es').length - 1);
});
