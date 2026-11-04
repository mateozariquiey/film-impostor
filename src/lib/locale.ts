import type { Locale } from '@/types';

export const LOCALES: readonly Locale[] = ['es', 'en'];

/** El idioma que se le pide a TMDB. De él salen el título y el cartel localizados. */
export const TMDB_LANGUAGES: Record<Locale, string> = { es: 'es-ES', en: 'en-US' };

/** La dirección de cada idioma. Las dos son la misma app: cambia lo que ve quien recibe el enlace. */
export const LOCALE_PATHS: Record<Locale, string> = { es: '/', en: '/en' };

export const MANIFEST_PATHS: Record<Locale, string> = {
    es: '/manifest.webmanifest',
    en: '/en/manifest.webmanifest',
};

const STORAGE_KEY = 'film-impostor-locale';

export function isLocale(value: unknown): value is Locale {
    return LOCALES.includes(value as Locale);
}

/** El primer idioma del navegador que tenemos. Para quien no habla ninguno de los dos, inglés. */
export function detectLocale(languages: readonly string[]): Locale {
    for (const language of languages) {
        const base = language.toLowerCase().split('-')[0];
        if (isLocale(base)) return base;
    }
    return 'en';
}

export function browserLocale(): Locale {
    return detectLocale(navigator.languages ?? [navigator.language]);
}

/** Lo elegido a mano manda sobre el navegador. */
export function loadLocale(): Locale {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isLocale(saved)) return saved;
    } catch {
        // Sin almacenamiento se sigue al navegador.
    }
    return browserLocale();
}

/** Volver al idioma del navegador borra la elección, y a partir de ahí se le vuelve a seguir. */
export function saveLocale(locale: Locale): void {
    try {
        if (locale === browserLocale()) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, locale);
    } catch {
        // Sin almacenamiento, la elección dura lo que dure la pestaña.
    }
}
