import { pickRandom } from '@/lib/game';

/**
 * Las películas que han salido en este dispositivo, de la más antigua a la más reciente. Solo se
 * guardan los ID: no revelan nada a simple vista, y sirven igual en los dos idiomas.
 * Con 200 hay para meses de partidas, y la lista cabe de sobra en la URL de la API.
 */
export const MAX_RECENT_MOVIES = 200;

const STORAGE_KEY = 'film-impostor-recent';

/** Elige al azar entre las que no han salido. Si ya han salido todas, la que hace más tiempo que salió. */
export function pickFresh<T extends { id: number }>(
    items: readonly T[],
    recent: readonly number[],
    random: () => number = Math.random,
): T {
    const fresh = items.filter((item) => !recent.includes(item.id));
    if (fresh.length > 0) return pickRandom(fresh, random);
    if (items.length === 0) throw new Error('No se puede elegir de una lista vacía');
    return items.reduce((oldest, item) => (recent.indexOf(item.id) < recent.indexOf(oldest.id) ? item : oldest));
}

export function addRecentMovie(recent: readonly number[], id: number): number[] {
    return [...recent.filter((other) => other !== id), id].slice(-MAX_RECENT_MOVIES);
}

/** Lo que venga del almacenamiento o de la URL puede ser cualquier cosa: solo pasan los ID. */
function cleanIds(values: unknown[]): number[] {
    return values.filter((id): id is number => Number.isInteger(id)).slice(-MAX_RECENT_MOVIES);
}

export function parseRecentMovies(raw: string | null): number[] {
    try {
        const data: unknown = JSON.parse(raw ?? '[]');
        return Array.isArray(data) ? cleanIds(data) : [];
    } catch {
        return [];
    }
}

/** Lo que llega a la API. Las de la reserva (ID negativo) nunca salen de TMDB, así que no se admiten. */
export function parseExcludeParam(param: string | null): number[] {
    if (!param) return [];
    return cleanIds(param.split(',').map(Number)).filter((id) => id > 0);
}

export function loadRecentMovies(): number[] {
    try {
        return parseRecentMovies(localStorage.getItem(STORAGE_KEY));
    } catch {
        return [];
    }
}

export function saveRecentMovies(recent: readonly number[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch {
        // Sin almacenamiento, la lista dura lo que dure la pestaña.
    }
}
