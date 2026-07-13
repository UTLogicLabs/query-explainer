import type { Route } from "./+types/home";

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

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
        Query Explainer
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
        Paste a SQL query, pick a dialect, and get a plain-English breakdown
        of its joins, filters, and aggregations — plus a visualized execution
        plan pulled from a real <code className="font-mono">EXPLAIN ANALYZE</code>.
      </p>

      <div className="mt-16 border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground">
          The query form is coming in the next stage.
        </p>
      </div>
    </main>
  );
}
