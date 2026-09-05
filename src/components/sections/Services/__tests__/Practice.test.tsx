import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Practice } from "../Practice";
import { DeskObject } from "../DeskObject";
import { practiceScenes } from "@/content/practice";

const items = [
  { id: "sites", title: "Siti e landing", description: "Niente temi comprati." },
  { id: "ecommerce", title: "E-commerce", description: "Il catalogo lo collego." },
  { id: "webapp", title: "Web app", description: "Si parte dalla versione piccola." },
  { id: "ai", title: "AI e automazioni", description: "Collegate ai tuoi dati veri." },
];
const props = { practice: "E in pratica?", intro: "Quattro modi di lavorare.", items };

describe("«E in pratica?» come scena", () => {
  it("resta una lista ordinata di quattro voci: l'ordine e' la risposta alle quattro frasi", () => {
    const { container } = render(<Practice {...props} />);
    const ol = container.querySelector("[data-practice]");
    expect(ol?.tagName).toBe("OL");
    expect(ol?.querySelectorAll(":scope > li")).toHaveLength(4);
  });

  it("ogni voce disegna gli oggetti che il contenuto dichiara, con la loro sagoma", () => {
    const { container } = render(<Practice {...props} />);
    const voci = container.querySelectorAll("[data-practice] > li");
    practiceScenes.forEach((scene, i) => {
      const sagome = voci[i].querySelectorAll("[data-desk-shape]");
      expect(sagome).toHaveLength(scene.drawings.length);
      scene.drawings.forEach((d, k) => {
        expect(sagome[k]).toHaveAttribute("data-shape", d.shape);
      });
    });
  });

  it("ogni disegno porta il suo campione: e' la ragione per cui e' grande", () => {
    // Sul tavolo il campione e' una macchia da settanta pixel; qui il disegno e'
    // largo duecentocinquanta e finalmente si legge cosa c'e' dentro. Senza
    // campione questa sezione non ha motivo di esistere.
    const { container } = render(<Practice {...props} />);
    const campioni = [...container.querySelectorAll("[data-desk-sample]")].map((el) =>
      el.getAttribute("data-desk-sample"),
    );
    expect(campioni).toEqual(practiceScenes.flatMap((s) => s.drawings.map((d) => d.sample)));
  });

  it("i lati si alternano: la freccia deve passare solo sopra i disegni", () => {
    const { container } = render(<Practice {...props} />);
    const lati = [...container.querySelectorAll("[data-practice] > li")].map((el) =>
      el.getAttribute("data-lato"),
    );
    expect(lati).toEqual(["dx", "sx", "dx", "sx"]);
  });

  it("i disegni sono decorativi: il significato sta nel titolo e nel testo", () => {
    const { container } = render(<Practice {...props} />);
    for (const disegno of container.querySelectorAll("[data-practice-drawing]")) {
      expect(disegno).toHaveAttribute("aria-hidden", "true");
      expect(
        disegno.querySelectorAll("img, svg, [alt], [role], [aria-label], [title]"),
      ).toHaveLength(0);
    }
  });

  it("il patto del fallback: senza movimento nessuna voce e' sbiadita", () => {
    // useMotionLevel dice "none" in SSR e al primo render. Se lo sbiadire delle
    // voci non attive stesse fuori da data-motion="full", tre quarti della
    // sezione resterebbero al 40% di opacita' per sempre — cioe' illeggibili —
    // ed e' il modo classico in cui una scena scrollytelling si rompe.
    //
    // Questa prova pero' guarda il MARKUP, e in jsdom il markup non e' vestito:
    // "none" e nessun data-attiva sono veri anche di una scena che sbiadisce lo
    // stesso, perche' a sbiadire e' il foglio di stile. Il patto vero lo guarda
    // «il patto del fallback, letto in tokens.css», in fondo a questo file.
    const { container } = render(<Practice {...props} />);
    expect(container.querySelector("[data-pratica]")).toHaveAttribute("data-motion", "none");
    expect(container.querySelector("[data-practice] > li")).not.toHaveAttribute("data-attiva");
  });

  it("i quattro testi restano quelli, al loro livello", () => {
    const { container } = render(<Practice {...props} />);
    expect(screen.getByRole("heading", { level: 3, name: props.practice })).toBeInTheDocument();
    for (const item of items) {
      expect(screen.getByRole("heading", { level: 4, name: item.title })).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
    const ol = container.querySelector("[data-practice]") as HTMLElement;
    expect(within(ol).getByText("01")).toBeVisible();
    expect(within(ol).getByText("04")).toBeVisible();
  });
});

describe("il filo in pagina", () => {
  it("c'e', ed e' decorativo", () => {
    const { container } = render(<Practice {...props} />);
    const svg = container.querySelector("[data-pratica-filo]");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("senza movimento e' gia' disegnato per intero", () => {
    // weave scrive dasharray e dashoffset inline, tutti e due pari alla
    // lunghezza del tratto: filo invisibile, ed e' lo scrub che poi lo disegna.
    // A livello "none" useSectionAnimation non chiama nemmeno la build, quindi
    // quelle due property non esistono e il filo si vede intero. E' il patto
    // del fallback, ed e' lo stesso dei cavi del tavolo.
    const { container } = render(<Practice {...props} />);
    const tratto = container.querySelector("[data-pratica-filo] path") as SVGPathElement;
    expect(tratto.style.strokeDasharray).toBe("");
    expect(tratto.style.strokeDashoffset).toBe("");
  });
});

describe("la freccia", () => {
  it("c'e', ed e' decorativa", () => {
    const { container } = render(<Practice {...props} />);
    const freccia = container.querySelector("[data-pratica-freccia]");
    expect(freccia).not.toBeNull();
    expect(freccia).toHaveAttribute("aria-hidden", "true");
  });

  it("la strada e' nel DOM ma non si vede: e' il tracciato, non il disegno", () => {
    // Niente display:none — romperebbe getPointAtLength, che e' l'unica ragione
    // per cui questo path esiste.
    const { container } = render(<Practice {...props} />);
    const strada = container.querySelector("[data-pratica-strada]");
    expect(strada).not.toBeNull();
    expect(strada).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-pratica-strada] path")).not.toBeNull();
  });
});

/**
 * IL FOGLIO DI STILE, LETTO COME TESTO.
 *
 * jsdom non applica `tokens.css`: qualunque asserzione su come questa scena si
 * VEDE, fatta sul DOM renderizzato, non guarda niente. «Il patto del fallback»
 * qui sopra ne e' un esempio dichiarato — verifica `data-motion="none"` e
 * l'assenza di `data-attiva`, che sono vere anche di un markup che sbiadisce
 * lo stesso, perche' a sbiadire e' il CSS e il CSS nessuno lo esegue.
 *
 * La tecnica per uscirne e' gia' in casa (DeskSpecimen.test.tsx, materials.test.ts):
 * si legge il foglio come stringa e si asserisce una sua PROPRIETA'. Le due
 * prove qui sotto lo fanno per le due cose che il DOM non puo' dire — che fuori
 * da "full" non si spegne niente, e che nessuna regola da cui i disegni
 * dipendono e' appesa a un selettore che i disegni non portano.
 *
 * Non fissano il foglio di oggi: nessuna delle due nomina una regola. Contano
 * quelle che ci sono e chiedono a ognuna la stessa cosa. Una prova che
 * ricopiasse lo stile attuale sarebbe peggio di nessuna prova — cadrebbe a ogni
 * modifica innocua e passerebbe su ogni modifica sbagliata che la ricopia.
 */
const TOKENS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

type Regola = { selettore: string; corpo: string; dentro: string[] };

/** Le regole del foglio, at-rule comprese: un `@media` non e' una regola, e' un
 *  contenitore di regole, e quelle dentro devono essere guardate come le altre.
 *  Il parser di `materials.test.ts` e' piatto e va bene per quello che chiede;
 *  qui la nidificazione conta, perche' meta' dell'impaginato della scena vive
 *  dentro una @media. */
function regole(css: string, dentro: string[] = []): Regola[] {
  const out: Regola[] = [];
  let testa = "";
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === "{") {
      let d = 0;
      let fine = i;
      for (let k = i; k < css.length; k++) {
        if (css[k] === "{") d++;
        else if (css[k] === "}" && --d === 0) {
          fine = k;
          break;
        }
      }
      const corpo = css.slice(i + 1, fine);
      const t = testa.trim().replace(/\s+/g, " ");
      if (t.startsWith("@")) out.push(...regole(corpo, [...dentro, t]));
      else out.push({ selettore: t, corpo, dentro });
      testa = "";
      i = fine + 1;
    } else if (c === "}") {
      testa = "";
      i++;
    } else {
      testa += c;
      i++;
    }
  }
  return out;
}

