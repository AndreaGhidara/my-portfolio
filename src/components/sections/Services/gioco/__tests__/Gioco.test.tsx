import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConTesti } from "@/test/renderConTesti";
import { installaIntersectionObserver } from "@/test/intersectionObserver";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Gioco } from "../Gioco";
import type { IdLivello, LivelloProps } from "../livelli";

/**
 * Qui si prova il guscio, non i livelli: ognuno ha le sue prove. Al posto dei
 * quattro livelli veri c'e' un banco finto con la stessa radice, un pulsante
 * che chiama onAvanti e `visibile` scritto in chiaro, cosi' si vede anche che
 * il guscio lo passa giu'. Il finale resta quello vero: e' del guscio.
 */
const { livelloFinto } = vi.hoisted(() => ({
  livelloFinto: (id: IdLivello) =>
    function LivelloFinto({ onAvanti, visibile }: LivelloProps) {
      return (
        <div className="banco" data-gioco-livello={id} data-visibile={visibile ? "si" : "no"}>
          <button type="button" onClick={onAvanti}>
            avanti finto
          </button>
        </div>
      );
    },
}));
vi.mock("../Schermo", () => ({ Schermo: livelloFinto("schermo") }));
vi.mock("../Logiche", () => ({ Logiche: livelloFinto("logiche") }));
vi.mock("../Pannello", () => ({ Pannello: livelloFinto("pannello") }));
vi.mock("../Notte", () => ({ Notte: livelloFinto("notte") }));

const comune = it_.services.gioco.comune;
const finale = it_.services.gioco.finale;

const banco = (container: HTMLElement) =>
  container.querySelector("[data-gioco-livello]") as HTMLElement;

const barrette = (nome = comune.barrette) =>
  within(screen.getByRole("group", { name: nome })).getAllByRole("button");

/** Il pulsante del livello finto che chiama onAvanti. */
const avanti = (container: HTMLElement) =>
  within(banco(container)).getByRole("button", { name: "avanti finto" });

beforeEach(() => {
  installaIntersectionObserver();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("il gioco, le barrette", () => {
  it("parte dal livello 1: e' l'unica barretta corrente, le altre non si aprono", () => {
    const { container } = renderConTesti(<Gioco />);
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "schermo");

    const [prima, ...resto] = barrette();
    expect(barrette()).toHaveLength(4);
    expect(prima).toHaveAttribute("aria-current", "step");
    expect(prima).toHaveTextContent(`1 · ${comune.livelli.schermo}`);
    for (const b of resto) {
      expect(b).toBeDisabled();
      expect(b).not.toHaveAttribute("aria-current");
    }
  });

  it("la riga sotto le barrette dice cosa si fa nel livello, e cambia con lui", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    expect(screen.getByText(comune.righe.schermo)).toBeInTheDocument();
    await utente.click(avanti(container));
    expect(screen.getByText(comune.righe.logiche)).toBeInTheDocument();
    expect(screen.queryByText(comune.righe.schermo)).toBeNull();
  });

  it("riapre i livelli gia' raggiunti, non quelli dopo", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    await utente.click(avanti(container));
    await utente.click(avanti(container));
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "pannello");

    await utente.click(barrette()[0]);
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "schermo");
    const [uno, due, tre, quattro] = barrette();
    expect(uno).toHaveAttribute("aria-current", "step");
    expect(due).toBeEnabled();
    expect(tre).toBeEnabled();
    expect(quattro).toBeDisabled();

    await utente.click(tre);
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "pannello");
  });
});

describe("il gioco, il giro intero", () => {
  it("dai quattro segnaposto si arriva al finale, e li' le barrette sono tutte fatte", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    for (const livello of ["schermo", "logiche", "pannello", "notte"]) {
      expect(banco(container)).toHaveAttribute("data-gioco-livello", livello);
      await utente.click(avanti(container));
    }
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "finale");
    expect(screen.getByRole("heading", { name: finale.titolo })).toBeInTheDocument();

    for (const b of barrette()) {
      expect(b).toBeEnabled();
      expect(b).not.toHaveAttribute("aria-current");
    }
  });

  it("«torna al sito» ricomincia dal livello 1, e i livelli dopo si richiudono", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    for (let i = 0; i < 4; i++) await utente.click(avanti(container));

    await utente.click(screen.getByRole("button", { name: new RegExp(finale.tornaAlSito) }));
    expect(banco(container)).toHaveAttribute("data-gioco-livello", "schermo");
    const [uno, ...resto] = barrette();
    expect(uno).toHaveAttribute("aria-current", "step");
    for (const b of resto) expect(b).toBeDisabled();
  });

  it("«parliamone» porta ai Contatti", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    for (let i = 0; i < 4; i++) await utente.click(avanti(container));
    expect(screen.getByRole("link", { name: new RegExp(finale.parliamone) })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  it("il finale elenca i quattro strati, nell'ordine dei livelli", async () => {
    const utente = userEvent.setup();
    const { container } = renderConTesti(<Gioco />);
    for (let i = 0; i < 4; i++) await utente.click(avanti(container));
    const strati = within(banco(container)).getAllByRole("listitem");
    expect(strati.map((s) => s.textContent)).toEqual([
      `1${finale.strati.schermo}`,
      `2${finale.strati.logiche}`,
      `3${finale.strati.pannello}`,
      `4${finale.strati.notte}`,
    ]);
  });
});

describe("il gioco passa ai livelli se e' sullo schermo", () => {
  it("visibile parte vero, diventa falso quando il gioco esce, e torna vero al rientro", () => {
    vi.unstubAllGlobals();
    const io = installaIntersectionObserver();
    const { container } = renderConTesti(<Gioco />);
    expect(banco(container)).toHaveAttribute("data-visibile", "si");
    io.esce();
    expect(banco(container)).toHaveAttribute("data-visibile", "no");
    io.entra();
    expect(banco(container)).toHaveAttribute("data-visibile", "si");
  });
});

describe("il gioco in inglese", () => {
  it("barrette e riga parlano la lingua della pagina", () => {
    renderConTesti(<Gioco />, { locale: "en" });
    expect(barrette(en_.services.gioco.comune.barrette)[0]).toHaveTextContent("1 · screen");
    expect(screen.getByText(/First build the screen/)).toBeInTheDocument();
  });
});
