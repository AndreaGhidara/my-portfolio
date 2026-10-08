import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorksView } from "../WorksView";
import { SHOT_SIZES } from "../WorkShot";
import { TAB, ARCHIVE_PARAMS } from "../archive";
import { rules } from "@/test/css";

const labels = {
  work: "Il lavoro",
  choice: "La soluzione scelta",
  approach: "Come è stata condotta",
  visit: "Visita il sito",
  screenshotAlt: "{name}: schermata",
  confidential: "Coperto da accordo di riservatezza",
  open: "Apri il caso",
  close: "Chiudi",
  putBack: "riporta davanti la cartella",
  archive: "Archivio lavori",
  dossier: "Pratica n.",
  before: "Com'era, quando sono arrivato",
  client: "Cliente",
  year: "Anno",
  status: "Stato",
  online: "Online",
  attachment: "Allegato A · la piattaforma oggi",
  measured: "Rilevato a fine lavoro",
  measuredSoFar: "Rilevato finora",
  estimate: "stima",
  delivered: "Consegnato",
  inProgress: "In corso",
  signatureName: "A. Ghidara",
  signatureRole: "sviluppatore",
};

const items = [
  {
    id: "bdroppy",
    name: "BDroppy",
    tagline: "La piattaforma era ferma su Next 14.",
    work: "Una piattaforma che vende ogni giorno e non poteva fermarsi.",
    choice: "Migrare una rotta alla volta invece di riscrivere da zero.",
    approach: "Vecchia e nuova dietro lo stesso indirizzo, una rotta per volta.",
    url: "https://www.bdroppy.com",
    screenshot: {
      src: "/works/bdroppy.webp",
      width: 1600,
      height: 776,
      blurDataURL: "data:image/webp;base64,BDROPPYLQIP",
    },
    screenshotAlt: "BDroppy: schermata",
    year: 2024,
    status: "consegnato" as const,
    tech: ["Next.js", "TypeScript"],
    metrics: [{ id: "bdroppyComponents", value: "120", label: "componenti migrati", estimated: true }],
  },
  {
    id: "aidify",
    name: "Aidify",
    tagline: "Assistenza sommersa dalle stesse dieci domande.",
    work: "Un assistente per le domande che tornano sempre.",
    choice: "Legato al catalogo e agli ordini veri, non a un modello che indovina.",
    approach: "Il confine di quello che sa e' scritto nel codice: oltre quello passa a una persona.",
    url: "https://aidify.cx",
    screenshot: {
      src: "/works/aidify.webp",
      width: 1600,
      height: 774,
      blurDataURL: "data:image/webp;base64,AIDIFYLQIP",
    },
    screenshotAlt: "Aidify: schermata",
    year: 2024,
    status: "consegnato" as const,
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

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<WorksView {...props} />);
    const sezione = screen.getByRole("region", { name: props.title });
    const titolo = within(sezione).getByRole("heading", { level: 2, name: props.title });
    expect(sezione).toHaveAttribute("aria-labelledby", titolo.id);
    expect(titolo).toHaveClass("section-title");
  });

  it("ogni cartella ha un titolo: il nome del lavoro e l'anno, come il dossier che apre", () => {
    render(<WorksView {...props} />);
    const titoli = screen.getAllByRole("heading", { level: 3 });
    expect(titoli.map((t) => t.textContent)).toEqual(items.map((i) => `${i.name} · ${i.year}`));
  });
  it("ogni cartella chiusa mostra il lavoro in una frase: è ciò che fa riconoscere il cliente, e da telefono non c'è hover che lo riveli", () => {
    render(<WorksView {...props} />);
    for (const item of items) {
      expect(screen.getByText(item.tagline)).toBeVisible();
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
      expect(figlio.hasAttribute("data-folder")).toBe(true);
    }
  });

  it("parte in colonna: l'archivio lo accende il componente, non il markup", () => {
    // Il server e il primo render non sanno se c'e' GSAP ne' quanto e' alto lo
    // schermo: la colonna si legge sempre, l'archivio va guadagnato.
    const { container } = render(<WorksView {...props} />);
    expect(container.querySelector("[data-archive-lit]")).toBeNull();
  });

  it("i numeri tarati nel prototipo arrivano al CSS dal modulo, non da una seconda copia", () => {
    const { container } = render(<WorksView {...props} />);
    const archivio = container.querySelector<HTMLElement>("[data-work-shelf]")!;
    expect(archivio.style.getPropertyValue("--step")).toBe(`${ARCHIVE_PARAMS.step}px`);
    expect(archivio.style.getPropertyValue("--distance")).toBe(`${ARCHIVE_PARAMS.distance}vh`);
    expect(archivio.style.getPropertyValue("--darkens")).toBe(String(ARCHIVE_PARAMS.darkens));
    expect(archivio.style.getPropertyValue("--narrows")).toBe(String(ARCHIVE_PARAMS.narrows));
    expect(archivio.style.getPropertyValue("--tab-width")).toBe(
      `${ARCHIVE_PARAMS.tabWidth}%`,
    );
    expect(archivio.style.getPropertyValue("--min-dark")).toBe(
      `${TAB.minDark * 100}%`,
    );
  });

  it("la linguetta e' un bottone fratello della faccia, non annidato nel bottone del caso", () => {
    // Archiviata, di una cartella resta a vista solo la linguetta: deve
    // prendere il click per intero, e un bottone dentro un bottone non e' HTML.
    const { container } = render(<WorksView {...props} />);
    for (const cartella of Array.from(container.querySelectorAll("[data-folder]"))) {
      const linguetta = cartella.querySelector("[data-tab]");
      expect(linguetta?.tagName).toBe("BUTTON");
      expect(linguetta?.parentElement).toBe(cartella);
      expect(linguetta?.closest("[data-face]")).toBeNull();
      expect(cartella.querySelector("[data-face] [data-open-button]")?.tagName).toBe("BUTTON");
    }
  });

  it("dorso e foglio sono disegno: chi legge a voce non li sente", () => {
    const { container } = render(<WorksView {...props} />);
    for (const sel of ["[data-spine]", "[data-sheet]"]) {
      for (const el of Array.from(container.querySelectorAll(sel))) {
        expect(el).toHaveAttribute("aria-hidden", "true");
      }
    }
  });

  it("la linguetta porta nome e anno, e l'anno sta a parte perche' sul telefono si toglie", () => {
    const { container } = render(<WorksView {...props} />);
    const linguetta = container.querySelector("[data-tab]")!;
    expect(linguetta).toHaveTextContent(/^BDroppy\s*·\s*2024/);
    expect(linguetta.querySelector("[data-tab-year]")).toHaveTextContent("· 2024");
  });

  it("la linguetta dice a chi legge a voce cosa fa: non apre il caso, riporta davanti la cartella", () => {
    render(<WorksView {...props} />);
    expect(
      screen.getByRole("button", { name: /^BDroppy\s*·\s*2024.*riporta davanti la cartella$/ }),
    ).toBeInTheDocument();
  });

  it("la faccia dice quale cartella e' su quante, e di chi", () => {
    const { container } = render(<WorksView {...props} />);
    const prima = container.querySelector("[data-folder] [data-face]")!;
    expect(prima).toHaveTextContent("01 / 02");
    expect(prima).toHaveTextContent("BDroppy · 2024");
  });

  it("il riservato non ha schermata, e al suo posto lo dice", () => {
    const riservato = { ...items[1], id: "riservato", screenshot: undefined, url: undefined };
    const { container } = render(<WorksView {...props} items={[riservato]} />);
    const riquadro = container.querySelector("[data-face-screenshot]");
    expect(riquadro).toHaveTextContent(labels.confidential);
    expect(riquadro!.querySelector("img")).toBeNull();
  });

  it("la schermata della faccia chiede la stessa candidata del dossier", () => {
    // Una sola `sizes` per cartella, dossier e precarico: con due valori il
    // browser scaricherebbe due file quasi uguali.
    const { container } = render(<WorksView {...props} />);
    const img = container.querySelector("[data-face-screenshot] img");
    expect(img).toHaveAttribute("sizes", SHOT_SIZES);
  });

  it("all'inizio nessun dossier è aperto", () => {
    render(<WorksView {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(items[0].choice)).not.toBeInTheDocument();
  });

  it("«Apri il caso» apre il dossier con la soluzione scelta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByText(items[0].choice)).toBeVisible();
    expect(screen.getByText(items[0].approach)).toBeVisible();
  });

  it("anche un click sulla faccia apre il dossier: la cartella e' la copertina", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getByText(items[1].tagline));
    expect(screen.getByText(items[1].choice)).toBeVisible();
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
    expect(screen.getByText(items[1].choice)).toBeVisible();
    expect(screen.queryByText(items[0].choice)).not.toBeInTheDocument();
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
    const faccia = container.querySelector<HTMLElement>("[data-face]")!;
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

