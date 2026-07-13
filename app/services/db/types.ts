export type Dialect = "postgres" | "mssql" | "sqlite";

export const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "mssql", label: "SQL Server" },
  { value: "sqlite", label: "SQLite" },
];

export interface ExplainRequest {
  dialect: Dialect;
  connectionString: string;
  sql: string;
}

export interface ExplainResult {
  dialect: Dialect;
  /** Raw plan output as returned by the driver, shape varies per dialect. */
  raw: unknown;
}

export class ExplainError extends Error {}
