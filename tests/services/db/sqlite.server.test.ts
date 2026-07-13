import { describe, expect, it, vi } from "vitest";
import { ExplainError } from "~/services/db/types";

const all = vi.fn();
const prepare = vi.fn().mockReturnValue({ all });
const close = vi.fn();

const DatabaseSync = vi.fn().mockImplementation(function () {
  return { prepare, close };
});

vi.mock("node:sqlite", () => ({
  DatabaseSync,
  default: { DatabaseSync },
}));

const { runSqliteExplain } = await import("~/services/db/sqlite.server");

describe("runSqliteExplain", () => {
  it("runs EXPLAIN QUERY PLAN and returns the rows", async () => {
    all.mockReturnValueOnce([
      { id: 0, parent: -1, notused: 0, detail: "SCAN orders" },
    ]);

    const result = await runSqliteExplain(":memory:", "SELECT * FROM orders");

    expect(prepare).toHaveBeenCalledWith(
      "EXPLAIN QUERY PLAN SELECT * FROM orders"
    );
    expect(result).toEqual({
      dialect: "sqlite",
      raw: [{ id: 0, parent: -1, notused: 0, detail: "SCAN orders" }],
    });
    expect(close).toHaveBeenCalled();
  });

  it("rejects non-SELECT statements before opening the database", async () => {
    await expect(
      runSqliteExplain(":memory:", "DELETE FROM orders")
    ).rejects.toThrow(ExplainError);
    expect(prepare).not.toHaveBeenCalled();
  });
});
