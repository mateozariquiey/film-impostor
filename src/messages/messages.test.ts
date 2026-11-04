import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';

describe('dos impostores', () => {
    const names = ['Lucía', 'Inés', 'Hierro', ''];

    it('se nombra a los dos, con la «y» que toca', () => {
        expect(es.result.were(2, 0, names)).toBe('Eran Hierro y Lucía');
        expect(es.result.were(0, 1, names)).toBe('Eran Lucía e Inés');
        expect(es.result.were(0, 2, names)).toBe('Eran Lucía y Hierro');
        expect(es.result.were(0, 3, names)).toBe('Eran Lucía y el jugador 4');
        expect(es.result.were(3, 4, names)).toBe('Eran el jugador 4 y el jugador 5');
        expect(en.result.were(0, 3, names)).toBe('It was Lucía and Player 4');
    });

    it('con uno, los textos no cambian', () => {
        expect(es.table.hold(1)).toBe('Mantén para ver quién era');
        expect(es.turn.giveClues(1)).toBe('Da pistas sin regalársela al impostor.');
        expect(es.table.rules(1)[1]).toBe('Antes de ver el resultado, el impostor puede intentar adivinar la película.');
        expect(en.table.hold(1)).toBe('Hold to see who it was');
    });
});

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
