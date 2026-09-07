import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { processDeliveries, type ProcessSample } from "@/content/process";
import { PROCESS_SPECIMENS, ProcessSpecimen } from "../ProcessSpecimen";

describe("i campioni delle consegne", () => {
  it("ogni campione dichiarato ha il suo disegno, e non ce n'è nessuno di troppo", () => {
    // Le due direzioni sono due difetti diversi, ed e' la stessa prova che il
    // tavolo fa sui suoi: un campione dichiarato senza disegno e' un buco in
    // pagina, un disegno che nessuno chiama e' codice morto che il giorno dopo
    // qualcuno "sistema" cambiandolo.
    const dichiarati = new Set(processDeliveries.map((d) => d.campione));
    const disegnati = new Set(Object.keys(PROCESS_SPECIMENS) as ProcessSample[]);
    for (const id of dichiarati) {
      expect(disegnati.has(id), `il campione "${id}" non sa disegnarsi`).toBe(true);
    }
    for (const id of disegnati) {
      expect(dichiarati.has(id), `il disegno "${id}" non lo chiama nessuna consegna`).toBe(true);
    }
  });

  it("nessuna consegna divide il campione con un'altra: un frammento è di una cosa sola", () => {
    const usati = processDeliveries.map((d) => d.campione);
    expect(new Set(usati).size).toBe(usati.length);
  });

  it("due campioni non sono lo stesso disegno", () => {
    // Due consegne su quattro hanno la STESSA sagoma (sono due fogli) quindi
    // qui non c'e' la rete di sicurezza che ha il tavolo: se «l'accordo» e «la
    // bozza» fossero fatti delle stesse marche, il documento e lo schermo
    // disegnato sarebbero due disegni identici uno sotto l'altro.
    const disegni = (Object.keys(PROCESS_SPECIMENS) as ProcessSample[]).map(
      (id) => render(<ProcessSpecimen sample={id} />).container.innerHTML,
    );
    expect(new Set(disegni).size).toBe(disegni.length);
  });

  it("il campione è decorazione dichiarata: non entra nell'albero di accessibilità", () => {
    // Il nome della consegna lo porta gia' il titolo accanto. Il campione del
    // numero contiene del testo, ed e' l'unico che senza questo verrebbe letto.
    for (const id of Object.keys(PROCESS_SPECIMENS) as ProcessSample[]) {
      const { container } = render(<ProcessSpecimen sample={id} />);
      expect(container.querySelector("[data-desk-sample]")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("il numero di telefono non è un numero: è la sua forma, con le cifre vuote", () => {
    // Inventare un numero sarebbe la bugia che la casella ha gia' rifiutato col
    // mittente inventato. Scriverne uno vero e' una decisione che riguarda i
    // Contatti, non questa sezione, e il giorno in cui si prende, questo e' il
    // primo posto in cui va.
    const { container } = render(<ProcessSpecimen sample="numero" />);
    expect(container.textContent).not.toMatch(/\d{4,}/);
  });
});