/** I campi della pratica come coppie etichetta → valore, nell'ordine del foglio. */
const campi = (dialog: HTMLElement) =>
  Array.from(dialog.querySelectorAll("[data-dossier-fields] > div")).map((campo) => [
    campo.querySelector("dt")?.textContent,
    campo.querySelector("dd")?.textContent,
  ]);

const riservato = {
  ...items[1],
  id: "riservato",
  name: "Riservato",
  year: 2026,
  status: "in-corso" as const,
  screenshot: undefined,
  url: undefined,
  metrics: [{ id: "riservatoCycleTime", value: "15 min", label: "per un passaggio che prima chiedeva ore", estimated: true }],
};

describe("la pratica", () => {
  it("porta cliente, anno, stato e il dominio senza protocollo ne' www", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const dialog = screen.getByRole("dialog", { name: "BDroppy · 2024" });
    expect(campi(dialog)).toEqual([
      ["Cliente", "BDroppy"],
      ["Anno", "2024"],
      ["Stato", "Consegnato"],
      ["Online", "bdroppy.com"],
    ]);
  });

  it("il dominio e' quello del caso aperto, anche senza www davanti", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[1]);
    expect(campi(screen.getByRole("dialog"))).toContainEqual(["Online", "aidify.cx"]);
  });

  it("dice quale pratica e' su quante, come la faccia della cartella", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[1]);
    const testa = screen.getByRole("dialog").querySelector("[data-dossier-head]");
    expect(testa).toHaveTextContent("Pratica n.");
    expect(testa).toHaveTextContent("02 / 02");
    expect(testa).toHaveTextContent(labels.archive);
  });

  it("il timbro dice lo stato, e la firma chi l'ha fatto", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector("[data-dossier-stamp]")).toHaveTextContent(labels.delivered);
    expect(dialog.querySelector("[data-dossier-signature]")).toHaveTextContent(`${labels.signatureName}${labels.signatureRole}`);
  });

  it("i numeri stimati lo dicono accanto al numero, e a lavoro finito sono «a fine lavoro»", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const numeri = screen.getByRole("dialog").querySelector<HTMLElement>("[data-dossier-figures]")!;
    expect(within(numeri).getByRole("heading", { name: labels.measured })).toBeInTheDocument();
    const valore = within(numeri).getByText("120");
    expect(valore.parentElement).toHaveTextContent(`120${labels.estimate}`);
  });

  it("un numero non stimato non porta la scritta «stima»", async () => {
    const misurato = { ...items[0], metrics: [{ ...items[0].metrics[0], estimated: false }] };
    render(<WorksView {...props} items={[misurato]} />);
    await userEvent.click(apri()[0]);
    const numeri = screen.getByRole("dialog").querySelector("[data-dossier-figures]");
    expect(numeri).not.toHaveTextContent(labels.estimate);
  });

  it("il riservato: niente schermata ne' link, «Online» e il posto del link dicono perche', timbro «In corso»", async () => {
    render(<WorksView {...props} items={[riservato]} />);
    await userEvent.click(apri()[0]);
    const dialog = screen.getByRole("dialog", { name: "Riservato · 2026" });
    expect(campi(dialog)).toEqual([
      ["Cliente", "Riservato"],
      ["Anno", "2026"],
      ["Stato", "In corso"],
      ["Online", labels.confidential],
    ]);
    expect(dialog.querySelector("img")).toBeNull();
    expect(dialog.querySelector("[data-dossier-confidential]")).toHaveTextContent(labels.confidential);
    expect(within(dialog).queryByRole("link")).toBeNull();
    expect(dialog.querySelector("[data-dossier-no-link]")).toHaveTextContent(labels.confidential);
    expect(dialog.querySelector("[data-dossier-stamp]")).toHaveTextContent(labels.inProgress);
  });

  it("su un lavoro in corso i numeri sono «rilevati finora», non a fine lavoro", async () => {
    render(<WorksView {...props} items={[riservato]} />);
    await userEvent.click(apri()[0]);
    const numeri = screen.getByRole("dialog").querySelector<HTMLElement>("[data-dossier-figures]")!;
    expect(within(numeri).getByRole("heading", { name: labels.measuredSoFar })).toBeInTheDocument();
    expect(numeri).not.toHaveTextContent(labels.measured);
  });

  it("dentro la pratica niente .eyebrow: porta i colori della pagina, che si ribaltano col tema", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    expect(screen.getByRole("dialog").querySelector(".eyebrow")).toBeNull();
  });
});

