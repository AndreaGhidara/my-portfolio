import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorksView } from "../WorksView";

const labels = {
  lavoro: "Il lavoro",
  scelta: "La soluzione scelta",
  conduzione: "Come è stata condotta",
  visit: "Visita il sito",
  screenshotAlt: "{name}: schermata",
  riservato: "Coperto da accordo di riservatezza",
  open: "Apri il caso",
  close: "Chiudi",
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

  it("l'attributo dello schedario resta sull'elemento che contiene le cartelle", () => {
    // Tutto l'impaginato dello schedario e' scritto con `[data-work-shelf] > *`:
    // le cartelle sovrapposte, le linguette sfalsate, il sollevamento al
    // passaggio del mouse. L'entrata avvolge quell'elemento, e se l'involucro
    // si mettesse in mezzo le cartelle tornerebbero quattro riquadri in fila.
    const { container } = render(<WorksView {...props} />);
    const schedario = container.querySelector("[data-work-shelf]");
    expect(schedario).not.toBeNull();
    expect(schedario!.children).toHaveLength(items.length);
    for (const figlio of Array.from(schedario!.children)) {
      expect(figlio.hasAttribute("data-work-folder")).toBe(true);
    }
  });

  it("linguetta e corpo hanno lo stesso fondo, ed e' il fondo che le salda in una cartella", () => {
    // I due pezzi si leggono come una cartella sola perche' il corpo copre il
    // bordo della linguetta con un fondo PIENO. Se i due fondi divergono, la
    // saldatura si vede. Ed e' --superficie e non --bg: sul tema scuro il
    // fondo di pagina lascerebbe le cartelle senza corpo.
    const { container } = render(<WorksView {...props} />);
    const linguetta = container.querySelector("[data-work-folder] > span");
    const corpo = container.querySelector("[data-folder-body]");
    expect(linguetta!.className).toContain("bg-[var(--superficie)]");
    expect(corpo!.className).toContain("bg-[var(--superficie)]");
  });

  it("la linguetta porta nome e anno, così il sintomo resta il titolo", () => {
    render(<WorksView {...props} />);
    expect(screen.getByText("BDroppy · 2024")).toBeVisible();
  });

  it("all'inizio nessun dossier è aperto", () => {
    render(<WorksView {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(items[0].scelta)).not.toBeInTheDocument();
  });

  it("cliccando una cartella si apre il dossier con la soluzione scelta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByText(items[0].scelta)).toBeVisible();
    expect(screen.getByText(items[0].conduzione)).toBeVisible();
  });

  it("il dossier ha un nome accessibile: chi naviga a voce deve sapere di quale caso si tratta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("dialog", { name: /BDroppy/ })).toBeInTheDocument();
  });

  it("mentre il dossier è aperto la pagina sotto non scorre", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
  });

  it("il link al sito si apre in una scheda nuova, in sicurezza", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const link = screen.getByRole("link", { name: new RegExp(labels.visit) });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("mostra le metriche del caso quando ce ne sono", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("120")).toBeVisible();
    expect(screen.getByText("componenti migrati")).toBeVisible();
  });

  it("il dossier mostra il caso della cartella cliccata, non sempre il primo", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[1]);
    expect(screen.getByText(items[1].scelta)).toBeVisible();
    expect(screen.queryByText(items[0].scelta)).not.toBeInTheDocument();
  });
  it("il riquadro non e' mai vuoto: l'anteprima sfocata c'e' dal primo frame, la schermata vera no", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    const shot = screen.getByRole("img", { name: items[0].screenshotAlt });
    // Finche' non e' arrivata, la schermata non si vede: quello che riempie il
    // riquadro e' l'anteprima, e la dissolvenza deve avere da dove partire.
    expect(shot).not.toHaveAttribute("data-loaded");
    const anteprima = document.querySelector("[data-shot-blur]");
    expect(anteprima).toBeInTheDocument();
    expect(anteprima).toHaveStyle({
      backgroundImage: `url("${items[0].screenshot.blurDataURL}")`,
    });
  });

  it("quando la schermata e' carica prende il posto dell'anteprima", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    const shot = screen.getByRole("img", { name: items[0].screenshotAlt });
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

    render(<WorksView {...props} items={[caso]} />);
    const cartella = screen.getAllByRole("button")[0];
    await userEvent.hover(cartella);
    await userEvent.unhover(cartella);
    await userEvent.hover(cartella);

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
    await userEvent.hover(screen.getAllByRole("button")[0]);

    expect(richieste).toHaveLength(0);
  });
});
