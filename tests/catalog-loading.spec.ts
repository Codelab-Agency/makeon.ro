import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

const product = { ...coffeeProducts[0], name: "Produs real", imageUrl: "/test-product.png" };
const catalog = { products: [product], managed: true, checkout: false, shippingBani: 0 };
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=", "base64");

test("waits for catalog data and photo without showing demo packaging", async ({ page }) => {
  let releaseData!: () => void;
  let releaseImage!: () => void;
  const dataReady = new Promise<void>(resolve => { releaseData = resolve; });
  const imageReady = new Promise<void>(resolve => { releaseImage = resolve; });
  await page.route("**/api/catalog", async route => { await dataReady; await route.fulfill({ json: catalog }); });
  await page.route("**/test-product.png", async route => { await imageReady; await route.fulfill({ body: pixel, contentType: "image/png" }); });
  await page.goto("/cafea", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toHaveText("Se încarcă produsele…");
  await expect(page.locator(".shop-product-card")).toHaveCount(0);
  releaseData();
  const card = page.locator(".shop-product-card");
  await expect(card).toHaveCount(1);
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".product-photo-loading")).toBeVisible();
  await expect(card.locator(".shop-pack")).toHaveCount(0);
  releaseImage();
  await expect(card.locator(".photo-loaded")).toBeVisible();
  await expect(card.locator(".product-photo-loading")).toHaveCount(0);
  await expect(card.getByRole("heading")).toHaveText("Produs real");
});

test("first catalog failure offers retry instead of demo products", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/catalog", route => ++requests === 1
    ? route.fulfill({ status: 503, json: { error: "Unavailable" } })
    : route.fulfill({ json: { ...catalog, products: [{ ...product, imageUrl: undefined }] } }));
  await page.goto("/cafea");
  await expect(page.locator(".coffee-shop").getByRole("alert")).toContainText("Catalogul este temporar indisponibil.");
  await expect(page.locator(".shop-product-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Reîncearcă", exact: true }).click();
  await expect(page.locator(".shop-product-card")).toHaveCount(1);
  await expect(page.locator(".shop-product-card h3")).toHaveText("Produs real");
});

test("failed image leaves a clear placeholder without falling back to demo artwork", async ({ page }) => {
  await page.route("**/api/catalog", route => route.fulfill({ json: catalog }));
  await page.route("**/test-product.png", route => route.fulfill({ status: 404, body: "" }));
  await page.goto("/cafea");
  await page.locator(".shop-product-card").scrollIntoViewIfNeeded();
  await expect(page.locator(".product-photo-error")).toHaveText("Imagine indisponibilă");
  await expect(page.locator(".product-photo-loading, .shop-pack")).toHaveCount(0);
});
