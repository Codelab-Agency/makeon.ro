import { test, expect } from "@playwright/test";

for (const width of [320, 390, 430])
  test(`contact form fits ${width}px and retains inputs after failure`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    let attempts = 0;
    const ids: string[] = [];
    await page.route("**/api/contact", async (route) => {
      const body = route.request().postDataJSON();
      ids.push(body.requestId);
      expect(body.email).toBe("client@example.com");
      attempts++;
      await route.fulfill({
        status: attempts === 1 ? 502 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          attempts === 1
            ? { error: "Trimiterea a eșuat. Încearcă din nou." }
            : { ok: true },
        ),
      });
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Găsim soluția potrivită", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#contact-name").fill("Client Test");
    await dialog.locator("#contact-email").fill("client@example.com");
    await dialog
      .locator("#contact-message")
      .fill("O ofertă pentru echipa noastră.");
    await dialog
      .getByRole("button", { name: "Solicită o ofertă", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("Trimiterea a eșuat");
    await expect(dialog.locator("#contact-email")).toHaveValue(
      "client@example.com",
    );
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await dialog
      .getByRole("button", { name: "Solicită o ofertă", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText(
      "Solicitarea a fost trimisă",
    );
    expect(ids[0]).toBe(ids[1]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
