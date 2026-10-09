import { StrictMode } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Panel, SEQUENCE } from "../Panel";

const p = it_.services.gioco.pannello;

const bench = (c: HTMLElement) => c.querySelector('[data-game-level="pannello"]') as HTMLElement;
const console_ = (c: HTMLElement) => bench(c).querySelector(".console") as HTMLElement;
const health = (c: HTMLElement) => Number(bench(c).querySelector(".health b")!.textContent!.replace("%", ""));
const tail = (c: HTMLElement) => bench(c).querySelector(".tail") as HTMLElement;
const moduleButton = (name: string) => screen.getByRole("button", { name: name });
const switchOn = () => screen.getByRole("button", { name: new RegExp(p.spento.accendi) });

// Clic sincrono: userEvent coi timer finti farebbe correre il battito fra un evento e l'altro.
const tap = (el: HTMLElement) => fireEvent.click(el);

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const mount = (props: Partial<{ onNext: () => void; visible: boolean }> = {}) => {
  const onNext = props.onNext ?? vi.fn();
  const r = renderWithMessages(
    <StrictMode>
      <Panel onNext={onNext} visible={props.visible ?? true} />
    </StrictMode>,
  );
  const setVisible = (v: boolean) =>
    r.rerender(
      <StrictMode>
        <Panel onNext={onNext} visible={v} />
      </StrictMode>,
    );
  return { ...r, onNext, setVisible };
};

describe("il pannello, i testi", () => {
  it("gli avvisi dei messaggi sono tanti quanti la sequenza dei servizi, in tutte e due le lingue", () => {
    expect(p.eventi).toHaveLength(SEQUENCE.length);
    expect(en_.services.gioco.pannello.eventi).toHaveLength(SEQUENCE.length);
  });
});

describe("il pannello, acceso e spento", () => {
  it("spento non succede niente: nessun avviso, la salute resta a 100, i moduli non si toccano", () => {
    const { container } = mount();
    expect(within(console_(container)).getByText(p.spento.titolo)).toBeInTheDocument();
    expect(within(bench(container)).getByText(p.conta.spento)).toBeInTheDocument();
    advance(20_000);
    expect(health(container)).toBe(100);
    expect(tail(container)).toHaveTextContent(p.coda.attesa);
    expect(moduleButton(p.servizi.manutenzione)).toBeDisabled();
  });

  it("acceso, il primo avviso arriva dopo 1,4 s e la salute scende solo da li'", () => {
    const { container } = mount();
    tap(switchOn());
    expect(screen.getByText(p.acceso.verde.titolo)).toBeInTheDocument();

    advance(1300);
    expect(health(container)).toBe(100);
    expect(tail(container)).toHaveTextContent(p.coda.attesa);

    advance(200);
    expect(tail(container)).toHaveTextContent(p.eventi[0].testo);
    expect(within(bench(container)).getByText("avviso 1 di 6")).toBeInTheDocument();
    expect(screen.getByText(p.acceso.spia.titolo)).toBeInTheDocument();
    expect(moduleButton(p.servizi.manutenzione)).toHaveClass("alarm");

    // 1,2 punti ogni 400 ms, e in StrictMode un intervallo solo: 12 punti, non 24.
    advance(4000);
    expect(health(container)).toBe(88);
  });

  it("la salute non scende sotto 40", () => {
    const { container } = mount();
    tap(switchOn());
    advance(1400 + 60_000);
    expect(health(container)).toBe(40);
  });
});

