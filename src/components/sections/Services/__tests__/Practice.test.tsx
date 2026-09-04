import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Practice } from "../Practice";
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
