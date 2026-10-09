import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { processDeliveries, type ProcessSample } from "@/content/process";
import { PROCESS_SPECIMENS, ProcessSpecimen } from "../ProcessSpecimen";

describe("i campioni delle consegne", () => {
  it("ogni campione dichiarato ha il suo disegno, e non ce n'è nessuno di troppo", () => {
    // Un campione senza disegno e' un buco in pagina, un disegno senza campione e' codice morto.
    const declared = new Set(processDeliveries.map((d) => d.sample));
    const drawn = new Set(Object.keys(PROCESS_SPECIMENS) as ProcessSample[]);
    for (const id of declared) {
      expect(drawn.has(id), `il campione "${id}" non sa disegnarsi`).toBe(true);
    }
    for (const id of drawn) {
      expect(declared.has(id), `il disegno "${id}" non lo chiama nessuna consegna`).toBe(true);
    }
  });

  it("nessuna consegna divide il campione con un'altra: un frammento è di una cosa sola", () => {
    const used = processDeliveries.map((d) => d.sample);
    expect(new Set(used).size).toBe(used.length);
  });

  it("due campioni non sono lo stesso disegno", () => {
    // Due consegne hanno la stessa sagoma: qui non c'e' la rete di sicurezza del tavolo.
    const drawings = (Object.keys(PROCESS_SPECIMENS) as ProcessSample[]).map(
      (id) => render(<ProcessSpecimen sample={id} />).container.innerHTML,
    );
    expect(new Set(drawings).size).toBe(drawings.length);
  });

  it("il campione è decorazione dichiarata: non entra nell'albero di accessibilità", () => {
    // Il campione del numero contiene del testo, e senza questo verrebbe letto.
    for (const id of Object.keys(PROCESS_SPECIMENS) as ProcessSample[]) {
      const { container } = render(<ProcessSpecimen sample={id} />);
      expect(container.querySelector("[data-desk-sample]")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("il numero di telefono non è un numero: è la sua forma, con le cifre vuote", () => {
    const { container } = render(<ProcessSpecimen sample="numero" />);
    expect(container.textContent).not.toMatch(/\d{4,}/);
  });
});
