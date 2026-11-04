import { describe, expect, it } from 'vitest';
import { filtersToSearchParams, parseFilters } from './filters';

const today = new Date('2026-06-01');

describe('parseFilters', () => {
    it('usa valores por defecto si no hay parámetros', () => {
        expect(parseFilters(new URLSearchParams(), today)).toEqual({ decade: 'ALL', popularity: 'TOP_100' });
    });

    it('acepta un año válido', () => {
        const params = new URLSearchParams({ decade: '90s', popularity: 'CLASSICS', year: '1994' });
        expect(parseFilters(params, today)).toEqual({ decade: '90s', popularity: 'CLASSICS', year: 1994 });
    });

    it('rechaza valores desconocidos o años imposibles', () => {
        expect(parseFilters(new URLSearchParams({ decade: '70s' }), today)).toBeNull();
        expect(parseFilters(new URLSearchParams({ popularity: 'TOP_10' }), today)).toBeNull();
        expect(parseFilters(new URLSearchParams({ year: '2099' }), today)).toBeNull();
        expect(parseFilters(new URLSearchParams({ year: 'abc' }), today)).toBeNull();
    });

    it('recupera los mismos filtros que se enviaron', () => {
        const filters = { decade: '10s', popularity: 'TOP_500', year: 2015 } as const;
        expect(parseFilters(filtersToSearchParams(filters), today)).toEqual(filters);
    });
});

it('valida el género que llega a la API', () => {
    expect(parseFilters(new URLSearchParams('genre=27'))?.genre).toBe(27);
    expect(parseFilters(new URLSearchParams('genre=1'))).toBeNull();
    expect(parseFilters(new URLSearchParams('genre=abc'))).toBeNull();
    expect(parseFilters(new URLSearchParams(''))).not.toHaveProperty('genre');
});
