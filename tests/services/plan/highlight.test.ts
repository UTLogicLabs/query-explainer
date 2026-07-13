import { describe, expect, it } from "vitest";
import { computeSlowThreshold, isSlowNode, nodeMetric } from "~/services/plan/highlight";
import type { PlanNode } from "~/services/plan/types";

describe("nodeMetric", () => {
  it("prefers actual time over cost estimate", () => {
    expect(nodeMetric({ label: "x", actualTimeMs: 5, costEstimate: 100, children: [] })).toBe(5);
  });

  it("falls back to cost estimate", () => {
    expect(nodeMetric({ label: "x", costEstimate: 100, children: [] })).toBe(100);
  });

  it("defaults to 0 when neither is present", () => {
    expect(nodeMetric({ label: "x", children: [] })).toBe(0);
  });
});

describe("computeSlowThreshold / isSlowNode", () => {
  const tree: PlanNode = {
    label: "root",
    actualTimeMs: 100,
    children: [
      { label: "fast", actualTimeMs: 5, children: [] },
      { label: "slow", actualTimeMs: 60, children: [] },
    ],
  };

  it("flags nodes at or above half of the tree's max metric", () => {
    const threshold = computeSlowThreshold(tree);
    expect(isSlowNode(tree, threshold)).toBe(true);
    expect(isSlowNode(tree.children[1], threshold)).toBe(true);
    expect(isSlowNode(tree.children[0], threshold)).toBe(false);
  });

  it("flags nothing when every node has a zero metric", () => {
    const zeroTree: PlanNode = { label: "root", children: [{ label: "child", children: [] }] };
    const threshold = computeSlowThreshold(zeroTree);
    expect(isSlowNode(zeroTree, threshold)).toBe(false);
    expect(isSlowNode(zeroTree.children[0], threshold)).toBe(false);
  });
});
