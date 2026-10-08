import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";
import { ThemeScript } from "../ThemeScript";
import { TopStateScript } from "../TopStateScript";
import { AT_TOP_THRESHOLD } from "../atTop";

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

describe("TopStateScript", () => {
  it("segna la cima con la stessa soglia che usa l'header mentre si scorre", () => {
    // Lo script e' una stringa: se la soglia ci arrivasse undefined, il
    // confronto darebbe sempre false e l'header nascerebbe opaco. Qui lo si
    // esegue davvero, ai due lati della soglia.
    const { container } = render(<TopStateScript />);
    const code = container.querySelector("script")?.innerHTML ?? "";
    const root = document.documentElement;

    Object.defineProperty(window, "scrollY", { value: AT_TOP_THRESHOLD - 1, configurable: true });
    root.removeAttribute("data-at-top");
    new Function(code)();
    expect(root.hasAttribute("data-at-top")).toBe(true);

    Object.defineProperty(window, "scrollY", { value: AT_TOP_THRESHOLD, configurable: true });
    root.removeAttribute("data-at-top");
    new Function(code)();
    expect(root.hasAttribute("data-at-top")).toBe(false);

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
});
