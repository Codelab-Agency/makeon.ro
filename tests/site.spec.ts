import { test, expect } from "@playwright/test";

test("the brand switch synchronizes solutions and FAQs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("cu o cafea.");
  await expect(page.getByRole("button", { name: "Lumea cafelei", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".coffee-shop")).toHaveCount(1);
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lumea apei", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".coffee-shop")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Puritate în fiecare pahar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ce include abonamentul Vero Aqua?" })).toHaveAttribute("aria-expanded", "true");
  await page.locator(".mini-switch").getByRole("button", { name: "Cafea", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lumea cafelei", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Cafea cu personalitate" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cum aleg aparatul potrivit pentru biroul meu?" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("offer dialog prepares a phone conversation and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".membership-card")).toHaveAttribute("data-service", "coffee");
  await expect(page.locator(".membership-card")).toContainText("personalizată");
  await expect(page.locator(".membership-card")).not.toContainText("31");
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await expect(page.locator(".membership-card")).toHaveAttribute("data-service", "water");
  await page.getByRole("button", { name: "Vreau această soluție" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#interest")).toContainText("Abonament Vero Aqua — 31 € + TVA/lună");
  await dialog.getByRole("combobox",{name:"Câți oameni sunt în echipă?"}).click();
  await dialog.getByRole("option",{name:"31–75 persoane",exact:true}).click();
  await dialog.getByRole("button", { name: "Pregătește discuția" }).click();
  await expect(dialog.getByRole("status")).toContainText("31–75 persoane");
  await expect(dialog.getByRole("link", { name: "+40 744 524 728" })).toHaveAttribute("href", "tel:+40744524728");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("mobile navigation and page fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Deschide meniul" }).click();
  await expect(page.getByRole("navigation", { name: "Navigație mobilă" })).toBeVisible();
  await page.getByRole("navigation", { name: "Navigație mobilă" }).getByRole("link", { name: "Soluții", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Navigație mobilă" })).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator(".element-scene")).toBeVisible();
  await expect(page.locator(".hero .world-switch")).toBeVisible();
});

test("Three.js morphs a coffee bean into water and keeps rendering after rapid switches", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", message => { if(message.type() === "error" && /shader|WebGL|THREE/.test(message.text())) errors.push(message.text()); });
  await page.goto("/");
  const scene=page.locator(".element-scene");
  await expect(scene).toHaveAttribute("data-engine", "three");
  await expect(scene).toHaveAttribute("aria-label", "Bob de cafea 3D animat, cu particule de aromă");
  await expect(scene.locator("canvas")).toBeVisible();
  await expect(scene).toHaveAttribute("data-morph", "0.000");
  const frame=Number(await scene.getAttribute("data-frame"));
  await expect.poll(async()=>Number(await scene.getAttribute("data-frame"))).toBeGreaterThan(frame+3);
  await page.getByRole("button", {name:"Lumea apei",exact:true}).click();
  await expect(page.locator(".world-curtain")).toHaveCSS("visibility", "visible");
  await expect.poll(async()=>Number(await scene.getAttribute("data-morph"))).toBeGreaterThan(.2);
  await expect(scene).toHaveAttribute("data-morph", "1.000");
  await expect(page.getByRole("heading",{level:1})).toContainText("să curgă.");
  await page.getByRole("button",{name:"Lumea cafelei",exact:true}).click();
  await page.getByRole("button",{name:"Lumea apei",exact:true}).click();
  await page.getByRole("button",{name:"Lumea cafelei",exact:true}).click();
  await expect(scene).toHaveAttribute("data-morph","0.000");
  await expect(page.locator(".world-curtain")).toHaveCSS("visibility","hidden");
  expect(errors).toEqual([]);
});

test("animations reveal the hero and sections during scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".hero-art")).toHaveCSS("opacity", "1");
  await page.locator("#ecosistem").scrollIntoViewIfNeeded();
  await expect(page.locator(".ecosystem-heading")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await expect(page.locator(".hero .primary-button")).toHaveCSS("opacity", "1");
  await page.locator("#abonamente").scrollIntoViewIfNeeded();
  await expect(page.locator(".membership-card")).toHaveCSS("opacity", "1");
});
