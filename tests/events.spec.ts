import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";
import { eventServices } from "../src/lib/service-options";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/catalog", route => route.fulfill({ json: {
    products: coffeeProducts, managed: false, checkout: false, shippingBani: 0,
  } }));
});

for (const width of [320, 390, 430, 768, 1280]) {
  test(`event formats and enquiry fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const section = page.locator('#evenimente');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('article')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const [index, service] of Object.values(eventServices).entries()) {
      await section.locator('article').nth(index).getByRole('button').click();
      const form = page.locator('.contact-dialog');
      await expect(form.locator('#interest')).toContainText(service);
      await expect(form.getByText('Câți invitați estimezi?', { exact: true })).toBeVisible();
      await expect(form.locator('#contact-message')).toHaveAttribute('placeholder', /Data evenimentului/);
      expect(await form.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.keyboard.press('Escape');
    }
  });
}

test('event request carries the selected setup and details without sending a real email', async ({ page }) => {
  let request: Record<string, string> | undefined;
  await page.route('**/api/contact', async route => {
    request = route.request().postDataJSON();
    await route.fulfill({json:{ok:true}});
  });
  await page.goto('/');
  await page.locator('#evenimente article').nth(1).getByRole('button').click();
  await page.locator('#contact-name').fill('Client eveniment');
  await page.locator('#contact-email').fill('event@example.test');
  await page.locator('#contact-message').fill('15 noiembrie, Brașov, 30 de invitați');
  await page.locator('.contact-dialog button[type="submit"]').click();
  await expect(page.locator('.contact-summary')).toContainText('Solicitarea a fost trimisă.');
  expect(request?.interest).toBe(eventServices.bar);
  expect(request?.message).toContain('Brașov');
  await page.keyboard.press('Escape');
  await page.locator('.world-switch button').nth(1).click();
  await expect(page.locator('#evenimente')).toHaveCount(0);
  await page.locator('.world-switch button').nth(0).click();
  await expect(page.locator('#evenimente')).toBeAttached();
  await page.goto('/apa');
  await expect(page.locator('#evenimente')).toHaveCount(0);
});
