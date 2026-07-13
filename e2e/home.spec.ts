import { expect, test } from "@playwright/test";

test("landing page renders the title and placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Query Explainer" })).toBeVisible();
  await expect(page.getByText(/query form is coming in the next stage/i)).toBeVisible();
});
