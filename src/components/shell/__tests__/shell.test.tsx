import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";
import { ThemeScript } from "../ThemeScript";

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("è un pulsante con nome accessibile: la lampadina da sola non basta", async () => {
    render(<ThemeToggle label="Cambia tema chiaro o scuro" />);
    expect(
      screen.getByRole("button", { name: "Cambia tema chiaro o scuro" }),
    ).toBeInTheDocument();
  });

  it("dichiara lo stato corrente con aria-pressed", async () => {
    render(<ThemeToggle label="Cambia tema" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("scrive il tema su <html>, dove tokens.css lo cerca", async () => {
    render(<ThemeToggle label="Cambia tema" />);
    await userEvent.click(screen.getByRole("button"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ricorda la scelta, così alla visita successiva non riparte da capo", async () => {
    render(<ThemeToggle label="Cambia tema" />);
    await userEvent.click(screen.getByRole("button"));
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});

describe("ThemeScript", () => {
  it("applica il tema prima della pittura, per evitare il lampo bianco", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("data-theme");
    expect(script?.innerHTML).toContain("localStorage");
    expect(script?.innerHTML).toContain("prefers-color-scheme");
  });
});
