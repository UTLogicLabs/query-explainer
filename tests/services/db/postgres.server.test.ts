import { describe, expect, it, vi } from "vitest";
import { ExplainError } from "~/services/db/types";

const connect = vi.fn();
const query = vi.fn();
const end = vi.fn();

vi.mock("pg", () => ({
  Client: vi.fn().mockImplementation(function () {
    return { connect, query, end };
  }),
}));

const { runPostgresExplain } = await import("~/services/db/postgres.server");

describe("runPostgresExplain", () => {
  it("runs EXPLAIN (ANALYZE, FORMAT JSON) and returns the plan", async () => {
    connect.mockResolvedValueOnce(undefined);
    query.mockResolvedValueOnce({
      rows: [{ "QUERY PLAN": [{ Plan: { "Node Type": "Seq Scan" } }] }],
    });
    end.mockResolvedValueOnce(undefined);

    const result = await runPostgresExplain(
      "postgres://localhost/db",
      "SELECT 1"
    );

    expect(query).toHaveBeenCalledWith(
      "EXPLAIN (ANALYZE, FORMAT JSON) SELECT 1"
    );
    expect(result).toEqual({
      dialect: "postgres",
      raw: [{ Plan: { "Node Type": "Seq Scan" } }],
    });
    expect(end).toHaveBeenCalled();
  });

  it("rejects non-SELECT statements before connecting", async () => {
    await expect(
      runPostgresExplain("postgres://localhost/db", "DELETE FROM orders")
    ).rejects.toThrow(ExplainError);
    expect(connect).not.toHaveBeenCalled();
  });

  it("wraps connection errors in an ExplainError and still closes the client", async () => {
    connect.mockRejectedValueOnce(new Error("connection refused"));
    end.mockResolvedValueOnce(undefined);

    await expect(
      runPostgresExplain("postgres://localhost/db", "SELECT 1")
    ).rejects.toThrow("connection refused");
    expect(end).toHaveBeenCalled();
  });
});
