import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorksView } from "../WorksView";
import { SHOT_SIZES } from "../WorkShot";
import { LINGUETTA, PARAMETRI } from "../archivio";

const labels = {
  lavoro: "Il lavoro",
  scelta: "La soluzione scelta",
  conduzione: "Come è stata condotta",
  visit: "Visita il sito",
  screenshotAlt: "{name}: schermata",
  riservato: "Coperto da accordo di riservatezza",
  open: "Apri il caso",
  close: "Chiudi",
  riporta: "riporta davanti la cartella",
};

const items = [
  {
    id: "bdroppy",
    name: "BDroppy",
    riga: "La piattaforma era ferma su Next 14.",
    lavoro: "Una piattaforma che vende ogni giorno e non poteva fermarsi.",
    scelta: "Migrare una rotta alla volta invece di riscrivere da zero.",
    conduzione: "Vecchia e nuova dietro lo stesso indirizzo, una rotta per volta.",
    url: "https://www.bdroppy.com",
    screenshot: {
      src: "/works/bdroppy.webp",
      width: 1600,
      height: 776,
      blurDataURL: "data:image/webp;base64,BDROPPYLQIP",
    },
    screenshotAlt: "BDroppy: schermata",
    year: 2024,
    tech: ["Next.js", "TypeScript"],
    metrics: [{ id: "bdroppyComponents", value: "120", label: "componenti migrati" }],
  },
  {
    id: "aidify",
    name: "Aidify",
    riga: "Assistenza sommersa dalle stesse dieci domande.",
    lavoro: "Un assistente per le domande che tornano sempre.",
    scelta: "Legato al catalogo e agli ordini veri, non a un modello che indovina.",
    conduzione: "Il confine di quello che sa e' scritto nel codice: oltre quello passa a una persona.",
    url: "https://aidify.cx",
    screenshot: {
      src: "/works/aidify.webp",
      width: 1600,
      height: 774,
      blurDataURL: "data:image/webp;base64,AIDIFYLQIP",
    },
    screenshotAlt: "Aidify: schermata",
    year: 2024,
    tech: ["Next.js", "Supabase"],
    metrics: [],
  },
];

const props = {
  eyebrow: "Lavori",
  title: "Quattro problemi, e come li ho risolti",
  intro: "Non trovi loghi e slogan.",
  labels,
  items,
};

/** I bottoni che aprono il dossier: uno per cartella, sulla faccia. */
const apri = () => screen.getAllByRole("button", { name: /Apri il caso/ });

