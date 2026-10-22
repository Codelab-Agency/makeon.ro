import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

for (const width of [320, 518, 1440]) {
  test(`unavailable cart rows fit and cannot be ordered at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    const product = { ...coffeeProducts[0], price: 50, stock: 10 };
    await page.route("**/api/catalog", route => route.fulfill({ json: {
      products: [product], managed: true, checkout: true, shippingBani: 0,
    } }));
    await page.addInitScript(({ slug }) => localStorage.setItem("makeon-coffee-cart-v1", JSON.stringify([
      { slug: "removed-coffee", grind: "Boabe", quantity: 6 },
      { slug, grind: "Boabe", quantity: 1 },
    ])), { slug: product.slug });
    await page.goto("/");
    await page.getByRole("button", { name: "Deschide coșul de cafea (7)" }).click();
    const cart = page.getByRole("dialog", { name: "Coșul de cafea" });
    const row = cart.locator(".cart-line-unavailable");
    await expect(row).toContainText("removed coffee · 6 bucăți");
    expect(await row.evaluate(el => {
      const copy = el.querySelector(".cart-line-copy")!;
      return copy.getBoundingClientRect().width > el.clientWidth * .9 && el.scrollWidth <= el.clientWidth;
    })).toBe(true);
    await expect(cart.getByRole("button", { name: "Plătește prin Stripe" })).toHaveCount(0);
    await expect(cart.locator(".production-request-form")).toHaveCount(0);
    await cart.getByRole("button", { name: "Elimină din coș", exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(cart.getByRole("button", { name: "Plătește prin Stripe" })).toBeVisible();
    await expect(cart.locator(".cart-summary-total")).toContainText("50,00");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("makeon-coffee-cart-v1")!).length)).toBe(1);
  });
}

test("catalog failure preserves the selection and offers retry instead of a missing-product warning", async ({ page }) => {
  await page.route("**/api/catalog", route => route.fulfill({ status: 503, json: {} }));
  await page.addInitScript(() => localStorage.setItem("makeon-coffee-cart-v1", JSON.stringify([
    { slug: "saved-coffee", grind: "Boabe", quantity: 1 },
  ])));
  await page.goto("/");
  await page.getByRole("button", { name: "Deschide coșul de cafea (1)" }).click();
  const cart = page.getByRole("dialog", { name: "Coșul de cafea" });
  await expect(cart).toContainText("Selecția ta este păstrată.");
  await expect(cart.locator(".cart-line-unavailable")).toHaveCount(0);
  await expect(cart.getByRole("button", { name: "Reîncearcă verificarea" })).toBeVisible();
});
