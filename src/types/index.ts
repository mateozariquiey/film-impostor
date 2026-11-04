export type Role = 'impostor' | 'normal';

export interface Player {
    id: number;
    role: Role;
}

export type Decade = 'ALL' | '80s' | '90s' | '00s' | '10s' | '20s';
export type Popularity = 'TOP_100' | 'TOP_500' | 'HARDCORE' | 'CLASSICS';
export type Hint = 'GENRE' | 'YEAR' | 'KEYWORDS';
export type Locale = 'es' | 'en';

export interface MovieFilters {
    decade: Decade;
    popularity: Popularity;
    /** Si se indica, sustituye a la década. */
    year?: number;
    /** ID de género de TMDB. Sin él, cualquiera. */
    genre?: number;
}

export interface Movie {
    id: number;
    /** Título y género van en el idioma en el que se pidió la película. */
    title: string;
    /** Lo que se le da al impostor como pista. Sin nada que aporte, no hay: ver `hintGenreName`. */
    genre: string | null;
    posterPath: string | null;
    releaseYear: string | null;
    keywords: string[];
}

export type GamePhase = 'SETUP' | 'TURN' | 'TABLE' | 'RESULT';