// jsdom non ha IntersectionObserver. L'archivio lo usa solo per sapere se e'
// sullo schermo quando un resize chiede di ridecidere: qui non osserva niente,
// e nessuna prova di questo file dipende da quello.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorksView", () => {
  it("ogni cartella chiusa mostra il lavoro in una frase: è ciò che fa riconoscere il cliente, e da telefono non c'è hover che lo riveli", () => {
    render(<WorksView {...props} />);
    for (const item of items) {
      expect(screen.getByText(item.riga)).toBeVisible();
    }
  });

  it("l'archivio e' una lista ordinata di cartelle, senza involucri in mezzo", () => {
    // Tutto l'impaginato dell'archivio e' scritto con `[data-work-shelf] >
    // [data-cartella]`: lo sticky, il passo, le linguette sfalsate. Un
    // involucro in mezzo scollegherebbe le cartelle dalle regole.
    const { container } = render(<WorksView {...props} />);
    const archivio = container.querySelector("[data-work-shelf]");
    expect(archivio?.tagName).toBe("OL");
    expect(archivio!.children).toHaveLength(items.length);
    for (const figlio of Array.from(archivio!.children)) {
      expect(figlio.tagName).toBe("LI");
      expect(figlio.hasAttribute("data-cartella")).toBe(true);
    }
  });

  it("parte in colonna: l'archivio lo accende il componente, non il markup", () => {
    // Il server e il primo render non sanno se c'e' GSAP ne' quanto e' alto lo
    // schermo: la colonna si legge sempre, l'archivio va guadagnato.
    const { container } = render(<WorksView {...props} />);
    expect(container.querySelector("[data-archivio-acceso]")).toBeNull();
  });

  it("i numeri tarati nel prototipo arrivano al CSS dal modulo, non da una seconda copia", () => {
    const { container } = render(<WorksView {...props} />);
    const archivio = container.querySelector<HTMLElement>("[data-work-shelf]")!;
    expect(archivio.style.getPropertyValue("--passo")).toBe(`${PARAMETRI.passo}px`);
    expect(archivio.style.getPropertyValue("--distanza")).toBe(`${PARAMETRI.distanza}vh`);
    expect(archivio.style.getPropertyValue("--scurisce")).toBe(String(PARAMETRI.scurisce));
    expect(archivio.style.getPropertyValue("--stringe")).toBe(String(PARAMETRI.stringe));
    expect(archivio.style.getPropertyValue("--larghezza-linguetta")).toBe(
      `${PARAMETRI.larghezzaLinguetta}%`,
    );
    expect(archivio.style.getPropertyValue("--buio-minimo")).toBe(
      `${LINGUETTA.buioMinimo * 100}%`,
    );
  });

  it("la linguetta e' un bottone fratello della faccia, non annidato nel bottone del caso", () => {
    // Archiviata, di una cartella resta a vista solo la linguetta: deve
    // prendere il click per intero, e un bottone dentro un bottone non e' HTML.
    const { container } = render(<WorksView {...props} />);
    for (const cartella of Array.from(container.querySelectorAll("[data-cartella]"))) {
      const linguetta = cartella.querySelector("[data-linguetta]");
      expect(linguetta?.tagName).toBe("BUTTON");
      expect(linguetta?.parentElement).toBe(cartella);
      expect(linguetta?.closest("[data-faccia]")).toBeNull();
      expect(cartella.querySelector("[data-faccia] [data-apri]")?.tagName).toBe("BUTTON");
    }
  });

  it("dorso e foglio sono disegno: chi legge a voce non li sente", () => {
    const { container } = render(<WorksView {...props} />);
    for (const sel of ["[data-dorso]", "[data-foglio]"]) {
      for (const el of Array.from(container.querySelectorAll(sel))) {
        expect(el).toHaveAttribute("aria-hidden", "true");
      }
    }
  });

  it("la linguetta porta nome e anno, e l'anno sta a parte perche' sul telefono si toglie", () => {
    const { container } = render(<WorksView {...props} />);
    const linguetta = container.querySelector("[data-linguetta]")!;
    expect(linguetta).toHaveTextContent(/^BDroppy\s*·\s*2024/);
    expect(linguetta.querySelector("[data-linguetta-anno]")).toHaveTextContent("· 2024");
  });

  it("la linguetta dice a chi legge a voce cosa fa: non apre il caso, riporta davanti la cartella", () => {
    render(<WorksView {...props} />);
    expect(
      screen.getByRole("button", { name: /^BDroppy\s*·\s*2024.*riporta davanti la cartella$/ }),
    ).toBeInTheDocument();
  });

  it("la faccia dice quale cartella e' su quante, e di chi", () => {
    const { container } = render(<WorksView {...props} />);
    const prima = container.querySelector("[data-cartella] [data-faccia]")!;
    expect(prima).toHaveTextContent("01 / 02");
    expect(prima).toHaveTextContent("BDroppy · 2024");
  });

  it("il riservato non ha schermata, e al suo posto lo dice", () => {
    const riservato = { ...items[1], id: "riservato", screenshot: undefined, url: undefined };
    const { container } = render(<WorksView {...props} items={[riservato]} />);
    const riquadro = container.querySelector("[data-faccia-schermata]");
    expect(riquadro).toHaveTextContent(labels.riservato);
    expect(riquadro!.querySelector("img")).toBeNull();
  });

  it("la schermata della faccia chiede la stessa candidata del dossier", () => {
    // Una sola `sizes` per cartella, dossier e precarico: con due valori il
    // browser scaricherebbe due file quasi uguali.
    const { container } = render(<WorksView {...props} />);
    const img = container.querySelector("[data-faccia-schermata] img");
    expect(img).toHaveAttribute("sizes", SHOT_SIZES);
  });

  it("il filo del sito si interrompe sull'archivio", () => {
    const { container } = render(<WorksView {...props} />);
    expect(container.querySelector("[data-thread]")).toBeNull();
  });

  it("all'inizio nessun dossier è aperto", () => {
    render(<WorksView {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(items[0].scelta)).not.toBeInTheDocument();
  });

  it("«Apri il caso» apre il dossier con la soluzione scelta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByText(items[0].scelta)).toBeVisible();
    expect(screen.getByText(items[0].conduzione)).toBeVisible();
  });

  it("anche un click sulla faccia apre il dossier: la cartella e' la copertina", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getByText(items[1].riga));
    expect(screen.getByText(items[1].scelta)).toBeVisible();
  });

  it("la linguetta non apre il dossier: riporta davanti la sua cartella", async () => {
    // In colonna la linguetta porta la cartella sotto la testata: jsdom lo
    // scroll non ce l'ha, e qui interessa solo dove finisce il click.
    const scorri = vi.fn();
    vi.stubGlobal("scrollTo", scorri);
    render(<WorksView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: /^Aidify\s*·\s*2024/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(scorri).toHaveBeenCalledTimes(1);
  });

  it("il dossier ha un nome accessibile: chi naviga a voce deve sapere di quale caso si tratta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    expect(screen.getByRole("dialog", { name: /BDroppy/ })).toBeInTheDocument();
  });

  it("mentre il dossier è aperto la pagina sotto non scorre", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
  });

  it("il link al sito si apre in una scheda nuova, in sicurezza", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const link = screen.getByRole("link", { name: new RegExp(labels.visit) });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("mostra le metriche del caso quando ce ne sono", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    expect(screen.getByText("120")).toBeVisible();
    expect(screen.getByText("componenti migrati")).toBeVisible();
  });

  it("il dossier mostra il caso della cartella cliccata, non sempre il primo", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[1]);
    expect(screen.getByText(items[1].scelta)).toBeVisible();
    expect(screen.queryByText(items[0].scelta)).not.toBeInTheDocument();
  });

  it("il riquadro non e' mai vuoto: l'anteprima sfocata c'e' dal primo frame, la schermata vera no", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const dialog = screen.getByRole("dialog");

    const shot = within(dialog).getByRole("img", { name: items[0].screenshotAlt });
    // Finche' non e' arrivata, la schermata non si vede: quello che riempie il
    // riquadro e' l'anteprima, e la dissolvenza deve avere da dove partire.
    expect(shot).not.toHaveAttribute("data-loaded");
    const anteprima = dialog.querySelector("[data-shot-blur]");
    expect(anteprima).toBeInTheDocument();
    expect(anteprima).toHaveStyle({
      backgroundImage: `url("${items[0].screenshot.blurDataURL}")`,
    });
  });

  it("quando la schermata e' carica prende il posto dell'anteprima", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);

    const shot = within(screen.getByRole("dialog")).getByRole("img", {
      name: items[0].screenshotAlt,
    });
    // next/image non passa il load cosi' com'e': ci mette in mezzo una
    // promessa (decode), quindi lo stato cambia un microtask dopo.
    await act(async () => {
      fireEvent.load(shot);
    });
    expect(shot).toHaveAttribute("data-loaded");
  });

  it("passando il mouse sulla cartella la schermata parte a caricare prima del click", async () => {
    // Il precarico chiede ESATTAMENTE l'indirizzo che chiedera' il dossier
    // (stesso srcset, stesso sizes): un indirizzo diverso non sarebbe un
    // anticipo, sarebbe la stessa immagine scaricata due volte.
    const richieste: { src: string; srcset: string }[] = [];
    class FintaImmagine {
      srcset = "";
      sizes = "";
      set src(value: string) {
        richieste.push({ src: value, srcset: this.srcset });
      }
    }
    vi.stubGlobal("Image", FintaImmagine);

    // Una schermata sua, mai chiesta dagli altri test di questo file: il
    // precarico ricorda cosa ha gia' scaricato, ed e' proprio il
    // comportamento che serve (il mouse passa sulla cartella dieci volte
    // mentre si legge il sintomo).
    const caso = {
      ...items[0],
      id: "unico",
      screenshot: {
        src: "/works/unico.webp",
        width: 1600,
        height: 776,
        blurDataURL: "data:image/webp;base64,UNICOLQIP",
      },
    };

    const { container } = render(<WorksView {...props} items={[caso]} />);
    const faccia = container.querySelector<HTMLElement>("[data-faccia]")!;
    await userEvent.hover(faccia);
    await userEvent.unhover(faccia);
    await userEvent.hover(faccia);

    expect(richieste).toHaveLength(1);
    expect(richieste[0].srcset).toContain(encodeURIComponent(caso.screenshot.src));
  });

  it("la cartella senza schermata non chiede niente: non c'e' niente da precaricare", async () => {
    const richieste: string[] = [];
    class FintaImmagine {
      srcset = "";
      sizes = "";
      set src(value: string) {
        richieste.push(value);
      }
    }
    vi.stubGlobal("Image", FintaImmagine);

    const senzaSchermata = { ...items[1], id: "riservato", screenshot: undefined, url: undefined };
    render(<WorksView {...props} items={[senzaSchermata]} />);
    await userEvent.hover(apri()[0]);

    expect(richieste).toHaveLength(0);
  });
});

