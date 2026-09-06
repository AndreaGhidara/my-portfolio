import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { SeekingView } from "../SeekingView";
import type { SeekingViewProps } from "../SeekingView";
import { seekingRoutes } from "@/content/seeking";

const strade = seekingRoutes.map((r, i) => ({
  id: r.id,
  nome: `Nome ${i}`,
  voice: `Voce ${i}`,
  et: `Et ${i}`,
  titolo: `Titolo ${i}`,
  etPrima: `EtPrima ${i}`,
  prima: `Prima ${i}`,
  tipo: `Tipo ${i}`,
  cta: `Cta ${i}`,
  prova: r.prova ? { testo: `Prova ${i}`, ancora: r.prova.ancora } : null,
}));

const props: SeekingViewProps = {
  eyebrow: "Partiamo da qui",
  title: "Da dove parti?",
  intro: "Cinque modi in cui di solito comincia.",
  attesa: "Non è un modulo: resta tutto qui.",
  etichettaTipo: "Che tipo di lavoro è",
  strade,
};

const css = readFileSync("src/styles/tokens.css", "utf8");

describe("la seconda sezione", () => {
  it("il titolo è un h2: sotto l'h1 dell'hero", () => {
    render(<SeekingView {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.title);
  });

  it("il testo corrente sull'arancio è inchiostro, non carta: la carta su arancio non arriva ad AA", () => {
    const { container } = render(<SeekingView {...props} />);
    expect(container.querySelector("[data-seeking-intro]")?.className).toContain("--on-accent");
    expect(container.querySelector("[data-seeking-attesa]")?.className).toContain("--on-accent");
  });

  it("dice il patto: la risposta non parte da nessuna parte", () => {
    // La riga «non è un modulo» è una promessa scritta in pagina. Se un giorno
    // la scelta comincia a viaggiare verso qualcuno, questa prova va tolta
    // INSIEME a quella riga — non prima.
    render(<SeekingView {...props} />);
    expect(screen.getByText(props.attesa)).toBeInTheDocument();
    const { container } = render(<SeekingView {...props} />);
    expect(container.querySelector("form")).toBeNull();
  });
});

describe("le cinque strade", () => {
  it("sono un gruppo solo, con la domanda per legenda", () => {
    // Per uno screen reader sono una domanda con cinque risposte, non cinque
    // caselle sparse per la pagina.
    render(<SeekingView {...props} />);
    expect(screen.getByRole("group", { name: props.title })).toBeInTheDocument();
  });

  it("sono radio veri: la tastiera funziona senza che la imitiamo", () => {
    // Un solo stop nel giro dei Tab, le frecce per cambiare, lo stato
    // annunciato. Con dei <button> andrebbe tutto riscritto a mano.
    render(<SeekingView {...props} />);
    const scelte = screen.getAllByRole("radio");
    expect(scelte).toHaveLength(seekingRoutes.length);
    for (const s of scelte) expect(s).toHaveAttribute("name", "strada");
  });

  it("nessuna parte scelta: la sezione si apre con una domanda, non con una risposta", () => {
    render(<SeekingView {...props} />);
    for (const s of screen.getAllByRole("radio")) expect(s).not.toBeChecked();
  });

  it("ogni strada porta il suo nome e la sua frase", () => {
    render(<SeekingView {...props} />);
    for (const s of strade) {
      expect(screen.getByText(s.nome)).toBeInTheDocument();
      expect(screen.getByText(s.voice)).toBeInTheDocument();
    }
  });
});

describe("le risposte", () => {
  it("sono tutte nel DOM: senza fogli di stile si legge tutto, mai un buco", () => {
    // È il patto del fallback, ed è il motivo per cui la sezione non ha
    // bisogno di JavaScript: il CSS ne scopre una, ma non è lui a produrle.
    render(<SeekingView {...props} />);
    for (const s of strade) {
      expect(screen.getByText(s.titolo)).toBeInTheDocument();
      expect(screen.getByText(s.prima)).toBeInTheDocument();
      expect(screen.getByText(s.tipo)).toBeInTheDocument();
    }
  });

  it("ognuna porta al contatto, e quelle che ce l'hanno anche alla prova", () => {
    const { container } = render(<SeekingView {...props} />);
    const risposte = container.querySelectorAll("[data-risposta]");
    expect(risposte).toHaveLength(seekingRoutes.length);
    risposte.forEach((r, i) => {
      expect(within(r as HTMLElement).getByText(strade[i].cta)).toHaveAttribute("href", "#contact");
      const p = strade[i].prova;
      const rimando = r.querySelector("[data-risposta-prova]");
      if (p) expect(rimando).toHaveAttribute("href", p.ancora);
      else expect(rimando, "«non ancora» non manda da nessuna parte").toBeNull();
    });
  });

  it("«non ancora» non chiede niente, ed è l'unica", () => {
    // Chiedere a chi ha appena ammesso di non sapere è il modo più rapido di
    // perderlo. Se un giorno le si aggiunge un rimando, questa prova cade.
    const senza = strade.filter((s) => s.prova === null);
    expect(senza).toHaveLength(1);
    expect(senza[0].id).toBe("nonancora");
  });
});

describe("il meccanismo senza JavaScript", () => {
  it("il foglio di stile sa scoprire tutte e cinque le risposte", () => {
    // L'unica cosa da tenere allineata al contenuto: una regola posizionale
    // per strada. Aggiungerne una sesta senza la sua regola vorrebbe dire una
    // risposta che non si apre mai, e nel codice non si vedrebbe.
    const regole = css.match(/\[data-strade\]:has\(\[data-strada\]:nth-child\(\d+\) input:checked\)/g);
    expect(regole ?? []).toHaveLength(seekingRoutes.length);
  });

  it("le risposte partono nascoste dal CSS, non dal markup", () => {
    // Nascoste nel markup sarebbero invisibili anche senza fogli di stile.
    expect(css).toMatch(/\[data-risposta\]\s*\{\s*display:\s*none/);
    const { container } = render(<SeekingView {...props} />);
    for (const r of container.querySelectorAll("[data-risposta]")) {
      expect(r).not.toHaveAttribute("hidden");
      expect((r as HTMLElement).style.display).toBe("");
    }
  });
});
