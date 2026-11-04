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

    test('el tiempo para hablar va en inglés', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, 'Secret Movie'));
        await setSettings(page, { playerCount: 3, talkMinutes: 3 });
        await page.goto('/en');
        await expect(page.getByRole('button', { name: /Time to talk.*3 min/ })).toBeVisible();
        await page.getByRole('button', { name: 'Start' }).tap();
        await playToTable(page, 3, 'Put the phone on the table');
        await expect(page.getByRole('timer')).toBeVisible();
        await page.getByRole('button', { name: 'Pause' }).tap();
        await page.getByRole('button', { name: 'Resume' }).tap();
        await page.getByRole('button', { name: 'Skip' }).tap();
        await expect(page.getByText('On three, point at who you suspect.')).toBeVisible();
    });
});

test.describe('el tiempo para hablar', () => {
    test.use({ locale: 'es-ES' });

    /** Cuenta los avisos: el sonido no se puede oír aquí, pero sí ver que se pide. */
    const spyOnAlerts = (page: Page) =>
        page.addInitScript(() => {
            const counts = { vibrate: 0, notes: 0 };
            Object.assign(window, { avisos: counts });
            // El gesto de mantener también vibra, con un número. El aviso es el único con un patrón.
            navigator.vibrate = (pattern) => {
                if (Array.isArray(pattern)) counts.vibrate += 1;
                return true;
            };
            const start = OscillatorNode.prototype.start;
            OscillatorNode.prototype.start = function (...args) {
                counts.notes += 1;
                return start.apply(this, args);
            };
        });
    const alerts = (page: Page) => page.evaluate(() => (window as unknown as { avisos: { vibrate: number; notes: number } }).avisos);

    test('por defecto no hay, y la mesa queda como siempre', async ({ page }) => {
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');
        await expect(page.getByRole('button', { name: /Tiempo para hablar.*Sin límite/ })).toBeVisible();
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);
        await expect(page.getByRole('heading', { name: 'Pistas, en este orden' })).toBeVisible();
        await expect(page.getByRole('timer')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Parar' })).toHaveCount(0);
    });

    test('se elige con el dedo, se para, sigue, y al acabar avisa una vez', async ({ page }) => {
        await page.clock.install();
        await spyOnAlerts(page);
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');

        await page.getByRole('button', { name: /Tiempo para hablar/ }).tap();
        await page.getByRole('dialog', { name: 'Tiempo para hablar' }).getByText('3 min').tap();
        await expect(page.getByRole('button', { name: /Tiempo para hablar.*3 min/ })).toBeVisible();

        await page.getByRole('button', { name: 'Empezar' }).tap();
        // Mientras se reparten los papeles no corre.
        await expect(page.getByRole('timer')).toHaveCount(0);
        await playToTable(page, 3);

        const clock = page.getByRole('timer');
        await expect(clock).toHaveText(/^(3:00|2:5\d)$/);

        await page.clock.fastForward(60_000);
        await expect(clock).toHaveText(/^(2:00|1:5\d)$/);

        await page.getByRole('button', { name: 'Parar' }).tap();
        const frozen = await clock.textContent();
        await page.clock.fastForward(600_000);
        await expect(clock).toHaveText(frozen!);
        expect((await alerts(page)).vibrate).toBe(0);

        await page.getByRole('button', { name: 'Seguir' }).tap();
        await expect(clock).toHaveText(frozen!);
        await page.clock.fastForward(125_000);
        await expect(page.getByText('Se acabó el tiempo. A la de tres, señalad a quien sospechéis.')).toBeVisible();
        await expect(clock).toHaveCount(0);
        expect(await domText(page)).not.toContain(SECRET);

        await page.clock.fastForward(5_000);
        const { vibrate, notes } = await alerts(page);
        expect(vibrate).toBe(1);
        expect(notes).toBe(2);
        await expectNoSideScroll(page);
    });

    test('saltar lleva a votar sin avisar', async ({ page }) => {
        await page.clock.install();
        await spyOnAlerts(page);
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3, talkMinutes: 5 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);

        await page.getByRole('button', { name: 'Saltar' }).tap();
        await expect(page.getByText('A la de tres, señalad a quien sospechéis.')).toBeVisible();
        await expect(page.getByText('Se acabó el tiempo')).toHaveCount(0);
        await page.clock.fastForward(600_000);
        expect((await alerts(page)).vibrate).toBe(0);
    });

    test('recargar no reinicia el tiempo: sigue corriendo, o sigue parado', async ({ page }) => {
        await page.clock.install();
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3, talkMinutes: 5 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);

        await page.clock.fastForward(120_000);
        await page.reload();
        await page.getByRole('button', { name: 'Seguir' }).tap();
        await expect(page.getByRole('timer')).toHaveText(/^(3:00|2:5\d)$/);

        await page.getByRole('button', { name: 'Parar' }).tap();
        const frozen = await page.getByRole('timer').textContent();
        await page.reload();
        await page.getByRole('button', { name: 'Seguir' }).tap();
        await expect(page.getByRole('timer')).toHaveText(frozen!);
        await expect(page.getByRole('button', { name: 'Seguir' })).toBeVisible();
    });

    test('si se acaba mientras alguien mantiene el botón, el gesto no se corta', async ({ page }) => {
        await page.clock.install();
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3, talkMinutes: 3 });
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        await playToTable(page, 3);

        await page.clock.fastForward(179_400);
        const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
        await expect(page.getByRole('heading', { name: /^Era el jugador \d$/ })).toBeVisible({ timeout: 4000 });
        await finger.release();
    });
});

test.describe('la pantalla encendida', () => {
    test.use({ locale: 'es-ES' });

    test('se pide al empezar, se vuelve a pedir al volver a la app y se suelta al terminar', async ({ page }) => {
        await page.addInitScript(() => {
            const lock = { requests: 0, releases: 0 };
            Object.assign(window, { pantalla: lock });
            Object.defineProperty(navigator, 'wakeLock', {
                value: {
                    request: async () => {
                        lock.requests += 1;
                        return {
                            release: async () => {
                                lock.releases += 1;
                            },
                        };
                    },
                },
            });
        });
        const lock = () => page.evaluate(() => (window as unknown as { pantalla: { requests: number; releases: number } }).pantalla);
        await fakeApi(page, () => fakeMovie(1, SECRET));
        await setSettings(page, { playerCount: 3 });
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible();
        expect((await lock()).requests).toBe(0);

        await page.getByRole('button', { name: 'Empezar' }).tap();
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        await expect.poll(async () => (await lock()).requests).toBe(1);

        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        await expect.poll(async () => (await lock()).requests).toBe(2);

        await page.getByRole('button', { name: 'Abandonar la partida' }).tap();
        await page.getByRole('button', { name: 'Abandonar', exact: true }).tap();
        await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible();
        await expect.poll(async () => (await lock()).releases).toBeGreaterThan(0);
    });
});
