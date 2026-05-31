import { test, expect } from "@playwright/test";

test("undangan demo render dengan section inti", async ({ page }) => {
  await page.goto("/andi-dan-sari");
  await expect(page.getByText("The Wedding Of", { exact: false })).toBeVisible();
  await expect(page.getByText("Acara", { exact: false }).first()).toBeVisible();
});

test("nama tamu dari ?to tampil", async ({ page }) => {
  await page.goto("/andi-dan-sari?to=Budi");
  await expect(page.getByText("Budi", { exact: false })).toBeVisible();
});

test("slug tidak dikenal -> 404", async ({ page }) => {
  const res = await page.goto("/slug-tidak-ada-xyz");
  expect(res?.status()).toBe(404);
});
