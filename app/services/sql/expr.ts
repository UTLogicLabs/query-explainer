/**
 * Renders a node-sql-parser expression AST node back into readable SQL
 * text for use in the plain-English summary. Deliberately not a full
 * SQL pretty-printer — just enough node types to describe the common
 * shapes (joins, filters, aggregations) a summary needs to mention.
 */
export function exprToString(expr: unknown): string {
  if (expr === null || expr === undefined) return "";
  if (typeof expr !== "object") return String(expr);

  const node = expr as Record<string, unknown>;

  const subqueryAst = node.ast as { type?: string } | undefined;
  if (subqueryAst?.type === "select") return "(subquery)";

  switch (node.type) {
    case "column_ref": {
      const column = node.column as { expr?: { value?: string } } | string;
      const columnName =
        typeof column === "string" ? column : column?.expr?.value ?? "";
      return node.table ? `${node.table}.${columnName}` : columnName;
    }
    case "number":
    case "bigint":
      return String(node.value);
    case "single_quote_string":
    case "string":
      return `'${node.value}'`;
    case "bool":
      return node.value ? "true" : "false";
    case "null":
      return "NULL";
    case "star":
      return "*";
    case "binary_expr":
      return `${exprToString(node.left)} ${node.operator} ${exprToString(node.right)}`;
    case "unary_expr":
      return `${node.operator} ${exprToString(node.expr)}`;
    case "aggr_func": {
      const args = node.args as { expr?: unknown } | undefined;
      return `${node.name}(${args?.expr ? exprToString(args.expr) : ""})`;
    }
    case "function": {
      const name = node.name as { name?: { value?: string }[] } | string;
      const fnName =
        typeof name === "string" ? name : name?.name?.[0]?.value ?? "";
      const args = node.args as { value?: unknown[] } | undefined;
      const argList = (args?.value ?? []).map(exprToString).join(", ");
      return `${fnName}(${argList})`;
    }
    case "expr_list":
      return ((node.value as unknown[]) ?? []).map(exprToString).join(", ");
    default:
      if ("value" in node) return String(node.value);
      return "";
  }
}