// Senza commenti: quello che precede una regola finirebbe nel suo selettore.
const css = readFileSync("src/styles/tokens.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Le regole del foglio di stile che riguardano l'archivio, corpo compreso. */
const regoleDellArchivio = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selettore, corpo]) => ({ selettore: selettore.trim(), corpo }))
  .filter((r) =>
    /\[data-(work-shelf|cartella|linguetta|dorso|foglio|faccia|apri)/.test(r.selettore),
  );

describe("i colori dell'archivio", () => {
  it("vengono dalla tavolozza: miscele dei token, niente colori scritti", () => {
    // tokens.test.ts guarda gli esadecimali; qui anche rgb() e hsl(), che quella
    // prova non vede. Il prototipo aveva le ombre in rgba.
    expect(regoleDellArchivio.length).toBeGreaterThan(10);
    const colpevoli = regoleDellArchivio.filter((r) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(r.corpo));
    expect(colpevoli.map((r) => r.selettore)).toEqual([]);
  });

  it("linguetta e dorso hanno lo stesso fondo, ed e' il fondo che le salda in una cartella", () => {
    const fondo = (sel: RegExp) =>
      regoleDellArchivio.find((r) => sel.test(r.selettore) && /background-color:/.test(r.corpo))
        ?.corpo.match(/background-color:\s*([^;]+);/)?.[1];
    expect(fondo(/^\[data-linguetta\]$/)).toBe("var(--cartella-dorso)");
    expect(fondo(/^\[data-dorso\]$/)).toBe("var(--cartella-dorso)");
  });

  it("sul chiaro la faccia e' la carta della pagina, sullo scuro un gradino sopra l'inchiostro", () => {
    // Correzione 4 della spec: sul chiaro faccia = --superficie, dorso
    // inchiostro al 10%, bordo al 24%, foglio carta. Sullo scuro i gradini del
    // prototipo: una cartella col fondo della pagina li' non avrebbe corpo.
    const chiaro = css.match(/\[data-work-shelf\]\s*\{[^}]*\}/)?.[0] ?? "";
    expect(chiaro).toMatch(/--cartella-faccia:\s*var\(--superficie\)/);
    expect(chiaro).toMatch(/--cartella-dorso:\s*color-mix\(in oklab, var\(--ink\) 10%, var\(--paper\)\)/);
    expect(chiaro).toMatch(/--cartella-bordo:\s*color-mix\(in oklab, var\(--ink\) 24%, var\(--paper\)\)/);
    expect(chiaro).toMatch(/--cartella-foglio:\s*var\(--paper\)/);

    const scuro = css.match(/\[data-theme="dark"\] \[data-work-shelf\]\s*\{[^}]*\}/)?.[0];
    expect(scuro, "l'archivio non ha i suoi colori sul tema scuro").toBeTruthy();
    for (const token of ["faccia", "dorso", "bordo", "foglio"]) {
      expect(scuro).toMatch(new RegExp(`--cartella-${token}:`));
    }
  });
});

