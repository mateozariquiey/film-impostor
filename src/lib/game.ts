import type { Player } from '@/types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
/** Con menos, dos impostores son demasiados: quedan muy pocos que conozcan la película. */
export const MIN_PLAYERS_FOR_TWO_IMPOSTORS = 7;

/** Devuelve un entero aleatorio entre 0 y max - 1. */
export function randomIndex(max: number, random: () => number = Math.random): number {
    return Math.floor(random() * max);
}

export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): T {
    if (items.length === 0) throw new Error('No se puede elegir de una lista vacía');
    return items[randomIndex(items.length, random)];
}

/** Cuántos impostores hay de verdad: la opción de dos solo vale en grupos grandes. */
export function impostorCountFor(playerCount: number, twoImpostors: boolean): number {
    return twoImpostors && playerCount >= MIN_PLAYERS_FOR_TWO_IMPOSTORS ? 2 : 1;
}

/** Crea los jugadores de una partida con sus impostores elegidos al azar, siempre personas distintas. */
export function createPlayers(count: number, random: () => number = Math.random, impostors = 1): Player[] {
    if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
        throw new Error(`El número de jugadores debe estar entre ${MIN_PLAYERS} y ${MAX_PLAYERS}`);
    }
    const first = randomIndex(count, random);
    if (impostors === 1) return playersWithImpostors(count, [first]);
    // El segundo sale de los que quedan, contando desde el primero, y así todas las parejas valen igual.
    const second = (first + 1 + randomIndex(count - 1, random)) % count;
    return playersWithImpostors(count, [first, second]);
}

export function playersWithImpostors(count: number, impostors: readonly number[]): Player[] {
    return Array.from({ length: count }, (_, id) => ({
        id,
        role: impostors.includes(id) ? 'impostor' : 'normal',
    }));
}

export function impostorsOf(players: readonly Player[]): number[] {
    return players.filter((player) => player.role === 'impostor').map((player) => player.id);
}

/**
 * El reparto de una partida. Quien empieza se sortea aparte y entre todos, también el impostor:
 * si dependiera de él o lo excluyera, empezar ya sería una pista.
 */
export function createDeal(
    count: number,
    random: () => number = Math.random,
    impostors = 1,
): { players: Player[]; firstPlayer: number } {
    return { players: createPlayers(count, random, impostors), firstPlayer: randomIndex(count, random) };
}
