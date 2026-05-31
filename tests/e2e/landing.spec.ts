import { test, expect } from "@playwright/test";

test("beranda menampilkan hero + section utama", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Rayakan hari bahagia/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pilihan Tema" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Harga yang Sederhana" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pertanyaan Umum" })).toBeVisible();
});

test("CTA Daftar mengarah ke /register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Daftar" }).first().click();
  await expect(page).toHaveURL(/\/register/);
});
