import { test, expect } from '@playwright/test';

test('mobile brand illustrations leave room for text and fit inside their cards', async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    for (const selector of ['.coffee-brand', '.water-brand']) {
      const card = page.locator(selector);
      const boxes = await card.evaluate((el) => {
        const card = el.getBoundingClientRect();
        const copy = el.querySelector('p')!.getBoundingClientRect();
        const art = el.querySelector('.brand-art, .water-visual')!.getBoundingClientRect();
        return { left: art.left - card.left, right: card.right - art.right, gap: art.top - copy.bottom };
      });
      expect(boxes.left).toBeGreaterThanOrEqual(0);
      expect(boxes.right).toBeGreaterThanOrEqual(0);
      expect(boxes.gap).toBeGreaterThanOrEqual(12);
    }
    for (const world of ['coffee', 'water']) {
      if (world === 'water') await page.locator('.business-switch button').nth(1).click();
      const issues = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p,.studio-tabs button,.footer-brands,.business-switch')].filter(el => {
        if (el.closest('dialog:not([open]), [role="img"]')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
      }).map(el => el.className));
      expect(issues).toEqual([]);
    }
  }
});

test('mobile shop search and a populated cart have space for their controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/cafea');
  const search = await page.locator('.shop-search').boundingBox();
  const sort = await page.locator('.shop-sort').boundingBox();
  expect(sort!.y).toBeGreaterThanOrEqual(search!.y + search!.height);
  await page.goto('/cafea/kopi-luwak');
  await page.locator('.detail-add-row .primary-button').click();
  await page.locator('.cart-button').click();
  const drawer = page.locator('.cart-drawer');
  await expect(drawer).toBeVisible();
  const overflow = await drawer.evaluate(el => {
    const bounds = el.getBoundingClientRect();
    return [...el.querySelectorAll('.cart-line-copy, .cart-line-controls button, .cart-summary-total, .cart-phone')].filter(node => {
      const r = node.getBoundingClientRect();
      return r.right > bounds.right + 1 || r.left < bounds.left - 1;
    }).map(node => node.className);
  });
  expect(overflow).toEqual([]);
  await drawer.locator('.remove-line').click();
  await expect(drawer.locator('.empty-cart')).toBeVisible();
});
