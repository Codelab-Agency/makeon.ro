import { test, expect } from "@playwright/test";

test("services change with the world, support keyboard navigation and prepare the selected request", async ({
  page,
}) => {
  await page.goto("/");
  const studio = page.locator("#servicii");
  await studio.getByRole("tab", { name: "Blendul care te reprezintă" }).click();
  await expect(studio.getByRole("tabpanel")).toContainText(
    "formulă personalizată",
  );
  await page.keyboard.press("ArrowDown");
  await expect(
    studio.getByRole("tab", { name: "Espresso sau slow mornings?" }),
  ).toBeFocused();
  await expect(studio.getByRole("tabpanel")).toContainText(
    "V60, Chemex sau AeroPress",
  );
  await studio
    .getByRole("button", { name: "Ajută-mă să aleg cafeaua" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("#interest")).toContainText(
    "Cafea pentru espresso sau filtru",
  );
  const whatsapp = dialog.getByRole("link", { name: "Preferi WhatsApp?" });
  const href = await whatsapp.getAttribute("href");
  expect(href).toContain("https://wa.me/40744524728?text=");
  expect(decodeURIComponent(href!)).toContain(
    "Cafea pentru espresso sau filtru",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await expect(
    studio.getByRole("tab", { name: "Grijă care continuă" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(studio.getByRole("tabpanel")).toContainText(
    "intervalele și costurile se stabilesc în ofertă",
  );
  await studio.getByRole("tab", { name: "Apa bună face cafeaua bună" }).click();
  await expect(studio.getByRole("tabpanel")).toContainText("espressoarelor");
  await page.setViewportSize({ width: 390, height: 844 });
  await studio.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("process illustrations animate on screen and pause off screen; reduced motion remains static", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const studio = page.locator("#servicii"),
    drum = studio.locator(".studio-drum");
  await studio.scrollIntoViewIfNeeded();
  await expect(studio).toHaveClass(/motion-visible/);
  await expect(studio.locator(".studio-diagram")).toHaveCSS("opacity", "1");
  const initial = await drum.getAttribute("transform");
  await expect.poll(() => drum.getAttribute("transform")).not.toBe(initial);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(studio).not.toHaveClass(/motion-visible/);
  const paused = await drum.getAttribute("transform");
  await page.waitForTimeout(200);
  expect(await drum.getAttribute("transform")).toBe(paused);
  await page.getByRole("button", { name: "Lumea apei", exact: true }).click();
  await studio.scrollIntoViewIfNeeded();
  await expect(studio).toHaveClass(/motion-visible/);
  const flow = studio.locator(".studio-flow"),
    offset = await flow.getAttribute("style");
  await expect.poll(() => flow.getAttribute("style")).not.toBe(offset);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await studio.scrollIntoViewIfNeeded();
  const still = await drum.getAttribute("transform");
  await page.waitForTimeout(200);
  expect(await drum.getAttribute("transform")).toBe(still);
  expect(errors).toEqual([]);
});