describe("aprire e chiudere la pratica", () => {
  const archivio = (container: HTMLElement) => container.querySelector("[data-work-shelf]");

  it("dal clic l'archivio sotto e' inerte: sotto la cartella caduta c'e' la faccia della precedente", async () => {
    const { container } = render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    expect(archivio(container)).toHaveAttribute("inert");
  });

  it("× chiude: la pagina torna libera e il fuoco torna su «Apri il caso» della cartella aperta", async () => {
    const { container } = render(<WorksView {...props} />);
    await userEvent.click(apri()[1]);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: labels.close }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-dialog-open"));
    expect(archivio(container)).not.toHaveAttribute("inert");
    expect(apri()[1]).toHaveFocus();
  });

  it("Esc non chiude di colpo: il cancel si ferma, e la chiusura passa dalla sua animazione", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const dialog = screen.getByRole("dialog");
    const esc = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(esc);
    });
    expect(esc.defaultPrevented).toBe(true);
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-dialog-open"));
    expect(apri()[0]).toHaveFocus();
  });

  it("un clic sul velo chiude come ×", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    await userEvent.click(screen.getByRole("dialog"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("un clic dentro il foglio non chiude", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    await userEvent.click(screen.getAllByText(items[0].choice)[0]);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("chiusa dal browser senza passare dal cancel, la pagina torna comunque libera", async () => {
    // Il close watcher: al secondo Esc, o col gesto indietro di Android, il
    // dialog si chiude da solo e il cancel non si puo' fermare.
    const { container } = render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    act(() => {
      (screen.getByRole("dialog") as HTMLDialogElement).close();
    });
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-dialog-open"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(archivio(container)).not.toHaveAttribute("inert");
    expect(apri()[0]).toHaveFocus();
  });

  it("dopo la chiusura si riapre, e mostra il caso nuovo", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: labels.close }));
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-dialog-open"));
    await userEvent.click(apri()[1]);
    expect(screen.getByRole("dialog", { name: "Aidify · 2024" })).toBeVisible();
  });

  it("un Esc durante la caduta, prima che il dialog esista, non si perde: si chiude appena aperta", async () => {
    // A "none" il dialog si apre subito dopo il commit e fra il clic e
    // showModal() non c'e' un momento in cui premere Esc. Qui il livello e'
    // "reduced" (nessuna preferenza, nessun puntatore fine) e le animazioni
    // non finiscono finche' il test non le libera: la cartella resta a meta'
    // caduta quanto serve.
    let libera = () => {};
    const inCorsa = new Promise<void>((risolvi) => {
      libera = risolvi;
    });
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: () => ({ finished: inCorsa, cancel() {} }),
    });
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    try {
      render(<WorksView {...props} />);
      await userEvent.click(apri()[0]);
      const dialog = document.querySelector<HTMLDialogElement>("[data-work-dialog]")!;
      expect(dialog.open).toBe(false);

      fireEvent.keyDown(document, { key: "Escape" });
      await act(async () => {
        libera();
      });

      await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-dialog-open"));
      expect(dialog.open).toBe(false);
      expect(apri()[0]).toHaveFocus();
    } finally {
      Reflect.deleteProperty(Element.prototype, "animate");
    }
  });

  it("smontata a pratica aperta, la pagina non resta bloccata", async () => {
    const { container, unmount } = render(<WorksView {...props} />);
    await userEvent.click(apri()[0]);
    const lista = archivio(container);
    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-dialog-open");
    expect(lista).not.toHaveAttribute("inert");
  });
});

