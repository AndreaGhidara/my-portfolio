import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithMessages } from "@/test/renderWithMessages";
import { installIntersectionObserver } from "@/test/intersectionObserver";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Game } from "../Game";
import type { LevelId, LevelProps } from "../levels";

// Si prova il guscio: i quattro livelli sono finti, con la stessa radice e `visible` in chiaro.
const { fakeLevel } = vi.hoisted(() => ({
  fakeLevel: (id: LevelId) =>
    function FakeLevel({ onNext, visible }: LevelProps) {
      return (
        <div className="bench" data-game-level={id} data-visible={visible ? "si" : "no"}>
          <div className="actions">
            <button type="button" onClick={onNext}>
              avanti finto
            </button>
          </div>
        </div>
      );
    },
}));
vi.mock("../Screen", () => ({ Screen: fakeLevel("schermo") }));
vi.mock("../Logic", () => ({ Logic: fakeLevel("logiche") }));
vi.mock("../Panel", () => ({ Panel: fakeLevel("pannello") }));
vi.mock("../Night", () => ({ Night: fakeLevel("notte") }));

const common = it_.services.gioco.comune;
const ending = it_.services.gioco.finale;

const bench = (container: HTMLElement) =>
  container.querySelector("[data-game-level]") as HTMLElement;

const bars = (name = common.barrette) =>
  within(screen.getByRole("group", { name })).getAllByRole("button");

const nextButton = (container: HTMLElement) =>
  within(bench(container)).getByRole("button", { name: "avanti finto" });

// Il guscio ignora un secondo tocco entro 350 ms: Date avanza di 400 ms prima di ogni tocco.
const press = async (user: ReturnType<typeof userEvent.setup>, el: Element) => {
  vi.setSystemTime(Date.now() + 400);
  await user.click(el);
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
    expect(bench(container)).toHaveAttribute("data-game-level", "schermo");

    const [first, ...rest] = bars();
    expect(bars()).toHaveLength(4);
    expect(first).toHaveAttribute("aria-current", "step");
    expect(first).toHaveTextContent(`1 · ${common.livelli.schermo}`);
    for (const b of rest) {
      expect(b).toBeDisabled();
      expect(b).not.toHaveAttribute("aria-current");
    }
  });

  it("la riga sotto le barrette dice cosa si fa nel livello, e cambia con lui", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    expect(screen.getByText(common.righe.schermo)).toBeInTheDocument();
    await press(user, nextButton(container));
    expect(screen.getByText(common.righe.logiche)).toBeInTheDocument();
    expect(screen.queryByText(common.righe.schermo)).toBeNull();
  });

  it("riapre i livelli gia' raggiunti, non quelli dopo", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    await press(user, nextButton(container));
    await press(user, nextButton(container));
    expect(bench(container)).toHaveAttribute("data-game-level", "pannello");

    await user.click(bars()[0]);
    expect(bench(container)).toHaveAttribute("data-game-level", "schermo");
    const [one, two, three, four] = bars();
    expect(one).toHaveAttribute("aria-current", "step");
    expect(two).toBeEnabled();
    expect(three).toBeEnabled();
    expect(four).toBeDisabled();

    await user.click(three);
    expect(bench(container)).toHaveAttribute("data-game-level", "pannello");
  });
});

