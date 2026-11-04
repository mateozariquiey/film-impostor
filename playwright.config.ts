import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
/** El móvil pequeño para el que está pensada la app, sea cual sea el navegador. */
const viewport = { width: 360, height: 640 };

/**
 * La partida en móvil, sobre la compilación real (`npm run build` antes), porque el service worker
 * solo existe ahí. TMDB se simula en cada prueba, así que no hace falta clave.
 *
 * El proyecto `webkit` es el motor de Safari, no iOS: ver `touchHold` en e2e/helpers.ts.
 */
export default defineConfig({
    testDir: './e2e',
    outputDir: './e2e/.resultados',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
        // Un service worker se quedaría con las peticiones a la API, y no se podrían simular.
        serviceWorkers: 'block',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Pixel 5'], viewport } },
        { name: 'webkit', use: { ...devices['iPhone 13'], viewport } },
    ],
    webServer: {
        command: `npm start -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        env: { TMDB_API_KEY: '' },
    },
});
