import type { Player } from '@/types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

/** Devuelve un entero aleatorio entre 0 y max - 1. */
export function randomIndex(max: number, random: () => number = Math.random): number {
    return Math.floor(random() * max);
}

export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): T {
    if (items.length === 0) throw new Error('No se puede elegir de una lista vacía');
    return items[randomIndex(items.length, random)];
}

/** Crea los jugadores de una partida con un único impostor elegido al azar. */
export function createPlayers(count: number, random: () => number = Math.random): Player[] {
    if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
        throw new Error(`El número de jugadores debe estar entre ${MIN_PLAYERS} y ${MAX_PLAYERS}`);
    }
    const impostor = randomIndex(count, random);
    return Array.from({ length: count }, (_, id) => ({
        id,
        role: id === impostor ? 'impostor' : 'normal',
    }));
}
