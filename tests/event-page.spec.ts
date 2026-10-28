import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({ json: { products: coffeeProducts, managed: false, checkout: false, shippingBani: 0 } }));
});

for (const width of [320, 390, 768, 1440]) {
  test(`events page supports both formats and the matching enquiry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/evenimente');
    await expect(page).toHaveTitle(/Evenimentul tău/);
    await expect(page.locator('h1')).toContainText('Momente memorabile.');
    await expect.poll(() => page.locator('.occasion-hero-image img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    const picker = page.getByRole('group', { name: 'Alege formatul evenimentului' });
    await picker.getByRole('button', { name: 'Barul de interior' }).click();
    await expect(page.locator('.occasion-format-layout')).toHaveClass(/format-bar/);
    await page.getByRole('button', { name: 'Solicită ofertă pentru barul mobil' }).click();
    const dialog = page.locator('.contact-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#interest')).toContainText('Evenimente private — bar mobil');
    await expect(dialog.getByLabel('Câți invitați estimezi?')).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await picker.getByRole('button', { name: 'Rulota de cafea' }).click();
    await page.getByRole('button', { name: 'Solicită ofertă pentru rulotă' }).click();
    await expect(dialog.locator('#interest')).toContainText('Evenimente private — rulotă');
    await page.keyboard.press('Escape');
    await page.getByText('Ce trebuie să vă spun pentru o ofertă?', { exact: true }).click();
    await expect(page.locator('details[open]')).toContainText('Data, localitatea');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('navigation opens the dedicated page and motion respects the preference', async ({ page }) => {
  await page.goto('/cafea');
  await page.locator('.desktop-nav').getByRole('link', { name: 'Evenimentul tău' }).click();
  await expect(page).toHaveURL(/\/evenimente$/);
  await expect(page.locator('.occasion-hero-copy')).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.occasion-page')).toHaveAttribute('data-motion', 'true');
  await page.locator('.occasion-format-heading').scrollIntoViewIfNeeded();
  await expect(page.locator('.occasion-format-heading')).toHaveAttribute('data-visible', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.occasion-page')).toHaveAttribute('data-motion', 'false');
  await expect(page.locator('.occasion-format-heading')).toHaveCSS('opacity', '1');
});
