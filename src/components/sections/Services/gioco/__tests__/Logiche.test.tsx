import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConTesti } from "@/test/renderConTesti";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Logiche } from "../Logiche";

const testi = it_.services.gioco.logiche;

const banco = (container: HTMLElement) =>
  container.querySelector('[data-gioco-livello="logiche"]') as HTMLElement;
const palco = (container: HTMLElement) => banco(container).querySelector(".palco") as HTMLElement;
const pulsante = (nome: string) => screen.getByRole("button", { name: new RegExp(nome) });

const monta = (onAvanti = vi.fn(), locale: "it" | "en" = "it") => {
  const utente = userEvent.setup();
  const resa = renderConTesti(<Logiche onAvanti={onAvanti} visibile />, { locale });
  return { utente, onAvanti, ...resa };
};

/** Il pulsante che porta al nodo dopo, col nome di quel nodo. */
const avantiA = (nome: string) => testi.avanti.replace("{nome}", nome);

/** Dalla partenza al primo nodo: il pulsante del sito finto. */
const parti = (utente: ReturnType<typeof userEvent.setup>) =>
  utente.click(pulsante(testi.partenza.prenota));

describe("le logiche, la partenza", () => {
  it("parte dalla schermata del Forno Aurora, e «Prenota la torta» porta al primo nodo", async () => {
    const { utente, container } = monta();
    expect(banco(container)).toBeInTheDocument();
    expect(screen.getByText(testi.partenza.indirizzo)).toBeInTheDocument();
    expect(screen.getByText(testi.partenza.appuntoTitolo)).toBeInTheDocument();

    await parti(utente);
    expect(screen.getByText(testi.nodi[0].titolo)).toBeInTheDocument();
    expect(screen.queryByText(testi.partenza.appuntoTitolo)).toBeNull();
  });

  it("anche l'appunto «Qui puoi prenotare» porta al primo nodo", async () => {
    const { utente } = monta();
    await utente.click(pulsante(testi.partenza.appuntoTitolo));
    expect(screen.getByText(testi.nodi[0].titolo)).toBeInTheDocument();
  });
});

describe("le logiche, i sei nodi", () => {
  it("con fai e avanti si attraversano i sei nodi fino allo scontrino di Andrea", async () => {
    const { utente, container } = monta();
    await parti(utente);
    for (const [i, nodo] of testi.nodi.entries()) {
      expect(screen.getByText(nodo.titolo)).toBeInTheDocument();
      await utente.click(pulsante(nodo.fai));
      await utente.click(pulsante(i < 5 ? avantiA(testi.nodi[i + 1].nome) : testi.stampa));
    }
    expect(within(palco(container)).getByText(/ORDINE N\. 0142 · ANDREA/)).toBeInTheDocument();
    expect(screen.getByText(testi.fine.titolo)).toBeInTheDocument();
  });

  it("rompi mostra l'incidente al posto della scena; fai lo toglie e resta il badge", async () => {
    const { utente, container } = monta();
    await parti(utente);
    const nodo = testi.nodi[0];

    await utente.click(pulsante(nodo.rompi));
    expect(within(palco(container)).getByText(nodo.errore)).toBeInTheDocument();
    expect(within(palco(container)).getByText(nodo.regola.se)).toBeInTheDocument();
    expect(within(palco(container)).getByText(nodo.regola.allora)).toBeInTheDocument();
    expect(within(palco(container)).getByText(testi.incidente.salvato)).toBeInTheDocument();
    expect(pulsante(testi.giaRotto)).toBeDisabled();

    await utente.click(pulsante(nodo.fai));
    expect(within(palco(container)).queryByText(nodo.errore)).toBeNull();
    expect(within(palco(container)).getByText(testi.trovata)).toBeInTheDocument();
  });

  it("tornando a un nodo gia' fatto e rotto l'errore non c'e', c'e' il badge", async () => {
    const { utente, container } = monta();
    await parti(utente);
    const [primo, secondo] = testi.nodi;
    await utente.click(pulsante(primo.rompi));
    await utente.click(pulsante(primo.fai));
    await utente.click(pulsante(avantiA(secondo.nome)));
    expect(screen.getByText(secondo.titolo)).toBeInTheDocument();

    // Il nodo nel circuito: si riapre perche' e' fatto.
    await utente.click(within(banco(container)).getByRole("button", { name: new RegExp(`1 .* ${primo.nome}`) }));
    expect(screen.getByText(primo.titolo)).toBeInTheDocument();
    expect(within(palco(container)).queryByText(primo.errore)).toBeNull();
    expect(within(palco(container)).getByText(testi.trovata)).toBeInTheDocument();
  });

  it("i nodi non ancora raggiunti nel circuito non si aprono", async () => {
    const { utente, container } = monta();
    await parti(utente);
    const terzo = within(banco(container)).getByRole("button", { name: new RegExp(`3 .* ${testi.nodi[2].nome}`) });
    expect(terzo).toBeDisabled();
  });
});

describe("le logiche, la fine", () => {
  const finoAllaFine = async (utente: ReturnType<typeof userEvent.setup>) => {
    await parti(utente);
    for (const [i, nodo] of testi.nodi.entries()) {
      await utente.click(pulsante(nodo.fai));
      await utente.click(pulsante(i < 5 ? avantiA(testi.nodi[i + 1].nome) : testi.stampa));
    }
  };

  it("«livello 3» chiama onAvanti", async () => {
    const { utente, onAvanti } = monta();
    await finoAllaFine(utente);
    await utente.click(pulsante(testi.fine.livello3));
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });

  it("«ricomincia» torna alla schermata del forno", async () => {
    const { utente } = monta();
    await finoAllaFine(utente);
    await utente.click(pulsante(testi.fine.ricomincia));
    expect(screen.getByText(testi.partenza.appuntoTitolo)).toBeInTheDocument();
  });
});

describe("le logiche, in inglese", () => {
  it("i testi ci sono, e non sono quelli italiani", async () => {
    const en = en_.services.gioco.logiche;
    const utente = userEvent.setup();
    renderConTesti(<Logiche onAvanti={vi.fn()} visibile />, { locale: "en" });
    expect(screen.getByText(en.partenza.appuntoTitolo)).toBeInTheDocument();
    await utente.click(screen.getByRole("button", { name: new RegExp(en.partenza.prenota) }));
    expect(screen.getByText(en.nodi[0].titolo)).toBeInTheDocument();
    expect(en.nodi[0].titolo).not.toBe(testi.nodi[0].titolo);
  });
});
