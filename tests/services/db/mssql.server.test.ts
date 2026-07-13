import { describe, expect, it, vi } from "vitest";
import { ExplainError } from "~/services/db/types";

const connect = vi.fn();
const close = vi.fn();
const query = vi.fn();
const requestMock = { multiple: false, query };

vi.mock("mssql", () => ({
  default: {
    ConnectionPool: vi.fn().mockImplementation(function () {
      return { connect, close, request: () => requestMock };
    }),
  },
}));

const { runMssqlExplain } = await import("~/services/db/mssql.server");

describe("runMssqlExplain", () => {
  it("wraps the query with SET STATISTICS XML and extracts the showplan", async () => {
    connect.mockResolvedValueOnce(undefined);
    query.mockResolvedValueOnce({
      recordsets: [
        [{ "Microsoft SQL Server 2005 XML Showplan": "<ShowPlanXML/>" }],
      ],
    });
    close.mockResolvedValueOnce(undefined);

    const result = await runMssqlExplain(
      "Server=localhost;Database=db",
      "SELECT 1"
    );

    expect(query).toHaveBeenCalledWith(
      "SET STATISTICS XML ON; SELECT 1; SET STATISTICS XML OFF;"
    );
    expect(result).toEqual({ dialect: "mssql", raw: "<ShowPlanXML/>" });
    expect(close).toHaveBeenCalled();
  });

  it("rejects non-SELECT statements before connecting", async () => {
    await expect(
      runMssqlExplain("Server=localhost;Database=db", "DROP TABLE orders")
    ).rejects.toThrow(ExplainError);
    expect(connect).not.toHaveBeenCalled();
  });

  it("throws when no showplan recordset is returned", async () => {
    connect.mockResolvedValueOnce(undefined);
    query.mockResolvedValueOnce({ recordsets: [[{ foo: "bar" }]] });
    close.mockResolvedValueOnce(undefined);

    await expect(
      runMssqlExplain("Server=localhost;Database=db", "SELECT 1")
    ).rejects.toThrow("SQL Server returned no execution plan.");
    expect(close).toHaveBeenCalled();
  });
});
