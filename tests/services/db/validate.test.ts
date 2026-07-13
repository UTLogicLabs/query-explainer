import { describe, expect, it } from "vitest";
import { assertReadOnlySelect } from "~/services/db/validate";
import { ExplainError } from "~/services/db/types";

describe("assertReadOnlySelect", () => {
  it("allows a simple SELECT", () => {
    expect(() => assertReadOnlySelect("SELECT * FROM orders")).not.toThrow();
  });

  it("allows a WITH ... SELECT", () => {
    expect(() =>
      assertReadOnlySelect("WITH recent AS (SELECT 1) SELECT * FROM recent")
    ).not.toThrow();
  });

  it("allows a trailing semicolon", () => {
    expect(() => assertReadOnlySelect("SELECT 1;")).not.toThrow();
  });

  it("rejects an empty query", () => {
    expect(() => assertReadOnlySelect("   ")).toThrow(ExplainError);
  });

  it("rejects multiple statements", () => {
    expect(() =>
      assertReadOnlySelect("SELECT 1; DROP TABLE orders;")
    ).toThrow(ExplainError);
  });

  it("rejects statements that don't start with SELECT/WITH", () => {
    expect(() => assertReadOnlySelect("DELETE FROM orders")).toThrow(
      ExplainError
    );
  });

  it("rejects a SELECT containing a write keyword", () => {
    expect(() =>
      assertReadOnlySelect("SELECT * FROM orders WHERE 1=1 OR EXECUTE(1)")
    ).toThrow(ExplainError);
  });

  it("does not false-positive on words containing forbidden substrings", () => {
    expect(() =>
      assertReadOnlySelect("SELECT * FROM orders WHERE status = 'created'")
    ).not.toThrow();
  });
});
