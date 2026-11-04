import { expect, test } from '@playwright/test';
import { domText, expectNoSideScroll, fakeApi, fakeMovie, touchHold, TURN_SURFACE } from './helpers';

const SECRET = 'Película Secreta';
const IMPOSTOR_ROLE = 'Eres el impostor';

test.use({ locale: 'es-ES' });

test('la partida completa con el dedo, sin que el secreto esté en la página fuera del gesto', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');

    await page.getByRole('button', { name: 'Un jugador menos' }).tap();
    await expect(page.locator('output')).toHaveAccessibleName('3 jugadores');
    await page.getByRole('button', { name: 'Empezar' }).tap();

    const roles: string[] = [];
    for (const player of [1, 2, 3]) {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(`Jugador ${player}`);

        // Antes del gesto no hay nada.
        await expect.poll(() => domText(page)).not.toContain(SECRET);
        expect(await domText(page)).not.toContain(IMPOSTOR_ROLE);

        // Mientras se mantiene, se ve el papel.
        const finger = await touchHold(page, TURN_SURFACE);
        const role = page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`));
        await expect(role).toBeVisible();
        roles.push((await role.textContent()) ?? '');
        await page.waitForTimeout(600);

        // Al soltar, desaparece del todo y no hay clic fantasma en el botón de pasar.
        await finger.release();
        await expect(page.getByText('Ya está oculto')).toBeVisible();
        expect(await domText(page)).not.toContain(SECRET);
        expect(await domText(page)).not.toContain(IMPOSTOR_ROLE);
        await page.waitForTimeout(300);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(`Jugador ${player}`);

        await page.getByRole('button', { name: player === 3 ? 'Dejar el móvil en la mesa' : `Pásale el móvil al jugador ${player + 1}` }).tap();
    }

    // Un solo impostor, y los demás ven la película.
    expect(roles.filter((role) => role === IMPOSTOR_ROLE)).toHaveLength(1);
    expect(roles.filter((role) => role === SECRET)).toHaveLength(2);

    // En la mesa no hay secretos, y un toque corto no revela nada.
    await expect(page.getByRole('heading', { name: 'Ya lo habéis visto todos' })).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);
    const hold = page.getByRole('button', { name: 'Mantén para ver quién era' });
    await hold.tap();
    await expect(page.getByText('Deja el dedo hasta que se llene el botón.')).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);

    // Manteniendo, sí. Los botones del resultado no saltan al levantar el dedo que venía pulsando.
    const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
    await expect(page.getByRole('heading', { name: /^Era el jugador \d$/ })).toBeVisible({ timeout: 3000 });
    await finger.release();
    await expect(page.getByText(`La película era ${SECRET}`)).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /^Era el jugador \d$/ })).toBeVisible();
    await expectNoSideScroll(page);
});

test('soltar antes de tiempo oculta el papel y pide mantener un poco más', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    const finger = await touchHold(page, TURN_SURFACE);
    await expect(page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`))).toBeVisible();
    await finger.release();

    await expect(page.getByText('Mantén un momento más')).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);
    expect(await domText(page)).not.toContain(IMPOSTOR_ROLE);
    await expect(page.getByRole('button', { name: /Pásale el móvil/ })).toHaveCount(0);
});

test('al soltar sobre el sitio donde aparece «Pasar el móvil» no se pasa solo', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    // El dedo sobre la señal de abajo, que es justo donde aparecerá el botón de pasar.
    const hint = await page.getByText('Mantén para ver tu papel').boundingBox();
    const finger = await touchHold(page, TURN_SURFACE, { x: hint!.x + hint!.width / 2, y: hint!.y + hint!.height / 2 });
    await page.waitForTimeout(650);
    await finger.release();

    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jugador 1');
    await expect(page.getByText('Ya está oculto')).toBeVisible();
});

test('que el móvil pase a segundo plano o pierda el foco oculta el papel', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    const finger = await touchHold(page, TURN_SURFACE);
    await expect(page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`))).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect.poll(() => domText(page)).not.toContain(SECRET);
    expect(await domText(page)).not.toContain(IMPOSTOR_ROLE);
    await finger.release();
});

test('recargar a media partida no enseña ningún papel y deja seguir', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Partida a medias' })).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);

    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain(SECRET);

    await page.getByRole('button', { name: 'Seguir' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);
});

test('volver atrás desde otra página no restaura ningún secreto', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    await page.goto('about:blank');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Partida a medias' })).toBeVisible();
    expect(await domText(page)).not.toContain(SECRET);
});
