import { test, expect } from "@playwright/test";

test("/dashboard/reseller tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/dashboard/reseller");
  await expect(page).toHaveURL(/\/login/);
});

test("/admin/resellers tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/admin/resellers");
  await expect(page).toHaveURL(/\/login/);
});
