import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanTree } from "~/components/PlanTree";
import type { PlanNode } from "~/services/plan/types";

describe("PlanTree", () => {
  it("renders nested nodes with their row/time stats", () => {
    const root: PlanNode = {
      label: "Hash Join",
      actualTimeMs: 12,
      rows: 42,
      children: [
        { label: "Seq Scan on orders", actualTimeMs: 1, rows: 90, children: [] },
      ],
    };

    render(<PlanTree root={root} />);

    expect(screen.getByText("Hash Join")).toBeInTheDocument();
    expect(screen.getByText("Seq Scan on orders")).toBeInTheDocument();
    expect(screen.getByText("rows: 42")).toBeInTheDocument();
    expect(screen.getByText("12 ms")).toBeInTheDocument();
  });

  it("marks the node closest to the plan's most expensive step as slow", () => {
    const root: PlanNode = {
      label: "Hash Join",
      actualTimeMs: 100,
      children: [
        { label: "Index Scan", actualTimeMs: 1, children: [] },
        { label: "Seq Scan", actualTimeMs: 90, children: [] },
      ],
    };

    render(<PlanTree root={root} />);

    expect(screen.getByText("Seq Scan").closest("summary")).toHaveTextContent("slow");
    expect(screen.getByText("Index Scan").closest("summary")).not.toHaveTextContent(
      "slow"
    );
  });

  it("renders a leaf node without a details/summary toggle", () => {
    const root: PlanNode = { label: "SCAN orders", children: [] };
    render(<PlanTree root={root} />);
    expect(screen.getByText("SCAN orders").closest("details")).toBeNull();
  });
});
