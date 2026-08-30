import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ServicesView } from "../ServicesView";
import type { ServicesViewProps } from "../ServicesView";
import { LABEL, drawWidth } from "../layers";

const layer = (id: string, n: number, mute = false) => ({
  id,
  title: `Strato ${id}`,
  lead: `A cosa serve lo strato ${id}.`,
  objects: Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i}`,
    shape: "sheet" as const,
    label: mute && i === n - 1 ? null : `${id} oggetto ${i}`,
  })),
});

/**
 * Il mondo viene disegnato due volte, una per formato, e il CSS ne nasconde uno.
 * Il gemello nascosto porta data-ghost: sta nel DOM ma non conta, ne' per i test
 * ne' per uno screen reader.
 */
const SOLI_VERI = "[data-desk-object]:not([data-ghost])";

const props: ServicesViewProps = {
  eyebrow: "Il metodo",
  stageTitle: "Tutto quello che non si vede",
  stageLead: "Un sito finito.",
  centre: "il progetto",
  punch: "Quello che chiami «un sito» è lo schermo al centro.",
  blank: "E la tua, qual è?",
  practice: "E in pratica?",
  intro: "Quattro modi di lavorare.",
  layers: [layer("site", 6), layer("logic", 6), layer("infra", 6), layer("growth", 6, true)],
  items: [
    { id: "sites", title: "Siti e landing", description: "Niente temi comprati." },
    { id: "ecommerce", title: "E-commerce", description: "Il catalogo lo collego." },
    { id: "webapp", title: "Web app", description: "Si parte dalla versione piccola." },
    { id: "ai", title: "AI e automazioni", description: "Collegate ai tuoi dati veri." },
  ],
};

describe("la sezione del tavolo", () => {
  it("è ancorabile dalla navbar", () => {
    const { container } = render(<ServicesView {...props} />);
    expect(container.querySelector("section#services")).not.toBeNull();
  });

  it("ha un titolo vero, non un titolo disegnato", () => {
    render(<ServicesView {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.stageTitle);
  });

  it("dice la sua tesi: è quella la ragione per cui la sezione esiste", () => {
    render(<ServicesView {...props} />);
    expect(screen.getByText(props.punch)).toBeInTheDocument();
  });
});

describe("il tavolo è la lista", () => {
  it("i quattro strati sono una lista ordinata: l'ordine è la distanza dal centro", () => {
    const { container } = render(<ServicesView {...props} />);
    const ol = container.querySelector("[data-desk-world]:not([aria-hidden]) [data-desk-layers]");
    expect(ol?.tagName).toBe("OL");
    expect(ol?.querySelectorAll(":scope > li")).toHaveLength(4);
  });

  it("ogni strato ha il suo titolo e la sua riga", () => {
    const { container } = render(<ServicesView {...props} />);
    // Il gemello nascosto e' aria-hidden, quindi per getByRole non esiste: i
    // titoli tornano uno per strato. Le righe invece sono testo semplice e
    // getByText ne troverebbe due, percio' si cercano dentro il mondo vero.
    const vero = container.querySelector("[data-desk-world]:not([aria-hidden])") as HTMLElement;
    for (const l of props.layers) {
      expect(screen.getByRole("heading", { level: 3, name: l.title })).toBeInTheDocument();
      expect(within(vero).getByText(l.lead)).toBeInTheDocument();
    }
  });

  it("legge tutte le etichette, in ordine: uno screen reader sente il tavolo per intero", () => {
    const { container } = render(<ServicesView {...props} />);
    const attese = props.layers.flatMap((l) => l.objects.map((o) => o.label).filter(Boolean));
    const lette = [...container.querySelectorAll(SOLI_VERI + " [data-desk-label]")].map(
      (el) => el.textContent,
    );
    expect(lette).toEqual(attese);
  });

  it("il post-it bianco non porta un'etichetta: il suo nome è quello di un comando", () => {
    const { container } = render(<ServicesView {...props} />);
    const oggetti = container.querySelectorAll(SOLI_VERI);
    expect(oggetti).toHaveLength(24);
    // Ventitre' etichette e un post-it. Quella che manca non e' una traduzione
    // dimenticata: e' l'unico oggetto che non si legge, si preme — e il nome
    // che uno screen reader annuncia e' il nome del comando, non una voce
    // dell'elenco. Per questo il conteggio delle etichette resta ventitre'.
    const senzaEtichetta = [...oggetti].filter((el) => !el.querySelector("[data-desk-label]"));
    expect(senzaEtichetta).toHaveLength(1);
    expect(within(senzaEtichetta[0] as HTMLElement).getByRole("link")).toHaveAccessibleName(
      props.blank,
    );
  });

  it("il post-it bianco è l'unica cosa che si può toccare, e porta al contatto", () => {
    render(<ServicesView {...props} />);
    expect(screen.getByRole("link", { name: props.blank })).toHaveAttribute("href", "#contact");
  });

  it("non ci sono altri comandi sul tavolo: il resto è un disegno da guardare", () => {
    const { container } = render(<ServicesView {...props} />);
    const vero = container.querySelector("[data-desk-world]:not([aria-hidden])") as HTMLElement;
    expect(within(vero).getAllByRole("link")).toHaveLength(1);
  });

  it("nel gemello il post-it resta un disegno: un comando solo per una porta sola", () => {
    // Il gemello e' un disegno aria-hidden, e in piu' questo post-it li' non si
    // disegna nemmeno: e' il sesto oggetto del suo strato, e il mondo verticale
    // ne mostra quattro (data-off). Un secondo <a> sarebbe una copia che nessuno
    // puo' premere, nessuno puo' raggiungere col Tab e nessuno sente.
    const { container } = render(<ServicesView {...props} />);
    const gemello = container.querySelector("[data-desk-world][aria-hidden]") as HTMLElement;
    expect(gemello.querySelectorAll("a")).toHaveLength(0);
    const muto = [...gemello.querySelectorAll("[data-desk-object]")].filter(
      (el) => !el.querySelector("[data-desk-label]"),
    );
    expect(muto).toHaveLength(1);
    expect(muto[0]).toHaveAttribute("data-off");
  });

  it("le sagome sono decorative: il significato sta nell'etichetta, non nel disegno", () => {
    const { container } = render(<ServicesView {...props} />);
    for (const oggetto of container.querySelectorAll(SOLI_VERI)) {
      // La sagoma e' una maschera CSS: dentro un oggetto non c'e' niente che
      // uno screen reader possa annunciare oltre alla sua etichetta.
      const annunciabile = oggetto.querySelectorAll("img, svg, [alt], [role], [aria-label], [title]");
      expect(annunciabile).toHaveLength(0);
    }
  });

  it("il disegno e' quello che la geometria dice: la larghezza arriva da layers.ts", () => {
    // Senza questa, si potrebbe togliere la larghezza inline e ogni prova di
    // layers.test.ts continuerebbe a passare, dimostrando cose su un mondo che
    // nessuno disegna piu'.
    const { container } = render(<ServicesView {...props} />);
    const primo = container.querySelector(SOLI_VERI) as HTMLElement;
    expect(primo.style.width).toBe(`${drawWidth("wide", "sheet")}%`);
    const etichetta = primo.querySelector("[data-desk-label]") as HTMLElement;
    expect(etichetta.style.maxWidth).toBe(`${LABEL.width}em`);
  });

  it("il gemello nascosto non si fa leggere due volte", () => {
    const { container } = render(<ServicesView {...props} />);
    const gemelli = container.querySelectorAll("[data-desk-world][aria-hidden]");
    expect(gemelli).toHaveLength(1);
    // Tutti i suoi oggetti sono marcati: e' con data-ghost che i test e il CSS
    // distinguono la copia disegnata dalla copia che si legge.
    for (const oggetto of gemelli[0].querySelectorAll("[data-desk-object]")) {
      expect(oggetto).toHaveAttribute("data-ghost");
    }
  });
});

describe("lo schermo al centro", () => {
  it("porta un sito finito, non una cornice vuota: e' la cosa che la tesi indica", () => {
    const { container } = render(<ServicesView {...props} />);
    const centro = container.querySelector(
      "[data-desk-world]:not([aria-hidden]) [data-desk-centre]",
    ) as HTMLElement;
    const schermo = centro.querySelector("[data-desk-screen]") as HTMLElement;
    expect(schermo).not.toBeNull();
    // La barra in cima, il titolo, le righe di testo e il bottone: e' quello che
    // fa leggere un rettangolo come un sito e non come un foglio.
    expect(schermo.querySelector("[data-desk-screen-bar]")).not.toBeNull();
    expect(schermo.querySelector("[data-desk-screen-head]")).not.toBeNull();
    expect(schermo.querySelectorAll("[data-desk-screen-line]").length).toBeGreaterThanOrEqual(2);
    expect(schermo.querySelector("[data-desk-screen-cta]")).not.toBeNull();
  });

  it("lo schermo e' muto: il nome del centro e' gia' la sua didascalia", () => {
    const { container } = render(<ServicesView {...props} />);
    const centro = container.querySelector(
      "[data-desk-world]:not([aria-hidden]) [data-desk-centre]",
    ) as HTMLElement;
    expect(centro).toHaveTextContent(props.centre);
    const schermo = centro.querySelector("[data-desk-screen]") as HTMLElement;
    expect(schermo).toHaveAttribute("aria-hidden", "true");
    expect(schermo.textContent).toBe("");
  });
});

describe("il patto del fallback", () => {
  it("senza movimento si vede il tavolo completo: --p non scritta vale 1", () => {
    const { container } = render(<ServicesView {...props} />);
    for (const el of container.querySelectorAll(SOLI_VERI)) {
      const opacity = (el as HTMLElement).style.opacity;
      expect(opacity).toContain("var(--p, 1)");
    }
  });

  it("ogni oggetto porta la sua finestra: le opacità le calcola il CSS, non React", () => {
    const { container } = render(<ServicesView {...props} />);
    const primo = container.querySelector(SOLI_VERI) as HTMLElement;
    expect(primo.style.getPropertyValue("--from")).not.toBe("");
    expect(primo.style.getPropertyValue("--span")).not.toBe("");
  });
});

describe("E in pratica?", () => {
  it("i quattro testi lunghi restano: il tavolo è lo spettacolo, questi la sostanza", () => {
    render(<ServicesView {...props} />);
    for (const item of props.items) {
      // Livello 4 e non 3: stanno dentro il blocco "E in pratica?", che e' il
      // loro <h3>. Al livello 3 sarebbero fratelli del titolo che li contiene.
      expect(screen.getByRole("heading", { level: 4, name: item.title })).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it("rispondono in ordine alle quattro voci, e l'ordine è visibile", () => {
    const { container } = render(<ServicesView {...props} />);
    const ol = container.querySelector("[data-practice]");
    expect(ol?.tagName).toBe("OL");
    expect(within(ol as HTMLElement).getByText("01")).toBeVisible();
    expect(within(ol as HTMLElement).getByText("04")).toBeVisible();
  });
});
