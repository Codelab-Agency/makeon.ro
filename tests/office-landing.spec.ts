import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/catalog", route => route.fulfill({ json: {
    products: coffeeProducts, managed: false, checkout: false, shippingBani: 0,
  } }));
});

for (const width of [320, 390, 430, 768, 1280]) {
  test(`office offer and shopping are distinct at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = page.locator(".hero");
    await expect(hero.locator(".hero-service-label")).toHaveText("Cafea și espressoare pentru birouri");
    await expect(hero.getByRole("link", { name: "Cumpără cafea" })).toHaveAttribute("href", "/cafea");
    await expect(page.locator('.product-beans').locator('..').getByRole('link', {name:'Vezi cafelele'})).toHaveAttribute('href','/cafea');
    expect(await page.evaluate(() => {
      const nodes = ['#ecosistem', '#abonamente', '#solutii', '#servicii', '#evenimente', '#magazin'].map(selector => document.querySelector(selector)!);
      return nodes.every((node, index) => index === 0 || !!(nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 621) {
      const primary = await hero.locator('.primary-button').boundingBox();
      expect(primary!.width).toBeGreaterThan(width * 0.85);
      const shop = await hero.locator('.hero-shop-link').boundingBox();
      expect(primary!.y + primary!.height).toBeLessThanOrEqual(shop!.y);
      const description = await hero.locator('.hero-description').boundingBox();
      const art = await hero.locator('.hero-art').boundingBox();
      expect(description!.y).toBeLessThan(art!.y);
    } else {
      const nav = await page.locator('.desktop-nav').boundingBox();
      const actions = await page.locator('.header-actions').boundingBox();
      expect(nav!.x + nav!.width).toBeLessThanOrEqual(actions!.x);
    }
    await hero.getByRole('button', {name:'Solicită ofertă pentru birou'}).click();
    await expect(page.locator('.contact-dialog #interest')).toContainText('Abonament de cafea');
    await page.keyboard.press('Escape');
    await hero.getByRole('button', {name:'Lumea apei', exact:true}).click();
    await expect(page.locator('.site')).toHaveClass(/world-water/);
    await expect(hero.locator('.hero-service-label')).toHaveCount(0);
    await expect(hero.getByRole('link', {name:'Descoperă lumea apei'})).toHaveAttribute('href','#solutii');
  });
}

for (const width of [390, 1280]) {
  test(`hero actions stay visible after animations and world changes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const actions = page.locator('.hero-actions');
    // Check the settled state: overlapping entrance tweens used to hide these again.
    await page.waitForTimeout(2200);
    await expect(actions).toHaveCSS('opacity', '1');
    await expect(actions).toHaveCSS('filter', 'blur(0px)');
    await expect(actions.getByRole('button')).toBeVisible();
    await expect(actions.getByRole('link')).toBeVisible();
    await page.locator('.world-switch button').nth(1).click();
    await page.waitForTimeout(1800);
    await expect(actions).toHaveCSS('opacity', '1');
    await expect(page.locator('#evenimente')).toHaveCount(0);
    await page.locator('.world-switch button').nth(0).click();
    await page.waitForTimeout(1800);
    await expect(actions).toHaveCSS('opacity', '1');
    await expect(actions.getByRole('button')).toBeVisible();
    await expect(page.locator('#evenimente')).toBeAttached();
  });
}