/** Le regole del foglio di stile che riguardano l'archivio, corpo compreso. */
const regoleDellArchivio = rules(/\[data-(work-shelf|folder|tab|spine|sheet|face|open-button)/);

describe("i colori dell'archivio", () => {
  it("vengono dalla tavolozza: miscele dei token, niente colori scritti", () => {
    // tokens.test.ts guarda gli esadecimali; qui anche rgb() e hsl(), che quella
    // prova non vede. Il prototipo aveva le ombre in rgba.
    expect(regoleDellArchivio.length).toBeGreaterThan(10);
    const colpevoli = regoleDellArchivio.filter((r) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(r.body));
    expect(colpevoli.map((r) => r.selector)).toEqual([]);
  });

  it("linguetta e dorso hanno lo stesso fondo, ed e' il fondo che le salda in una cartella", () => {
    const fondo = (sel: RegExp) =>
      regoleDellArchivio.find((r) => sel.test(r.selector) && /background-color:/.test(r.body))
        ?.body.match(/background-color:\s*([^;]+);/)?.[1];
    expect(fondo(/^\[data-tab\]$/)).toBe("var(--folder-spine)");
    expect(fondo(/^\[data-spine\]$/)).toBe("var(--folder-spine)");
  });

  it("sul chiaro la faccia e' la carta della pagina, sullo scuro un gradino sopra l'inchiostro", () => {
    // Correzione 4 della spec: sul chiaro faccia = --superficie, dorso
    // inchiostro al 10%, bordo al 24%, foglio carta. Sullo scuro i gradini del
    // prototipo: una cartella col fondo della pagina li' non avrebbe corpo.
    const chiaro = rules("[data-work-shelf]")[0]?.body ?? "";
    expect(chiaro).toMatch(/--folder-face:\s*var\(--surface\)/);
    expect(chiaro).toMatch(/--folder-spine:\s*color-mix\(in oklab, var\(--ink\) 10%, var\(--paper\)\)/);
    expect(chiaro).toMatch(/--folder-border:\s*color-mix\(in oklab, var\(--ink\) 24%, var\(--paper\)\)/);
    expect(chiaro).toMatch(/--folder-sheet:\s*var\(--paper\)/);

    const scuro = rules('[data-theme="dark"] [data-work-shelf]')[0]?.body;
    expect(scuro, "l'archivio non ha i suoi colori sul tema scuro").toBeTruthy();
    for (const token of ["face", "spine", "border", "sheet"]) {
      expect(scuro).toMatch(new RegExp(`--folder-${token}:`));
    }
  });
});

describe("l'archivio sta tutto sotto l'attributo", () => {
  it("senza l'attributo niente e' sticky: la colonna si legge senza JavaScript", () => {
    const sticky = regoleDellArchivio.filter((r) => /position:\s*sticky/.test(r.body));
    expect(sticky.length).toBeGreaterThan(0);
    for (const r of sticky) expect(r.selector).toContain("[data-archive-lit]");
  });

  it("scurire e stringere solo le cartelle che possono finire sotto: l'ultima mai", () => {
    const effetti = regoleDellArchivio.filter((r) => /\bfilter:|\bscale:|will-change:/.test(r.body));
    expect(effetti.length).toBeGreaterThan(0);
    for (const r of effetti) {
      expect(r.selector).toContain("[data-archive-lit]");
      expect(r.selector).toContain(":not(:last-child)");
    }
  });

  it("la linguetta si scurisce col resto, ma col fondo e non col filtro: il testo deve restare leggibile", () => {
    // Col filtro anche il testo si scurisce, e l'anno della linguetta piu' in
    // fondo scendeva a 1,74:1 sul chiaro (misurato). Il fondo invece si
    // mischia con l'inchiostro quanto il resto della cartella, e il testo
    // cambia tono (vedi tonoLinguetta).
    const filtri = regoleDellArchivio.filter((r) => /\bfilter:/.test(r.body));
    expect(filtri.length).toBeGreaterThan(0);
    for (const r of filtri) {
      expect(r.selector).toMatch(/:not\(\[data-tab\]\)$/);
    }
    const fondo = regoleDellArchivio.find(
      (r) => r.selector.includes("[data-archive-lit]") && /\[data-tab\]$/.test(r.selector) && /background-color:/.test(r.body),
    );
    expect(fondo?.body).toMatch(/color-mix\(in srgb, var\(--folder-spine\), var\(--ink\) calc\(var\(--depth, 0\) \* var\(--darkens\) \* 100%\)\)/);
    // Dietro @supports: un color-mix con calc che il browser rifiuta diventa
    // trasparente, non torna al fondo di prima.
    expect(fondo?.inside).toContain("@supports (background-color: color-mix(in srgb, red calc(1 * 10%), blue))");
  });

  it("i tre toni della linguetta: sul chiaro cambiano il testo, sullo scuro no", () => {
    const colore = (selettore: RegExp, valore: RegExp) =>
      rules(selettore).some((r) => valore.test(r.body));
    expect(colore(/\[data-tab-tone="1"\] > \[data-tab\]$/, /color:\s*var\(--fg\)/)).toBe(true);
    expect(colore(/\[data-tab-tone="2"\] > \[data-tab\]/, /color:\s*var\(--paper\)/)).toBe(true);
    expect(
      colore(/\[data-theme="dark"\].*\[data-tab-tone\] > \[data-tab\]/, /color:\s*var\(--folder-muted\)/),
    ).toBe(true);
  });

  it("il dorso della cartella davanti prende il click, e non lo passa a quelle coperte", () => {
    // La fascia fra le linguette e la faccia e' dorso: trasparente al
    // puntatore, un click li' apriva il dossier di una cartella nascosta.
    const dorso = regoleDellArchivio.find(
      (r) => r.selector.includes("[data-archive-lit]") && /\[data-spine\]$/.test(r.selector),
    );
    expect(dorso?.body).toMatch(/pointer-events:\s*auto/);
  });

  it("dentro l'archivio i testi piccoli hanno un tenue piu' scuro, e l'arancio scuro e' schiarito", () => {
    // I rapporti sono in contrast.test.ts, misurati sui colori risolti.
    const chiaro = rules("[data-work-shelf]")[0]?.body ?? "";
    expect(chiaro).toMatch(/--folder-muted:\s*color-mix\(in oklab, var\(--fg-muted\) 80%, var\(--fg\)\)/);
    const scuro = rules('[data-theme="dark"] [data-work-shelf]')[0]?.body ?? "";
    expect(scuro).toMatch(/--folder-muted:\s*var\(--fg-muted\)/);
    expect(scuro).toMatch(/--accent-text:\s*color-mix\(in oklab, var\(--accent\) 90%, var\(--paper\)\)/);
    // Il tenue globale compare solo dentro la definizione del tenue suo.
    const tenui = regoleDellArchivio.filter((r) =>
      /var\(--fg-muted\)/.test(r.body.replace(/--folder-muted:[^;]*;/g, "")),
    );
    expect(tenui.map((r) => r.selector), "un testo dell'archivio usa ancora il tenue globale").toEqual([]);
  });

  it("il puntatore passa attraverso le cartelle e prende solo faccia e linguetta", () => {
    // Le cartelle archiviate stanno una sopra l'altra: senza, la scatola di
    // quella davanti coprirebbe le linguette di quelle dietro.
    const eventi = (sel: string) =>
      regoleDellArchivio.find((r) => r.selector === sel && /pointer-events:/.test(r.body))?.body;
    expect(eventi("[data-folder]")).toMatch(/pointer-events:\s*none/);
    expect(eventi("[data-tab]")).toMatch(/pointer-events:\s*auto/);
    expect(eventi("[data-face]")).toMatch(/pointer-events:\s*auto/);
  });

  it("sotto i 600px la linguetta porta solo il nome e la faccia perde le tecnologie", () => {
    const telefono = { media: "(max-width: 599px)" };
    const anno = rules(/\[data-tab-year\]$/, telefono);
    expect(anno.length, "manca il blocco del telefono dell'archivio").toBeGreaterThan(0);
    expect(anno.map((r) => r.body).join("\n")).toMatch(/display:\s*none/);
    expect(rules(/\[data-face-tech\]$/, telefono).map((r) => r.body).join("\n")).toMatch(/display:\s*none/);
  });

  it("il centro della faccia non si stringe sotto il suo contenuto, o la soglia non vede niente", () => {
    // La soglia confronta quanto deborda la faccia. Con `min-height: 0` sul
    // centro, la riga di mezzo si stringeva e il contenuto finiva sopra il
    // piede invece di debordare: misurato a 390x664, il riquadro del
    // riservato scendeva 17px sotto il centro fin dentro «Apri il caso», e la
    // soglia diceva che ci stava.
    const centro = regoleDellArchivio.filter((r) => /\[data-face-centre\]$/.test(r.selector));
    expect(centro.length).toBeGreaterThan(0);
    for (const r of centro) expect(r.body).not.toMatch(/min-height:\s*0/);
  });

  it("la riga grande cresce anche con l'altezza, non solo con la larghezza", () => {
    // Su un portatile basso (1366x768) la riga del riservato a 3,6vw chiedeva
    // cento pixel piu' della faccia. `vh` davanti per chi `svh` non lo conosce.
    const riga = regoleDellArchivio.filter((r) => /\[data-face-line\]$/.test(r.selector) && /font-size:/.test(r.body));
    const corpo = riga.map((r) => r.body).join("");
    expect(corpo).toMatch(/font-size:\s*clamp\(1\.45rem, min\(3\.6vw, [\d.]+vh\), 3\.1rem\);\s*font-size:\s*clamp\(1\.45rem, min\(3\.6vw, [\d.]+svh\), 3\.1rem\)/);
  });

  it("la faccia si toglie la barra in basso, o «Apri il caso» ci finisce sotto", () => {
    const faccia = regoleDellArchivio.find(
      (r) => r.selector.includes("[data-archive-lit]") && /\[data-face\]$/.test(r.selector) && /height:/.test(r.body),
    );
    expect(faccia?.body).toContain("var(--bottom-bar)");
    expect(faccia?.body).toContain("100svh");
  });
});

/** Le regole della pratica: tutte sotto il dialog, anche dentro le media query. */
const regoleDellaPratica = rules(/\[data-work-dialog\]/);

describe("i colori della pratica", () => {
  it("il foglio e' carta nei due temi: dentro mai i colori che seguono il tema", () => {
    // Come l'editor della cassetta e' scuro in tutti e due, la pratica e' un
    // oggetto di carta: --fg, --bg e compagni si ribaltano col tema scuro, e
    // il foglio diventerebbe inchiostro su inchiostro.
    expect(regoleDellaPratica.length).toBeGreaterThan(20);
    const vietati = /var\(--(fg|bg|fg-muted|line|accent-text|folder-[\w-]+)\)/;
    const colpevoli = regoleDellaPratica.filter((r) => vietati.test(r.body));
    expect(colpevoli.map((r) => r.selector)).toEqual([]);
  });

  it("i colori del foglio sono i suoi, e vengono dalla tavolozza", () => {
    const radice = regoleDellaPratica.find((r) => r.selector === "[data-work-dialog]")?.body ?? "";
    expect(radice).toMatch(/--sheet-paper:\s*var\(--paper\)/);
    expect(radice).toMatch(/--sheet-ink:\s*var\(--ink\)/);
    expect(radice).toMatch(/--sheet-muted:\s*var\(--muted\)/);
    expect(radice).toMatch(/--sheet-orange:\s*var\(--accent-on-paper\)/);
    const scritti = regoleDellaPratica.filter((r) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(r.body));
    expect(scritti.map((r) => r.selector)).toEqual([]);
  });

  it("il timbro non si fonde con la carta: il suo colore e' quello misurato in contrast.test.ts", () => {
    expect(regoleDellaPratica.filter((r) => /mix-blend-mode/.test(r.body))).toEqual([]);
  });

  it("sul computer il foglio si scorre invece di tagliare il testo", () => {
    const computer = rules(/\[data-dossier-sheet\]$/, { media: "(min-width: 1024px) and (min-height: 700px)" });
    expect(computer.length, "manca il blocco del computer della pratica").toBeGreaterThan(0);
    expect(computer.map((r) => r.body).join("\n")).toMatch(/overflow-y:\s*auto/);
    const pratica = regoleDellaPratica.filter((r) => /\[data-dossier(-sheet)?\]$/.test(r.selector));
    expect(pratica.filter((r) => r.selector.endsWith("[data-dossier-sheet]")).length).toBeGreaterThan(0);
    const nascosti = pratica.filter((r) => /overflow(-y)?:\s*hidden/.test(r.body));
    expect(nascosti.map((r) => r.selector)).toEqual([]);
  });
});
