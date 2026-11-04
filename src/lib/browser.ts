import { useEffect } from 'react';

export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Evita que la pantalla se apague durante la partida, si el navegador lo permite. */
export function useKeepScreenOn(active: boolean): void {
    useEffect(() => {
        if (!active || !('wakeLock' in navigator)) return;

        let lock: WakeLockSentinel | null = null;
        let stopped = false;

        const acquire = async () => {
            try {
                const next = await navigator.wakeLock.request('screen');
                if (stopped) void next.release();
                else lock = next;
            } catch {
                // Lo normal si hay ahorro de batería: la partida sigue igual.
            }
        };
        // El bloqueo se pierde al cambiar de app, así que se pide otra vez al volver.
        const onVisibility = () => {
            if (document.visibilityState === 'visible') void acquire();
        };

        void acquire();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            stopped = true;
            document.removeEventListener('visibilitychange', onVisibility);
            void lock?.release();
        };
    }, [active]);
}

/** Pide confirmación antes de recargar o cerrar. Solo hace falta si la partida no se puede guardar. */
export function useWarnBeforeLeaving(active: boolean): void {
    useEffect(() => {
        if (!active) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [active]);
}

/** Si la app se ha abierto ya instalada. `standalone` es como lo dice iOS. */
export function isInstalled(): boolean {
    const { standalone } = navigator as Navigator & { standalone?: boolean };
    return standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

/** Registra el service worker que permite abrir la app sin conexión. */
export function useServiceWorker(): void {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        if (process.env.NODE_ENV === 'production') {
            // Si falla, la app funciona igual, pero solo con conexión.
            navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
        } else {
            // En desarrollo, uno que quedara de probar `npm start` serviría una versión vieja.
            void navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => registrations.forEach((registration) => void registration.unregister()));
        }
    }, []);
}

/**
 * Baja la luz de la pantalla (y de la barra del navegador) mientras el móvil pasa de mano,
 * para que no ilumine la cara de quien lo mira. Se ve igual en tema claro y oscuro.
 */
export function useDimScreen(active: boolean): void {
    useEffect(() => {
        if (!active) return;
        const root = document.documentElement;
        const bars = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
        const colors = bars.map((bar) => bar.content);

        root.dataset.luz = 'baja';
        bars.forEach((bar) => (bar.content = '#141b19'));
        return () => {
            delete root.dataset.luz;
            bars.forEach((bar, index) => (bar.content = colors[index]));
        };
    }, [active]);
}
