import { XMLParser } from "fast-xml-parser";
import type { PlanNode } from "~/services/plan/types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

type XmlNode = Record<string, unknown>;

function toNumber(value: unknown): number | undefined {
  const num = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Showplan XML nests each RelOp's children under an arbitrary wrapper
 * element (NestedLoops, Hash, IndexScan, ...) whose name depends on the
 * physical operator. Rather than model every wrapper shape, this walks
 * the whole subtree and collects RelOp elements — stopping at each one
 * found so nested/grandchild RelOps aren't double-counted here.
 */
function findRelOps(node: XmlNode): XmlNode[] {
  let found: XmlNode[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === "RunTimeInformation" || key.startsWith("@_") || key === "#text") {
      continue;
    }

    if (key === "RelOp") {
      found = found.concat(Array.isArray(value) ? (value as XmlNode[]) : [value as XmlNode]);
      continue;
    }

    if (value && typeof value === "object") {
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        if (item && typeof item === "object") {
          found = found.concat(findRelOps(item as XmlNode));
        }
      }
    }
  }

  return found;
}

function extractRuntime(relOp: XmlNode): { rows?: number; timeMs?: number } {
  const info = relOp.RunTimeInformation as
    | { RunTimeCountersPerThread?: XmlNode | XmlNode[] }
    | undefined;
  const counters = info?.RunTimeCountersPerThread;
  if (!counters) return {};

  const list = Array.isArray(counters) ? counters : [counters];
  let rows = 0;
  let timeMs = 0;
  for (const c of list) {
    rows += toNumber(c["@_ActualRows"]) ?? 0;
    timeMs = Math.max(timeMs, toNumber(c["@_ActualElapsedms"]) ?? 0);
  }

  return { rows, timeMs };
}

function toNode(relOp: XmlNode): PlanNode {
  const label = String(relOp["@_PhysicalOp"] ?? relOp["@_LogicalOp"] ?? "Operation");
  const runtime = extractRuntime(relOp);

  return {
    label,
    costEstimate: toNumber(relOp["@_EstimatedTotalSubtreeCost"]),
    rows: runtime.rows ?? toNumber(relOp["@_EstimateRows"]),
    actualTimeMs: runtime.timeMs,
    children: findRelOps(relOp).map(toNode),
  };
}

/** `raw` is the Showplan XML string captured via `SET STATISTICS XML ON`. */
export function normalizeMssqlPlan(raw: unknown): PlanNode {
  const xml = String(raw ?? "");
  const parsed = parser.parse(xml) as XmlNode;
  const [root] = findRelOps(parsed);

  if (!root) {
    return { label: "Unknown plan", children: [] };
  }

  return toNode(root);
}
