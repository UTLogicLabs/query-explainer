import { describe, expect, it } from "vitest";
import { normalizeSqlitePlan } from "~/services/plan/normalizeSqlite";

describe("normalizeSqlitePlan", () => {
  it("returns a single root node as-is", () => {
    const raw = [{ id: 2, parent: 0, notused: 0, detail: "SCAN orders" }];
    expect(normalizeSqlitePlan(raw)).toEqual({ label: "SCAN orders", children: [] });
  });

  it("wraps multiple top-level rows under a synthetic root", () => {
    const raw = [
      { id: 3, parent: 0, notused: 0, detail: "SCAN orders" },
      { id: 5, parent: 0, notused: 0, detail: "SCAN customers" },
    ];
    expect(normalizeSqlitePlan(raw)).toEqual({
      label: "Query plan",
      children: [
        { label: "SCAN orders", children: [] },
        { label: "SCAN customers", children: [] },
      ],
    });
  });

  it("builds parent/child relationships from the id/parent columns", () => {
    const raw = [
      { id: 1, parent: 0, notused: 0, detail: "SEARCH orders USING INDEX" },
      { id: 2, parent: 1, notused: 0, detail: "USE TEMP B-TREE FOR ORDER BY" },
    ];
    expect(normalizeSqlitePlan(raw)).toEqual({
      label: "SEARCH orders USING INDEX",
      children: [{ label: "USE TEMP B-TREE FOR ORDER BY", children: [] }],
    });
  });

  it("handles an empty result", () => {
    expect(normalizeSqlitePlan([])).toEqual({ label: "Query plan", children: [] });
  });
});
