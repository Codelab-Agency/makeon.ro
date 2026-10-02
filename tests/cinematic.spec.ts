import { test, expect } from '@playwright/test';

test('cinematic decoration pauses outside the viewport and remains static with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const ecosystem = page.locator('.ecosystem');
  const orbit = ecosystem.locator(':scope > .ambient-orbit svg');
  await ecosystem.scrollIntoViewIfNeeded();
  await expect(orbit).toHaveCSS('animation-play-state', 'running');
  const first = await orbit.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => orbit.evaluate(el => getComputedStyle(el).transform)).not.toBe(first);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(orbit).toHaveCSS('animation-play-state', 'paused');
  const paused = await orbit.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(150);
  expect(await orbit.evaluate(el => getComputedStyle(el).transform)).toBe(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ecosystem.scrollIntoViewIfNeeded();
  await expect(orbit).toHaveCSS('animation-name', 'none');
  expect(await page.locator('.element-scene canvas').count()).toBe(1);
  expect(await page.locator('.ecosystem canvas, .solutions canvas, .service-studio canvas, .closing canvas').count()).toBe(0);
});

test('coffee and water retain their brand colors while cinematic surfaces follow the selected world', async ({ page }) => {
  await page.goto('/');
  const cardColors = await page.locator('.brand-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor));
  const initial = await page.locator('.ecosystem').evaluate(el => getComputedStyle(el).backgroundColor);
  await page.locator('.business-switch button').nth(1).click();
  expect(await page.locator('.brand-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor))).toEqual(cardColors);
  expect(await page.locator('.ecosystem').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(initial);
  for (const selector of ['.ecosystem', '.service-studio', '.business', '.closing']) {
    expect(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(7, 21, 29)');
  }
  await page.goto('/cafea');
  expect(await page.locator('.coffee-shop').evaluate(el => getComputedStyle(el).color)).toBe('rgb(59, 45, 37)');
});
