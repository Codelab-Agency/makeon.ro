import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test('hero morphs automatically without controls and leaves the page theme unchanged', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/api/catalog', route => route.fulfill({ json: { products: coffeeProducts, managed: false, checkout: false, shippingBani: 0 } }));
  await page.goto('/');
  const scene = page.locator('.hero .element-scene');
  await expect(scene.locator('canvas')).toBeVisible();
  await expect(scene).toHaveAttribute('data-morph', '0.000');
  const hero = page.locator('.hero');
  const initialBackground = await hero.evaluate(el => getComputedStyle(el).backgroundColor);
  const initialHeader = await page.locator('.site > header').evaluate(el => getComputedStyle(el).backgroundColor);
  await page.waitForTimeout(1000);
  await expect(scene).toHaveAttribute('data-morph', '0.000');
  await expect.poll(async () => Number(await scene.getAttribute('data-morph')), { timeout: 15000 }).toBeGreaterThan(.95);
  await expect(page.locator('.site')).toHaveClass(/world-coffee/);
  expect(await hero.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(initialBackground);
  expect(await page.locator('.site > header').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(initialHeader);
  await expect(page.locator('.hero-animation-control')).toHaveCount(0);
  await expect.poll(async () => Number(await scene.getAttribute('data-morph')), { timeout: 15000 }).toBeLessThan(.05);
});
