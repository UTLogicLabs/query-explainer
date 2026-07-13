import { ExplainError } from "~/services/db/types";

/**
 * Naive read-only guard for stage 1. This is deliberately simple —
 * AST-based validation (stage 2+) replaces the statement-count heuristic
 * with a real parse, but the "must be a single SELECT" rule stays as a
 * defense against a pasted connection string being used to run writes.
 */
export function assertReadOnlySelect(sql: string): void {
  const trimmed = sql.trim().replace(/;+\s*$/, "");

  if (!trimmed) {
    throw new ExplainError("SQL query is required.");
  }

  if (trimmed.includes(";")) {
    throw new ExplainError("Only a single statement is allowed.");
  }

  if (!/^(select|with)\b/i.test(trimmed)) {
    throw new ExplainError("Only SELECT statements can be explained.");
  }

  const forbidden = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|merge|exec|execute)\b/i;
  if (forbidden.test(trimmed)) {
    throw new ExplainError("Only read-only SELECT statements are allowed.");
  }
}
