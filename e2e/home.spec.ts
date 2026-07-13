import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

let dbDir: string;
let dbPath: string;

test.beforeAll(() => {
  dbDir = mkdtempSync(join(tmpdir(), "query-explainer-e2e-"));
  dbPath = join(dbDir, "test.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER)");
  db.exec("INSERT INTO orders (customer_id) VALUES (1), (2)");
  db.close();
});

test.afterAll(() => {
  rmSync(dbDir, { recursive: true, force: true });
});

test("landing page renders the title and query form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Query Explainer" })).toBeVisible();
  await expect(page.getByLabel("SQL query")).toBeVisible();
});

test("running EXPLAIN against a real SQLite database renders the plan", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#dialect", "sqlite");
  await page.fill("#connectionString", dbPath);
  await page.fill("#sql", "SELECT * FROM orders WHERE customer_id = 1");
  await page.click('button:has-text("Run EXPLAIN")');

  await expect(page.getByText(/raw plan \(sqlite\)/i)).toBeVisible();
  await expect(page.getByText(/SCAN orders/)).toBeVisible();
  await expect(page.getByText("Plain-English summary")).toBeVisible();
  await expect(page.getByText(/Selects all columns from `orders`/)).toBeVisible();
  await expect(page.getByText(/Filters rows where `customer_id = 1`/)).toBeVisible();
});

test("a rejected write statement surfaces an error", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#dialect", "sqlite");
  await page.fill("#connectionString", dbPath);
  await page.fill("#sql", "DELETE FROM orders");
  await page.click('button:has-text("Run EXPLAIN")');

  await expect(page.getByRole("alert")).toHaveText(
    "Only SELECT statements can be explained."
  );
});
