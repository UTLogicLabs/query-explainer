import { computeSlowThreshold, isSlowNode, nodeMetric } from "~/services/plan/highlight";
import type { PlanNode } from "~/services/plan/types";

function PlanNodeItem({ node, threshold }: { node: PlanNode; threshold: number }) {
  const slow = isSlowNode(node, threshold);
  const metric = nodeMetric(node);

  const summary = (
    <summary
      className={`cursor-pointer rounded-lg px-2 py-1 text-sm ${
        slow
          ? "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          : "hover:bg-muted"
      }`}
    >
      <span className="font-medium">{node.label}</span>
      {node.rows !== undefined && (
        <span className="ml-2 text-xs text-muted-foreground">rows: {node.rows}</span>
      )}
      {node.actualTimeMs !== undefined && (
        <span className="ml-2 text-xs text-muted-foreground">
          {node.actualTimeMs} ms
        </span>
      )}
      {node.actualTimeMs === undefined && node.costEstimate !== undefined && (
        <span className="ml-2 text-xs text-muted-foreground">
          cost: {node.costEstimate}
        </span>
      )}
      {slow && (
        <span className="ml-2 text-xs font-semibold uppercase tracking-wide">
          slow
        </span>
      )}
    </summary>
  );

  if (node.children.length === 0) {
    return <div className="py-0.5">{summary}</div>;
  }

  return (
    <details open className="py-0.5" data-metric={metric}>
      {summary}
      <div className="ml-4 border-l border-border pl-3">
        {node.children.map((child, i) => (
          <PlanNodeItem key={i} node={child} threshold={threshold} />
        ))}
      </div>
    </details>
  );
}

export function PlanTree({ root }: { root: PlanNode }) {
  const threshold = computeSlowThreshold(root);
  return (
    <div role="tree" aria-label="Execution plan">
      <PlanNodeItem node={root} threshold={threshold} />
    </div>
  );
}
