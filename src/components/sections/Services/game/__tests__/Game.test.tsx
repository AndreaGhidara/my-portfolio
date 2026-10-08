import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithMessages } from "@/test/renderWithMessages";
import { installIntersectionObserver } from "@/test/intersectionObserver";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Game } from "../Game";
import type { LevelId, LevelProps } from "../levels";

/**
 * Qui si prova il guscio, non i livelli: ognuno ha le sue prove. Al posto dei
 * quattro livelli veri c'e' un banco finto con la stessa radice, un pulsante
 * che chiama onAvanti e `visibile` scritto in chiaro, cosi' si vede anche che
 * il guscio lo passa giu'. Il finale resta quello vero: e' del guscio.
 */
const { livelloFinto } = vi.hoisted(() => ({
  livelloFinto: (id: LevelId) =>
    function LivelloFinto({ onNext: onAvanti, visible: visibile }: LevelProps) {
      return (
        <div className="bench" data-game-level={id} data-visible={visibile ? "si" : "no"}>
          <div className="actions">
            <button type="button" onClick={onAvanti}>
              avanti finto
            </button>
          </div>
        </div>
      );
    },
}));
vi.mock("../Screen", () => ({ Screen: livelloFinto("schermo") }));
vi.mock("../Logic", () => ({ Logic: livelloFinto("logiche") }));
vi.mock("../Panel", () => ({ Panel: livelloFinto("pannello") }));
vi.mock("../Night", () => ({ Night: livelloFinto("notte") }));

const comune = it_.services.gioco.comune;
const finale = it_.services.gioco.finale;

const banco = (container: HTMLElement) =>
  container.querySelector("[data-game-level]") as HTMLElement;

const barrette = (nome = comune.barrette) =>
  within(screen.getByRole("group", { name: nome })).getAllByRole("button");

/** Il pulsante del livello finto che chiama onAvanti. */
const avanti = (container: HTMLElement) =>
  within(banco(container)).getByRole("button", { name: "avanti finto" });

/**
 * Il guscio ignora un secondo tocco sui pulsanti del banco che arriva entro
 * 350 ms dal primo (il doppio tocco). Le prove del giro premono come una
 * persona che legge: l'orologio va avanti di 400 ms prima di ogni tocco. E'
 * finto solo Date, da cui jsdom prende il timeStamp degli eventi.
 */
const premi = async (utente: ReturnType<typeof userEvent.setup>, el: Element) => {
  vi.setSystemTime(Date.now() + 400);
  await utente.click(el);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  installIntersectionObserver();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("il gioco, le barrette", () => {
  it("parte dal livello 1: e' l'unica barretta corrente, le altre non si aprono", () => {
    const { container } = renderWithMessages(<Game />);
    expect(banco(container)).toHaveAttribute("data-game-level", "schermo");

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
    const { container } = renderWithMessages(<Game />);
    expect(screen.getByText(comune.righe.schermo)).toBeInTheDocument();
    await premi(utente, avanti(container));
    expect(screen.getByText(comune.righe.logiche)).toBeInTheDocument();
    expect(screen.queryByText(comune.righe.schermo)).toBeNull();
  });

  it("riapre i livelli gia' raggiunti, non quelli dopo", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    await premi(utente, avanti(container));
    await premi(utente, avanti(container));
    expect(banco(container)).toHaveAttribute("data-game-level", "pannello");

    await utente.click(barrette()[0]);
    expect(banco(container)).toHaveAttribute("data-game-level", "schermo");
    const [uno, due, tre, quattro] = barrette();
    expect(uno).toHaveAttribute("aria-current", "step");
    expect(due).toBeEnabled();
    expect(tre).toBeEnabled();
    expect(quattro).toBeDisabled();

    await utente.click(tre);
    expect(banco(container)).toHaveAttribute("data-game-level", "pannello");
  });
});

