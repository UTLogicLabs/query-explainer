import { Client } from "pg";
import { assertReadOnlySelect } from "~/services/db/validate";
import { ExplainError, type ExplainResult } from "~/services/db/types";

export async function runPostgresExplain(
  connectionString: string,
  sql: string
): Promise<ExplainResult> {
  assertReadOnlySelect(sql);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    const result = await client.query(
      `EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`
    );
    const plan = result.rows[0]?.["QUERY PLAN"];

    if (!plan) {
      throw new ExplainError("Postgres returned no plan.");
    }

    return { dialect: "postgres", raw: plan };
  } catch (error) {
    if (error instanceof ExplainError) throw error;
    throw new ExplainError(
      error instanceof Error ? error.message : "Failed to run EXPLAIN."
    );
  } finally {
    await client.end().catch(() => {});
  }
}
