import { describe, expect, it } from "vitest";
import { normalizePostgresPlan } from "~/services/plan/normalizePostgres";

describe("normalizePostgresPlan", () => {
  it("normalizes a nested plan with relation names and stats", () => {
    const raw = [
      {
        Plan: {
          "Node Type": "Hash Join",
          "Total Cost": 100,
          "Plan Rows": 50,
          "Actual Rows": 42,
          "Actual Total Time": 12.5,
          Plans: [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "orders",
              "Total Cost": 10,
              "Plan Rows": 100,
              "Actual Rows": 90,
              "Actual Total Time": 1.2,
            },
          ],
        },
      },
    ];

    expect(normalizePostgresPlan(raw)).toEqual({
      label: "Hash Join",
      costEstimate: 100,
      rows: 42,
      actualTimeMs: 12.5,
      children: [
        {
          label: "Seq Scan on orders",
          costEstimate: 10,
          rows: 90,
          actualTimeMs: 1.2,
          children: [],
        },
      ],
    });
  });

  it("falls back gracefully when there is no plan", () => {
    expect(normalizePostgresPlan([])).toEqual({ label: "Unknown plan", children: [] });
  });
});