describe("il gioco, il giro intero", () => {
  it("dai quattro segnaposto si arriva al finale, e li' le barrette sono tutte fatte", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (const livello of ["schermo", "logiche", "pannello", "notte"]) {
      expect(banco(container)).toHaveAttribute("data-game-level", livello);
      await premi(utente, avanti(container));
    }
    expect(banco(container)).toHaveAttribute("data-game-level", "finale");
    expect(screen.getByRole("heading", { name: finale.titolo })).toBeInTheDocument();

    for (const b of barrette()) {
      expect(b).toBeEnabled();
      expect(b).not.toHaveAttribute("aria-current");
    }
  });

  it("«torna al sito» ricomincia dal livello 1, e i livelli dopo si richiudono", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await premi(utente, avanti(container));

    await premi(utente, screen.getByRole("button", { name: new RegExp(finale.tornaAlSito) }));
    expect(banco(container)).toHaveAttribute("data-game-level", "schermo");
    const [uno, ...resto] = barrette();
    expect(uno).toHaveAttribute("aria-current", "step");
    for (const b of resto) expect(b).toBeDisabled();
  });

  it("«parliamone» porta ai Contatti", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await premi(utente, avanti(container));
    expect(screen.getByRole("link", { name: new RegExp(finale.parliamone) })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  it("il finale elenca i quattro strati, nell'ordine dei livelli", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await premi(utente, avanti(container));
    const strati = within(banco(container)).getAllByRole("listitem");
    expect(strati.map((s) => s.textContent)).toEqual([
      `1${finale.strati.schermo}`,
      `2${finale.strati.logiche}`,
      `3${finale.strati.pannello}`,
      `4${finale.strati.notte}`,
    ]);
  });
});

describe("il doppio tocco", () => {
  it("due tocchi entro 350 ms fanno avanzare di un livello solo", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(avanti(container));
    expect(banco(container)).toHaveAttribute("data-game-level", "logiche");
    vi.setSystemTime(Date.now() + 200);
    fireEvent.click(avanti(container));
    expect(banco(container)).toHaveAttribute("data-game-level", "logiche");
  });

  it("dopo 350 ms il secondo tocco passa", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(avanti(container));
    vi.setSystemTime(Date.now() + 360);
    fireEvent.click(avanti(container));
    expect(banco(container)).toHaveAttribute("data-game-level", "pannello");
  });

  it("le barrette non sono pulsanti del banco: si premono subito", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(avanti(container));
    fireEvent.click(barrette()[0]);
    expect(banco(container)).toHaveAttribute("data-game-level", "schermo");
  });
});

describe("il cambio di livello si sente", () => {
  it("il fuoco va sul banco nuovo, ma non al primo montaggio", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    expect(document.activeElement).not.toBe(banco(container));
    await premi(utente, avanti(container));
    expect(document.activeElement).toBe(banco(container));
    expect(banco(container)).toHaveAttribute("data-game-level", "logiche");
    expect(banco(container)).toHaveAttribute("tabindex", "-1");
  });

  it("la riga del livello e' una regione che si annuncia", async () => {
    const utente = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    const riga = container.querySelector("[data-game-line]") as HTMLElement;
    expect(riga).toHaveAttribute("aria-live", "polite");
    await premi(utente, avanti(container));
    // La stessa regione, col testo nuovo: una regione appena nata non la
    // annuncia nessuno.
    expect(container.querySelector("[data-game-line]")).toBe(riga);
    expect(riga).toHaveTextContent(comune.righe.logiche);
  });
});

describe("il gioco passa ai livelli se e' sullo schermo", () => {
  it("visibile parte vero, diventa falso quando il gioco esce, e torna vero al rientro", () => {
    vi.unstubAllGlobals();
    const io = installIntersectionObserver();
    const { container } = renderWithMessages(<Game />);
    expect(banco(container)).toHaveAttribute("data-visible", "si");
    io.exit();
    expect(banco(container)).toHaveAttribute("data-visible", "no");
    io.enter();
    expect(banco(container)).toHaveAttribute("data-visible", "si");
  });
});

describe("il gioco in inglese", () => {
  it("barrette e riga parlano la lingua della pagina", () => {
    renderWithMessages(<Game />, { locale: "en" });
    expect(barrette(en_.services.gioco.comune.barrette)[0]).toHaveTextContent("1 · screen");
    expect(screen.getByText(/First build the screen/)).toBeInTheDocument();
  });
});
