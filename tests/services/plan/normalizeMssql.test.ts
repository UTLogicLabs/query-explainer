import { XMLParser } from "fast-xml-parser";
import { describe, expect, it, vi } from "vitest";
import { normalizeMssqlPlan } from "~/services/plan/normalizeMssql";

const SAMPLE_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan">
  <BatchSequence><Batch><Statements><StmtSimple>
    <QueryPlan>
      <RelOp NodeId="0" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="5" EstimatedTotalSubtreeCost="1.2">
        <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="5" ActualElapsedms="12"/></RunTimeInformation>
        <NestedLoops>
          <RelOp NodeId="1" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.1">
            <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualElapsedms="1"/></RunTimeInformation>
          </RelOp>
          <RelOp NodeId="2" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="100" EstimatedTotalSubtreeCost="1.0">
            <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="100" ActualElapsedms="11"/></RunTimeInformation>
          </RelOp>
        </NestedLoops>
      </RelOp>
    </QueryPlan>
  </StmtSimple></Statements></Batch></BatchSequence>
</ShowPlanXML>`;

describe("normalizeMssqlPlan", () => {
  it("parses showplan XML into a nested tree with actual runtime stats", () => {
    const result = normalizeMssqlPlan(SAMPLE_XML);

    expect(result).toEqual({
      label: "Nested Loops",
      costEstimate: 1.2,
      rows: 5,
      actualTimeMs: 12,
      children: [
        {
          label: "Index Scan",
          costEstimate: 0.1,
          rows: 1,
          actualTimeMs: 1,
          children: [],
        },
        {
          label: "Clustered Index Scan",
          costEstimate: 1.0,
          rows: 100,
          actualTimeMs: 11,
          children: [],
        },
      ],
    });
  });

  it("falls back gracefully when there is no RelOp", () => {
    expect(normalizeMssqlPlan("<ShowPlanXML></ShowPlanXML>")).toEqual({
      label: "Unknown plan",
      children: [],
    });
  });

  it("fails closed instead of throwing when the XML can't be parsed", () => {
    const spy = vi.spyOn(XMLParser.prototype, "parse").mockImplementation(() => {
      throw new Error("malformed XML");
    });

    let result: unknown;
    expect(() => {
      result = normalizeMssqlPlan(SAMPLE_XML);
    }).not.toThrow();
    expect(result).toEqual({ label: "Unknown plan", children: [] });

    spy.mockRestore();
  });
});
