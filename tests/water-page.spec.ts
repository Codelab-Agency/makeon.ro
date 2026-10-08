import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/catalog", route => route.fulfill({ json: {
    products: coffeeProducts, managed: false, checkout: false, shippingBani: 0,
  } }));
});

for (const width of [320, 390, 430, 768, 1280]) {
  test(`water landing remains standalone at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/apa");
    await expect(page.locator(".site")).toHaveClass(/world-water/);
    await expect(page).toHaveTitle(/Vero Aqua/);
    await expect(page.locator(".world-switch, .mini-switch, .business-switch")).toHaveCount(0);
    await expect(page.locator("#ecosistem")).toHaveCount(0);
    await expect(page.locator(".scroll-cue")).toHaveAttribute("href", "#solutii");
    await expect(page.locator("#solutii")).toBeAttached();
    await expect(page.locator("#abonamente")).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    if (width < 621) {
      await page.locator(".menu-button").click();
      const menu = page.locator(".mobile-menu-dialog");
      await expect(menu).toBeVisible();
      await expect(menu.locator('a[href="/apa"]')).toBeVisible();
      await expect(menu.locator('a[href="/apa#solutii"]')).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).not.toBeVisible();
      await page.locator(".closing .primary-button").click();
    } else {
      const nav = page.locator(".desktop-nav");
      await expect(nav.locator('a[href="/apa"]')).toBeVisible();
      const navBox = await nav.boundingBox();
      const actionsBox = await page.locator(".header-actions").boundingBox();
      expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(actionsBox!.x);
      await page.locator(".offer-button").click();
    }
    const form = page.locator(".contact-dialog");
    await expect(form).toBeVisible();
    await expect(form).toContainText("Consultanță pentru filtrarea apei");
    expect(await form.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}

test("home retains its world switch and water link is available from the store", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site")).toHaveClass(/world-coffee/);
  await page.locator('.world-switch button').nth(1).click();
  await expect(page.locator(".site")).toHaveClass(/world-water/);
  await page.goto("/cafea");
  await expect(page.locator('.desktop-nav a[href="/apa"]')).toBeVisible();
  await page.locator('.desktop-nav a[href="/apa"]').click();
  await expect(page).toHaveURL(/\/apa$/);
  await expect(page.locator(".site")).toHaveClass(/world-water/);
});
