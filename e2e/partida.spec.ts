import { expect, test, type Page } from '@playwright/test';
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

        // Al soltar, desaparece del todo y no se pasa el móvil. El clic fantasma del dedo no se ve en
        // WebKit, donde aquí se mantiene con ratón: lo cubre la prueba de «no deja ningún clic detrás».
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
    await expect(page.getByRole('heading', { name: 'Pistas, en este orden' })).toBeVisible();
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

test('el papel mide lo mismo con cualquier papel y no se lee desde lejos', async ({ page }) => {
    const roles = new Map<string, { size: number; cartel: string }>();
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();

    for (let player = 1; player <= 4; player++) {
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        const finger = await touchHold(page, TURN_SURFACE);
        const role = page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`));
        await expect(role).toBeVisible();
        await page.waitForTimeout(600);
        const size = await role.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
        const cartel = await role.evaluate((node) => {
            const card = node.closest('[data-cartel]')!;
            const box = card.getBoundingClientRect();
            const top = node.closest('p')!.getBoundingClientRect().top;
            return [box.x, box.y, box.width, box.height, getComputedStyle(card).backgroundColor, top].join();
        });
        roles.set((await role.textContent()) ?? '', { size, cartel });
        await finger.release();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /Pásale|Dejar el móvil/ }).tap();
    }

    const secret = roles.get(SECRET);
    const impostor = roles.get(IMPOSTOR_ROLE);
    expect(secret, 'alguien ve la película').toBeTruthy();
    expect(impostor, 'alguien es el impostor').toBeTruthy();
    expect(impostor).toEqual(secret);
    // A 30 px, un OCR ya lo lee a veces a 2,5 m simulados.
    expect(secret!.size).toBeLessThanOrEqual(28);
});

test('en una pantalla baja y con todas las pistas, el nombre y el cartel no dependen del papel', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 481 });
    await page.addInitScript(() => {
        localStorage.setItem('film-impostor-settings', JSON.stringify({ playerCount: 3, names: ['Ana', 'Ana', 'Ana'], hints: ['GENRE', 'YEAR', 'KEYWORDS'] }));
    });
    const long = 'El señor de los anillos: El retorno del rey';
    await fakeApi(page, () => ({ ...fakeMovie(1, long), keywords: ['elves', 'orcs', 'ring'] }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();

    const seen = new Map<string, string>();
    for (let player = 1; player <= 3; player++) {
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        const finger = await touchHold(page, TURN_SURFACE);
        await expect(page.locator('[data-cartel] p').first()).toBeVisible();
        await page.waitForTimeout(600);
        const measure = await page.evaluate(() => {
            const card = document.querySelector('[data-cartel]')!;
            const box = (node: Element) => {
                const { x, y, width, height } = node.getBoundingClientRect();
                return [x, y, width, height].join();
            };
            const bottom = Math.max(...[...card.querySelectorAll('p')].map((node) => node.getBoundingClientRect().bottom));
            return { role: card.querySelector('p')!.textContent!, boxes: `${box(card)}|${box(card.querySelector('h1')!)}`, overflow: bottom - card.getBoundingClientRect().bottom };
        });
        // Las pistas tienen que caber: el impostor no puede quedarse sin ellas.
        expect(measure.overflow, measure.role).toBeLessThanOrEqual(0);
        seen.set(measure.role.startsWith(IMPOSTOR_ROLE) ? 'impostor' : 'grupo', measure.boxes);
        await finger.release();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /Pásale|Dejar el móvil/ }).tap();
    }
    expect(seen.get('impostor')).toBeTruthy();
    expect(seen.get('impostor')).toEqual(seen.get('grupo'));
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

test('al soltar sobre el sitio donde aparece «Pasar el móvil» no se pasa solo', async ({ page, browserName }) => {
    // En WebKit no se puede dejar un dedo apoyado, y con ratón el clic nunca caería en el botón nuevo,
    // de modo que pasaría sin comprobar nada. Lo que sí se comprueba allí es la prueba siguiente.
    test.skip(browserName === 'webkit', 'Requiere mantener un dedo de verdad, y Playwright solo lo permite en Chromium');
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

test('un toque en la zona de mantener no deja ningún clic detrás, que es lo que evita el salto', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();

    const surface = page.locator(TURN_SURFACE);
    await expect(surface).toHaveCSS('touch-action', 'none');
    await page.evaluate(() => {
        const seen: string[] = [];
        Object.assign(window, { seen });
        for (const type of ['pointerdown', 'touchend', 'click']) document.addEventListener(type, () => seen.push(type), true);
    });

    await page.touchscreen.tap(180, 320);
    await expect(page.getByText('Mantén un momento más')).toBeVisible();
    await page.waitForTimeout(400);

    // El dedo tiene que haber llegado de verdad: sin esto, la prueba pasaría aunque no hubiera toque.
    const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
    expect(seen).toContain('pointerdown');
    expect(seen).toContain('touchend');
    expect(seen).not.toContain('click');
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

test.describe('la pista de género, con el grupo filtrando por Terror', () => {
    /** Va pasando el móvil hasta dar con el impostor, y devuelve lo que ve mientras mantiene. */
    async function impostorScreen(page: Page, genre: string | null) {
        await fakeApi(page, () => ({ ...fakeMovie(1, SECRET), genre }));
        await page.goto('/');
        await page.getByRole('button', { name: /De qué género/ }).tap();
        await page.getByRole('dialog', { name: 'De qué género' }).getByText('Terror').tap();
        await page.getByRole('button', { name: 'Un jugador menos' }).tap();
        await page.getByRole('button', { name: 'Empezar' }).tap();

        for (const player of [1, 2, 3]) {
            await expect(page.getByRole('heading', { level: 1 })).toContainText(`Jugador ${player}`);
            const finger = await touchHold(page, TURN_SURFACE);
            await expect(page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`))).toBeVisible();
            const text = await domText(page);
            await page.waitForTimeout(550);
            await finger.release();
            if (text.includes(IMPOSTOR_ROLE)) return text;
            await page.getByRole('button', { name: player === 3 ? 'Dejar el móvil en la mesa' : `Pásale el móvil al jugador ${player + 1}` }).tap();
        }
        throw new Error('Ningún jugador era el impostor');
    }

    test('otro género de la película se presenta como un añadido', async ({ page }) => {
        const text = await impostorScreen(page, 'Ciencia ficción');
        expect(text).toContain('También: Ciencia ficción');
    });

    test('sin otro género no hay línea de género, y dice que no hay pistas', async ({ page }) => {
        const text = await impostorScreen(page, null);
        expect(text).not.toContain('También');
        expect(text).not.toContain('Género:');
        expect(text).toContain('Sin pistas esta vez');
    });
});

