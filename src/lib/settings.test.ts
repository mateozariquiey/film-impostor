import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS } from './game';
import { cleanName, DEFAULT_SETTINGS, MAX_NAME_LENGTH, parseSettings, settingsToFilters } from './settings';

describe('parseSettings', () => {
    it('los dos impostores hay que pedirlos', () => {
        expect(parseSettings('{}').twoImpostors).toBe(false);
        expect(parseSettings('{"twoImpostors":true}').twoImpostors).toBe(true);
        expect(parseSettings('{"twoImpostors":"sí"}').twoImpostors).toBe(false);
    });

    it('el tiempo para hablar es uno de los que se ofrecen, y por defecto no hay', () => {
        expect(parseSettings('{"talkMinutes":5}').talkMinutes).toBe(5);
        expect(parseSettings('{"talkMinutes":4}').talkMinutes).toBe(0);
        expect(parseSettings('{"talkMinutes":"5"}').talkMinutes).toBe(0);
        expect(parseSettings('{}').talkMinutes).toBe(0);
    });

    it('devuelve los valores por defecto si no hay nada guardado o el JSON está roto', () => {
        expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
        expect(parseSettings('{no es json')).toEqual(DEFAULT_SETTINGS);
    });

    it('conserva los valores válidos y descarta los demás', () => {
        const raw = JSON.stringify({ playerCount: 99, decade: '80s', popularity: 'X', year: '1985', hints: ['YEAR', 'FOO'] });
        expect(parseSettings(raw)).toEqual({
            playerCount: DEFAULT_SETTINGS.playerCount,
            decade: '80s',
            genre: null,
            popularity: DEFAULT_SETTINGS.popularity,
            year: '1985',
            hints: ['YEAR'],
            names: [],
            talkMinutes: 0,
            twoImpostors: false,
        });
    });
});

describe('settingsToFilters', () => {
    it('incluye el año solo si es válido', () => {
        expect(settingsToFilters({ ...DEFAULT_SETTINGS, year: '2001' })).toEqual({ decade: 'ALL', popularity: 'TOP_100', year: 2001 });
        expect(settingsToFilters({ ...DEFAULT_SETTINGS, year: '' })).toEqual({ decade: 'ALL', popularity: 'TOP_100' });
        expect(settingsToFilters({ ...DEFAULT_SETTINGS, year: '12' })).toEqual({ decade: 'ALL', popularity: 'TOP_100' });
    });
});

it.each(['null', '[]', '42', 'true', '"texto"'])('descarta JSON que no sea un objeto de ajustes: %s', (raw) => {
    expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
});

describe('nombres', () => {
    it('se conservan por posición y se descarta lo que no es texto', () => {
        const raw = JSON.stringify({ names: ['Lucía', 3, '', 'Marcos'] });
        expect(parseSettings(raw).names).toEqual(['Lucía', '', '', 'Marcos']);
    });

    it('si faltan o no son una lista, no hay nombres', () => {
        expect(parseSettings('{}').names).toEqual([]);
        expect(parseSettings(JSON.stringify({ names: 'Lucía' })).names).toEqual([]);
    });

    it('no pasan del máximo de jugadores ni de letras', () => {
        const names = parseSettings(JSON.stringify({ names: Array(20).fill('x'.repeat(40)) })).names;
        expect(names).toHaveLength(MAX_PLAYERS);
        expect(names[0]).toHaveLength(MAX_NAME_LENGTH);
    });

    it('se limpian al jugar', () => {
        expect(cleanName('  Ana   María ')).toBe('Ana María');
        expect(cleanName('   ')).toBe('');
    });
});

describe('género', () => {
    it('guarda solo géneros que existen', () => {
        expect(parseSettings(JSON.stringify({ genre: 27 })).genre).toBe(27);
        expect(parseSettings(JSON.stringify({ genre: 123456 })).genre).toBeNull();
        expect(parseSettings(JSON.stringify({ genre: 'terror' })).genre).toBeNull();
    });

    it('pasa a los filtros si se ha elegido', () => {
        expect(settingsToFilters({ ...DEFAULT_SETTINGS, genre: 35 }).genre).toBe(35);
        expect(settingsToFilters(DEFAULT_SETTINGS)).not.toHaveProperty('genre');
    });
});
