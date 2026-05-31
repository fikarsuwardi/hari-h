import { test, expect } from "@playwright/test";

test("tamu kirim RSVP di undangan demo lalu muncul di buku tamu", async ({ page }) => {
  const nama = `Tamu ${Date.now()}`;
  await page.goto("/andi-dan-sari");
  await page.getByPlaceholder("Nama Anda").fill(nama);
  await page.getByPlaceholder("Ucapan & doa").fill("Selamat menempuh hidup baru!");
  await page.getByRole("button", { name: "Kirim" }).click();
  await expect(page.getByText("Ucapan Anda terkirim", { exact: false })).toBeVisible();
  await expect(page.getByText(nama, { exact: false })).toBeVisible();
});
