import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Home, { action } from "~/routes/home";
import { runExplain } from "~/services/db/explain.server";
import { ExplainError } from "~/services/db/types";

vi.mock("~/services/db/explain.server", () => ({
  runExplain: vi.fn(),
}));

function renderHome() {
  const Stub = createRoutesStub([{ path: "/", Component: Home, action }]);
  render(<Stub initialEntries={["/"]} />);
}

describe("Home route", () => {
  it("renders the heading and the query form", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { name: "Query Explainer" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Dialect")).toBeInTheDocument();
    expect(screen.getByLabelText("Connection string")).toBeInTheDocument();
    expect(screen.getByLabelText("SQL query")).toBeInTheDocument();
  });

  it("renders the raw plan on a successful submission", async () => {
    vi.mocked(runExplain).mockResolvedValueOnce({
      dialect: "postgres",
      raw: { Plan: { "Node Type": "Seq Scan" } },
    });

    const user = userEvent.setup();
    renderHome();

    await user.type(
      screen.getByLabelText("Connection string"),
      "postgres://localhost/db"
    );
    await user.type(screen.getByLabelText("SQL query"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /run explain/i }));

    expect(await screen.findByText(/raw plan \(postgres\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Seq Scan/)).toBeInTheDocument();
  });

  it("renders an error message when explain fails", async () => {
    vi.mocked(runExplain).mockRejectedValueOnce(
      new ExplainError("Only SELECT statements can be explained.")
    );

    const user = userEvent.setup();
    renderHome();

    await user.type(
      screen.getByLabelText("Connection string"),
      "postgres://localhost/db"
    );
    await user.type(screen.getByLabelText("SQL query"), "DELETE FROM orders");
    await user.click(screen.getByRole("button", { name: /run explain/i }));

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Only SELECT statements can be explained.");
  });
});
