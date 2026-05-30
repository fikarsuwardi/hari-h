import { test, expect } from "@playwright/test";

test("dashboard tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /Masuk/i })).toBeVisible();
});

test("halaman register tampil", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Daftar" })).toBeVisible();
});
