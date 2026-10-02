import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test('managed catalog and shipping reach checkout; a stock conflict keeps the cart', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/catalog', route => route.fulfill({ json: {
    products: coffeeProducts.map(p => ({ ...p, price: 49.99, stock: 5 })),
    managed: true, checkout: true, shippingBani: 2000,
  } }));
  let requestItems: unknown;
  await page.route('**/api/checkout', async route => {
    requestItems = route.request().postDataJSON().items;
    await route.fulfill({ status: 409, json: { error: 'Stocul disponibil s-a schimbat.' } });
  });
  await page.addInitScript(() => localStorage.setItem('makeon-coffee-cart-v1', JSON.stringify([
    { slug: 'intense', grind: 'Boabe', quantity: 2 },
  ])));
  await page.goto('/cafea');
  await page.getByRole('button', { name: 'Deschide coșul de cafea (2)' }).click();
  const cart = page.getByRole('dialog', { name: 'Coșul de cafea' });
  await expect(cart).toContainText('119,98');
  await cart.getByRole('button', { name: 'Plătește prin Stripe' }).click();
  await expect(cart.getByRole('alert')).toHaveText('Stocul disponibil s-a schimbat.');
  await expect(cart.locator('.cart-line')).toHaveCount(1);
  expect(requestItems).toEqual([{ slug: 'intense', grind: 'Boabe', quantity: 2 }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('checkout stays disabled when the requested quantity exceeds stock', async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({ json: {
    products: coffeeProducts.map(p => ({ ...p, price: 49.99, stock: 1 })),
    managed: true, checkout: true, shippingBani: 0,
  } }));
  await page.addInitScript(() => localStorage.setItem('makeon-coffee-cart-v1', JSON.stringify([
    { slug: 'intense', grind: 'Boabe', quantity: 2 },
  ])));
  await page.goto('/cafea');
  await page.getByRole('button', { name: 'Deschide coșul de cafea (2)' }).click();
  await expect(page.getByRole('button', { name: 'Plătește prin Stripe' })).toBeDisabled();
});
