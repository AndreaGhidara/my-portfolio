import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { deskLayers, type SampleId } from "@/content/desk";
import { metricById } from "@/content/metrics";
import { rules } from "@/test/css";
import { DeskTable, type DeskLayerData } from "../DeskTable";
import { SPECIMENS } from "../DeskSpecimen";

// Senza campione apposta: l'hosting non ha una faccia, e il testo del post-it
// grigio va tradotto, quindi arriva dai messaggi e non da SPECIMENS.
const WITHOUT_SPECIMEN = ["hosting", "blank"];

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
    // Il difetto di partenza: la nota si vedeva solo al passaggio del mouse.
    const { container } = renderTable();
    const note = container.querySelector("[data-desk-note]");
    expect(note).not.toBeNull();
    expect(note?.textContent).toBe(NOTE);
  });

  it("la nota non e' il nome del comando: quello resta l'invito", () => {
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
    const coffees = metricById("coffees");
    expect(coffees.value).toBe("23.777");
    expect(coffees.estimated).toBe(true);
    expect(coffees.howToVerify.length).toBeGreaterThan(15);
  });
});

describe("i campioni sanno disegnarsi", () => {
  it("ogni campione dichiarato ha il suo disegno, e non ce n'e' nessuno di troppo", () => {
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
    // "Il tuo gestionale" e "I dati" erano la stessa tabella. La firma e' l'insieme
    // delle marche piu' il testo, senza conteggi: i campioni mono sono la stessa
    // marca e si distinguono per la parola.
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
    // Una marca senza regola e' un elemento largo zero: si disegna e non si vede.
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
