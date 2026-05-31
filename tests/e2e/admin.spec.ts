import { test, expect } from "@playwright/test";

test("admin tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/admin/themes");
  await expect(page).toHaveURL(/\/login/);
});
