import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

const key = 'c206c460-6ca3-4c70-a9eb-b0309bc87f13';
const cart = [{ slug: 'intense', grind: 'Boabe', quantity: 1 }];
test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({ json: { products: coffeeProducts.map(p => ({ ...p, price: 49, stock: 5 })), managed: true, checkout: true, shippingBani: 2000 } }));
  await page.addInitScript(({ cart }) => localStorage.setItem('makeon-coffee-cart-v1', JSON.stringify(cart)), { cart });
});

test('browser Back from checkout cancels the reservation and keeps the cart', async ({ page }) => {
  let cancellations = 0;
  await page.route('**/api/checkout/cancel', async route => { cancellations++; expect(route.request().postDataJSON().key).toBe(key); await route.fulfill({ json: { cancelled: true } }); });
  await page.route('**/fake-stripe', route => route.fulfill({ contentType: 'text/html', body: '<h1>External checkout</h1>' }));
  await page.goto('/cafea');
  await expect(page.locator('.cart-button')).toBeVisible();
  await page.evaluate(({ key, cart }) => { sessionStorage.setItem('makeon-checkout-key', key); sessionStorage.setItem('makeon-checkout-cart', JSON.stringify(cart)); }, { key, cart });
  await page.goto('/fake-stripe');
  await page.goBack();
  await expect.poll(() => cancellations).toBeGreaterThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('makeon-checkout-key'))).toBe(null);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('makeon-coffee-cart-v1')!))).toEqual(cart);
});

test('a failed cancellation can be retried before starting a new payment', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/checkout/cancel', route => { attempts++; return route.fulfill(attempts === 1 ? { status: 502, json: { error: 'Temporary failure' } } : { json: { cancelled: true } }); });
  await page.addInitScript(key => sessionStorage.setItem('makeon-checkout-key', key), key);
  await page.goto('/cafea');
  await page.locator('.cart-button').click();
  await page.getByRole('button', { name: 'Reîncearcă eliberarea rezervării' }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('makeon-checkout-key'))).toBe(null);
  await expect(page.getByRole('button', { name: 'Reîncearcă eliberarea rezervării' })).not.toBeVisible();
});
