import type { PlanNode } from "~/services/plan/types";

interface PostgresPlanNode {
  "Node Type"?: string;
  "Relation Name"?: string;
  "Total Cost"?: number;
  "Plan Rows"?: number;
  "Actual Rows"?: number;
  "Actual Total Time"?: number;
  Plans?: PostgresPlanNode[];
}

function toNode(node: PostgresPlanNode): PlanNode {
  const label = node["Relation Name"]
    ? `${node["Node Type"]} on ${node["Relation Name"]}`
    : node["Node Type"] ?? "Unknown";

  return {
    label,
    costEstimate: node["Total Cost"],
    rows: node["Actual Rows"] ?? node["Plan Rows"],
    actualTimeMs: node["Actual Total Time"],
    children: (node.Plans ?? []).map(toNode),
  };
}

/** `raw` is the array returned by `EXPLAIN (ANALYZE, FORMAT JSON)`. */
export function normalizePostgresPlan(raw: unknown): PlanNode {
  const entries = raw as { Plan: PostgresPlanNode }[];
  const root = entries?.[0]?.Plan;

  if (!root) {
    return { label: "Unknown plan", children: [] };
  }

  return toNode(root);
}
