/** Los minutos que se pueden elegir. 0 es sin límite, lo normal: el grupo decide cuándo vota. */
export const TALK_MINUTES = [0, 3, 5, 8] as const;

/**
 * El tiempo de conversación. Corriendo guarda la hora a la que acaba y no lo que queda, porque con
 * la pantalla bloqueada o la app en segundo plano los temporizadores del navegador se paran, pero
 * el reloj sigue. `skipped` distingue si se acabó el tiempo o si el grupo decidió no esperar.
 */
export type TalkTimer =
    | { status: 'running'; endsAt: number }
    | { status: 'paused'; remainingMs: number }
    | { status: 'over'; skipped: boolean };

export function startTalkTimer(minutes: number, now: number): TalkTimer | null {
    return minutes > 0 ? { status: 'running', endsAt: now + minutes * 60_000 } : null;
}

export function talkRemainingMs(timer: TalkTimer, now: number): number {
    if (timer.status === 'over') return 0;
    return timer.status === 'paused' ? timer.remainingMs : Math.max(0, timer.endsAt - now);
}

export function pauseTalkTimer(timer: TalkTimer, now: number): TalkTimer {
    return timer.status === 'running' ? { status: 'paused', remainingMs: talkRemainingMs(timer, now) } : timer;
}

export function resumeTalkTimer(timer: TalkTimer, now: number): TalkTimer {
    return timer.status === 'paused' ? { status: 'running', endsAt: now + timer.remainingMs } : timer;
}

/** 4:05. Redondea hacia arriba, para que el 0:00 se vea justo al acabar y no un segundo antes. */
export function formatTalkTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Lo que venga de una partida guardada puede ser cualquier cosa. */
export function parseTalkTimer(value: unknown): TalkTimer | null {
    if (typeof value !== 'object' || value === null) return null;
    const timer = value as Record<string, unknown>;
    if (timer.status === 'running' && isTime(timer.endsAt)) return { status: 'running', endsAt: timer.endsAt };
    if (timer.status === 'paused' && isTime(timer.remainingMs)) return { status: 'paused', remainingMs: timer.remainingMs };
    if (timer.status === 'over') return { status: 'over', skipped: timer.skipped === true };
    return null;
}

function isTime(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
