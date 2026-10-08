import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { deskLayers, type SampleId } from "@/content/desk";
import { metricById } from "@/content/metrics";
import { rules } from "@/test/css";
import { DeskTable, type DeskLayerData } from "../DeskTable";
import { SPECIMENS } from "../DeskSpecimen";

/**
 * I due oggetti che un campione onesto non ce l'hanno, e perche'.
 *
 * Un campione e' un FRAMMENTO della cosa, non un suo simbolo: "I colori" sono i
 * colori veri, "Il dominio" e' il dominio scritto. E' la regola che tiene questa
 * proposta lontana dal catalogo di icone, ed e' anche quello che la limita.
 *
 * - `hosting` ("Dove sta"): l'hosting non ha una faccia. Qualunque cosa gli si
 *   metta dentro (una nuvola, un globo, un server) e' un simbolo travestito da
 *   campione, e il primo che sfonda la regola la sfonda per tutti.
 * - `blank`: il post-it grigio ha qualcosa scritto sopra (il conto dei caffe')
 *   ma e' testo TRADOTTO, e i campioni sono disegni fissi dentro un componente.
 *   Gli arriva percio' dalle traduzioni, come `note`, e non da SPECIMENS. E' una
 *   ragione tecnica, non un'eccezione alla regola dei campioni.
 *
 * Un vuoto dichiarato in mezzo a ventidue prove si legge come una scelta. Uno
 * dimenticato no, ed e' per questo che la lista sta qui e non in un commento.
 */
const WITHOUT_SPECIMEN = ["hosting", "blank"];

/** Tutti gli oggetti del tavolo, appiattiti. */
const objects = deskLayers.flatMap((layer) =>
  layer.objects.map((object) => ({ ...object, layer: layer.id })),
);

const fakeLayers = (): DeskLayerData[] =>
  deskLayers.map((layer) => ({
    id: layer.id,
    title: `Strato ${layer.id}`,
    lead: `A cosa serve lo strato ${layer.id}.`,
    objects: layer.objects.map((object) => ({
      id: object.id,
      shape: object.shape,
      sample: object.sample,
      label: object.mute ? null : `${object.id}`,
    })),
  }));

describe("chi ha un campione", () => {
  it("ce l'hanno tutti tranne i due che non possono averlo", () => {
    for (const object of objects) {
      const expected = !WITHOUT_SPECIMEN.includes(object.id);
      expect(
        Boolean(object.sample),
        expected
          ? `${object.layer}/${object.id} non ha un campione: o glielo dai, o entra in WITHOUT_SPECIMEN con la sua ragione`
          : `${object.layer}/${object.id} ha un campione ma e' nella lista di chi non puo' averlo`,
      ).toBe(expected);
    }
  });

  it("il post-it grigio non passa da SPECIMENS: quello che porta e' testo tradotto", () => {
    const mute = objects.find((o) => o.mute);
    expect(mute).toBeDefined();
    expect(mute?.sample).toBeUndefined();
  });
});

