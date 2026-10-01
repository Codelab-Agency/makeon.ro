import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts/video", { recursive: true });
const browser=await chromium.launch({channel:"chrome",headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"no-preference",recordVideo:{dir:"artifacts/video",size:{width:1440,height:1000}}});
try {
  const page=await context.newPage();
  await page.goto("http://127.0.0.1:3000",{waitUntil:"networkidle"});
  await page.locator("#ecosistem").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.locator("#servicii").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.getByRole("tab",{name:"Blendul care te reprezintă"}).click();
  await page.waitForTimeout(1500);
  await page.locator("#magazin").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator(".shop-product-art").first().hover();
  await page.waitForTimeout(1200);
  await page.locator(".mini-switch").getByRole("button",{name:"Apă",exact:true}).click();
  await page.waitForTimeout(1500);
  await page.locator("#servicii").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2300);
  await page.getByRole("tab",{name:"Grijă care continuă"}).click();
  await page.waitForTimeout(1800);
  await page.close();
  await page.video().saveAs("artifacts/makeon-services-animation.webm");
  console.log("Saved artifacts/makeon-services-animation.webm");
} finally {await context.close();await browser.close();}
