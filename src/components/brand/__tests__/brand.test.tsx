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

  it("il segno e' una maschera e non un'immagine: cosi' esiste anche sul tema scuro", () => {
    // Il file e' inchiostro su trasparente. Messo come <img> resta inchiostro
    // anche quando la pagina diventa inchiostro, e le virgolette spariscono.
    // Da maschera prende --fg, che e' carta sul tema scuro e inchiostro sul
    // chiaro: un file solo, giusto in tutti e due. E' la stessa strada del
    // cerchio d'inchiostro.
    const { container } = render(<QuoteFrame variant="open" />);
    const segno = container.querySelector("[data-quote-fill]") as HTMLElement | null;
    expect(segno, "manca il segno mascherato").not.toBeNull();
    expect(segno!.style.backgroundColor).toBe("var(--fg)");
    expect(segno!.style.mask || segno!.style.webkitMask).toContain("quote-open");
    expect(container.querySelector("img"), "e' ancora un'immagine").toBeNull();
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