describe("il post-it grigio", () => {
  const NOTE = "23.777 caffè";

  const renderTable = () =>
    render(
      <DeskTable layers={fakeLayers()} centre="il progetto" blank="E la tua, qual è? Scrivimi." note={NOTE} />,
    );

  it("porta la sua nota, e si vede senza che nessuno ci passi sopra", () => {
    // E' il difetto da cui e' partita questa modifica: prima il post-it stava
    // grigio e muto finche' qualcuno non ci passava sopra col mouse, e nessuno
    // passa il mouse su un quadrato che non sembra niente. L'affordance
    // esisteva solo dopo che l'avevi gia' trovata.
    const { container } = renderTable();
    const note = container.querySelector("[data-desk-note]");
    expect(note).not.toBeNull();
    expect(note?.textContent).toBe(NOTE);
  });

  it("la nota non e' il nome del comando: quello resta l'invito", () => {
    // Due testi dentro un <a> sono un comando che si annuncia due volte. La nota
    // e' decorazione come ogni altro campione del tavolo; il nome e' la domanda.
    const { getByRole, container } = renderTable();
    expect(container.querySelector("[data-desk-note]")).toHaveAttribute("aria-hidden", "true");
    expect(getByRole("link", { name: "E la tua, qual è? Scrivimi." })).toBeInTheDocument();
  });

  it("ce n'e' una sola su tutto il tavolo: la porta solo l'oggetto che si preme", () => {
    const { container } = renderTable();
    expect(container.querySelectorAll("[data-desk-note]")).toHaveLength(1);
    const inside = container.querySelector("[data-desk-note]")?.closest("[data-desk-blank]");
    expect(inside, "la nota sta fuori dal comando").not.toBeNull();
  });

  it("il numero sta dove stanno gli altri numeri inventati, e si dichiara tale", () => {
    // La regola di content/metrics.ts: ogni numero non misurato sta in un posto
    // solo e dichiara di essere stimato. Questo e' una battuta e non un dato,
    // ragione in piu' perche' non se ne stia per conto suo dentro un componente,
    // dove nessuno lo troverebbe il giorno che qualcuno chiede "e questo?".
    const coffees = metricById("coffees");
    expect(coffees.value).toBe("23.777");
    expect(coffees.estimated).toBe(true);
    expect(coffees.howToVerify.length).toBeGreaterThan(15);
  });
});

describe("i campioni sanno disegnarsi", () => {
  it("ogni campione dichiarato ha il suo disegno, e non ce n'e' nessuno di troppo", () => {
    // Le due direzioni sono due difetti diversi. Un campione dichiarato senza
    // disegno e' un buco nel tavolo; un disegno senza nessuno che lo chiami e'
    // codice morto che il giorno dopo qualcuno "sistema" cambiandolo.
    const declared = new Set(objects.map((o) => o.sample).filter(Boolean) as SampleId[]);
    const drawn = new Set(Object.keys(SPECIMENS) as SampleId[]);
    for (const id of declared) {
      expect(drawn.has(id), `il campione "${id}" e' dichiarato ma non sa disegnarsi`).toBe(true);
    }
    for (const id of drawn) {
      expect(declared.has(id), `il disegno "${id}" non lo chiama nessun oggetto`).toBe(true);
    }
  });

  it("nessun oggetto divide il suo campione con un altro: un frammento e' di una cosa sola", () => {
    const used = objects.map((o) => o.sample).filter(Boolean);
    expect(new Set(used).size).toBe(used.length);
  });

  it("due campioni non sono lo stesso disegno: fatti di marche diverse, o di parole diverse", () => {
    // La prova qui sopra guarda gli ID e non vede niente. Serviva questa, e
    // servirla PRIMA: "Il tuo gestionale" era una tabella di celle, e "I dati"
    // e' una tabella di celle piu' fitta: due oggetti col medesimo disegno, che
    // e' esattamente il difetto che i campioni erano li' per risolvere. Nessuna
    // prova se n'e' accorta, e l'ha visto un occhio.
    //
    // La firma e' l'INSIEME delle marche piu' il testo, senza i conteggi: due
    // tabelle restano due tabelle anche con dodici celle una e diciotto l'altra,
    // ed e' quel caso che va colto. Il testo entra perche' i quattro campioni
    // mono (nome.it, https://, 0,4 s, v2.4 → v2.5) sono la stessa marca e cose
    // diverse: li' e' la parola a essere il disegno.
    //
    // Resta un proxy, e vale la pena dirlo: coglie "lo stesso disegno", non
    // "un disegno che gli somiglia". Per quello serve un occhio, e va bene cosi'.
    const signatures = new Map<string, string>();
    for (const [id, drawing] of Object.entries(SPECIMENS)) {
      const { container } = render(<span data-desk-sample={id}>{drawing}</span>);
      const marks = [
        ...new Set(
          [...container.querySelectorAll("[data-m]")].map((n) => n.getAttribute("data-m")),
        ),
      ].sort();
      const signature = `${marks.join("+")} | ${container.textContent}`;
      const twin = signatures.get(signature);
      expect(
        twin,
        `"${id}" e "${twin}" sono lo stesso disegno (${signature}): uno dei due non sta mostrando niente di suo`,
      ).toBeUndefined();
      signatures.set(signature, id);
    }
  });
});