describe("il pannello, i moduli", () => {
  it("il modulo sbagliato dice che li' e' tutto a posto, e non c'e' niente da fare", () => {
    const { container } = mount();
    tap(switchOn());
    advance(1400);
    tap(moduleButton(p.servizi.assistenza));

    const con = within(console_(container));
    expect(con.getByText(p.modulo.aPosto)).toBeInTheDocument();
    expect(con.getByText(p.modulo.altra)).toBeInTheDocument();
    expect(con.getByRole("button", { name: p.modulo.niente })).toBeDisabled();
  });

  it("il modulo giusto mostra il problema; intervenire lo risolve e la salute si ferma", () => {
    const { container } = mount();
    tap(switchOn());
    advance(1400);
    tap(moduleButton(p.servizi.manutenzione));

    const con = within(console_(container));
    expect(con.getByText(p.modulo.cosa)).toBeInTheDocument();
    expect(con.getByText(p.eventi[0].testo)).toBeInTheDocument();
    tap(con.getByRole("button", { name: new RegExp(p.eventi[0].intervento) }));

    expect(con.getByText(p.modulo.fatto)).toBeInTheDocument();
    expect(con.getByText(p.eventi[0].esito)).toBeInTheDocument();
    expect(con.getByRole("button", { name: p.modulo.aspetta })).toBeDisabled();
    expect(tail(container)).toHaveTextContent(`${p.servizi.manutenzione} · risolto`);
    expect(moduleButton(p.servizi.manutenzione)).not.toHaveClass("alarm");

    const stalled = health(container);
    advance(2000);
    expect(health(container)).toBe(stalled);

    // 2,6 s dopo l'intervento arriva il secondo avviso.
    advance(600);
    expect(tail(container)).toHaveTextContent(p.eventi[1].testo);
    expect(moduleButton(p.servizi.assistenza)).toHaveClass("alarm");
  });
});

describe("il pannello, fuori dallo schermo", () => {
  it("con visibile false i timer si fermano, e al rientro riprendono da dove erano", () => {
    const { container, setVisible } = mount();
    tap(switchOn());
    advance(1000);
    setVisible(false);
    advance(10_000);
    expect(tail(container)).toHaveTextContent(p.coda.attesa);

    setVisible(true);
    advance(400);
    expect(tail(container)).toHaveTextContent(p.eventi[0].testo);
    const before = health(container);

    setVisible(false);
    advance(10_000);
    expect(health(container)).toBe(before);

    setVisible(true);
    advance(4000);
    expect(health(container)).toBeLessThan(before);
  });

  it("smontato, non resta un timer acceso", () => {
    const { unmount } = mount();
    tap(switchOn());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("il pannello, il resoconto", () => {
  const solveAll = (container: HTMLElement) => {
    for (const [i, service] of SEQUENCE.entries()) {
      advance(i === 0 ? 1400 : 2600);
      tap(moduleButton(p.servizi[service]));
      tap(
        within(console_(container)).getByRole("button", { name: new RegExp(p.eventi[i].intervento) }),
      );
    }
    advance(2600);
  };

  it("i sei avvisi portano al resoconto per servizio; «livello 4» chiama onNext", () => {
    const { container, onNext } = mount();
    tap(switchOn());
    solveAll(container);

    const con = within(console_(container));
    expect(con.getByText(p.fine.occhiello)).toBeInTheDocument();
    expect(con.getByText(p.fine.bene)).toBeInTheDocument();
    expect(within(bench(container)).getByText(p.conta.fine)).toBeInTheDocument();
    const rows = con.getAllByRole("listitem").map((li) => li.textContent);
    expect(rows).toEqual([
      "Assistenza · 1 avviso",
      "Automazioni · 1 avviso",
      "I numeri · 1 avviso",
      "Farsi trovare · 1 avviso",
      "Manutenzione · 2 avvisi",
    ]);
    expect(vi.getTimerCount()).toBe(0);

    tap(con.getByRole("button", { name: new RegExp(p.fine.avanti) }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("«ricomincia» riporta al pannello spento con la salute piena", () => {
    const { container } = mount();
    tap(switchOn());
    advance(1400 + 10_000);
    solveAll(container);
    expect(screen.getByText(p.fine.male)).toBeInTheDocument();

    tap(screen.getByRole("button", { name: new RegExp(p.fine.ricomincia) }));
    expect(screen.getByText(p.spento.titolo)).toBeInTheDocument();
    expect(health(container)).toBe(100);
  });

  it("in inglese il resoconto parla inglese", () => {
    const pe = en_.services.gioco.pannello;
      renderWithMessages(<Panel onNext={vi.fn()} visible />, { locale: "en" });
    tap(screen.getByRole("button", { name: new RegExp(pe.spento.accendi) }));
    advance(1400);
    expect(screen.getByText(pe.acceso.spia.titolo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: pe.servizi.manutenzione })).toHaveClass("alarm");
  });
});
