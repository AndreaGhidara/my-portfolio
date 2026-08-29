import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wordmark } from "../Wordmark";
import { Avatar } from "../Avatar";
import { QuoteFrame } from "../QuoteFrame";
import { WebCorner } from "../WebCorner";
import { InkCircle } from "../InkCircle";

describe("Wordmark", () => {
  it("espone il nome come testo accessibile, anche se è fatto di immagini", () => {
    render(<Wordmark text="ANDREA" label="Andrea" />);
    expect(screen.getByRole("img", { name: "Andrea" })).toBeInTheDocument();
  });

  it("rende una immagine per ogni lettera", () => {
    const { container } = render(<Wordmark text="ANDREA" label="Andrea" />);
    expect(container.querySelectorAll("img")).toHaveLength(6);
  });

  it("le singole lettere hanno alt vuoto, così lo screen reader legge solo il nome", () => {
    const { container } = render(<Wordmark text="ANDREA" label="Andrea" />);
    container.querySelectorAll("img").forEach((img) => {
      expect(img).toHaveAttribute("alt", "");
    });
  });

  it("ogni lettera dichiara width e height, per non causare salti di layout", () => {
    const { container } = render(<Wordmark text="ANDREA" label="Andrea" />);
    container.querySelectorAll("img").forEach((img) => {
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
    });
  });
});

describe("Avatar", () => {
  it("ha un alt descrittivo: è l'unica immagine non decorativa del marchio", () => {
    render(<Avatar />);
    expect(screen.getByAltText(/Andrea Ghidara/i)).toBeInTheDocument();
  });
});

describe("elementi decorativi", () => {
  it("le virgolette sono nascoste alla tecnologia assistiva", () => {
    const { container } = render(<QuoteFrame variant="open" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("la ragnatela è nascosta alla tecnologia assistiva", () => {
    const { container } = render(<WebCorner />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("il cerchio a pennellata rende i figli", () => {
    render(<InkCircle><span>dentro</span></InkCircle>);
    expect(screen.getByText("dentro")).toBeVisible();
  });
});