describe("dove stanno e come si comportano", () => {
  it("ce n'e' esattamente uno per ogni oggetto che lo dichiara", () => {
    const { container } = render(
      <DeskTable layers={fakeLayers()} centre="il progetto" blank="Scrivimi" note="23.777 caffè" />,
    );
    const expected = objects.filter((o) => o.sample).length;
    expect(container.querySelectorAll("[data-desk-sample]")).toHaveLength(expected);
  });

  it("non si annunciano: sono decorazione, e il nome dell'oggetto lo porta gia' l'etichetta", () => {
    // Un campione che entra nell'albero di accessibilita' fa leggere "I colori,
    // I colori", o peggio, "Aa". L'etichetta e' il nome; questo e' il disegno.
    const { container } = render(
      <DeskTable layers={fakeLayers()} centre="il progetto" blank="Scrivimi" note="23.777 caffè" />,
    );
    for (const specimen of container.querySelectorAll("[data-desk-sample]")) {
      expect(
        specimen.getAttribute("aria-hidden"),
        specimen.getAttribute("data-desk-sample") ?? undefined,
      ).toBe("true");
    }
  });

  it("non toccano il conteggio delle etichette: restano ventitre'", () => {
    const { container } = render(
      <DeskTable layers={fakeLayers()} centre="il progetto" blank="Scrivimi" note="23.777 caffè" />,
    );
    expect(container.querySelectorAll("[data-desk-label]")).toHaveLength(23);
  });
});

describe("di che colore sono", () => {
  it("non scrivono nessun colore a mano: solo token, come tutto il resto del tavolo", () => {
    // La stessa regola dei materiali (vedi materials.ts): una tinta scritta a
    // mano non sa girare col tema, e questi campioni si vedono su carta e su
    // inchiostro. L'unica eccezione ammessa sarebbe un colore che NON deve
    // seguire il tema, e qui non ce n'e' nessuno: anche i tre campioni de
    // "I colori" sono i token del brand, che e' esattamente il motivo per cui
    // quel campione e' onesto.
    const culprits: string[] = [];
    for (const { selector, body } of rules(/data-desk-sample/)) {
      const hex = body.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hex) culprits.push(`${selector} → ${hex.join(", ")}`);
    }
    expect(culprits, `colori scritti a mano nei campioni:\n${culprits.join("\n")}`).toHaveLength(
      0,
    );
  });

  it("il foglio di stile conosce ogni marca: nessun campione resta un quadrato invisibile", () => {
    // Il difetto vero non e' un campione senza regola: quasi tutti si disegnano
    // con le marche condivise, e chiedere una regola col loro nome sarebbe una
    // prova che impone un CSS ridondante. Il difetto e' una MARCA senza regola:
    // uno <i data-m="qualcosa"> mai dichiarato e' un elemento largo zero, che si
    // disegna, non si vede, e che nessuna prova di rendering sa distinguere da
    // un elemento disegnato bene.
    const selectors = rules().map((r) => r.selector);
    const orphans = new Set<string>();
    for (const [id, drawing] of Object.entries(SPECIMENS)) {
      const { container } = render(<span data-desk-sample={id}>{drawing}</span>);
      for (const mark of container.querySelectorAll("[data-m]")) {
        const name = mark.getAttribute("data-m");
        if (name && !selectors.some((s) => s.includes(`[data-m="${name}"]`))) orphans.add(`${id} → ${name}`);
      }
    }
    expect([...orphans], `marche senza regola:\n${[...orphans].join("\n")}`).toHaveLength(0);
  });
});
