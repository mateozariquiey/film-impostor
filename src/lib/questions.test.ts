import { describe, expect, it } from 'vitest';
import { MAX_RECENT_QUESTIONS, QUESTIONS, addRecentQuestion, isQuestion, pickQuestion } from './questions';

describe('las preguntas', () => {
    it('hay al menos 40, sin repetir en ningún idioma', () => {
        expect(QUESTIONS.length).toBeGreaterThanOrEqual(40);
        expect(new Set(QUESTIONS.map(({ es }) => es)).size).toBe(QUESTIONS.length);
        expect(new Set(QUESTIONS.map(({ en }) => en)).size).toBe(QUESTIONS.length);
    });

    it('están bien escritas y caben en dos líneas de la mesa', () => {
        for (const { es, en } of QUESTIONS) {
            expect(es).toMatch(/^¿.+\?$/);
            expect(en).toMatch(/^[A-Z].+\?$/);
            expect(es.length).toBeLessThanOrEqual(60);
            expect(en.length).toBeLessThanOrEqual(60);
        }
    });
});

describe('elegir una pregunta', () => {
    it('no repite ninguna de las recientes', () => {
        const recent = QUESTIONS.map((_, id) => id).slice(1);
        expect(pickQuestion(recent, () => 0.5)).toBe(0);
    });

    it('recorre todas las libres según el azar', () => {
        const seen = QUESTIONS.map((_, id) => pickQuestion([], () => id / QUESTIONS.length));
        expect(new Set(seen).size).toBe(QUESTIONS.length);
    });

    it('la lista de recientes deja siempre preguntas libres, y lo último va al final', () => {
        expect(MAX_RECENT_QUESTIONS).toBeLessThan(QUESTIONS.length);
        let recent: number[] = [];
        for (let turn = 0; turn < 200; turn++) {
            const next = pickQuestion(recent);
            expect(recent).not.toContain(next);
            recent = addRecentQuestion(recent, next);
            expect(recent.at(-1)).toBe(next);
            expect(recent.length).toBeLessThanOrEqual(MAX_RECENT_QUESTIONS);
        }
    });

    it('solo acepta posiciones que existen', () => {
        expect(isQuestion(0)).toBe(true);
        expect(isQuestion(QUESTIONS.length)).toBe(false);
        expect(isQuestion(-1)).toBe(false);
        expect(isQuestion(1.5)).toBe(false);
        expect(isQuestion('1')).toBe(false);
    });
});
