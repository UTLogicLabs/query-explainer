import { exprToString } from "~/services/sql/expr";
import { parseSql } from "~/services/sql/parser";
import type { Dialect } from "~/services/db/types";
import { ExplainError } from "~/services/db/types";

interface FromTable {
  table?: string;
  as?: string;
  join?: string;
  on?: unknown;
  expr?: unknown;
}

function describeTable(from: FromTable): string {
  if (!from.table) return from.as ? `a subquery (as ${from.as})` : "a subquery";
  return from.as ? `\`${from.table}\` (as \`${from.as}\`)` : `\`${from.table}\``;
}

function describeColumns(columns: unknown): string {
  if (!Array.isArray(columns)) return "its columns";

  const names = columns.map((col) => {
    const c = col as { expr: unknown; as?: string };
    const rendered = exprToString(c.expr);
    return c.as ? `${rendered} as ${c.as}` : rendered;
  });

  if (names.length === 1 && names[0] === "*") return "all columns";

  return names.join(", ");
}

export function summarizeQuery(sql: string, dialect: Dialect): string[] {
  const ast = parseSql(sql, dialect);

  if (!ast || ast.type !== "select") {
    throw new ExplainError("Only SELECT statements can be summarized.");
  }

  const sentences: string[] = [];
  const from = (ast.from ?? []) as FromTable[];
  const [base, ...joins] = from;

  if (base) {
    sentences.push(`Selects ${describeColumns(ast.columns)} from ${describeTable(base)}.`);
  }

  for (const join of joins) {
    const joinType = join.join ?? "JOIN";
    const condition = join.on ? ` on \`${exprToString(join.on)}\`` : "";
    sentences.push(`${joinType}s to ${describeTable(join)}${condition}.`);
  }

  if (ast.where) {
    sentences.push(`Filters rows where \`${exprToString(ast.where)}\`.`);
  }

  const aggregateColumns = Array.isArray(ast.columns)
    ? ast.columns.filter(
        (col: { expr?: { type?: string } }) => col.expr?.type === "aggr_func"
      )
    : [];
  if (aggregateColumns.length > 0) {
    const described = aggregateColumns
      .map((col: { expr: unknown; as?: string }) =>
        col.as ? `${exprToString(col.expr)} as ${col.as}` : exprToString(col.expr)
      )
      .join(", ");
    sentences.push(`Computes ${described}.`);
  }

  const groupByColumns = ast.groupby?.columns;
  if (Array.isArray(groupByColumns) && groupByColumns.length > 0) {
    sentences.push(`Groups by \`${groupByColumns.map(exprToString).join(", ")}\`.`);
  }

  if (ast.having) {
    sentences.push(`Keeps only groups where \`${exprToString(ast.having)}\`.`);
  }

  if (Array.isArray(ast.orderby) && ast.orderby.length > 0) {
    const ordered = ast.orderby
      .map((o: { expr: unknown; type?: string }) =>
        o.type ? `${exprToString(o.expr)} ${o.type}` : exprToString(o.expr)
      )
      .join(", ");
    sentences.push(`Orders results by \`${ordered}\`.`);
  }

  const limit = ast.limit?.value?.[0]?.value;
  if (limit !== undefined) {
    sentences.push(`Limits the result to ${limit} row${limit === 1 ? "" : "s"}.`);
  }

  return sentences;
}
