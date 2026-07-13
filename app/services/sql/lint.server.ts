import { exprToString } from "~/services/sql/expr";
import { parseSql } from "~/services/sql/parser";
import type { Dialect } from "~/services/db/types";
import type { PlanNode } from "~/services/plan/types";

export interface LintWarning {
  severity: "warning" | "info";
  message: string;
}

interface SelectColumn {
  expr: { ast?: { type?: string } };
  as?: string;
}

/** Below this row count a full scan usually isn't worth worrying about. */
const LARGE_SCAN_ROW_THRESHOLD = 1000;

const FULL_SCAN_LABEL = /^(seq scan|table scan|clustered index scan|scan\b)/i;

function isSelectStar(columns: unknown): boolean {
  if (!Array.isArray(columns) || columns.length !== 1) return false;
  const col = columns[0] as { expr: unknown };
  return exprToString(col.expr) === "*";
}

function hasSubqueryColumn(columns: unknown): boolean {
  if (!Array.isArray(columns)) return false;
  return columns.some((col: SelectColumn) => col.expr?.ast?.type === "select");
}

function findFullScans(node: PlanNode): PlanNode[] {
  const self = FULL_SCAN_LABEL.test(node.label) ? [node] : [];
  return self.concat(node.children.flatMap(findFullScans));
}

export function lintQuery(sql: string, dialect: Dialect, plan?: PlanNode): LintWarning[] {
  const ast = parseSql(sql, dialect);
  if (!ast || ast.type !== "select") return [];

  const warnings: LintWarning[] = [];

  if (isSelectStar(ast.columns)) {
    warnings.push({
      severity: "warning",
      message:
        "Uses SELECT * — list only the columns you need to reduce I/O and avoid breaking callers when the schema changes.",
    });
  }

  const hasLimit = Array.isArray(ast.limit?.value) && ast.limit.value.length > 0;
  if (!ast.where && !hasLimit) {
    warnings.push({
      severity: "warning",
      message:
        "No WHERE clause or LIMIT — this reads every row in the table(s) involved.",
    });
  }

  if (hasSubqueryColumn(ast.columns)) {
    warnings.push({
      severity: "warning",
      message:
        "A subquery in the SELECT list typically runs once per output row (N+1-shaped) — consider rewriting it as a JOIN.",
    });
  }

  if (plan) {
    const largeScans = findFullScans(plan).filter(
      (node) => (node.rows ?? 0) > LARGE_SCAN_ROW_THRESHOLD
    );
    for (const scan of largeScans) {
      warnings.push({
        severity: "warning",
        message: `Full scan ("${scan.label}") touched ~${scan.rows} rows — consider adding an index on the filtered column(s).`,
      });
    }
  }

  return warnings;
}
