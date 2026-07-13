import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "~/components/Footer";

describe("Footer", () => {
  it("renders the site name", () => {
    render(<Footer />);
    expect(screen.getByText("Query Explainer")).toBeInTheDocument();
  });
});
