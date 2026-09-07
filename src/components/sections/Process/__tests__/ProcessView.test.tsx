import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProcessView, type ProcessViewProps } from "../ProcessView";
import { processDeliveries } from "@/content/process";

const deliveries = processDeliveries.map((d, i) => ({
  id: d.id,
  quando: `Quando ${i}`,
  titolo: `Titolo ${i}`,
  lead: `Lead ${i}`,
  dentro: [`Dentro ${i}a`, `Dentro ${i}b`, `Dentro ${i}c`],
  nonlo: `Non è ${i}`,
  perche: `Perché ${i}`,
}));

const props: ProcessViewProps = {
  eyebrow: "Come lavoro",
  title: "Quattro cose che ricevi, in quest'ordine",
  intro: "Non è l'elenco di quello che faccio io.",
  deliveries,
};

describe("ProcessView", () => {
  it("le consegne sono una lista ordinata: «in quest'ordine» è metà del titolo", () => {
    // Non quattro riquadri. L'ordine e' l'informazione, e una lista ordinata e'
    // il modo in cui arriva anche a chi la pagina non la vede.
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(processDeliveries.length);
  });

  it("l'ultima consegna è quella che non ha una data di fine", () => {
    // Per `[data-process-item]` e non per ruolo: dentro ogni consegna c'e' una
    // seconda lista (le tre cose che contiene) e getAllByRole("listitem")
    // pesca anche quelle. L'ultima voce della pagina e' un trattino, non una
    // consegna.
    const { container } = render(<ProcessView {...props} />);
    const voci = container.querySelectorAll("[data-process-item]");
    const ultima = deliveries[deliveries.length - 1];
    expect(voci[voci.length - 1]).toHaveTextContent(ultima.titolo);
  });

  it("i lati si alternano: due voci di fila dallo stesso lato lasciano mezza colonna vuota", () => {
    const { container } = render(<ProcessView {...props} />);
    const lati = [...container.querySelectorAll("[data-process-item]")].map((el) =>
      el.getAttribute("data-lato"),
    );
    expect(lati).toHaveLength(processDeliveries.length);
    for (let i = 1; i < lati.length; i++) {
      expect(lati[i], `la voce ${i + 1} sta dallo stesso lato della precedente`).not.toBe(
        lati[i - 1],
      );
    }
  });

  it("ogni consegna dice anche cosa NON è", () => {
    // E' la riga che tiene la sezione lontana dal dépliant: «non e' un
    // preventivo», «non e' la grafica finita». Se sparisce da una voce sola,
    // quella voce diventa una promessa.
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelectorAll("[data-process-non]")).toHaveLength(deliveries.length);
  });

  it("i disegni sono le sagome del tavolo, e sono decorazione dichiarata", () => {
    // Il gancio e' `data-desk-piece` («un pezzo disegnato») e non
    // `data-desk-object`: quello conta i ventiquattro oggetti sul tavolo, e
    // queste quattro consegne sul tavolo non ci stanno.
    const { container } = render(<ProcessView {...props} />);
    const pezzi = [...container.querySelectorAll("[data-desk-piece]")];
    expect(pezzi.map((p) => p.getAttribute("data-shape"))).toEqual(
      processDeliveries.map((d) => d.shape),
    );
    expect(container.querySelectorAll("[data-desk-object]")).toHaveLength(0);
    for (const art of container.querySelectorAll("[data-process-art]")) {
      expect(art).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("il filo attraversa la sezione", () => {
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelector('[data-thread="process"]')).not.toBeNull();
  });
});
