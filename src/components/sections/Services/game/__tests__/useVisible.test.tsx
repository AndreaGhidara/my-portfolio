import { describe, it, expect, afterEach, vi } from "vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { installIntersectionObserver, removeIntersectionObserver } from "@/test/intersectionObserver";
import { useVisible } from "../useVisible";

function Prova() {
  const ref = useRef<HTMLDivElement | null>(null);
  const visibile = useVisible(ref);
  return <div ref={ref}>{visibile ? "in vista" : "fuori"}</div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useVisibile", () => {
  it("parte in vista: nessuno ha ancora detto il contrario", () => {
    installIntersectionObserver();
    render(<Prova />);
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("diventa fuori quando l'osservatore lo dice, e torna in vista al rientro", () => {
    const io = installIntersectionObserver();
    render(<Prova />);
    io.exit();
    expect(screen.getByText("fuori")).toBeInTheDocument();
    io.enter();
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("senza IntersectionObserver resta in vista: i timer non si fermano mai", () => {
    removeIntersectionObserver();
    render(<Prova />);
    expect(screen.getByText("in vista")).toBeInTheDocument();
  });

  it("smontando, l'osservatore si stacca", () => {
    const io = installIntersectionObserver();
    const { unmount } = render(<Prova />);
    expect(io.active()).toBe(1);
    unmount();
    expect(io.active()).toBe(0);
  });
});
