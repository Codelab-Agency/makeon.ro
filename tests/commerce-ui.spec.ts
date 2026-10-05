import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";
import { legal } from "../src/lib/legal";

test("managed catalog and shipping reach checkout; a stock conflict keeps the cart", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/catalog", (route) =>
    route.fulfill({
      json: {
        products: coffeeProducts.map((p) => ({ ...p, price: 49.99, stock: 5 })),
        managed: true,
        checkout: true,
        shippingBani: 2000,
      },
    }),
  );
  let requestItems: unknown;
  await page.route("**/api/checkout", async (route) => {
    requestItems = route.request().postDataJSON().items;
    await route.fulfill({
      status: 409,
      json: { error: "Stocul disponibil s-a schimbat." },
    });
  });
  await page.addInitScript(() =>
    localStorage.setItem(
      "makeon-coffee-cart-v1",
      JSON.stringify([{ slug: "intense", grind: "Boabe", quantity: 2 }]),
    ),
  );
  await page.goto("/cafea");
  await page
    .getByRole("button", { name: "Deschide coșul de cafea (2)" })
    .click();
  const cart = page.getByRole("dialog", { name: "Coșul de cafea" });
  await expect(cart).toContainText("119,98");
  await expect(cart.getByRole("button", { name: "Plătește prin Stripe" })).toBeDisabled();
  await cart.getByRole("checkbox").check();
  await cart.getByRole("button", { name: "Plătește prin Stripe" }).click();
  await expect(cart.getByRole("alert")).toHaveText(
    "Stocul disponibil s-a schimbat.",
  );
  await expect(cart.locator(".cart-line")).toHaveCount(1);
  expect(requestItems).toEqual([
    { slug: "intense", grind: "Boabe", quantity: 2 },
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("quantities exceeding stock open a made-to-order request instead of direct payment", async ({
  page,
}) => {
  await page.route("**/api/catalog", (route) =>
    route.fulfill({
      json: {
        products: coffeeProducts.map((p) => ({ ...p, price: 49.99, stock: 1 })),
        managed: true,
        checkout: true,
        shippingBani: 0,
      },
    }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "makeon-coffee-cart-v1",
      JSON.stringify([{ slug: "intense", grind: "Boabe", quantity: 2 }]),
    ),
  );
  await page.goto("/cafea");
  await page
    .getByRole("button", { name: "Deschide coșul de cafea (2)" })
    .click();
  await expect(
    page.getByRole("button", { name: "Plătește prin Stripe" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Înregistrează comanda" }),
  ).toBeVisible();
});

test("a mixed cart submits customer details and selections without immediate payment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/catalog", (route) =>
    route.fulfill({
      json: {
        products: coffeeProducts.map((p) => ({
          ...p,
          price: 50,
          stock: p.slug === "intense" ? 0 : 5,
        })),
        managed: true,
        checkout: true,
        shippingBani: 2000,
      },
    }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "makeon-coffee-cart-v1",
      JSON.stringify([
        { slug: "intense", grind: "Boabe", quantity: 2 },
        { slug: "noblesse", grind: "Boabe", quantity: 1 },
      ]),
    ),
  );
  let attempts = 0;
  const keys: string[] = [];
  await page.route("**/api/orders/request", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.phone).toBe("+40744123456");
    expect(body.termsAccepted).toBe(true);
    expect(body.legalVersion).toBe(legal.version);
    expect(body.items).toHaveLength(2);
    keys.push(body.key);
    await route.fulfill({
      status: ++attempts === 1 ? 502 : 200,
      json:
        attempts === 1
          ? { error: "Reîncearcă solicitarea." }
          : { reference: "MK-test" },
    });
  });
  await page.goto("/cafea");
  await page
    .getByRole("button", { name: "Deschide coșul de cafea (3)" })
    .click();
  const cart = page.getByRole("dialog", { name: "Coșul de cafea" });
  await cart.locator("#production-name").fill("Client test");
  await cart.locator("#production-phone").fill("+40744123456");
  await cart.locator("#production-email").fill("client@example.test");
  await expect(cart.getByRole("button", { name: "Înregistrează comanda" })).toBeDisabled();
  await cart.getByRole("checkbox").check();
  await cart.getByRole("button", { name: "Înregistrează comanda" }).click();
  await expect(cart.getByRole("alert")).toHaveText("Reîncearcă solicitarea.");
  await cart.getByRole("button", { name: "Înregistrează comanda" }).click();
  await expect(cart.getByRole("status")).toContainText(
    "Comanda a fost înregistrată",
  );
  expect(keys[0]).toBe(keys[1]);
  expect(await cart.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});
