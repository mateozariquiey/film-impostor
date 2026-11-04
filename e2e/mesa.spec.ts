import { expect, test, type Page } from '@playwright/test';
import { domText, expectNoSideScroll, fakeApi, fakeMovie, touchHold, TURN_SURFACE } from './helpers';

const SECRET = 'Película Secreta';

/** Pasa todos los turnos con el dedo hasta dejar el móvil en la mesa. */
async function playToTable(page: Page, players: number, lastButton: string | RegExp = 'Dejar el móvil en la mesa') {
    for (let player = 1; player <= players; player++) {
        const finger = await touchHold(page, TURN_SURFACE);
        await page.waitForTimeout(560);
        await finger.release();
        const next = player === players ? page.getByRole('button', { name: lastButton }) : page.getByRole('button', { name: /Pásale el móvil|Pass the phone/ });
        await next.tap();
    }
}

const setSettings = (page: Page, settings: object) =>
    page.addInitScript((value) => {
        if (!localStorage.getItem('film-impostor-settings')) localStorage.setItem('film-impostor-settings', JSON.stringify(value));
    }, settings);

/** La pregunta es lo que hay en cartel debajo del botón de pedir otra. */
const question = (page: Page) => page.locator('p[aria-live="polite"]');

test.describe('la pregunta para arrancar', () => {
    test.use({ locale: 'es-ES' });

    test('sale en la mesa, se puede cambiar con un toque y no dice nada de la película', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();

        // Durante los turnos todavía no está: nadie contesta antes de haber visto su papel.
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Otra pregunta' })).toHaveCount(0);

        await playToTable(page, 3);
        await expect(question(page)).toHaveText(/^¿.+\?$/);
        const first = await question(page).textContent();

        const before = await page.getByRole('button', { name: 'Mantén para ver quién era' }).boundingBox();
        await page.getByRole('button', { name: 'Otra pregunta' }).tap();
        await expect(question(page)).not.toHaveText(first!);
        expect(await domText(page)).not.toContain(SECRET);

        // Cambiarla no mueve el botón de ver el resultado, ni hace falta desplazarse para llegar a él.
        const after = await page.getByRole('button', { name: 'Mantén para ver quién era' }).boundingBox();
        expect(after).toEqual(before);
        await expectNoSideScroll(page);
    });

    test('recargar en la mesa conserva la pregunta', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);
        const shown = await question(page).textContent();

        await page.reload();
        await page.getByRole('button', { name: 'Seguir' }).tap();
        await expect(question(page)).toHaveText(shown!);
    });

    test('no se repite de una partida a la siguiente', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);
        const first = await question(page).textContent();

        const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
        await expect(page.getByRole('button', { name: 'Otra película' })).toBeVisible({ timeout: 3000 });
        await finger.release();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Otra película' }).tap();
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        await playToTable(page, 3);
        await expect(question(page)).toHaveText(/^¿.+\?$/);
        await expect(question(page)).not.toHaveText(first!);
    });
});

test.describe('en inglés', () => {
    test.use({ locale: 'en-US' });

    test('la pregunta va en inglés', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, 'Secret Movie'));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/en');
        await page.getByRole('button', { name: 'Start' }).tap();
        await playToTable(page, 3, 'Put the phone on the table');
        await expect(question(page)).toHaveText(/^[A-Z].+\?$/);
        await expect(page.getByText('To get you started')).toBeVisible();
        await page.getByRole('button', { name: 'Another question' }).tap();
        await expect(question(page)).toHaveText(/^[A-Z].+\?$/);
    });
});
