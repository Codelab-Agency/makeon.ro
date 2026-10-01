import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
  recordVideo: { dir: "artifacts/video", size: { width: 1440, height: 1000 } },
});
try {
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.locator(".element-scene canvas").waitFor();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await page.waitForTimeout(3200);
  await page.getByRole("button", { name: "Lumea cafelei", exact: true }).click();
  await page.waitForTimeout(3000);
  const video = page.video();
  await context.close();
  await video.saveAs("artifacts/makeon-metamorphosis.webm");
  console.log("Saved artifacts/makeon-metamorphosis.webm");
} finally { await context.close(); await browser.close(); }
