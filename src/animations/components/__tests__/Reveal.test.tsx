import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "../Reveal";

describe("Reveal", () => {
  it("rende i figli anche quando le animazioni sono disattivate", () => {
    render(<Reveal>Contenuto importante</Reveal>);
    expect(screen.getByText("Contenuto importante")).toBeVisible();
  });

  it("non nasconde nulla via stile in linea: il contenuto non dipende da JavaScript", () => {
    const { container } = render(<Reveal>Testo</Reveal>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe("");
    expect(wrapper.style.visibility).toBe("");
  });

  it("rende l'elemento richiesto invece di un div", () => {
    const { container } = render(<Reveal as="section">Testo</Reveal>);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("inoltra la classe ricevuta", () => {
    const { container } = render(<Reveal className="mia-classe">Testo</Reveal>);
    expect(container.firstElementChild).toHaveClass("mia-classe");
  });
});
