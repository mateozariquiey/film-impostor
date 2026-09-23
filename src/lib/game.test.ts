import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS, MIN_PLAYERS, createPlayers, pickRandom, randomIndex } from './game';

describe('createPlayers', () => {
    it('crea el número de jugadores pedido con un único impostor', () => {
        const players = createPlayers(5);
        expect(players).toHaveLength(5);
        expect(players.filter((p) => p.role === 'impostor')).toHaveLength(1);
    });

    it('usa la función aleatoria para elegir al impostor', () => {
        const players = createPlayers(4, () => 0.99);
        expect(players[3].role).toBe('impostor');
    });

    it('rechaza números de jugadores fuera de rango', () => {
        expect(() => createPlayers(MIN_PLAYERS - 1)).toThrow();
        expect(() => createPlayers(MAX_PLAYERS + 1)).toThrow();
        expect(() => createPlayers(3.5)).toThrow();
    });
});

describe('randomIndex y pickRandom', () => {
    it('devuelve siempre un índice dentro del rango', () => {
        expect(randomIndex(10, () => 0)).toBe(0);
        expect(randomIndex(10, () => 0.9999)).toBe(9);
    });

    it('elige un elemento de la lista', () => {
        expect(pickRandom(['a', 'b', 'c'], () => 0.5)).toBe('b');
    });

    it('falla con una lista vacía', () => {
        expect(() => pickRandom([])).toThrow();
    });
});
