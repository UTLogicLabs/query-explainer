import pkg from "node-sql-parser";
import type { Dialect } from "~/services/db/types";

const { Parser } = pkg;

const PARSER_DIALECT: Record<Dialect, string> = {
  postgres: "postgresql",
  mssql: "transactsql",
  sqlite: "sqlite",
};

const parser = new Parser();

export function parseSql(sql: string, dialect: Dialect) {
  const ast = parser.astify(sql, { database: PARSER_DIALECT[dialect] });
  return Array.isArray(ast) ? ast[0] : ast;
}
