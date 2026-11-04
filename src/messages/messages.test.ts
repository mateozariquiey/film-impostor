import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';

describe('cómo se nombra a un jugador', () => {
    const names = ['Lucía', ''];

    it('usa el nombre si lo hay', () => {
        expect(es.playerName(0, names)).toBe('Lucía');
        expect(es.turn.passTo(0, names)).toBe('Pásale el móvil a Lucía');
        expect(en.turn.passTo(0, names)).toBe('Pass the phone to Lucía');
        expect(en.resume.turnOf(0, names)).toBe('It’s Lucía’s turn. Roles are still hidden.');
    });

    it('usa el número si está vacío o no se ha escrito', () => {
        for (const index of [1, 2]) {
            const number = index + 1;
            expect(es.playerName(index, names)).toBe(`Jugador ${number}`);
            expect(es.turn.passTo(index, names)).toBe(`Pásale el móvil al jugador ${number}`);
            expect(es.result.was(index, names)).toBe(`Era el jugador ${number}`);
            expect(en.playerName(index, names)).toBe(`Player ${number}`);
            expect(en.result.was(index, names)).toBe(`It was Player ${number}`);
        }
    });
});
