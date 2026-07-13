import { runMssqlExplain } from "~/services/db/mssql.server";
import { runPostgresExplain } from "~/services/db/postgres.server";
import { runSqliteExplain } from "~/services/db/sqlite.server";
import { ExplainError, type ExplainRequest, type ExplainResult } from "~/services/db/types";

export async function runExplain({
  dialect,
  connectionString,
  sql,
}: ExplainRequest): Promise<ExplainResult> {
  if (!connectionString.trim()) {
    throw new ExplainError("A connection string is required.");
  }

  switch (dialect) {
    case "postgres":
      return runPostgresExplain(connectionString, sql);
    case "mssql":
      return runMssqlExplain(connectionString, sql);
    case "sqlite":
      return runSqliteExplain(connectionString, sql);
    default:
      throw new ExplainError(`Unsupported dialect: ${dialect satisfies never}`);
  }
}
