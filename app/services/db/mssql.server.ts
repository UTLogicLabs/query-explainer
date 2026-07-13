import sql from "mssql";
import { assertReadOnlySelect } from "~/services/db/validate";
import { ExplainError, type ExplainResult } from "~/services/db/types";

const SHOWPLAN_COLUMN = /^Microsoft SQL Server .* XML Showplan$/i;

function findShowplanXml(recordsets: unknown): string | undefined {
  if (!Array.isArray(recordsets)) return undefined;

  for (const recordset of recordsets) {
    if (!Array.isArray(recordset)) continue;
    for (const row of recordset) {
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        if (SHOWPLAN_COLUMN.test(key) && typeof value === "string") {
          return value;
        }
      }
    }
  }

  return undefined;
}

export async function runMssqlExplain(
  connectionString: string,
  sqlText: string
): Promise<ExplainResult> {
  assertReadOnlySelect(sqlText);

  const pool = new sql.ConnectionPool(connectionString);

  try {
    await pool.connect();
    const request = pool.request();
    request.multiple = true;
    const result = await request.query(
      `SET STATISTICS XML ON; ${sqlText}; SET STATISTICS XML OFF;`
    );
    const plan = findShowplanXml(result.recordsets);

    if (!plan) {
      throw new ExplainError("SQL Server returned no execution plan.");
    }

    return { dialect: "mssql", raw: plan };
  } catch (error) {
    if (error instanceof ExplainError) throw error;
    throw new ExplainError(
      error instanceof Error ? error.message : "Failed to run EXPLAIN."
    );
  } finally {
    await pool.close().catch(() => {});
  }
}
