export type Theme = 'rojo' | 'dia';

const STORAGE_KEY = 'film-impostor-theme';
const STATUS_BAR: Record<Theme, string> = { rojo: '#140302', dia: '#eef0ee' };

/** El guion de layout.tsx ya ha puesto el tema guardado en <html> antes de pintar. */
export function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'dia' ? 'dia' : 'rojo';
}

/** Aplica y guarda el tema. La pantalla de resultado siempre se ve a la luz blanca. */
export function applyTheme(theme: Theme, isLit: boolean): void {
    const root = document.documentElement;
    if (theme === 'dia') root.dataset.theme = 'dia';
    else delete root.dataset.theme;

    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', STATUS_BAR[isLit ? 'dia' : theme]);

    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Sin almacenamiento, el tema dura lo que dure la página.
    }
}
