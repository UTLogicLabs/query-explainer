import { describe, expect, it } from "vitest";
import { exprToString } from "~/services/sql/expr";

describe("exprToString", () => {
  it("renders a column reference with a table qualifier", () => {
    expect(
      exprToString({ type: "column_ref", table: "o", column: { expr: { value: "id" } } })
    ).toBe("o.id");
  });

  it("renders a column reference without a table qualifier", () => {
    expect(
      exprToString({ type: "column_ref", table: null, column: { expr: { value: "id" } } })
    ).toBe("id");
  });

  it("renders numbers, strings, booleans, and null", () => {
    expect(exprToString({ type: "number", value: 42 })).toBe("42");
    expect(exprToString({ type: "single_quote_string", value: "abc" })).toBe("'abc'");
    expect(exprToString({ type: "bool", value: true })).toBe("true");
    expect(exprToString({ type: "null" })).toBe("NULL");
  });

  it("renders a binary expression", () => {
    expect(
      exprToString({
        type: "binary_expr",
        operator: "=",
        left: { type: "column_ref", table: null, column: { expr: { value: "id" } } },
        right: { type: "number", value: 1 },
      })
    ).toBe("id = 1");
  });

  it("renders an aggregate function call", () => {
    expect(
      exprToString({
        type: "aggr_func",
        name: "COUNT",
        args: { expr: { type: "star", value: "*" } },
      })
    ).toBe("COUNT(*)");
  });

  it("returns an empty string for null/undefined input", () => {
    expect(exprToString(null)).toBe("");
    expect(exprToString(undefined)).toBe("");
  });

  it("renders a scalar subquery as a placeholder instead of blank text", () => {
    expect(exprToString({ ast: { type: "select" }, parentheses: true })).toBe(
      "(subquery)"
    );
  });
});
