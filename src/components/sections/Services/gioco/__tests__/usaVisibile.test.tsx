import { describe, it, expect, afterEach, vi } from "vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { installaIntersectionObserver, togliIntersectionObserver } from "@/test/intersectionObserver";
import { useVisibile } from "../usaVisibile";

function Prova() {
  const ref = useRef<HTMLDivElement | null>(null);
  const visibile = useVisibile(ref);
  return <div ref={ref}>{visibile ? "in vista" : "fuori"}</div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useVisibile", () => {
  it("parte in vista: nessuno ha ancora detto il contrario", () => {
    installaIntersectionObserver();
    render(<Prova />);
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("diventa fuori quando l'osservatore lo dice, e torna in vista al rientro", () => {
    const io = installaIntersectionObserver();
    render(<Prova />);
    io.esce();
    expect(screen.getByText("fuori")).toBeInTheDocument();
    io.entra();
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("senza IntersectionObserver resta in vista: i timer non si fermano mai", () => {
    togliIntersectionObserver();
    render(<Prova />);
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("smontando, l'osservatore si stacca", () => {
    const io = installaIntersectionObserver();
    const { unmount } = render(<Prova />);
    expect(io.attivi()).toBe(1);
    unmount();
    expect(io.attivi()).toBe(0);
  });
});
