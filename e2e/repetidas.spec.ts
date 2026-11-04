import { expect, test, type Page } from '@playwright/test';
import { fakeApi, fakeMovie, touchHold, TURN_SURFACE } from './helpers';

test.use({ locale: 'es-ES' });

/** Juega de principio a fin con 3 jugadores, hasta la pantalla del resultado. */
async function playRound(page: Page) {
    for (let player = 1; player <= 3; player++) {
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        const finger = await touchHold(page, TURN_SURFACE);
        await page.waitForTimeout(600);
        await finger.release();
        await page.getByRole('button', { name: /Pásale el móvil|Dejar el móvil/ }).tap();
    }
    const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
    await expect(page.getByRole('button', { name: 'Otra película' })).toBeVisible({ timeout: 3000 });
    await finger.release();
    await page.waitForTimeout(500);
}

test('cada partida pide no repetir las anteriores, también tras cerrar la app', async ({ page }) => {
    let next = 100;
    const requests = await fakeApi(page, () => fakeMovie(next++, 'Alien'));
    await page.addInitScript(() => {
        if (!localStorage.getItem('film-impostor-settings')) {
            localStorage.setItem('film-impostor-settings', JSON.stringify({ playerCount: 3 }));
        }
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Empezar' }).tap();
    await playRound(page);
    await page.getByRole('button', { name: 'Otra película' }).tap();
    await playRound(page);

    expect(requests[0].searchParams.get('exclude')).toBeNull();
    expect(requests[1].searchParams.get('exclude')).toBe('100');

    await page.reload();
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();
    expect(requests[2].searchParams.get('exclude')).toBe('100,101');
});

test('la lista de reserva tampoco repite: 38 partidas, 38 películas', async ({ page }) => {
    // Son 38 partidas seguidas: en WebKit, en la integración continua, se pasa de los 30 s por poco.
    test.slow();
    await page.route('**/api/movies/random**', (route) => route.fulfill({ status: 502, json: {} }));
    await page.goto('/');

    const seen = new Set<string>();
    await page.getByRole('button', { name: 'Empezar' }).tap();
    for (let round = 0; round < 38; round++) {
        await page.getByRole('button', { name: 'Jugar con la lista de reserva' }).tap();
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        seen.add((await page.evaluate(() => atob(localStorage.getItem('film-impostor-game') ?? ''))).replace(/.*%22title%22%3A%22(.*?)%22.*/, '$1'));
        await page.getByRole('button', { name: 'Abandonar la partida' }).tap();
        await page.getByRole('button', { name: 'Abandonar', exact: true }).tap();
        await page.getByRole('button', { name: 'Empezar' }).tap();
    }
    expect(seen.size).toBe(38);

    // Agotada, no se queda sin nada: vuelve a salir la más antigua.
    await page.getByRole('button', { name: 'Jugar con la lista de reserva' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();
});
