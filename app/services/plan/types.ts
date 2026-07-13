export interface PlanNode {
  label: string;
  /** Estimated total cost/rows, whatever the dialect's planner reports before running. */
  costEstimate?: number;
  /** Actual (or, lacking that, estimated) row count. */
  rows?: number;
  /** Actual measured execution time for this node, in milliseconds. */
  actualTimeMs?: number;
  children: PlanNode[];
}
