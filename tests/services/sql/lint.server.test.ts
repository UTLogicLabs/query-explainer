import { describe, expect, it } from "vitest";
import { lintQuery } from "~/services/sql/lint.server";
import type { PlanNode } from "~/services/plan/types";

describe("lintQuery", () => {
  it("flags SELECT *", () => {
    const warnings = lintQuery("SELECT * FROM orders WHERE id = 1", "postgres");
    expect(warnings.some((w) => w.message.includes("SELECT *"))).toBe(true);
  });

  it("does not flag an explicit column list", () => {
    const warnings = lintQuery("SELECT id FROM orders WHERE id = 1", "postgres");
    expect(warnings.some((w) => w.message.includes("SELECT *"))).toBe(false);
  });

  it("flags a query with neither WHERE nor LIMIT", () => {
    const warnings = lintQuery("SELECT id FROM orders", "postgres");
    expect(warnings.some((w) => w.message.includes("No WHERE clause"))).toBe(true);
  });

  it("does not flag a query with a WHERE clause", () => {
    const warnings = lintQuery("SELECT id FROM orders WHERE id = 1", "postgres");
    expect(warnings.some((w) => w.message.includes("No WHERE clause"))).toBe(false);
  });

  it("does not flag a query with a LIMIT clause", () => {
    const warnings = lintQuery("SELECT id FROM orders LIMIT 10", "postgres");
    expect(warnings.some((w) => w.message.includes("No WHERE clause"))).toBe(false);
  });

  it("flags a scalar subquery in the SELECT list", () => {
    const warnings = lintQuery(
      "SELECT id, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS cnt FROM customers c",
      "postgres"
    );
    expect(warnings.some((w) => w.message.includes("N+1-shaped"))).toBe(true);
  });

  it("does not flag a query without a subquery", () => {
    const warnings = lintQuery("SELECT id FROM customers", "postgres");
    expect(warnings.some((w) => w.message.includes("N+1-shaped"))).toBe(false);
  });

  it("flags a full scan on a large table from the plan", () => {
    const plan: PlanNode = {
      label: "Seq Scan on orders",
      rows: 50000,
      children: [],
    };
    const warnings = lintQuery("SELECT id FROM orders WHERE status = 1", "postgres", plan);
    expect(warnings.some((w) => w.message.includes('Full scan ("Seq Scan on orders")'))).toBe(
      true
    );
  });

  it("does not flag a full scan on a small table", () => {
    const plan: PlanNode = { label: "Seq Scan on orders", rows: 10, children: [] };
    const warnings = lintQuery("SELECT id FROM orders WHERE status = 1", "postgres", plan);
    expect(warnings.some((w) => w.message.includes("Full scan"))).toBe(false);
  });

  it("does not flag an index scan", () => {
    const plan: PlanNode = {
      label: "Index Scan using orders_pkey",
      rows: 50000,
      children: [],
    };
    const warnings = lintQuery("SELECT id FROM orders WHERE id = 1", "postgres", plan);
    expect(warnings.some((w) => w.message.includes("Full scan"))).toBe(false);
  });

  it("returns no warnings for a clean, targeted query", () => {
    const plan: PlanNode = {
      label: "Index Scan using orders_pkey",
      rows: 1,
      children: [],
    };
    const warnings = lintQuery("SELECT id FROM orders WHERE id = 1", "postgres", plan);
    expect(warnings).toEqual([]);
  });
});
