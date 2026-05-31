import { test, expect } from "@playwright/test";

test("/dashboard/invitation/create tanpa login redirect ke /login", async ({ page }) => {
  await page.goto("/dashboard/invitation/create");
  await expect(page).toHaveURL(/\/login/);
});

test("/tema/minimalis-01 render 'The Wedding Of'", async ({ page }) => {
  await page.goto("/tema/minimalis-01");
  await expect(page.getByText("The Wedding Of", { exact: false })).toBeVisible();
});