test('si falla «Otra película», el aviso y sus salidas quedan a la vista en una pantalla pequeña', async ({ page }) => {
    let fail = false;
    await page.route('**/api/movies/random**', (route) => (fail ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: fakeMovie(1, SECRET) })));
    await page.goto('/');
    await page.getByRole('button', { name: 'Un jugador menos' }).tap();
    await page.getByRole('button', { name: 'Empezar' }).tap();

    for (const player of [1, 2, 3]) {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(`Jugador ${player}`);
        const finger = await touchHold(page, TURN_SURFACE);
        await page.waitForTimeout(600);
        await finger.release();
        await page.getByRole('button', { name: player === 3 ? 'Dejar el móvil en la mesa' : `Pásale el móvil al jugador ${player + 1}` }).tap();
    }
    const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
    await expect(page.getByRole('heading', { name: /^Era el jugador \d$/ })).toBeVisible({ timeout: 3000 });
    await finger.release();

    fail = true;
    await page.getByRole('button', { name: 'Otra película' }).tap();
    await expect(page.getByRole('button', { name: 'Jugar con la lista de reserva' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'English' })).toBeInViewport();
});

test('el botón de mantener se llena de verdad, y el texto no desaparece mientras tanto', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Requiere mantener un dedo de verdad');
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.addInitScript(() => {
        localStorage.setItem('film-impostor-settings', JSON.stringify({ playerCount: 3 }));
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    for (let player = 1; player <= 3; player++) {
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        const finger = await touchHold(page, TURN_SURFACE);
        await page.waitForTimeout(600);
        await finger.release();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /Pásale|Dejar el móvil/ }).tap();
    }
    const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
    // Si el nombre de la animación se pierde, el botón no da ninguna señal: por eso se mira que exista y que corra.
    const nombres = await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName));
    expect(nombres).toContain('llenar');
    // Lo que aún no se ha llenado sigue leyéndose: el texto de debajo no se confunde con el fondo del botón.
    const { color, fondo } = await page.locator('[data-texto]').evaluate((el) => ({
        color: getComputedStyle(el).color,
        fondo: getComputedStyle(el.parentElement!).backgroundColor,
    }));
    expect(color).not.toBe(fondo);
    await finger.release();
});

