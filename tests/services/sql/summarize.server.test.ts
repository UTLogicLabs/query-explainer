import { describe, expect, it } from "vitest";
import { summarizeQuery } from "~/services/sql/summarize.server";

describe("summarizeQuery", () => {
  it("describes a simple SELECT", () => {
    const summary = summarizeQuery("SELECT id, name FROM customers", "postgres");
    expect(summary).toEqual(["Selects id, name from `customers`."]);
  });

  it("describes SELECT * and a WHERE filter", () => {
    const summary = summarizeQuery(
      "SELECT * FROM orders WHERE customer_id = 1",
      "postgres"
    );
    expect(summary).toEqual([
      "Selects all columns from `orders`.",
      "Filters rows where `customer_id = 1`.",
    ]);
  });

  it("describes a join with its condition", () => {
    const summary = summarizeQuery(
      "SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id",
      "postgres"
    );
    expect(summary).toEqual([
      "Selects o.id, c.name from `orders` (as `o`).",
      "INNER JOINs to `customers` (as `c`) on `o.customer_id = c.id`.",
    ]);
  });

  it("describes an aggregation with GROUP BY and HAVING", () => {
    const summary = summarizeQuery(
      "SELECT department, COUNT(*) AS cnt FROM employees GROUP BY department HAVING COUNT(*) > 5",
      "postgres"
    );
    expect(summary).toEqual([
      "Selects department, COUNT(*) as cnt from `employees`.",
      "Computes COUNT(*) as cnt.",
      "Groups by `department`.",
      "Keeps only groups where `COUNT(*) > 5`.",
    ]);
  });

  it("describes ORDER BY and LIMIT", () => {
    const summary = summarizeQuery(
      "SELECT id FROM orders ORDER BY id DESC LIMIT 10",
      "postgres"
    );
    expect(summary).toEqual([
      "Selects id from `orders`.",
      "Orders results by `id DESC`.",
      "Limits the result to 10 rows.",
    ]);
  });

  it("describes a subquery in FROM", () => {
    const summary = summarizeQuery(
      "SELECT t.id FROM (SELECT id FROM orders) t",
      "postgres"
    );
    expect(summary[0]).toBe("Selects t.id from a subquery (as t).");
  });

  it("works against the mssql dialect", () => {
    const summary = summarizeQuery(
      "SELECT TOP 10 id FROM orders WHERE total > 100",
      "mssql"
    );
    expect(summary).toEqual([
      "Selects id from `orders`.",
      "Filters rows where `total > 100`.",
    ]);
  });

  it("works against the sqlite dialect", () => {
    const summary = summarizeQuery(
      "SELECT id FROM orders LIMIT 1",
      "sqlite"
    );
    expect(summary).toEqual([
      "Selects id from `orders`.",
      "Limits the result to 1 row.",
    ]);
  });
});
