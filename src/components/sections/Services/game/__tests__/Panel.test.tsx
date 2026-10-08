import { StrictMode } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Panel, SEQUENCE } from "../Panel";

const p = it_.services.gioco.pannello;

const banco = (c: HTMLElement) => c.querySelector('[data-game-level="pannello"]') as HTMLElement;
const console_ = (c: HTMLElement) => banco(c).querySelector(".console") as HTMLElement;
const salute = (c: HTMLElement) => Number(banco(c).querySelector(".health b")!.textContent!.replace("%", ""));
const coda = (c: HTMLElement) => banco(c).querySelector(".tail") as HTMLElement;
const modulo = (nome: string) => screen.getByRole("button", { name: nome });
const accendi = () => screen.getByRole("button", { name: new RegExp(p.spento.accendi) });

/** Il clic sincrono: userEvent con i timer finti farebbe correre il battito
 *  fra un evento e l'altro, e i conti del tempo non tornerebbero piu'. */
const tocca = (el: HTMLElement) => fireEvent.click(el);

/** Avanza il tempo finto dentro act, perche' i battiti aggiornano lo stato. */
const passa = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const monta = (props: Partial<{ onAvanti: () => void; visibile: boolean }> = {}) => {
  const onAvanti = props.onAvanti ?? vi.fn();
  const r = renderWithMessages(
    <StrictMode>
      <Panel onNext={onAvanti} visible={props.visibile ?? true} />
    </StrictMode>,
  );
  const visibile = (v: boolean) =>
    r.rerender(
      <StrictMode>
        <Panel onNext={onAvanti} visible={v} />
      </StrictMode>,
    );
  return { ...r, onAvanti, visibile };
};

describe("il pannello, i testi", () => {
  it("gli avvisi dei messaggi sono tanti quanti la sequenza dei servizi, in tutte e due le lingue", () => {
    expect(p.eventi).toHaveLength(SEQUENCE.length);
    expect(en_.services.gioco.pannello.eventi).toHaveLength(SEQUENCE.length);
  });
});

describe("il pannello, acceso e spento", () => {
  it("spento non succede niente: nessun avviso, la salute resta a 100, i moduli non si toccano", () => {
    const { container } = monta();
    expect(within(console_(container)).getByText(p.spento.titolo)).toBeInTheDocument();
    expect(within(banco(container)).getByText(p.conta.spento)).toBeInTheDocument();
    passa(20_000);
    expect(salute(container)).toBe(100);
    expect(coda(container)).toHaveTextContent(p.coda.attesa);
    expect(modulo(p.servizi.manutenzione)).toBeDisabled();
  });

  it("acceso, il primo avviso arriva dopo 1,4 s e la salute scende solo da li'", () => {
    const { container } = monta();
    tocca(accendi());
    expect(screen.getByText(p.acceso.verde.titolo)).toBeInTheDocument();

    passa(1300);
    expect(salute(container)).toBe(100);
    expect(coda(container)).toHaveTextContent(p.coda.attesa);

    passa(200);
    expect(coda(container)).toHaveTextContent(p.eventi[0].testo);
    expect(within(banco(container)).getByText("avviso 1 di 6")).toBeInTheDocument();
    expect(screen.getByText(p.acceso.spia.titolo)).toBeInTheDocument();
    expect(modulo(p.servizi.manutenzione)).toHaveClass("alarm");

    // 1,2 punti ogni 400 ms, e con lo StrictMode un intervallo solo: 4 s
    // fanno 12 punti, non 24.
    passa(4000);
    expect(salute(container)).toBe(88);
  });

  it("la salute non scende sotto 40", () => {
    const { container } = monta();
    tocca(accendi());
    passa(1400 + 60_000);
    expect(salute(container)).toBe(40);
  });
});

