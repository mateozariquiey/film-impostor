import type { Movie } from '@/types';
import { isQuestion } from '@/lib/questions';
import { parseSettings, type GameSettings } from '@/lib/settings';
import { parseTalkTimer, type TalkTimer } from '@/lib/talkTimer';

/** Lo necesario para retomar una partida a medias. El resultado no se guarda: ya es público. */
export interface SavedGame {
    phase: 'TURN' | 'TABLE';
    currentPlayerIndex: number;
    impostor: number;
    firstPlayer: number;
    /** La pregunta de la mesa, para que recargar no la cambie. */
    question: number;
    /** Solo existe en la mesa, y si el grupo ha pedido tiempo. */
    talkTimer: TalkTimer | null;
    movie: Movie;
    settings: GameSettings;
    /** Para que «Otra película» siga saliendo de la selección manual. */
    customPool: Movie[];
}

export type LoadedGame =
    | { status: 'none' }
    | { status: 'expired' }
    | { status: 'ok'; game: SavedGame };

/** Una partida dura minutos, así que esto solo cubre pausas largas. Se cuenta desde el último turno. */
export const SAVED_GAME_TTL_MS = 6 * 60 * 60 * 1000;

const STORAGE_KEY = 'film-impostor-game';
const VERSION = 1;

/**
 * Base64 solo para que ni el título ni el impostor se lean de un vistazo si alguien abre el
 * almacenamiento del navegador. No es cifrado: la clave tendría que estar en este mismo móvil.
 */
export function encodeSavedGame(game: SavedGame, now: number): string {
    return btoa(encodeURIComponent(JSON.stringify({ version: VERSION, savedAt: now, ...game })));
}

export function decodeSavedGame(raw: string, now: number): LoadedGame {
    let data: unknown;
    try {
        data = JSON.parse(decodeURIComponent(atob(raw)));
    } catch {
        return { status: 'none' };
    }
    if (!isRecord(data) || data.version !== VERSION || typeof data.savedAt !== 'number') {
        return { status: 'none' };
    }

    // Un reloj atrasado da una edad negativa: mejor perder la partida que no caducarla nunca.
    const age = now - data.savedAt;
    if (age < 0 || age > SAVED_GAME_TTL_MS) return { status: 'expired' };

    const game = toSavedGame(data);
    return game ? { status: 'ok', game } : { status: 'none' };
}

/** Lee la partida guardada y borra la que ya no sirve, para que no quede nada en el móvil. */
export function loadGame(now = Date.now()): LoadedGame {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return { status: 'none' };
        const loaded = decodeSavedGame(raw, now);
        if (loaded.status !== 'ok') localStorage.removeItem(STORAGE_KEY);
        return loaded;
    } catch {
        return { status: 'none' };
    }
}

export function saveGame(game: SavedGame, now = Date.now()): void {
    try {
        localStorage.setItem(STORAGE_KEY, encodeSavedGame(game, now));
    } catch {
        // Sin almacenamiento la partida funciona igual, y se avisa antes de recargar.
    }
}

export function clearGame(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Si no se puede leer ni escribir, tampoco hay nada guardado.
    }
}

/** Si se puede guardar: sin esto, recargar sí pierde la partida y hay que avisar. */
export function canSaveGames(): boolean {
    try {
        localStorage.setItem(`${STORAGE_KEY}-prueba`, '1');
        localStorage.removeItem(`${STORAGE_KEY}-prueba`);
        return true;
    } catch {
        return false;
    }
}

function toSavedGame(data: Record<string, unknown>): SavedGame | null {
    const { phase, currentPlayerIndex, impostor, firstPlayer, question, talkTimer, movie, settings, customPool } = data;
    if (phase !== 'TURN' && phase !== 'TABLE') return null;
    if (!isMovie(movie) || !isRecord(settings)) return null;

    const parsed = parseSettings(JSON.stringify(settings));
    // parseSettings sustituye lo que no vale: otro número de jugadores significa que era inválido.
    if (parsed.playerCount !== settings.playerCount) return null;
    const count = parsed.playerCount;
    if (!isIndex(currentPlayerIndex, count) || !isIndex(impostor, count) || !isIndex(firstPlayer, count)) {
        return null;
    }

    return {
        phase,
        currentPlayerIndex,
        impostor,
        firstPlayer,
        // Una partida guardada antes de que hubiera preguntas se sigue pudiendo retomar.
        question: isQuestion(question) ? question : 0,
        talkTimer: phase === 'TABLE' ? parseTalkTimer(talkTimer) : null,
        movie,
        settings: parsed,
        customPool: Array.isArray(customPool) ? customPool.filter(isMovie) : [],
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIndex(value: unknown, count: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count;
}

function isMovie(value: unknown): value is Movie {
    if (!isRecord(value)) return false;
    const { id, title, genre, posterPath, releaseYear, keywords } = value;
    return (
        typeof id === 'number' &&
        typeof title === 'string' &&
        title !== '' &&
        (genre === null || typeof genre === 'string') &&
        (posterPath === null || typeof posterPath === 'string') &&
        (releaseYear === null || typeof releaseYear === 'string') &&
        Array.isArray(keywords) &&
        keywords.every((keyword) => typeof keyword === 'string')
    );
}
