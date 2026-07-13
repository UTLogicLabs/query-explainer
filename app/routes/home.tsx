import { Form, useNavigation } from "react-router";
import type { Route } from "./+types/home";
import { runExplain } from "~/services/db/explain.server";
import { DIALECTS, ExplainError, type Dialect, type ExplainResult } from "~/services/db/types";
import { summarizeQuery } from "~/services/sql/summarize.server";
import { lintQuery, type LintWarning } from "~/services/sql/lint.server";
import { normalizePlan } from "~/services/plan/normalize";
import type { PlanNode } from "~/services/plan/types";
import { PlanTree } from "~/components/PlanTree";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Query Explainer" },
    {
      name: "description",
      content:
        "Paste a SQL query and get a plain-English breakdown plus a visual execution plan.",
    },
  ];
}

type ActionData =
  | {
      ok: true;
      result: ExplainResult;
      summary: string[];
      plan: PlanNode;
      warnings: LintWarning[];
    }
  | { ok: false; error: string };

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const dialect = String(formData.get("dialect")) as Dialect;
  const connectionString = String(formData.get("connectionString") ?? "");
  const sql = String(formData.get("sql") ?? "");

  try {
    const result = await runExplain({ dialect, connectionString, sql });

    let summary: string[] = [];
    try {
      summary = summarizeQuery(sql, dialect);
    } catch {
      // Summary is best-effort — the raw plan is still useful on its own
      // if the parser doesn't support this particular query shape.
    }

    const plan = normalizePlan(result.dialect, result.raw);

    let warnings: LintWarning[] = [];
    try {
      warnings = lintQuery(sql, dialect, plan);
    } catch {
      // Warnings are best-effort, same as the summary above.
    }

    return { ok: true, result, summary, plan, warnings };
  } catch (error) {
    const message =
      error instanceof ExplainError
        ? error.message
        : "Something went wrong running EXPLAIN.";
    return { ok: false, error: message };
  }
}

export default function Home({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const data = actionData as ActionData | undefined;
  const submitting = navigation.state === "submitting";

  return (
    <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
        Query Explainer
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
        Paste a SQL query, pick a dialect, and get a plain-English breakdown
        of its joins, filters, and aggregations — plus a visualized execution
        plan pulled from your database&apos;s real query plan output.
      </p>

      <Form method="post" className="mt-16 border border-border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="dialect" className="text-sm font-medium">
            Dialect
          </label>
          <select
            id="dialect"
            name="dialect"
            defaultValue="postgres"
            className="border border-border rounded-lg px-3 py-2 bg-background"
          >
            {DIALECTS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="connectionString" className="text-sm font-medium">
            Connection string
          </label>
          <input
            id="connectionString"
            name="connectionString"
            type="password"
            autoComplete="off"
            placeholder="postgres://user:pass@host:5432/db"
            className="border border-border rounded-lg px-3 py-2 bg-background font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Used only for this request — never stored. Only read-only SELECT
            statements are permitted.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sql" className="text-sm font-medium">
            SQL query
          </label>
          <textarea
            id="sql"
            name="sql"
            rows={6}
            placeholder="SELECT * FROM orders WHERE customer_id = 1"
            className="border border-border rounded-lg px-3 py-2 bg-background font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="self-start bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Running…" : "Run EXPLAIN"}
        </button>
      </Form>

      {data && !data.ok && (
        <div
          role="alert"
          className="mt-8 border border-red-300 bg-red-50 text-red-900 rounded-xl p-4 text-sm dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {data.error}
        </div>
      )}

      {data && data.ok && data.warnings.length > 0 && (
        <div className="mt-8 border border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-900 dark:text-yellow-200">
            Warnings
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900 dark:text-yellow-200">
            {data.warnings.map((warning, i) => (
              <li key={i}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      {data && data.ok && data.summary.length > 0 && (
        <div className="mt-8 border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Plain-English summary</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {data.summary.map((sentence, i) => (
              <li key={i}>{sentence}</li>
            ))}
          </ul>
        </div>
      )}

      {data && data.ok && (
        <div className="mt-8 border border-border rounded-xl p-6" data-testid="execution-plan">
          <h2 className="text-lg font-semibold mb-4">Execution plan</h2>
          <PlanTree root={data.plan} />
        </div>
      )}

      {data && data.ok && (
        <details className="mt-8 border border-border rounded-xl p-6">
          <summary className="cursor-pointer text-lg font-semibold">
            Raw plan ({data.result.dialect})
          </summary>
          <pre className="mt-4 overflow-x-auto text-xs font-mono bg-muted p-4 rounded-lg">
            {typeof data.result.raw === "string"
              ? data.result.raw
              : JSON.stringify(data.result.raw, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}
