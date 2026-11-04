import { describe, expect, it } from 'vitest';
import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    MIN_PLAYERS_FOR_TWO_IMPOSTORS,
    createDeal,
    createPlayers,
    impostorCountFor,
    impostorsOf,
    pickRandom,
    playersWithImpostors,
    randomIndex,
} from './game';

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

describe('dos impostores', () => {
    it('solo cuentan desde el mínimo de jugadores, y si el grupo los ha pedido', () => {
        expect(impostorCountFor(MIN_PLAYERS_FOR_TWO_IMPOSTORS - 1, true)).toBe(1);
        expect(impostorCountFor(MIN_PLAYERS_FOR_TWO_IMPOSTORS, true)).toBe(2);
        expect(impostorCountFor(MAX_PLAYERS, true)).toBe(2);
        expect(impostorCountFor(MAX_PLAYERS, false)).toBe(1);
    });

    it('son siempre dos personas distintas, y todas las parejas salen por igual', () => {
        const count = 7;
        const seen = new Map<string, number>();
        for (let first = 0; first < count; first++) {
            for (let second = 0; second < count - 1; second++) {
                const values = [first / count, second / (count - 1)];
                const impostors = impostorsOf(createPlayers(count, () => values.shift()!, 2));
                expect(impostors).toHaveLength(2);
                const key = impostors.join('-');
                seen.set(key, (seen.get(key) ?? 0) + 1);
            }
        }
        // Cada pareja sale dos veces: una por cada orden en que se pueden sacar.
        expect(seen.size).toBe((count * (count - 1)) / 2);
        expect([...seen.values()].every((times) => times === 2)).toBe(true);
    });

    it('quien empieza se sigue sorteando entre todos, también los impostores', () => {
        const count = 7;
        const starts = new Set<boolean>();
        for (let first = 0; first < count; first++) {
            const values = [0, 0, first / count];
            const { players, firstPlayer } = createDeal(count, () => values.shift()!, 2);
            expect(firstPlayer).toBe(first);
            starts.add(players[firstPlayer].role === 'impostor');
        }
        expect(starts).toEqual(new Set([true, false]));
    });

    it('el reparto se puede rehacer a partir de quiénes son', () => {
        const players = playersWithImpostors(8, [6, 1]);
        expect(impostorsOf(players)).toEqual([1, 6]);
        expect(players).toHaveLength(8);
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
