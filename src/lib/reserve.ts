import type { Locale, Movie } from '@/types';
import { translateGenre } from '@/lib/genres';

/**
 * Lista de reserva para jugar cuando TMDB no responde o no hay conexión.
 * Son películas muy conocidas, con su título en España y en inglés, y no llevan cartel ni palabras clave.
 * Títulos, años y géneros contrastados con las fichas de TMDB y con Wikidata (noviembre de 2026).
 * Una película sin título en inglés es porque no es conocida fuera de España: no sale en esa lista.
 */
const RESERVE: readonly (readonly [es: string, en: string | null, genre: string, year: number])[] = [
    ['El padrino', 'The Godfather', 'Drama', 1972],
    ['Tiburón', 'Jaws', 'Suspense', 1975],
    ['La guerra de las galaxias', 'Star Wars', 'Ciencia ficción', 1977],
    ['Grease', 'Grease', 'Romance', 1978],
    ['Alien: El octavo pasajero', 'Alien', 'Terror', 1979],
    ['En busca del arca perdida', 'Raiders of the Lost Ark', 'Aventura', 1981],
    ['E.T., el extraterrestre', 'E.T. the Extra-Terrestrial', 'Familia', 1982],
    ['Los Goonies', 'The Goonies', 'Aventura', 1985],
    ['Regreso al futuro', 'Back to the Future', 'Aventura', 1985],
    ['Dirty Dancing', 'Dirty Dancing', 'Romance', 1987],
    ['Jungla de cristal', 'Die Hard', 'Acción', 1988],
    ['Pretty Woman', 'Pretty Woman', 'Romance', 1990],
    ['Solo en casa', 'Home Alone', 'Comedia', 1990],
    ['El silencio de los corderos', 'The Silence of the Lambs', 'Suspense', 1991],
    ['Parque Jurásico', 'Jurassic Park', 'Aventura', 1993],
    ['El rey león', 'The Lion King', 'Animación', 1994],
    ['Forrest Gump', 'Forrest Gump', 'Comedia', 1994],
    ['Pulp Fiction', 'Pulp Fiction', 'Crimen', 1994],
    ['Toy Story', 'Toy Story', 'Animación', 1995],
    ['Titanic', 'Titanic', 'Drama', 1997],
    ['Matrix', 'The Matrix', 'Ciencia ficción', 1999],
    ['El club de la lucha', 'Fight Club', 'Drama', 1999],
    ['Gladiator', 'Gladiator', 'Acción', 2000],
    ['Shrek', 'Shrek', 'Animación', 2001],
    ['Amélie', 'Amélie', 'Comedia', 2001],
    ['Harry Potter y la piedra filosofal', "Harry Potter and the Philosopher's Stone", 'Fantasía', 2001],
    ['El señor de los anillos: La comunidad del anillo', 'The Lord of the Rings: The Fellowship of the Ring', 'Fantasía', 2001],
    ['Piratas del Caribe: La maldición de la Perla Negra', 'Pirates of the Caribbean: The Curse of the Black Pearl', 'Aventura', 2003],
    ['El caballero oscuro', 'The Dark Knight', 'Acción', 2008],
    ['Avatar', 'Avatar', 'Ciencia ficción', 2009],
    ['Origen', 'Inception', 'Acción', 2010],
    ['Ocho apellidos vascos', null, 'Comedia', 2014],
    ['Interstellar', 'Interstellar', 'Ciencia ficción', 2014],
    ['Mad Max: Furia en la carretera', 'Mad Max: Fury Road', 'Acción', 2015],
    ['Coco', 'Coco', 'Animación', 2017],
    ['Parásitos', 'Parasite', 'Drama', 2019],
    ['Barbie', 'Barbie', 'Comedia', 2023],
    ['Oppenheimer', 'Oppenheimer', 'Drama', 2023],
];

/** Las de la reserva llevan ID negativo: nunca coinciden con los de TMDB. */
export function isReserveMovie(movie: Movie): boolean {
    return movie.id < 0;
}

/** La lista en un idioma. El ID es el de su fila, así que una película sale igual de «ya vista» en los dos. */
export function reserveMovies(locale: Locale): Movie[] {
    return RESERVE.flatMap(([es, en, genre, year], index) => {
        const title = locale === 'es' ? es : en;
        if (title === null) return [];
        return {
            id: -(index + 1),
            title,
            genre: translateGenre(genre, locale),
            posterPath: null,
            releaseYear: String(year),
            keywords: [],
        };
    });
}
