import { expect, test } from "@playwright/test";

test("student sees their dashboard after logging in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /^Welkom,/ })).toBeVisible();
});
