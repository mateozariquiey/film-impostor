import { expect, test } from '@playwright/test';
import { fakeApi, fakeMovie, touchHold, TURN_SURFACE } from './helpers';

test.describe('con el navegador en español', () => {
    test.use({ locale: 'es-ES' });

    test('se puede pasar a inglés, se recuerda, y volver al idioma del navegador deja de forzarlo', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'es');

        await page.getByRole('button', { name: 'English' }).tap();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page).toHaveURL(/\/en$/);

        await page.reload();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

        await page.getByRole('button', { name: 'Español' }).tap();
        await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible();
        await expect(page).toHaveURL(/\/$/);
        expect(await page.evaluate(() => localStorage.getItem('film-impostor-locale'))).toBeNull();
    });

    test('cambiar de idioma descarta la selección de películas, que iba en el otro', async ({ page }) => {
        await page.route('**/api/movies/pool**', (route) =>
            route.fulfill({ json: [fakeMovie(1, 'Alien'), fakeMovie(2, 'Tiburón')] }),
        );
        await page.goto('/');
        await page.getByRole('button', { name: 'Quitar películas' }).tap();
        await page.getByRole('button', { name: 'Tachar Tiburón' }).tap();
        await page.getByRole('button', { name: 'Usar solo esta' }).tap();
        await expect(page.getByRole('button', { name: /Quitar películas.*Quedan 1/ })).toBeVisible();

        await page.getByRole('button', { name: 'English' }).tap();
        await expect(page.getByRole('button', { name: 'Remove movies' })).toBeVisible();
        await expect(page.getByRole('button', { name: /left/ })).toHaveCount(0);
    });
});

test.describe('con el navegador en inglés', () => {
    test.use({ locale: 'en-GB' });

    test('la partida va entera en inglés y pide las películas en inglés', async ({ page }) => {
        const requests = await fakeApi(page, () => fakeMovie(1, 'Alien'));
        await page.goto('/');
        await page.getByRole('button', { name: 'Start' }).tap();
        await expect(page.getByText('Take the phone')).toBeVisible();
        expect(requests[0].searchParams.get('lang')).toBe('en');

        const finger = await touchHold(page, TURN_SURFACE);
        await expect(page.getByText(/^(Alien|You’re the impostor)$/)).toBeVisible();
        await page.waitForTimeout(600);
        await finger.release();
        await expect(page.getByText('Hidden again')).toBeVisible();
    });

    test('sin conexión con TMDB ofrece la reserva, con títulos y géneros en inglés', async ({ page }) => {
        await page.route('**/api/movies/random**', (route) => route.abort());
        await page.goto('/');
        await page.getByRole('button', { name: 'Start' }).tap();
        await expect(page.getByText('You’re offline')).toBeVisible();
        await expect(page.getByText('The backup list has 37 very well-known movies')).toBeVisible();
        await page.getByRole('button', { name: 'Play with the backup list' }).tap();
        await expect(page.getByText('Take the phone')).toBeVisible();
    });
});

test('cada dirección trae sus metadatos, manifest e imagen para compartir, sin JavaScript', async ({ request }) => {
    const spanish = await (await request.get('/')).text();
    expect(spanish).toContain('<html lang="es"');
    expect(spanish).toContain('Todos ven la misma película, menos uno. Un juego');
    expect(spanish).toContain('es_ES');
    expect(spanish).toContain('href="/manifest.webmanifest"');

    const english = await (await request.get('/en')).text();
    expect(english).toContain('<html lang="en"');
    expect(english).toContain('All but one see the same movie. A party game');
    expect(english).toContain('en_US');
    expect(english).toContain('href="/en/manifest.webmanifest"');
    expect(english).toContain('/en/opengraph-image');
    expect(english).toContain('Film Impostor: all but one see the same movie.');

    const image = english.match(/property="og:image" content="[^"]*?(\/en\/opengraph-image[^"]*)"/)?.[1];
    expect(image).toBeTruthy();
    expect((await request.get(image!)).headers()['content-type']).toBe('image/png');

    const manifestEs = await (await request.get('/manifest.webmanifest')).json();
    const manifestEn = await (await request.get('/en/manifest.webmanifest')).json();
    expect(manifestEs).toMatchObject({ lang: 'es', id: '/' });
    expect(manifestEn).toMatchObject({ lang: 'en', id: '/', description: expect.stringContaining('All but one') });
});
