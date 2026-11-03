import type { Movie } from '@/types';

/**
 * Lista de reserva para jugar cuando TMDB no responde o no hay conexión.
 * Son películas muy conocidas, con su título en España, y no llevan cartel ni palabras clave.
 */
const RESERVE: readonly (readonly [title: string, genre: string, year: number])[] = [
    ['El padrino', 'Drama', 1972],
    ['Tiburón', 'Suspense', 1975],
    ['La guerra de las galaxias', 'Ciencia ficción', 1977],
    ['Grease', 'Música', 1978],
    ['Alien, el octavo pasajero', 'Terror', 1979],
    ['En busca del arca perdida', 'Aventura', 1981],
    ['E.T., el extraterrestre', 'Familia', 1982],
    ['Los Goonies', 'Aventura', 1985],
    ['Regreso al futuro', 'Aventura', 1985],
    ['Dirty Dancing', 'Romance', 1987],
    ['Jungla de cristal', 'Acción', 1988],
    ['Pretty Woman', 'Romance', 1990],
    ['Solo en casa', 'Comedia', 1990],
    ['El silencio de los corderos', 'Suspense', 1991],
    ['Jurassic Park', 'Aventura', 1993],
    ['El rey león', 'Animación', 1994],
    ['Forrest Gump', 'Comedia', 1994],
    ['Pulp Fiction', 'Crimen', 1994],
    ['Toy Story', 'Animación', 1995],
    ['Titanic', 'Drama', 1997],
    ['Matrix', 'Ciencia ficción', 1999],
    ['El club de la lucha', 'Drama', 1999],
    ['Gladiator', 'Acción', 2000],
    ['Shrek', 'Animación', 2001],
    ['Amélie', 'Comedia', 2001],
    ['Harry Potter y la piedra filosofal', 'Fantasía', 2001],
    ['El señor de los anillos: La comunidad del anillo', 'Fantasía', 2001],
    ['Piratas del Caribe: La maldición de la Perla Negra', 'Aventura', 2003],
    ['El caballero oscuro', 'Acción', 2008],
    ['Avatar', 'Ciencia ficción', 2009],
    ['Origen', 'Acción', 2010],
    ['Ocho apellidos vascos', 'Comedia', 2014],
    ['Interstellar', 'Ciencia ficción', 2014],
    ['Mad Max: Furia en la carretera', 'Acción', 2015],
    ['Coco', 'Animación', 2017],
    ['Parásitos', 'Drama', 2019],
    ['Barbie', 'Comedia', 2023],
    ['Oppenheimer', 'Drama', 2023],
];

export const RESERVE_MOVIES: readonly Movie[] = RESERVE.map(([title, genre, year], index) => ({
    // IDs negativos: nunca coinciden con los de TMDB.
    id: -(index + 1),
    title,
    genre,
    posterPath: null,
    releaseYear: String(year),
    keywords: [],
}));
