import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS, MIN_PLAYERS, createDeal, createPlayers, pickRandom, playerName, randomIndex, thePlayer, toPlayer } from './game';

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

describe('quién empieza', () => {
    it('se sortea sin depender del impostor: salen todas las combinaciones por igual', () => {
        const count = 4;
        const seen = new Map<string, number>();
        // Dos sorteos seguidos, con todos los valores posibles de cada uno.
        for (let first = 0; first < count; first++) {
            for (let second = 0; second < count; second++) {
                const values = [first / count, second / count];
                const { players, firstPlayer } = createDeal(count, () => values.shift()!);
                const key = `${players.findIndex((player) => player.role === 'impostor')}-${firstPlayer}`;
                seen.set(key, (seen.get(key) ?? 0) + 1);
            }
        }
        expect(seen.size).toBe(count * count);
        expect([...seen.values()].every((times) => times === 1)).toBe(true);
    });

    it('el impostor también puede empezar', () => {
        const { players, firstPlayer } = createDeal(3, () => 0.5);
        expect(players[firstPlayer].role).toBe('impostor');
    });
});

describe('cómo se nombra a un jugador', () => {
    const names = ['Lucía', ''];

    it('usa el nombre si lo hay', () => {
        expect(playerName(0, names)).toBe('Lucía');
        expect(thePlayer(0, names)).toBe('Lucía');
        expect(toPlayer(0, names)).toBe('a Lucía');
    });

    it('usa el número si está vacío o no se ha escrito', () => {
        for (const index of [1, 2]) {
            expect(playerName(index, names)).toBe(`Jugador ${index + 1}`);
            expect(thePlayer(index, names)).toBe(`el jugador ${index + 1}`);
            expect(toPlayer(index, names)).toBe(`al jugador ${index + 1}`);
        }
    });
});
