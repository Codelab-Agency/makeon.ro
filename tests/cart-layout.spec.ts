import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test('opening and closing the cart preserves page width and scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.route('**/api/catalog', route => route.fulfill({ json: {
    products: coffeeProducts, managed: false, checkout: false, shippingBani: 0,
  } }));
  await page.goto('/');
  // Explicit classic scrollbars also exercise the issue on overlay-scrollbar hosts.
  await page.addStyleTag({ content: 'html::-webkit-scrollbar { width: 18px; } html::-webkit-scrollbar-thumb { background: #888; }' });
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  const geometry = () => page.evaluate(() => ({
    bodyWidth: document.body.getBoundingClientRect().width,
    actionsRight: document.querySelector('.header-actions')!.getBoundingClientRect().right,
    scrollY,
  }));
  const before = await geometry();
  const trigger = page.getByRole('button', { name: /Deschide coșul de cafea/ });
  for (let i = 0; i < 2; i++) {
    const button = await trigger.boundingBox();
    // Click the visible sticky control without Playwright scrolling its flow box.
    await page.mouse.click(button!.x + button!.width / 2, button!.y + button!.height / 2);
    await expect(page.getByRole('dialog', { name: 'Coșul de cafea' })).toBeVisible();
    await expect.poll(geometry).toEqual(before);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Coșul de cafea' })).not.toBeVisible();
    await expect.poll(geometry).toEqual(before);
    await expect(trigger).toBeFocused();
  }
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});
