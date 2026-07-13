# Query Explainer

Paste a SQL query, pick a dialect, and get a plain-English breakdown of its
joins, filters, and aggregations — plus a visualized execution plan pulled
from a real `EXPLAIN ANALYZE`, and warnings for common anti-patterns
(`SELECT *`, missing index hints, N+1-shaped subqueries).

Built with React Router v7 (Node SSR), Tailwind CSS v4, and native database
drivers for Postgres, MSSQL, and SQLite.

## Status

This project is under active, staged development. Current stage: **0 —
scaffold** (project shell, theme, tooling, CI). Query input, live `EXPLAIN`
execution, the plain-English summary, the execution plan visualization, and
anti-pattern warnings land in subsequent stages.

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

Once query execution lands (stage 1), you'll paste a connection string for
your target database (Postgres, MSSQL, or SQLite) directly into the UI for
each request — it is never persisted server-side. Only read-only `SELECT`
statements are permitted.

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
(`.github/workflows/ci.yml`).
