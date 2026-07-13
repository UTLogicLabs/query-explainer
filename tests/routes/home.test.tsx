import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import Home from "~/routes/home";

describe("Home route", () => {
  it("renders the heading and placeholder copy", () => {
    const Stub = createRoutesStub([{ path: "/", Component: Home }]);
    render(<Stub initialEntries={["/"]} />);

    expect(
      screen.getByRole("heading", { name: "Query Explainer" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/query form is coming in the next stage/i)
    ).toBeInTheDocument();
  });
});
