import type { Dialect } from "~/services/db/types";
import { normalizeMssqlPlan } from "~/services/plan/normalizeMssql";
import { normalizePostgresPlan } from "~/services/plan/normalizePostgres";
import { normalizeSqlitePlan } from "~/services/plan/normalizeSqlite";
import type { PlanNode } from "~/services/plan/types";

export function normalizePlan(dialect: Dialect, raw: unknown): PlanNode {
  switch (dialect) {
    case "postgres":
      return normalizePostgresPlan(raw);
    case "mssql":
      return normalizeMssqlPlan(raw);
    case "sqlite":
      return normalizeSqlitePlan(raw);
    default:
      return { label: `Unsupported dialect: ${dialect satisfies never}`, children: [] };
  }
}