/** Le proprieta' dichiarate da una regola, senza quelle delle regole annidate. */
function dichiara(corpo: string, prop: string): string[] {
  return [...corpo.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:([^;]*)`, "g"))].map((m) =>
    m[1].trim(),
  );
}

/** Un selettore alla volta: `a, b { }` sono due regole scritte in una. */
const selettori = (r: Regola) =>
  r.selettore
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Le quattro cose che la scena FA LEGGERE. Il filo, la strada e la freccia sono
 *  decorazione aria-hidden — e la freccia e' gia' `display: none` fuori da
 *  "full" — mentre il patto del fallback riguarda quello che si legge. */
const CONTENUTO = /\[data-practice-(item|text|art|drawing)\]/;
const PIENO = /\[data-motion="full"\]/;

describe("il patto del fallback, letto in tokens.css", () => {
  /**
   * La regola: chi non ha chiesto il movimento non deve trovare la scena
   * spenta. Una regola della scena e' DINAMICA — e allora deve stare sotto
   * `[data-motion="full"]` — quando:
   *
   *  - dipende da `[data-attiva]`, che e' uno stato che scrive solo il ciclo e
   *    che senza ciclo nessuna voce ha mai;
   *  - dichiara `opacity` o `filter`, cioe' toglie qualcosa alla vista;
   *  - dichiara `transition`, cioe' promette un movimento;
   *  - dichiara una `transform` che non venga per intero dai dati inline della
   *    voce. La rotazione dei disegni — `rotate(var(--rot))` — non e' movimento:
   *    e' il disegno, ed e' uguale a ogni livello. Uno `scale(0.96)` no.
   *
   * Senza questo vincolo tre quarti della sezione restano al 40% di opacita'
   * per sempre — cioe' illeggibili — ed e' il modo classico in cui una scena
   * guidata dallo scorrimento si rompe su chi non la puo' guardare.
   */
  const soloDati = (valore: string) =>
    !/\d/.test(valore.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ""));

  it("niente si spegne, si filtra o si muove fuori da [data-motion=\"full\"]", () => {
    const dinamiche: string[] = [];
    for (const r of regole(TOKENS)) {
      const spegne =
        dichiara(r.corpo, "opacity").length > 0 ||
        dichiara(r.corpo, "filter").length > 0 ||
        dichiara(r.corpo, "transition").length > 0;
      const trasforma = dichiara(r.corpo, "transform").some((v) => !soloDati(v));
      for (const sel of selettori(r)) {
        if (!CONTENUTO.test(sel)) continue;
        const dinamica = spegne || trasforma || /\[data-attiva\]/.test(sel);
        if (dinamica && !PIENO.test(sel)) dinamiche.push(`${sel} { ${r.corpo.trim()} }`);
      }
    }
    expect(
      dinamiche,
      "regole che spengono o muovono la scena senza il permesso di data-motion",
    ).toEqual([]);
  });

  it("il vuoto della coda si apre solo dove la freccia esiste", () => {
    // Il blocco vuoto in fondo e' lo spazio del 180, e la freccia vive solo a
    // "full". Era appeso a una @media da 900px: chi ha la riduzione del
    // movimento, chi non ha JavaScript e chiunque stia fra i 900 e i 1023
    // chiudeva la sezione con mezzo schermo di pagina bianca e niente dentro.
    const aperture = regole(TOKENS).flatMap((r) =>
      selettori(r)
        .filter((sel) => /\[data-pratica-coda\]/.test(sel))
        .flatMap((sel) =>
          dichiara(r.corpo, "height")
            .filter((h) => !/^0\b/.test(h))
            .map((h) => ({ sel, h })),
        ),
    );
    expect(aperture.length, "nessuna regola apre la coda: la scena non ha piu' respiro").toBe(1);
    for (const { sel, h } of aperture) {
      expect(PIENO.test(sel), `${sel} apre la coda a ${h} senza che ci sia una freccia`).toBe(true);
    }
  });
});

describe("i disegni della scena e le regole che li vestono", () => {
  const combacia = (nodi: Element[], sel: string) => {
    try {
      return nodi.some((n) => n.matches(sel));
    } catch {
      // Un selettore che jsdom non sa leggere non si puo' giudicare: meglio
      // saltarlo che dichiararlo irraggiungibile.
      return null;
    }
  };

  /** Gli stati che il ciclo scrive e il livello di movimento risolto: descrivono
   *  un MOMENTO, non il disegno. A riposo e senza JavaScript non ci sono su
   *  nessuno dei due ospiti, e chiederne la raggiungibilita' qui vorrebbe dire
   *  chiedere che la scena sia sempre in moto. Chi li guarda e' la prova qui
   *  sopra. */
  const MOMENTO = /\[data-attiva\]|\[data-motion=/;

  /** Quello che sta DENTRO un ospite: la sagoma coi suoi strati, il campione con
   *  le sue marche. L'ospite stesso resta fuori — dove sta e quanto e' grande
   *  sono le due cose che i due ospiti hanno il diritto di dire in modo diverso:
   *  uno sta su un tavolo, l'altro in una pila. Quello che devono avere uguale
   *  e' il contenuto, ed e' esattamente quello che si guarda qui. */
  const dentro = (ospiti: Element[]) => ospiti.flatMap((o) => [...o.querySelectorAll("*")]);

  const disegni = () => {
    const { container } = render(<Practice {...props} />);
    const out = [...container.querySelectorAll("[data-practice-drawing]")];
    expect(out.length, "senza disegni questa prova non guarda niente").toBeGreaterThan(0);
    return out;
  };

  /**
   * Gli stessi nove oggetti, disegnati come stanno SUL TAVOLO. Non e' markup
   * scritto a mano: e' `DeskObject`, cioe' l'originale, costruito con le due
   * sole cose che «E in pratica?» riprende — la sagoma e il campione. Niente
   * etichetta e niente comando, che la scena non riprende e che infatti non
   * ha (il significato sta nell'<h4> e nel testo accanto).
   */
  const gemelli = () => {
    const { container } = render(
      <ul>
        {practiceScenes
          .flatMap((s) => s.drawings)
          .map((d, i) => (
            <DeskObject
              key={i}
              shape={d.shape}
              sample={d.sample}
              label={null}
              layout="wide"
              placement={{ x: 50, y: 50, rotate: 0 }}
              beat={{ from: 0, span: 1 }}
              hidden={false}
              ghost={false}
            />
          ))}
      </ul>,
    );
    return [...container.querySelectorAll("[data-desk-object]")];
  };

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it("quello che il tavolo dipinge dentro i suoi oggetti arriva anche qui", () => {
    /**
     * E' la prova che avrebbe colto il difetto da cui nasce questo giro: la
     * scatola del campione pendeva da `[data-desk-object]`, che i disegni della
     * scena non hanno e non possono avere — glielo vieta la prova che conta i
     * ventiquattro oggetti del tavolo (spec §4.4). Il campione si impaginava
     * DOPO la sagoma invece che dentro, e non cadeva niente: nessuna prova
     * guardava il foglio di stile da questa parte.
     *
     * La forma, ed e' quella della spec e non una mia invenzione: «le stesse
     * sagome, con gli stessi materiali e gli stessi campioni». Allora si
     * disegnano i nove oggetti anche come stanno sul tavolo, e si chiede al
     * foglio una cosa sola — OGNI regola che tocca qualcosa dentro un oggetto
     * del tavolo deve toccare la stessa cosa dentro il disegno della scena. Se
     * una non ci arriva, quel disegno e' meno di quello che dice di essere.
     *
     * Vale piu' della correzione che l'ha generata: la stessa classe di difetto
     * torna ogni volta che un selettore si sposta, e da qui in poi cade subito.
     */
    document.documentElement.dataset.theme = "dark";
    const tavolo = dentro(gemelli());
    const scena = dentro(disegni());
    const orfane: string[] = [];
    for (const r of regole(TOKENS)) {
      for (const sel of selettori(r)) {
        if (MOMENTO.test(sel)) continue;
        if (combacia(tavolo, sel) !== true) continue;
        if (combacia(scena, sel) !== true) orfane.push(sel);
      }
    }
    expect(
      orfane,
      "regole che vestono un oggetto del tavolo e non arrivano allo stesso disegno nella scena",
    ).toEqual([]);
  });

  it("ogni sagoma riceve un materiale, in tutti e due i temi", () => {
    // Il verso opposto della prova qui sopra, e la ragione per cui la scena
    // esiste: «le stesse sagome con gli stessi materiali». Senza un
    // `--desk-pieno` che le arrivi, una sagoma e' il suo contorno in colore di
    // testo — cioe' il tavolo com'era prima dei materiali, ingrandito.
    const vestono = regole(TOKENS).filter((r) => dichiara(r.corpo, "--desk-pieno").length > 0);
    for (const tema of ["light", "dark"] as const) {
      if (tema === "dark") document.documentElement.dataset.theme = "dark";
      else delete document.documentElement.dataset.theme;
      const sagome = disegni().flatMap((d) => [...d.querySelectorAll("[data-desk-shape]")]);
      expect(sagome.length, "nessuna sagoma da vestire").toBeGreaterThan(0);
      for (const sagoma of sagome) {
        // Il pieno si eredita: la regola puo' scrivere sulla sagoma o su
        // chiunque la contenga.
        const catena: Element[] = [];
        for (let n: Element | null = sagoma; n; n = n.parentElement) catena.push(n);
        const trovata = vestono.some((r) =>
          selettori(r).some((sel) => combacia(catena, sel) === true),
        );
        expect(
          trovata,
          `tema ${tema}: la sagoma ${sagoma.getAttribute("data-shape")} non riceve nessun --desk-pieno`,
        ).toBe(true);
      }
      cleanup();
    }
  });
});
