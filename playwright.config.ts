import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/**
 * La partida en móvil, sobre la compilación real (`npm run build` antes), porque el service worker
 * solo existe ahí. TMDB se simula en cada prueba, así que no hace falta clave.
 */
export default defineConfig({
    testDir: './e2e',
    outputDir: './e2e/.resultados',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 },
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
        // Un service worker se quedaría con las peticiones a la API, y no se podrían simular.
        serviceWorkers: 'block',
    },
    webServer: {
        command: `npm start -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        env: { TMDB_API_KEY: '' },
    },
});
