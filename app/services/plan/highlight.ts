import type { PlanNode } from "~/services/plan/types";

/** The metric used to judge how "expensive" a node is: actual time if we have it, else the planner's cost estimate. */
export function nodeMetric(node: PlanNode): number {
  return node.actualTimeMs ?? node.costEstimate ?? 0;
}

function maxMetric(node: PlanNode): number {
  return node.children.reduce((max, child) => Math.max(max, maxMetric(child)), nodeMetric(node));
}

/** Nodes at or above this fraction of the plan's most expensive node are flagged as slow. */
const SLOW_NODE_THRESHOLD_RATIO = 0.5;

export function computeSlowThreshold(root: PlanNode): number {
  const max = maxMetric(root);
  return max > 0 ? max * SLOW_NODE_THRESHOLD_RATIO : Infinity;
}

export function isSlowNode(node: PlanNode, threshold: number): boolean {
  return nodeMetric(node) >= threshold && nodeMetric(node) > 0;
}
