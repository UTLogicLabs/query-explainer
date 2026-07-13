import { describe, expect, it, vi } from "vitest";
import { ExplainError } from "~/services/db/types";

const runPostgresExplain = vi.fn();
const runMssqlExplain = vi.fn();
const runSqliteExplain = vi.fn();

vi.mock("~/services/db/postgres.server", () => ({ runPostgresExplain }));
vi.mock("~/services/db/mssql.server", () => ({ runMssqlExplain }));
vi.mock("~/services/db/sqlite.server", () => ({ runSqliteExplain }));

const { runExplain } = await import("~/services/db/explain.server");

describe("runExplain", () => {
  it("requires a connection string", async () => {
    await expect(
      runExplain({ dialect: "postgres", connectionString: "  ", sql: "SELECT 1" })
    ).rejects.toThrow(ExplainError);
    expect(runPostgresExplain).not.toHaveBeenCalled();
  });

  it("dispatches to the postgres adapter", async () => {
    runPostgresExplain.mockResolvedValueOnce({ dialect: "postgres", raw: {} });
    await runExplain({
      dialect: "postgres",
      connectionString: "postgres://x",
      sql: "SELECT 1",
    });
    expect(runPostgresExplain).toHaveBeenCalledWith("postgres://x", "SELECT 1");
  });

  it("dispatches to the mssql adapter", async () => {
    runMssqlExplain.mockResolvedValueOnce({ dialect: "mssql", raw: {} });
    await runExplain({
      dialect: "mssql",
      connectionString: "Server=x",
      sql: "SELECT 1",
    });
    expect(runMssqlExplain).toHaveBeenCalledWith("Server=x", "SELECT 1");
  });

  it("dispatches to the sqlite adapter", async () => {
    runSqliteExplain.mockResolvedValueOnce({ dialect: "sqlite", raw: {} });
    await runExplain({
      dialect: "sqlite",
      connectionString: ":memory:",
      sql: "SELECT 1",
    });
    expect(runSqliteExplain).toHaveBeenCalledWith(":memory:", "SELECT 1");
  });
});