test('nada del papel se corta en el móvil más pequeño, ni con el título más largo ni con todas las pistas', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(() => {
        localStorage.setItem('film-impostor-settings', JSON.stringify({ playerCount: 7, twoImpostors: true, hints: ['GENRE', 'YEAR', 'KEYWORDS'] }));
    });
    const long = 'Doctor Strange en el multiverso de la locura: la película completa';
    await fakeApi(page, () => ({ ...fakeMovie(1, long), keywords: ['based on young adult novel', 'based on novel or book', 'post-apocalyptic future'] }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    const heights = new Set<number>();
    for (let player = 1; player <= 7; player++) {
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        const finger = await touchHold(page, TURN_SURFACE);
        await expect(page.getByText(/Tu papel/)).toBeVisible();
        const measure = await page.locator('[data-pieza]').evaluate((node) => ({
            height: node.getBoundingClientRect().height,
            spare: node.clientHeight - node.scrollHeight,
        }));
        expect(measure.spare, 'el papel cabe entero').toBeGreaterThanOrEqual(0);
        heights.add(measure.height);
        await page.waitForTimeout(600);
        await finger.release();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /Pásale|Dejar el móvil/ }).tap();
    }
    expect(heights.size, 'la pieza encendida mide lo mismo con cualquier papel').toBe(1);
});

test('el dedo sobre el texto del cartel también enseña el papel', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    const text = await page.getByText('Coge el móvil').boundingBox();
    const finger = await touchHold(page, TURN_SURFACE, { x: text!.x + 10, y: text!.y + text!.height / 2 });
    await expect(page.getByText('Tu papel', { exact: true })).toBeVisible();
    await finger.release();
});

/** Pasa a segundo plano y lee la página sin dejar que corra nada más: justo después, el navegador puede congelarla. */
const hideAndReadPage = (page: Page) =>
    page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        return document.documentElement.textContent ?? '';
    });

/** Juega hasta el resultado con 3 jugadores. */
async function playToResult(page: Page) {
    await page.getByRole('button', { name: 'Un jugador menos' }).tap();
    await page.getByRole('button', { name: 'Empezar' }).tap();
    for (const player of [1, 2, 3]) {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(`Jugador ${player}`);
        const finger = await touchHold(page, TURN_SURFACE);
        await page.waitForTimeout(600);
        await finger.release();
        await page.getByRole('button', { name: player === 3 ? 'Dejar el móvil en la mesa' : `Pásale el móvil al jugador ${player + 1}` }).tap();
    }
    const finger = await touchHold(page, 'button:has-text("Mantén para ver quién era")');
    await expect(page.getByRole('heading', { name: /^Era el jugador \d$/ })).toBeVisible({ timeout: 3000 });
    await finger.release();
}

test('«Cambiar ajustes» mientras se busca otra película se queda en los ajustes', async ({ page }) => {
    let answer = () => {};
    let slow = false;
    await page.route('**/api/movies/random**', async (route) => {
        if (slow) await new Promise<void>((resolve) => (answer = resolve));
        await route.fulfill({ json: fakeMovie(1, SECRET) });
    });
    await page.goto('/');
    await playToResult(page);

    slow = true;
    await page.getByRole('button', { name: 'Otra película' }).tap();
    await expect(page.getByRole('button', { name: 'Buscando película…' })).toBeVisible();
    await page.getByRole('button', { name: 'Cambiar ajustes' }).tap();
    await expect(page.getByRole('button', { name: 'Empezar' })).toBeEnabled();

    answer();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Empezar' })).toBeEnabled();
    await expect(page.getByText('Coge el móvil')).toBeHidden();
});

test('con la red colgada se deja de esperar y se ofrece la lista de reserva', async ({ page }) => {
    test.setTimeout(45_000);
    await page.route('**/api/movies/random**', () => {});
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByRole('button', { name: 'Buscando película…' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jugar con la lista de reserva' })).toBeVisible({ timeout: 25_000 });
});

test('el papel abierto con el botón para lectores de pantalla también se oculta en segundo plano', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await page.getByRole('button', { name: 'Mostrar mi papel sin mantener pulsado' }).evaluate((button: HTMLElement) => button.click());
    await expect(page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`))).toBeVisible();

    const text = await hideAndReadPage(page);
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(IMPOSTOR_ROLE);
});

test('con el dedo puesto, el papel sale de la página en el mismo instante en que pasa a segundo plano', async ({ page }) => {
    await fakeApi(page, () => fakeMovie(1, SECRET));
    await page.goto('/');
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByText('Coge el móvil')).toBeVisible();
    const finger = await touchHold(page, TURN_SURFACE);
    await expect(page.getByText(new RegExp(`${SECRET}|${IMPOSTOR_ROLE}`))).toBeVisible();

    const text = await hideAndReadPage(page);
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(IMPOSTOR_ROLE);
    await finger.release();
});
