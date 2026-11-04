import type { Locale } from '@/types';

/** La lista oficial de géneros de películas de TMDB, con sus ID y los nombres que da en cada idioma. */
const GENRES = [
    { id: 28, es: 'Acción', en: 'Action' },
    { id: 12, es: 'Aventura', en: 'Adventure' },
    { id: 16, es: 'Animación', en: 'Animation' },
    { id: 35, es: 'Comedia', en: 'Comedy' },
    { id: 80, es: 'Crimen', en: 'Crime' },
    { id: 99, es: 'Documental', en: 'Documentary' },
    { id: 18, es: 'Drama', en: 'Drama' },
    { id: 10751, es: 'Familia', en: 'Family' },
    { id: 14, es: 'Fantasía', en: 'Fantasy' },
    { id: 36, es: 'Historia', en: 'History' },
    { id: 27, es: 'Terror', en: 'Horror' },
    { id: 10402, es: 'Música', en: 'Music' },
    { id: 9648, es: 'Misterio', en: 'Mystery' },
    { id: 10749, es: 'Romance', en: 'Romance' },
    { id: 878, es: 'Ciencia ficción', en: 'Science Fiction' },
    { id: 10770, es: 'Película de TV', en: 'TV Movie' },
    { id: 53, es: 'Suspense', en: 'Thriller' },
    { id: 10752, es: 'Bélica', en: 'War' },
    { id: 37, es: 'Western', en: 'Western' },
] as const;

const TV_MOVIE = 10770;

export function isGenreId(value: unknown): value is number {
    return GENRES.some(({ id }) => id === value);
}

export function genreName(id: number | undefined, locale: Locale): string {
    return GENRES.find((genre) => genre.id === id)?.[locale] ?? (locale === 'es' ? 'Género desconocido' : 'Unknown genre');
}

/** Para las películas de la lista de reserva, que llevan el género escrito en español. */
export function translateGenre(spanishName: string, locale: Locale): string {
    return genreName(GENRES.find(({ es }) => es === spanishName)?.id, locale);
}

/** Los que se ofrecen al elegir, por orden alfabético. «Película de TV» se deja fuera: no es algo que se busque para jugar. */
export function pickableGenres(locale: Locale): { id: number; name: string }[] {
    return GENRES.filter(({ id }) => id !== TV_MOVIE)
        .map((genre) => ({ id: genre.id as number, name: genre[locale] as string }))
        .sort((a, b) => a.name.localeCompare(b.name, locale));
}
