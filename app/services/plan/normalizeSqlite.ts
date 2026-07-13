import type { PlanNode } from "~/services/plan/types";

interface SqliteExplainRow {
  id: number;
  parent: number;
  detail: string;
}

/**
 * `raw` is the flat row list from `EXPLAIN QUERY PLAN`. SQLite doesn't
 * report cost/row/time statistics for this command, so nodes only carry
 * a label — there's nothing to highlight as "slow" for this dialect.
 */
export function normalizeSqlitePlan(raw: unknown): PlanNode {
  const rows = (raw ?? []) as SqliteExplainRow[];
  const nodesById = new Map<number, PlanNode>();
  const roots: PlanNode[] = [];

  for (const row of rows) {
    nodesById.set(row.id, { label: row.detail, children: [] });
  }

  for (const row of rows) {
    const node = nodesById.get(row.id)!;
    const parent = nodesById.get(row.parent);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  if (roots.length === 1) return roots[0];

  return { label: "Query plan", children: roots };
}
