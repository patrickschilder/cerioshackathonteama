import { expect, test } from "@playwright/test";

test("instructor sees the course list after logging in", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "Cursussen beheren" })).toBeVisible();
});
