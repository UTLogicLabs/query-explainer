import { DatabaseSync } from "node:sqlite";
import { assertReadOnlySelect } from "~/services/db/validate";
import { ExplainError, type ExplainResult } from "~/services/db/types";

export async function runSqliteExplain(
  connectionString: string,
  sql: string
): Promise<ExplainResult> {
  assertReadOnlySelect(sql);

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(connectionString);
  } catch (error) {
    throw new ExplainError(
      error instanceof Error
        ? `Could not open SQLite database: ${error.message}`
        : "Could not open SQLite database."
    );
  }

  try {
    const rows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
    return { dialect: "sqlite", raw: rows };
  } catch (error) {
    if (error instanceof ExplainError) throw error;
    throw new ExplainError(
      error instanceof Error ? error.message : "Failed to run EXPLAIN."
    );
  } finally {
    db.close();
  }
}
