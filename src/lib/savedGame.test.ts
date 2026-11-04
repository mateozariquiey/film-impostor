import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import {
    canSaveGames,
    clearGame,
    decodeSavedGame,
    encodeSavedGame,
    loadGame,
    saveGame,
    SAVED_GAME_TTL_MS,
    type SavedGame,
} from './savedGame';

const NOW = 1_800_000_000_000;

const movie: Movie = {
    id: 603,
    title: 'Ñandú: el título con acentos',
    genre: 'Acción',
    posterPath: '/a.jpg',
    releaseYear: '1999',
    keywords: ['espacio'],
};

const game: SavedGame = {
    phase: 'TURN',
    currentPlayerIndex: 2,
    impostor: 3,
    firstPlayer: 0,
    question: 7,
    talkTimer: null,
    movie,
    settings: { ...DEFAULT_SETTINGS, playerCount: 5, names: ['Lucía', '', 'Marcos'] },
    customPool: [movie],
};

/** Codifica una partida con cambios, como si la hubiera guardado una versión con otros datos. */
function encodeWith(changes: object, savedAt = NOW): string {
    return btoa(encodeURIComponent(JSON.stringify({ version: 1, savedAt, ...game, ...changes })));
}

describe('codificar y leer la partida', () => {
    it('recupera exactamente lo guardado, también con acentos', () => {
        expect(decodeSavedGame(encodeSavedGame(game, NOW), NOW)).toEqual({ status: 'ok', game });
    });

    it('no deja a la vista ni el título ni el impostor', () => {
        const raw = encodeSavedGame(game, NOW);
        for (const secret of ['impostor', 'Ñandú', 'title', 'Lucía']) expect(raw).not.toContain(secret);
    });

    it('caduca pasado el plazo, y no antes', () => {
        const raw = encodeSavedGame(game, NOW);
        expect(decodeSavedGame(raw, NOW + SAVED_GAME_TTL_MS).status).toBe('ok');
        expect(decodeSavedGame(raw, NOW + SAVED_GAME_TTL_MS + 1).status).toBe('expired');
    });

    it('da por caducada una partida guardada en el futuro', () => {
        expect(decodeSavedGame(encodeSavedGame(game, NOW + 1000), NOW).status).toBe('expired');
    });

    it.each([
        ['texto que no es base64', '%%%'],
        ['base64 que no es JSON', btoa('hola')],
        ['JSON que no es un objeto', btoa(encodeURIComponent('[1]'))],
        ['otra versión', encodeWith({ version: 2 })],
        ['resultado guardado', encodeWith({ phase: 'RESULT' })],
        ['ajustes de fase', encodeWith({ phase: 'SETUP' })],
        ['turno fuera de rango', encodeWith({ currentPlayerIndex: 5 })],
        ['impostor fuera de rango', encodeWith({ impostor: 5 })],
        ['impostor no entero', encodeWith({ impostor: 1.5 })],
        ['primer jugador fuera de rango', encodeWith({ firstPlayer: -1 })],
        ['sin película', encodeWith({ movie: null })],
        ['película sin título', encodeWith({ movie: { ...movie, title: '' } })],
        ['palabras clave inválidas', encodeWith({ movie: { ...movie, keywords: [1] } })],
        ['número de jugadores inválido', encodeWith({ settings: { ...game.settings, playerCount: 99 } })],
    ])('descarta %s', (_, raw) => {
        expect(decodeSavedGame(raw, NOW)).toEqual({ status: 'none' });
    });

    it.each([
        ['sin pregunta, de antes de que las hubiera', undefined],
        ['con una pregunta que ya no existe', 9999],
    ])('retoma una partida %s', (_, question) => {
        const loaded = decodeSavedGame(encodeWith({ question }), NOW);
        expect(loaded.status === 'ok' && loaded.game.question).toBe(0);
    });

    it('conserva el tiempo de la mesa, y un temporizador en un turno no vale', () => {
        const timer = { status: 'paused', remainingMs: 1000 };
        const atTable = decodeSavedGame(encodeWith({ phase: 'TABLE', talkTimer: timer }), NOW);
        expect(atTable.status === 'ok' && atTable.game.talkTimer).toEqual(timer);
        const onTurn = decodeSavedGame(encodeWith({ phase: 'TURN', talkTimer: timer }), NOW);
        expect(onTurn.status === 'ok' && onTurn.game.talkTimer).toBeNull();
    });

    it('filtra lo que no sea una película en la selección manual', () => {
        const loaded = decodeSavedGame(encodeWith({ customPool: [movie, { id: 'x' }] }), NOW);
        expect(loaded.status === 'ok' && loaded.game.customPool).toEqual([movie]);
    });
});

describe('almacenamiento', () => {
    let store: Map<string, string>;

    beforeEach(() => {
        store = new Map();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => void store.set(key, value),
            removeItem: (key: string) => void store.delete(key),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('guarda y retoma', () => {
        saveGame(game, NOW);
        expect(loadGame(NOW + 1000)).toEqual({ status: 'ok', game });
    });

    it('no hay nada que retomar en un móvil nuevo', () => {
        expect(loadGame(NOW)).toEqual({ status: 'none' });
    });

    it('al caducar borra la partida: el aviso sale una vez y no queda el secreto', () => {
        saveGame(game, NOW);
        expect(loadGame(NOW + SAVED_GAME_TTL_MS + 1)).toEqual({ status: 'expired' });
        expect(store.size).toBe(0);
        expect(loadGame(NOW + SAVED_GAME_TTL_MS + 2)).toEqual({ status: 'none' });
    });

    it('borra lo que no se puede leer', () => {
        saveGame(game, NOW);
        const [key] = store.keys();
        store.set(key, 'roto');
        expect(loadGame(NOW)).toEqual({ status: 'none' });
        expect(store.size).toBe(0);
    });

    it('cada turno guardado reinicia el plazo', () => {
        saveGame(game, NOW);
        saveGame({ ...game, currentPlayerIndex: 3 }, NOW + SAVED_GAME_TTL_MS);
        const loaded = loadGame(NOW + SAVED_GAME_TTL_MS + 1000);
        expect(loaded.status === 'ok' && loaded.game.currentPlayerIndex).toBe(3);
    });

    it('clearGame deja el almacenamiento limpio', () => {
        saveGame(game, NOW);
        clearGame();
        expect(store.size).toBe(0);
    });

    it('sin almacenamiento no falla y lo dice', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('bloqueado');
            },
            setItem: () => {
                throw new Error('bloqueado');
            },
            removeItem: () => {
                throw new Error('bloqueado');
            },
        });
        expect(() => saveGame(game, NOW)).not.toThrow();
        expect(() => clearGame()).not.toThrow();
        expect(loadGame(NOW)).toEqual({ status: 'none' });
        expect(canSaveGames()).toBe(false);
    });

    it('con almacenamiento lo dice y no deja rastro de la prueba', () => {
        expect(canSaveGames()).toBe(true);
        expect(store.size).toBe(0);
    });
});
