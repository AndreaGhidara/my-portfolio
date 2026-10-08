import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithMessages } from "@/test/renderWithMessages";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Logic } from "../Logic";

const copy = it_.services.gioco.logiche;

const bench = (container: HTMLElement) =>
  container.querySelector('[data-game-level="logiche"]') as HTMLElement;
const stage = (container: HTMLElement) => bench(container).querySelector(".stage") as HTMLElement;
const button = (name: string) => screen.getByRole("button", { name: new RegExp(name) });

const mount = (onNext = vi.fn(), locale: "it" | "en" = "it") => {
  const user = userEvent.setup();
  const rendered = renderWithMessages(<Logic onNext={onNext} visible />, { locale });
  return { user, onNext, ...rendered };
};

/** Il pulsante che porta al nodo dopo, col nome di quel nodo. */
const nextTo = (name: string) => copy.avanti.replace("{nome}", name);

/** Dalla partenza al primo nodo: il pulsante del sito finto. */
const start = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(button(copy.partenza.prenota));

describe("le logiche, la partenza", () => {
  it("parte dalla schermata del Forno Aurora, e «Prenota la torta» porta al primo nodo", async () => {
    const { user, container } = mount();
    expect(bench(container)).toBeInTheDocument();
    expect(screen.getByText(copy.partenza.indirizzo)).toBeInTheDocument();
    expect(screen.getByText(copy.partenza.appuntoTitolo)).toBeInTheDocument();

    await start(user);
    expect(screen.getByText(copy.nodi[0].titolo)).toBeInTheDocument();
    expect(screen.queryByText(copy.partenza.appuntoTitolo)).toBeNull();
  });

  it("anche l'appunto «Qui puoi prenotare» porta al primo nodo", async () => {
    const { user } = mount();
    await user.click(button(copy.partenza.appuntoTitolo));
    expect(screen.getByText(copy.nodi[0].titolo)).toBeInTheDocument();
  });
});

describe("le logiche, i sei nodi", () => {
  it("con fai e avanti si attraversano i sei nodi fino allo scontrino di Andrea", async () => {
    const { user, container } = mount();
    await start(user);
    for (const [i, node] of copy.nodi.entries()) {
      expect(screen.getByText(node.titolo)).toBeInTheDocument();
      await user.click(button(node.fai));
      await user.click(button(i < 5 ? nextTo(copy.nodi[i + 1].nome) : copy.stampa));
    }
    expect(within(stage(container)).getByText(/ORDINE N\. 0142 · ANDREA/)).toBeInTheDocument();
    expect(screen.getByText(copy.fine.titolo)).toBeInTheDocument();
  });

  it("rompi mostra l'incidente al posto della scena; fai lo toglie e resta il badge", async () => {
    const { user, container } = mount();
    await start(user);
    const node = copy.nodi[0];

    await user.click(button(node.rompi));
    expect(within(stage(container)).getByText(node.errore)).toBeInTheDocument();
    expect(within(stage(container)).getByText(node.regola.se)).toBeInTheDocument();
    expect(within(stage(container)).getByText(node.regola.allora)).toBeInTheDocument();
    expect(within(stage(container)).getByText(copy.incidente.salvato)).toBeInTheDocument();
    expect(button(copy.giaRotto)).toBeDisabled();

    await user.click(button(node.fai));
    expect(within(stage(container)).queryByText(node.errore)).toBeNull();
    expect(within(stage(container)).getByText(copy.trovata)).toBeInTheDocument();
  });

  it("tornando a un nodo gia' fatto e rotto l'errore non c'e', c'e' il badge", async () => {
    const { user, container } = mount();
    await start(user);
    const [first, second] = copy.nodi;
    await user.click(button(first.rompi));
    await user.click(button(first.fai));
    await user.click(button(nextTo(second.nome)));
    expect(screen.getByText(second.titolo)).toBeInTheDocument();

    // Il nodo nel circuito: si riapre perche' e' fatto.
    await user.click(within(bench(container)).getByRole("button", { name: new RegExp(`1 .* ${first.nome}`) }));
    expect(screen.getByText(first.titolo)).toBeInTheDocument();
    expect(within(stage(container)).queryByText(first.errore)).toBeNull();
    expect(within(stage(container)).getByText(copy.trovata)).toBeInTheDocument();
  });

  it("i nodi non ancora raggiunti nel circuito non si aprono", async () => {
    const { user, container } = mount();
    await start(user);
    const third = within(bench(container)).getByRole("button", { name: new RegExp(`3 .* ${copy.nodi[2].nome}`) });
    expect(third).toBeDisabled();
  });
});

describe("le logiche, la fine", () => {
  const toTheEnd = async (user: ReturnType<typeof userEvent.setup>) => {
    await start(user);
    for (const [i, node] of copy.nodi.entries()) {
      await user.click(button(node.fai));
      await user.click(button(i < 5 ? nextTo(copy.nodi[i + 1].nome) : copy.stampa));
    }
  };

  it("«livello 3» chiama onNext", async () => {
    const { user, onNext } = mount();
    await toTheEnd(user);
    await user.click(button(copy.fine.livello3));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("«ricomincia» torna alla schermata del forno", async () => {
    const { user } = mount();
    await toTheEnd(user);
    await user.click(button(copy.fine.ricomincia));
    expect(screen.getByText(copy.partenza.appuntoTitolo)).toBeInTheDocument();
  });
});

describe("le logiche, in inglese", () => {
  it("i testi ci sono, e non sono quelli italiani", async () => {
    const en = en_.services.gioco.logiche;
    const user = userEvent.setup();
    renderWithMessages(<Logic onNext={vi.fn()} visible />, { locale: "en" });
    expect(screen.getByText(en.partenza.appuntoTitolo)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: new RegExp(en.partenza.prenota) }));
    expect(screen.getByText(en.nodi[0].titolo)).toBeInTheDocument();
    expect(en.nodi[0].titolo).not.toBe(copy.nodi[0].titolo);
  });
});
