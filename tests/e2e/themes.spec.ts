import { test, expect } from "@playwright/test";

for (const key of ["minimalis-01", "elegan-01", "floral-01"]) {
  test(`tema ${key} preview render`, async ({ page }) => {
    await page.goto(`/tema/${key}`);
    await expect(page.getByText("Rama", { exact: false }).first()).toBeVisible();
  });
}
