export type Role = 'impostor' | 'normal';

export interface Player {
    id: number;
    role: Role;
}

export type Decade = 'ALL' | '80s' | '90s' | '00s' | '10s' | '20s';
export type Popularity = 'TOP_100' | 'TOP_500' | 'HARDCORE' | 'CLASSICS';
export type Hint = 'GENRE' | 'YEAR' | 'KEYWORDS';

export interface MovieFilters {
    decade: Decade;
    popularity: Popularity;
    /** Si se indica, sustituye a la década. */
    year?: number;
}

export interface Movie {
    id: number;
    title: string;
    genre: string;
    posterPath: string | null;
    releaseYear: string | null;
    keywords: string[];
}

export type GamePhase = 'SETUP' | 'TURN' | 'TABLE' | 'RESULT';
