import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.locator(".element-scene").waitFor();
  await page.screenshot({ path: "artifacts/makeon-coffee-hero.png" });
  await page.screenshot({ path: "artifacts/makeon-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await page.screenshot({ path: "artifacts/makeon-water-hero.png" });
  await page.screenshot({ path: "artifacts/makeon-water.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/makeon-mobile-hero.png" });
  await page.screenshot({ path: "artifacts/makeon-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3000/cafea", { waitUntil: "networkidle" });
  await page.screenshot({ path: "artifacts/makeon-shop.png", fullPage: true });
  await page.goto("http://127.0.0.1:3000/cafea/etiopia", { waitUntil: "networkidle" });
  await page.screenshot({ path: "artifacts/makeon-product.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/makeon-product-mobile.png", fullPage: true });
  console.log("Saved desktop, water and mobile previews in artifacts/.");
} finally { await browser.close(); }