describe("il pannello, i moduli", () => {
  it("il modulo sbagliato dice che li' e' tutto a posto, e non c'e' niente da fare", () => {
    const { container } = monta();
    tocca(accendi());
    passa(1400);
    tocca(modulo(p.servizi.assistenza));

    const con = within(console_(container));
    expect(con.getByText(p.modulo.aPosto)).toBeInTheDocument();
    expect(con.getByText(p.modulo.altra)).toBeInTheDocument();
    expect(con.getByRole("button", { name: p.modulo.niente })).toBeDisabled();
  });

  it("il modulo giusto mostra il problema; intervenire lo risolve e la salute si ferma", () => {
    const { container } = monta();
    tocca(accendi());
    passa(1400);
    tocca(modulo(p.servizi.manutenzione));

    const con = within(console_(container));
    expect(con.getByText(p.modulo.cosa)).toBeInTheDocument();
    expect(con.getByText(p.eventi[0].testo)).toBeInTheDocument();
    tocca(con.getByRole("button", { name: new RegExp(p.eventi[0].intervento) }));

    expect(con.getByText(p.modulo.fatto)).toBeInTheDocument();
    expect(con.getByText(p.eventi[0].esito)).toBeInTheDocument();
    expect(con.getByRole("button", { name: p.modulo.aspetta })).toBeDisabled();
    expect(coda(container)).toHaveTextContent(`${p.servizi.manutenzione} · risolto`);
    expect(modulo(p.servizi.manutenzione)).not.toHaveClass("alarm");

    const ferma = salute(container);
    passa(2000);
    expect(salute(container)).toBe(ferma);

    // 2,6 s dopo l'intervento arriva il secondo avviso.
    passa(600);
    expect(coda(container)).toHaveTextContent(p.eventi[1].testo);
    expect(modulo(p.servizi.assistenza)).toHaveClass("alarm");
  });
});

describe("il pannello, fuori dallo schermo", () => {
  it("con visibile false i timer si fermano, e al rientro riprendono da dove erano", () => {
    const { container, visibile } = monta();
    tocca(accendi());
    passa(1000);
    visibile(false);
    passa(10_000);
    expect(coda(container)).toHaveTextContent(p.coda.attesa);

    visibile(true);
    passa(400);
    expect(coda(container)).toHaveTextContent(p.eventi[0].testo);
    const prima = salute(container);

    visibile(false);
    passa(10_000);
    expect(salute(container)).toBe(prima);

    visibile(true);
    passa(4000);
    expect(salute(container)).toBeLessThan(prima);
  });

  it("smontato, non resta un timer acceso", () => {
    const { unmount } = monta();
    tocca(accendi());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("il pannello, il resoconto", () => {
  const risolviTutto = (container: HTMLElement) => {
    for (const [i, servizio] of SEQUENCE.entries()) {
      passa(i === 0 ? 1400 : 2600);
      tocca(modulo(p.servizi[servizio]));
      tocca(
        within(console_(container)).getByRole("button", { name: new RegExp(p.eventi[i].intervento) }),
      );
    }
    passa(2600);
  };

  it("i sei avvisi portano al resoconto per servizio; «livello 4» chiama onAvanti", () => {
    const { container, onAvanti } = monta();
    tocca(accendi());
    risolviTutto(container);

    const con = within(console_(container));
    expect(con.getByText(p.fine.occhiello)).toBeInTheDocument();
    expect(con.getByText(p.fine.bene)).toBeInTheDocument();
    expect(within(banco(container)).getByText(p.conta.fine)).toBeInTheDocument();
    const righe = con.getAllByRole("listitem").map((li) => li.textContent);
    expect(righe).toEqual([
      "Assistenza · 1 avviso",
      "Automazioni · 1 avviso",
      "I numeri · 1 avviso",
      "Farsi trovare · 1 avviso",
      "Manutenzione · 2 avvisi",
    ]);
    expect(vi.getTimerCount()).toBe(0);

    tocca(con.getByRole("button", { name: new RegExp(p.fine.avanti) }));
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });

  it("«ricomincia» riporta al pannello spento con la salute piena", () => {
    const { container } = monta();
    tocca(accendi());
    passa(1400 + 10_000);
    risolviTutto(container);
    expect(screen.getByText(p.fine.male)).toBeInTheDocument();

    tocca(screen.getByRole("button", { name: new RegExp(p.fine.ricomincia) }));
    expect(screen.getByText(p.spento.titolo)).toBeInTheDocument();
    expect(salute(container)).toBe(100);
  });

  it("in inglese il resoconto parla inglese", () => {
    const pe = en_.services.gioco.pannello;
      renderWithMessages(<Panel onNext={vi.fn()} visible />, { locale: "en" });
    tocca(screen.getByRole("button", { name: new RegExp(pe.spento.accendi) }));
    passa(1400);
    expect(screen.getByText(pe.acceso.spia.titolo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: pe.servizi.manutenzione })).toHaveClass("alarm");
  });
});
