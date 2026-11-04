import { expect, it } from 'vitest';
import { detectLocale } from './locale';

it('sigue el primer idioma del navegador que la app tiene', () => {
    expect(detectLocale(['es-MX', 'en'])).toBe('es');
    expect(detectLocale(['en-GB', 'es'])).toBe('en');
    expect(detectLocale(['fr-FR', 'es-ES', 'en'])).toBe('es');
    expect(detectLocale(['EN'])).toBe('en');
});

it('quien no habla ninguno de los dos lo ve en inglés', () => {
    expect(detectLocale(['fr-FR'])).toBe('en');
    expect(detectLocale([])).toBe('en');
});
