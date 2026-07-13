import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Nav } from "~/components/Nav";

describe("Nav", () => {
  it("renders the site title and a link to GitHub", () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    );

    expect(screen.getByText("Query Explainer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/UTLogicLabs/query-explainer"
    );
  });
});