describe("l'archivio sta tutto sotto l'attributo", () => {
  it("senza l'attributo niente e' sticky: la colonna si legge senza JavaScript", () => {
    const sticky = regoleDellArchivio.filter((r) => /position:\s*sticky/.test(r.corpo));
    expect(sticky.length).toBeGreaterThan(0);
    for (const r of sticky) expect(r.selettore).toContain("[data-archivio-acceso]");
  });

  it("scurire e stringere solo le cartelle che possono finire sotto: l'ultima mai", () => {
    const effetti = regoleDellArchivio.filter((r) => /\bfilter:|\bscale:|will-change:/.test(r.corpo));
    expect(effetti.length).toBeGreaterThan(0);
    for (const r of effetti) {
      expect(r.selettore).toContain("[data-archivio-acceso]");
      expect(r.selettore).toContain(":not(:last-child)");
    }
  });

  it("la linguetta si scurisce col resto, ma col fondo e non col filtro: il testo deve restare leggibile", () => {
    // Col filtro anche il testo si scurisce, e l'anno della linguetta piu' in
    // fondo scendeva a 1,74:1 sul chiaro (misurato). Il fondo invece si
    // mischia con l'inchiostro quanto il resto della cartella, e il testo
    // cambia tono (vedi tonoLinguetta).
    const filtri = regoleDellArchivio.filter((r) => /\bfilter:/.test(r.corpo));
    expect(filtri.length).toBeGreaterThan(0);
    for (const r of filtri) {
      expect(r.selettore).toMatch(/:not\(\[data-linguetta\]\)$/);
    }
    const fondo = regoleDellArchivio.find(
      (r) => r.selettore.includes("[data-archivio-acceso]") && /\[data-linguetta\]$/.test(r.selettore) && /background-color:/.test(r.corpo),
    );
    expect(fondo?.corpo).toMatch(/color-mix\(in srgb, var\(--cartella-dorso\), var\(--ink\) calc\(var\(--profondita, 0\) \* var\(--scurisce\) \* 100%\)\)/);
    // Dietro @supports: un color-mix con calc che il browser rifiuta diventa
    // trasparente, non torna al fondo di prima.
    expect(css).toMatch(/@supports \(background-color: color-mix\(in srgb, red calc\(1 \* 10%\), blue\)\)/);
  });

  it("i tre toni della linguetta: sul chiaro cambiano il testo, sullo scuro no", () => {
    expect(css).toMatch(/\[data-tono-linguetta="1"\] > \[data-linguetta\]\s*\{[^}]*color:\s*var\(--fg\)/);
    expect(css).toMatch(/\[data-tono-linguetta="2"\] > \[data-linguetta\][^{]*\{[^}]*color:\s*var\(--paper\)/);
    expect(css).toMatch(/\[data-theme="dark"\][^{]*\[data-tono-linguetta\] > \[data-linguetta\][^{]*\{[^}]*color:\s*var\(--cartella-tenue\)/);
  });

  it("il dorso della cartella davanti prende il click, e non lo passa a quelle coperte", () => {
    // La fascia fra le linguette e la faccia e' dorso: trasparente al
    // puntatore, un click li' apriva il dossier di una cartella nascosta.
    const dorso = regoleDellArchivio.find(
      (r) => r.selettore.includes("[data-archivio-acceso]") && /\[data-dorso\]$/.test(r.selettore),
    );
    expect(dorso?.corpo).toMatch(/pointer-events:\s*auto/);
  });

  it("dentro l'archivio i testi piccoli hanno un tenue piu' scuro, e l'arancio scuro e' schiarito", () => {
    // I rapporti sono in contrast.test.ts, misurati sui colori risolti.
    const chiaro = css.match(/\[data-work-shelf\]\s*\{[^}]*\}/)?.[0] ?? "";
    expect(chiaro).toMatch(/--cartella-tenue:\s*color-mix\(in oklab, var\(--fg-muted\) 80%, var\(--fg\)\)/);
    const scuro = css.match(/\[data-theme="dark"\] \[data-work-shelf\]\s*\{[^}]*\}/)?.[0] ?? "";
    expect(scuro).toMatch(/--cartella-tenue:\s*var\(--fg-muted\)/);
    expect(scuro).toMatch(/--accento-testo:\s*color-mix\(in oklab, var\(--accent\) 90%, var\(--paper\)\)/);
    // Il tenue globale compare solo dentro la definizione del tenue suo.
    const tenui = regoleDellArchivio.filter((r) =>
      /var\(--fg-muted\)/.test(r.corpo.replace(/--cartella-tenue:[^;]*;/g, "")),
    );
    expect(tenui.map((r) => r.selettore), "un testo dell'archivio usa ancora il tenue globale").toEqual([]);
  });

  it("il puntatore passa attraverso le cartelle e prende solo faccia e linguetta", () => {
    // Le cartelle archiviate stanno una sopra l'altra: senza, la scatola di
    // quella davanti coprirebbe le linguette di quelle dietro.
    const eventi = (sel: string) =>
      regoleDellArchivio.find((r) => r.selettore === sel && /pointer-events:/.test(r.corpo))?.corpo;
    expect(eventi("[data-cartella]")).toMatch(/pointer-events:\s*none/);
    expect(eventi("[data-linguetta]")).toMatch(/pointer-events:\s*auto/);
    expect(eventi("[data-faccia]")).toMatch(/pointer-events:\s*auto/);
  });

  it("sotto i 600px la linguetta porta solo il nome e la faccia perde le tecnologie", () => {
    const blocchi = [...css.matchAll(/@media \(max-width: 599px\) \{[\s\S]*?\n\}/g)].map((m) => m[0]);
    const telefono = blocchi.find((b) => b.includes("[data-linguetta-anno]"));
    expect(telefono, "manca il blocco del telefono dell'archivio").toBeTruthy();
    expect(telefono).toMatch(/\[data-linguetta-anno\]\s*\{[^}]*display:\s*none/);
    expect(telefono).toMatch(/\[data-faccia-tech\]\s*\{[^}]*display:\s*none/);
  });

  it("il centro della faccia non si stringe sotto il suo contenuto, o la soglia non vede niente", () => {
    // La soglia confronta quanto deborda la faccia. Con `min-height: 0` sul
    // centro, la riga di mezzo si stringeva e il contenuto finiva sopra il
    // piede invece di debordare: misurato a 390x664, il riquadro del
    // riservato scendeva 17px sotto il centro fin dentro «Apri il caso», e la
    // soglia diceva che ci stava.
    const centro = regoleDellArchivio.filter((r) => /\[data-faccia-centro\]$/.test(r.selettore));
    expect(centro.length).toBeGreaterThan(0);
    for (const r of centro) expect(r.corpo).not.toMatch(/min-height:\s*0/);
  });

  it("la riga grande cresce anche con l'altezza, non solo con la larghezza", () => {
    // Su un portatile basso (1366x768) la riga del riservato a 3,6vw chiedeva
    // cento pixel piu' della faccia. `vh` davanti per chi `svh` non lo conosce.
    const riga = regoleDellArchivio.filter((r) => /\[data-faccia-riga\]$/.test(r.selettore) && /font-size:/.test(r.corpo));
    const corpo = riga.map((r) => r.corpo).join("");
    expect(corpo).toMatch(/font-size:\s*clamp\(1\.45rem, min\(3\.6vw, [\d.]+vh\), 3\.1rem\);\s*font-size:\s*clamp\(1\.45rem, min\(3\.6vw, [\d.]+svh\), 3\.1rem\)/);
  });

  it("la faccia si toglie la barra in basso, o «Apri il caso» ci finisce sotto", () => {
    const faccia = regoleDellArchivio.find(
      (r) => r.selettore.includes("[data-archivio-acceso]") && /\[data-faccia\]$/.test(r.selettore) && /height:/.test(r.corpo),
    );
    expect(faccia?.corpo).toContain("var(--barra-bassa)");
    expect(faccia?.corpo).toContain("100svh");
  });
});
