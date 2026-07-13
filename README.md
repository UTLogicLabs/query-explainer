# Query Explainer

Paste a SQL query, pick a dialect, and get a plain-English breakdown of its
joins, filters, and aggregations — plus a visualized execution plan pulled
from your database's real query plan output (`EXPLAIN ANALYZE` on Postgres,
`SET STATISTICS XML` on SQL Server, `EXPLAIN QUERY PLAN` on SQLite), and
warnings for common anti-patterns.

Built with React Router v7 (Node SSR), Tailwind CSS v4, and native database
drivers for Postgres, MSSQL, and SQLite.

![Query Explainer showing a warning, a plain-English summary, and an execution plan tree for a joined SQLite query](docs/screenshot.png)

## Features

- **Live `EXPLAIN`** — paste a connection string and a query, pick a dialect,
  and it runs the real plan command against your database: Postgres
  (`EXPLAIN (ANALYZE, FORMAT JSON)`), SQL Server (`SET STATISTICS XML`), or
  SQLite (`EXPLAIN QUERY PLAN`).
- **Plain-English summary** — the query is parsed into an AST
  (`node-sql-parser`, not just keyword templating) and rendered as a list of
  sentences describing its tables, joins, filters, aggregations, grouping,
  ordering, and limit.
- **Execution plan tree** — each dialect's raw plan output is normalized into
  a common tree shape and rendered as a collapsible tree, with nodes near the
  plan's most expensive step flagged as slow.
- **Anti-pattern warnings** — flags `SELECT *`, a missing `WHERE`/`LIMIT`, a
  scalar subquery in the `SELECT` list (N+1-shaped), and full scans on large
  tables (using the normalized plan).

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Testing

```bash
npm test            # unit/component tests (Vitest)
npm run test:coverage
npm run test:e2e     # Playwright end-to-end tests
```

### Linting & type checking

```bash
npm run lint
npm run typecheck
```

## Connecting to a database

Paste a connection string for your target database directly into the UI —
it's used only for that request and is never persisted server-side. Only
read-only `SELECT` (or `WITH ... SELECT`) statements are permitted; anything
else is rejected before a connection is opened.

| Dialect | Connection string example |
|---|---|
| Postgres | `postgres://user:pass@localhost:5432/mydb` |
| SQL Server | `Server=localhost;Database=mydb;User Id=sa;Password=...;TrustServerCertificate=true` |
| SQLite | a filesystem path to the `.db` file (e.g. `/tmp/mydb.sqlite`, or `:memory:`) |

For SQL Server, the app runs `SET STATISTICS XML ON` around your query,
which means the query is actually executed to capture real runtime stats —
same as Postgres's `ANALYZE` and SQLite's plan (which doesn't execute the
query at all). Point it at a read replica or a non-production database if
that matters for your workload.

## Building for Production

```bash
npm run build
```

The built server (`npm start`) is a plain Node process — no Cloudflare
Workers or edge-specific bindings — so it can hold real TCP connections to
Postgres/MSSQL and read local SQLite files.

## CI

Every push and pull request runs typecheck, lint, unit tests (with
coverage), and the Playwright e2e suite via GitHub Actions
(`.github/workflows/ci.yml`). The `main` branch is protected: changes land
through a PR with a green CI run.
