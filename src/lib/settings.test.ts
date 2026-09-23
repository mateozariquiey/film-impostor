import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, settingsToFilters } from './settings';

describe('parseSettings', () => {
    it('devuelve los valores por defecto si no hay nada guardado o el JSON está roto', () => {
        expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
        expect(parseSettings('{no es json')).toEqual(DEFAULT_SETTINGS);
    });

    it('conserva los valores válidos y descarta los demás', () => {
        const raw = JSON.stringify({ playerCount: 99, decade: '80s', popularity: 'X', year: '1985', hints: ['YEAR', 'FOO'] });
        expect(parseSettings(raw)).toEqual({
            playerCount: DEFAULT_SETTINGS.playerCount,
            decade: '80s',
            popularity: DEFAULT_SETTINGS.popularity,
            year: '1985',
            hints: ['YEAR'],
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
