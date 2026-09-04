import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ServicesView } from "../ServicesView";
import type { ServicesViewProps } from "../ServicesView";
import { LABEL, drawWidth } from "../layers";

/** Il quarto, come nel tavolo vero: il mondo verticale disegna i primi quattro
 *  oggetti di ogni strato, e il post-it bianco deve stare fra quelli. */
const MUTO = 3;

const layer = (id: string, n: number, mute = false) => ({
  id,
  title: `Strato ${id}`,
  lead: `A cosa serve lo strato ${id}.`,
  objects: Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i}`,
    shape: "sheet" as const,
    label: mute && i === MUTO ? null : `${id} oggetto ${i}`,
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
  note: "23.777 caffè",
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

  it("nel gemello il post-it si disegna e si preme, ma non entra nel giro dei Tab", () => {
    // Sotto i 1024px il disegno e' il gemello, e questo post-it li' c'e': e' il
    // quarto oggetto del suo strato, non il sesto, quindi non porta data-off.
    // Un post-it che porta da qualche parte e non si preme sarebbe il disegno di
    // un comando, percio' l'<a> c'e'. Ma il gemello e' aria-hidden per intero:
    // una seconda fermata del Tab annuncerebbe il nulla, e il nome del comando
    // sta nell'altro mondo — quello che uno screen reader legge davvero.
    const { container } = render(<ServicesView {...props} />);
    const gemello = container.querySelector("[data-desk-world][aria-hidden]") as HTMLElement;
    const muti = [...gemello.querySelectorAll("[data-desk-object]")].filter(
      (el) => !el.querySelector("[data-desk-label]"),
    );
    expect(muti).toHaveLength(1);
    expect(muti[0]).not.toHaveAttribute("data-off");
    const comando = muti[0].querySelector("[data-desk-blank]") as HTMLElement;
    expect(comando).toHaveAttribute("href", "#contact");
    expect(comando).toHaveAttribute("tabindex", "-1");
    expect(comando).toHaveTextContent("");
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

/**
 * I materiali. Una maschera CSS dipinge un colore solo: finche' la sagoma era
 * un file solo, foglio, scheda e telefono erano lo stesso grigio identico e i
 * quattro strati si leggevano come quattro contorni della stessa famiglia. Due
 * strati sono due superfici da colorare — ed e' il DOM a doverli portare,
 * perche' nel CSS un pieno che non ha dove appoggiarsi non esiste.
 */
describe("i materiali", () => {
  it("ogni oggetto e' due strati: la superficie sotto, il tracciato sopra", () => {
    const { container } = render(<ServicesView {...props} />);
    const oggetti = container.querySelectorAll(SOLI_VERI);
    expect(oggetti.length).toBeGreaterThan(0);
    for (const oggetto of oggetti) {
      const sagoma = oggetto.querySelector("[data-desk-shape]") as HTMLElement;
      expect(sagoma, "un oggetto senza sagoma").not.toBeNull();
      expect(sagoma.querySelector("[data-desk-fill]")).not.toBeNull();
      expect(sagoma.querySelector("[data-desk-line]")).not.toBeNull();
      // L'ordine e' il disegno: il pieno viene PRIMA, o coprirebbe il tracciato
      // che dovrebbe stargli sopra. Nessuno z-index — l'ordine e' quello del DOM.
      expect(sagoma.children[0]).toHaveAttribute("data-desk-fill");
      expect(sagoma.children[1]).toHaveAttribute("data-desk-line");
    }
  });

  it("anche il laptop al centro: e' il pieno scuro che fa leggere acceso lo schermo", () => {
    const { container } = render(<ServicesView {...props} />);
    const centro = container.querySelector(
      "[data-desk-world]:not([aria-hidden]) [data-desk-centre] [data-desk-shape]",
    ) as HTMLElement;
    expect(centro.querySelector("[data-desk-fill]")).not.toBeNull();
    expect(centro.querySelector("[data-desk-line]")).not.toBeNull();
  });

  it("l'etichetta non e' dentro la sagoma: e' li' che l'ombra non la prende", () => {
    // L'unico divieto esplicito di §4.4 bis: «un'ombra portata sulle sole
    // superfici, MAI sull'etichetta». Il filtro sta su [data-desk-shape] (lo
    // verifica il contratto in materials.test.ts) e non tocca l'etichetta
    // soltanto perche' questa e' una SORELLA della sagoma, non una figlia.
    // Portarla dentro — per esempio per farla ruotare insieme al disegno —
    // lascerebbe verde tutto il resto e metterebbe un'ombra sotto ogni parola
    // del tavolo, che non e' un tavolo: e' un banner.
    const { container } = render(<ServicesView {...props} />);
    const etichette = container.querySelectorAll("[data-desk-label]");
    expect(etichette.length).toBeGreaterThan(0);
    for (const etichetta of etichette) {
      expect(etichetta.closest("[data-desk-shape]")).toBeNull();
    }
  });

  it("i led stanno sul rack e su nient'altro: sono colore vero, non una maschera", () => {
    // Il colore non puo' venire dal file: una maschera porta una forma, non un
    // colore. I led sono l'unico posto del tavolo dove serve dipingere qualcosa
    // dentro un oggetto, e quindi l'unico che ha uno strato in piu'.
    const { container } = render(
      <ServicesView
        {...props}
        layers={[
          { ...layer("infra", 2), objects: [
            { id: "infra-rack", shape: "rack" as const, label: "il server" },
            { id: "infra-sheet", shape: "sheet" as const, label: "il foglio" },
          ] },
        ]}
      />,
    );
    const oggetti = [...container.querySelectorAll(SOLI_VERI)];
    const rack = oggetti.find((el) => el.getAttribute("data-shape") === "rack") as HTMLElement;
    const foglio = oggetti.find((el) => el.getAttribute("data-shape") === "sheet") as HTMLElement;
    expect(rack.querySelector("[data-desk-leds]")).not.toBeNull();
    expect(foglio.querySelector("[data-desk-leds]")).toBeNull();
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
