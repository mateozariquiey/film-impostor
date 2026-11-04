import { describe, expect, it } from 'vitest';
import { formatTalkTime, parseTalkTimer, pauseTalkTimer, resumeTalkTimer, startTalkTimer, talkRemainingMs } from './talkTimer';

const NOW = 1_800_000_000_000;

describe('el tiempo de conversación', () => {
    it('sin minutos no hay temporizador', () => {
        expect(startTalkTimer(0, NOW)).toBeNull();
    });

    it('cuenta por la hora, así que sigue corriendo aunque la app esté parada', () => {
        const timer = startTalkTimer(5, NOW)!;
        expect(talkRemainingMs(timer, NOW)).toBe(300_000);
        expect(talkRemainingMs(timer, NOW + 60_000)).toBe(240_000);
        expect(talkRemainingMs(timer, NOW + 999_000)).toBe(0);
    });

    it('al pausar se congela, y al seguir continúa donde estaba', () => {
        const paused = pauseTalkTimer(startTalkTimer(3, NOW)!, NOW + 60_000);
        expect(talkRemainingMs(paused, NOW + 500_000)).toBe(120_000);

        const running = resumeTalkTimer(paused, NOW + 500_000);
        expect(talkRemainingMs(running, NOW + 500_000)).toBe(120_000);
        expect(talkRemainingMs(running, NOW + 560_000)).toBe(60_000);
    });

    it('pausar lo acabado, o seguir lo que ya corre, no cambia nada', () => {
        const over = { status: 'over', skipped: false } as const;
        const running = startTalkTimer(3, NOW)!;
        expect(pauseTalkTimer(over, NOW)).toBe(over);
        expect(resumeTalkTimer(running, NOW + 1000)).toBe(running);
    });

    it('se lee como un reloj', () => {
        expect(formatTalkTime(300_000)).toBe('5:00');
        expect(formatTalkTime(245_000)).toBe('4:05');
        expect(formatTalkTime(1)).toBe('0:01');
        expect(formatTalkTime(0)).toBe('0:00');
    });
});

describe('leer el temporizador de una partida guardada', () => {
    it('acepta los tres estados', () => {
        for (const timer of [
            { status: 'running', endsAt: NOW },
            { status: 'paused', remainingMs: 1000 },
            { status: 'over', skipped: true },
        ]) {
            expect(parseTalkTimer(timer)).toEqual(timer);
        }
    });

    it.each([[undefined], [null], ['running'], [{ status: 'running' }], [{ status: 'paused', remainingMs: -1 }], [{ status: 'otro' }]])(
        'descarta %j',
        (value) => {
            expect(parseTalkTimer(value)).toBeNull();
        },
    );
});
