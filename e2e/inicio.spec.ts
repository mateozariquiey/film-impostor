import { expect, test } from '@playwright/test';
import { expectNoSideScroll, fakeApi, fakeMovie } from './helpers';

const noScroll = async (page: import('@playwright/test').Page) => {
    await expectNoSideScroll(page);
    const extra = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(extra, 'scroll vertical en el inicio').toBeLessThanOrEqual(0);
};

test.describe('en español', () => {
    test.use({ locale: 'es-ES' });

    test('el inicio cabe sin scroll en 360×640, con los valores más largos', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible();
        await noScroll(page);

        await page.evaluate(() =>
            localStorage.setItem(
                'film-impostor-settings',
                JSON.stringify({ playerCount: 12, popularity: 'CLASSICS', genre: 878, hints: ['GENRE', 'YEAR', 'KEYWORDS'] }),
            ),
        );
        await page.reload();
        await expect(page.getByRole('button', { name: /De qué género.*Ciencia ficción/ })).toBeVisible();
        await noScroll(page);
    });

    test('la hoja de género filtra de verdad, se recuerda y se recorre con el dedo', async ({ page }) => {
        const requests = await fakeApi(page, () => fakeMovie(1, 'Alien'));
        await page.goto('/');

        const row = page.getByRole('button', { name: /De qué género/ });
        await expect(row).toContainText('Cualquiera');
        await row.tap();
        const sheet = page.getByRole('dialog', { name: 'De qué género' });
        await expect(sheet).toBeVisible();

        // Hay más géneros de los que caben: la hoja se desplaza y su botón sigue al alcance.
        const scrolls = await sheet.evaluate((element) => element.scrollHeight > element.clientHeight);
        expect(scrolls).toBe(true);
        await expect(sheet.getByText('Película de TV')).toHaveCount(0);

        await sheet.getByText('Western').tap();
        await expect(sheet).toBeHidden();
        await expect(row).toContainText('Western');

        await page.reload();
        await expect(row).toContainText('Western');

        await page.getByRole('button', { name: 'Empezar' }).tap();
        await expect(page.getByText('Coge el móvil')).toBeVisible();
        expect(requests[0].searchParams.get('genre')).toBe('37');
        expect(requests[0].searchParams.get('lang')).toBe('es');
    });

    test('«Cómo se juega» cuenta cómo instalarla y se puede cerrar en pantalla pequeña', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Cómo se juega' }).tap();
        const sheet = page.getByRole('dialog', { name: 'Cómo se juega' });
        // No cabe entera: se abre por el principio, no donde esté el primer enlace.
        await expect(sheet.getByRole('heading', { name: 'Cómo se juega' })).toBeInViewport();
        await expect(sheet.getByRole('heading', { name: 'Instalarla' })).toBeVisible();
        await expect(sheet.getByText('Añadir a pantalla de inicio').first()).toBeVisible();
        await sheet.getByRole('button', { name: 'Entendido' }).tap();
        await expect(sheet).toBeHidden();
    });

    test('quien ya la tiene instalada no ve cómo instalarla', async ({ page }) => {
        await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
        await page.goto('/');
        await page.getByRole('button', { name: 'Cómo se juega' }).tap();
        const sheet = page.getByRole('dialog', { name: 'Cómo se juega' });
        await expect(sheet.getByRole('button', { name: 'Entendido' })).toBeVisible();
        await expect(sheet.getByRole('heading', { name: 'Instalarla' })).toHaveCount(0);
    });

    test('deslizar el dedo por la hoja la desplaza sin elegir nada, y el teclado la recorre sin cerrarla', async ({ page }) => {
        await page.goto('/');
        const row = page.getByRole('button', { name: /De qué género/ });
        await row.tap();
        const sheet = page.getByRole('dialog', { name: 'De qué género' });
        await expect(sheet).toBeVisible();
        await page.waitForTimeout(300);

        const box = await sheet.boundingBox();
        const x = box!.x + box!.width / 2;
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: 500 }] });
        for (let y = 480; y >= 200; y -= 20) {
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        }
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(() => sheet.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('radio', { name: 'Cualquiera' })).toBeChecked();

        await sheet.getByRole('radio', { name: 'Cualquiera' }).focus();
        await page.keyboard.press('ArrowDown');
        await expect(sheet.getByRole('radio', { name: 'Acción' })).toBeChecked();
        await expect(sheet).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(row).toContainText('Acción');
    });

    test('si no hay películas con esos filtros lo dice, y se puede cambiar el género', async ({ page }) => {
        await page.route('**/api/movies/random**', (route) => route.fulfill({ status: 404, json: {} }));
        await page.goto('/');
        await page.getByRole('button', { name: 'Empezar' }).tap();
        const message = page.getByText('Prueba con otra época o género.');
        await expect(message).toBeVisible();
        await page.getByRole('button', { name: /De qué género/ }).tap();
        await page.getByRole('dialog', { name: 'De qué género' }).getByText('Comedia').tap();
        await expect(message).toHaveCount(0);
    });
});

test.describe('en inglés', () => {
    test.use({ locale: 'en-US' });

    test('sigue al navegador y el inicio también cabe sin scroll', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page).toHaveURL(/\/en$/);
        await noScroll(page);

        await page.evaluate(() =>
            localStorage.setItem(
                'film-impostor-settings',
                JSON.stringify({ playerCount: 12, popularity: 'TOP_500', genre: 878, hints: ['GENRE', 'YEAR', 'KEYWORDS'] }),
            ),
        );
        await page.reload();
        await expect(page.getByRole('button', { name: /What genre.*Science Fiction/ })).toBeVisible();
        await noScroll(page);
    });
});
