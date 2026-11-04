import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US', serviceWorkers: 'allow' });

test('tras la primera visita abre sin red, en los dos idiomas, y se juega con la reserva', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).tap();
    await page.getByRole('button', { name: 'Play with the backup list' }).tap();
    await expect(page.getByText('Take the phone')).toBeVisible();
    await page.getByRole('button', { name: 'Quit the game' }).tap();
    await page.getByRole('button', { name: 'Quit', exact: true }).tap();

    await page.getByRole('button', { name: 'Español' }).tap();
    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible();
});