describe("il gioco, il giro intero", () => {
  it("dai quattro segnaposto si arriva al finale, e li' le barrette sono tutte fatte", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (const level of ["schermo", "logiche", "pannello", "notte"]) {
      expect(bench(container)).toHaveAttribute("data-game-level", level);
      await press(user, nextButton(container));
    }
    expect(bench(container)).toHaveAttribute("data-game-level", "finale");
    expect(screen.getByRole("heading", { name: ending.titolo })).toBeInTheDocument();

    for (const b of bars()) {
      expect(b).toBeEnabled();
      expect(b).not.toHaveAttribute("aria-current");
    }
  });

  it("«torna al sito» ricomincia dal livello 1, e i livelli dopo si richiudono", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await press(user, nextButton(container));

    await press(user, screen.getByRole("button", { name: new RegExp(ending.tornaAlSito) }));
    expect(bench(container)).toHaveAttribute("data-game-level", "schermo");
    const [one, ...rest] = bars();
    expect(one).toHaveAttribute("aria-current", "step");
    for (const b of rest) expect(b).toBeDisabled();
  });

  it("«parliamone» porta ai Contatti", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await press(user, nextButton(container));
    expect(screen.getByRole("link", { name: new RegExp(ending.parliamone) })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  it("il finale elenca i quattro strati, nell'ordine dei livelli", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    for (let i = 0; i < 4; i++) await press(user, nextButton(container));
    const layers = within(bench(container)).getAllByRole("listitem");
    expect(layers.map((s) => s.textContent)).toEqual([
      `1${ending.strati.schermo}`,
      `2${ending.strati.logiche}`,
      `3${ending.strati.pannello}`,
      `4${ending.strati.notte}`,
    ]);
  });
});

describe("il doppio tocco", () => {
  it("due tocchi entro 350 ms fanno avanzare di un livello solo", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(nextButton(container));
    expect(bench(container)).toHaveAttribute("data-game-level", "logiche");
    vi.setSystemTime(Date.now() + 200);
    fireEvent.click(nextButton(container));
    expect(bench(container)).toHaveAttribute("data-game-level", "logiche");
  });

  it("dopo 350 ms il secondo tocco passa", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(nextButton(container));
    vi.setSystemTime(Date.now() + 360);
    fireEvent.click(nextButton(container));
    expect(bench(container)).toHaveAttribute("data-game-level", "pannello");
  });

  it("le barrette non sono pulsanti del banco: si premono subito", () => {
    const { container } = renderWithMessages(<Game />);
    fireEvent.click(nextButton(container));
    fireEvent.click(bars()[0]);
    expect(bench(container)).toHaveAttribute("data-game-level", "schermo");
  });
});

describe("il cambio di livello si sente", () => {
  it("il fuoco va sul banco nuovo, ma non al primo montaggio", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    expect(document.activeElement).not.toBe(bench(container));
    await press(user, nextButton(container));
    expect(document.activeElement).toBe(bench(container));
    expect(bench(container)).toHaveAttribute("data-game-level", "logiche");
    expect(bench(container)).toHaveAttribute("tabindex", "-1");
  });

  it("la riga del livello e' una regione che si annuncia", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMessages(<Game />);
    const line = container.querySelector("[data-game-line]") as HTMLElement;
    expect(line).toHaveAttribute("aria-live", "polite");
    await press(user, nextButton(container));
    // La stessa regione col testo nuovo: una regione appena nata non si annuncia.
    expect(container.querySelector("[data-game-line]")).toBe(line);
    expect(line).toHaveTextContent(common.righe.logiche);
  });
});

describe("il gioco passa ai livelli se e' sullo schermo", () => {
  it("visibile parte vero, diventa falso quando il gioco esce, e torna vero al rientro", () => {
    vi.unstubAllGlobals();
    const io = installIntersectionObserver();
    const { container } = renderWithMessages(<Game />);
    expect(bench(container)).toHaveAttribute("data-visible", "si");
    io.exit();
    expect(bench(container)).toHaveAttribute("data-visible", "no");
    io.enter();
    expect(bench(container)).toHaveAttribute("data-visible", "si");
  });
});

describe("il gioco in inglese", () => {
  it("barrette e riga parlano la lingua della pagina", () => {
    renderWithMessages(<Game />, { locale: "en" });
    expect(bars(en_.services.gioco.comune.barrette)[0]).toHaveTextContent("1 · screen");
    expect(screen.getByText(/First build the screen/)).toBeInTheDocument();
  });
});
