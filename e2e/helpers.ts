import { expect, type Page } from '@playwright/test';

export interface FakeMovie {
    id: number;
    title: string;
    genre: string;
    posterPath: string | null;
    releaseYear: string | null;
    keywords: string[];
}

export const fakeMovie = (id: number, title: string): FakeMovie => ({
    id,
    title,
    genre: 'Terror',
    posterPath: null,
    releaseYear: '1979',
    keywords: ['space'],
});

/** Sustituye a TMDB: la API de la app contesta lo que diga cada prueba. Devuelve las URL pedidas. */
export async function fakeApi(page: Page, movies: (url: URL) => FakeMovie): Promise<URL[]> {
    const requests: URL[] = [];
    await page.route('**/api/movies/random**', (route) => {
        const url = new URL(route.request().url());
        requests.push(url);
        return route.fulfill({ json: movies(url) });
    });
    return requests;
}

/**
 * Mantiene el dedo de verdad, con eventos táctiles del navegador: `tap` de Playwright suelta al
 * instante y un `click` de ratón no pasaría por el gesto que usa la gente.
 *
 * Playwright solo sabe mantener un dedo en Chromium, porque lo hace por CDP. En WebKit no hay forma de
 * dejarlo apoyado, así que se mantiene con el ratón: pasa por los mismos eventos de puntero y la misma
 * captura, en el motor de Safari, pero sin `touchstart`/`touchend` ni el sistema de gestos de iOS.
 */
export async function touchHold(page: Page, selector: string, at?: { x: number; y: number }) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error(`No se ve ${selector}`);
    const point = at ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    if (page.context().browser()?.browserType().name() === 'webkit') {
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
        return { release: () => page.mouse.up() };
    }

    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    return {
        release: async () => {
            await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await client.detach();
        },
    };
}

/** El texto completo de la página, también lo oculto: si un secreto está en el DOM, aquí se ve. */
export const domText = (page: Page) => page.evaluate(() => document.documentElement.textContent ?? '');

export async function expectNoSideScroll(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'scroll horizontal').toBeLessThanOrEqual(0);
}

export const TURN_SURFACE = '[aria-label="Mantén pulsado para ver tu papel"], [aria-label="Press and hold to see your role"]';
