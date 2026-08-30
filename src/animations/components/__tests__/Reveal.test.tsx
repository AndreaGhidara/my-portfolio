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

  // Reveal e' un involucro di presentazione: se mangia gli attributi che non
  // conosce, chi lo usa e' costretto ad aggiungere un <div> attorno solo per
  // poterli scrivere, e l'elemento che conta smette di essere quello reso.
  it("inoltra anche gli attributi che non conosce", () => {
    const { container } = render(
      <Reveal as="ol" data-practice id="lista">
        <li>Voce</li>
      </Reveal>,
    );
    const ol = container.querySelector("[data-practice]");
    expect(ol?.tagName).toBe("OL");
    expect(ol).toHaveAttribute("id", "lista");
  });
});
