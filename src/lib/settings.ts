import type { Decade, Hint, MovieFilters, Popularity } from '@/types';
import { isDecade, isHint, isPopularity, isValidYear } from '@/lib/filters';
import { isGenreId } from '@/lib/genres';
import { MAX_PLAYERS, MIN_PLAYERS } from '@/lib/game';
import { TALK_MINUTES } from '@/lib/talkTimer';

export interface GameSettings {
    playerCount: number;
    decade: Decade;
    popularity: Popularity;
    /** Texto del campo "año exacto"; vacío si no se usa. */
    year: string;
    /** ID de género de TMDB, o null para cualquiera. */
    genre: number | null;
    hints: Hint[];
    /** Nombre escrito para cada jugador, por posición. Sobrevive a bajar y subir el número de jugadores. */
    names: string[];
    /** Minutos de conversación. 0 es sin límite. */
    talkMinutes: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
    playerCount: 4,
    decade: 'ALL',
    popularity: 'TOP_100',
    year: '',
    genre: null,
    hints: ['GENRE'],
    names: [],
    talkMinutes: 0,
};

export const MAX_NAME_LENGTH = 16;

/** Un nombre tal como se enseña en la partida. */
export function cleanName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH).trim();
}

const STORAGE_KEY = 'film-impostor-settings';

/** Lee los ajustes guardados y descarta cualquier valor que no sea válido. */
export function parseSettings(raw: string | null): GameSettings {
    if (!raw) return DEFAULT_SETTINGS;

    let data: Partial<Record<keyof GameSettings, unknown>>;
    try {
        data = JSON.parse(raw);
    } catch {
        return DEFAULT_SETTINGS;
    }

    if (typeof data !== 'object' || data === null || Array.isArray(data)) return DEFAULT_SETTINGS;

    const count = data.playerCount;
    return {
        playerCount:
            typeof count === 'number' && Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS
                ? count
                : DEFAULT_SETTINGS.playerCount,
        decade: isDecade(data.decade) ? data.decade : DEFAULT_SETTINGS.decade,
        popularity: isPopularity(data.popularity) ? data.popularity : DEFAULT_SETTINGS.popularity,
        year: typeof data.year === 'string' ? data.year : DEFAULT_SETTINGS.year,
        genre: isGenreId(data.genre) ? data.genre : DEFAULT_SETTINGS.genre,
        hints: Array.isArray(data.hints) ? data.hints.filter(isHint) : DEFAULT_SETTINGS.hints,
        names: Array.isArray(data.names)
            ? data.names
                  .slice(0, MAX_PLAYERS)
                  .map((name) => (typeof name === 'string' ? name.slice(0, MAX_NAME_LENGTH) : ''))
            : DEFAULT_SETTINGS.names,
        talkMinutes: (TALK_MINUTES as readonly unknown[]).includes(data.talkMinutes)
            ? (data.talkMinutes as number)
            : DEFAULT_SETTINGS.talkMinutes,
    };
}

export function loadSettings(): GameSettings {
    try {
        return parseSettings(localStorage.getItem(STORAGE_KEY));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: GameSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Sin almacenamiento (modo privado, cuota llena…) la partida funciona igual.
    }
}

/** Filtros de búsqueda a partir de los ajustes. Un año válido sustituye a la década. */
export function settingsToFilters(settings: GameSettings): MovieFilters {
    const year = Number(settings.year);
    const hasYear = settings.year.trim() !== '' && isValidYear(year);
    return {
        decade: settings.decade,
        popularity: settings.popularity,
        ...(hasYear ? { year } : {}),
        ...(settings.genre !== null ? { genre: settings.genre } : {}),
    };
}
