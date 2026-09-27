import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { ThreadSegment } from "../ThreadSegment";
import { THREAD_ANCHORS, SECTION_ORDER, INTERRUZIONE, NASCOSTE, IN_PAGINA } from "../anchors";

// Senza commenti: quello sopra la sezione nascosta dice come rimetterla, e
// nomina il componente.
const pagina = readFileSync("src/app/[locale]/page.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
/** Il componente che rende ogni sezione del filo in page.tsx. */
const COMPONENTE: Record<string, string> = { hero: "Hero", process: "Process", contact: "Contact" };

describe("ancoraggi del filo", () => {
  it("copre tutte le sezioni attraversate dal filo", () => {
    expect(Object.keys(THREAD_ANCHORS).sort()).toEqual([...SECTION_ORDER].sort());
  });

  it("le sezioni nascoste sono dichiarate, e sono davvero fuori dalla pagina", () => {
    // Una sezione tolta da page.tsx senza passare di qui lasciava il filo con
    // un buco che la prova di continuita' non vedeva: guardava la mappa, non
    // la pagina. Adesso le due cose devono dire lo stesso.
    for (const { sezione, perche } of NASCOSTE) {
      expect(SECTION_ORDER, `${sezione} non e' una sezione del filo`).toContain(sezione);
      expect(perche.trim().length, `${sezione} nascosta senza un perche'`).toBeGreaterThan(20);
      expect(pagina, `${sezione} e' dichiarata nascosta ma e' in pagina`).not.toMatch(
        new RegExp(`<${COMPONENTE[sezione]} />`),
      );
    }
    for (const sezione of IN_PAGINA) {
      expect(pagina, `${sezione} manca dalla pagina senza essere dichiarata nascosta`).toMatch(
        new RegExp(`<${COMPONENTE[sezione]} />`),
      );
    }
  });

  it("il filo è continuo, tranne dove è dichiarato che si interrompe", () => {
    // Il filo si interrompe solo dove una scena non lascia passare una linea
    // verticale (la stampante, il tavolo e l'archivio dei Lavori, il
    // percorso) o dove una sezione e' nascosta. Ogni interruzione e'
    // DICHIARATA in anchors.ts con il suo perche', e questa prova pretende che
    // le rotture siano esattamente quelle: una in piu' vuol dire che il filo
    // si e' spezzato senza che nessuno l'abbia deciso. Si contano sulle
    // sezioni che stanno davvero in pagina, non sulla mappa intera.
    const rotture: string[] = [];
    for (let i = 0; i < IN_PAGINA.length - 1; i++) {
      const da = IN_PAGINA[i];
      const a = IN_PAGINA[i + 1];
      if (THREAD_ANCHORS[a].in !== THREAD_ANCHORS[da].out) rotture.push(`${da}->${a}`);
    }
    // Le interruzioni che toccano una sezione nascosta tornano a valere
    // quando lei torna: adesso non ci sono, e non si contano.
    const inVigore = INTERRUZIONE.filter(({ tra }) => tra.every((s) => IN_PAGINA.includes(s)));
    expect(rotture, "il filo si spezza in un punto non dichiarato").toEqual(
      inVigore.map(({ tra: [da, a] }) => `${da}->${a}`),
    );
  });

  it("le interruzioni sono queste tre, e nessun'altra", () => {
    // Scritte per esteso: aggiungerne una deve passare di qui, e chi lo fa
    // legge la regola nel commento di INTERRUZIONE. La prima copre stampante,
    // tavolo e archivio insieme: sono tre scene di fila, e in mezzo non c'e'
    // niente che il filo possa attraversare. La terza vale solo finche' «Come
    // lavoro» e' nascosta.
    expect(INTERRUZIONE.map(({ tra }) => tra)).toEqual([
      ["hero", "process"],
      ["process", "contact"],
      ["hero", "contact"],
    ]);
  });

  it("ogni interruzione nomina due sezioni consecutive e dice perche'", () => {
    // Consecutive nella mappa intera, o nella pagina com'e' adesso: la terza
    // esiste solo perche' in mezzo c'e' una sezione nascosta.
    for (const { tra: [da, a], perche } of INTERRUZIONE) {
      expect(SECTION_ORDER).toContain(da);
      expect(SECTION_ORDER).toContain(a);
      const vicine = (ordine: readonly string[]) =>
        ordine.includes(da) && ordine.indexOf(a) === ordine.indexOf(da) + 1;
      expect(vicine(SECTION_ORDER) || vicine(IN_PAGINA), `${da}->${a} non sono vicine`).toBe(true);
      expect(perche.trim().length, `${da}->${a} senza un perche'`).toBeGreaterThan(20);
    }
  });

  it("le scene non hanno una corsa del filo", () => {
    // La stampante, il tavolo, l'archivio dei Lavori e il percorso non
    // disegnano il filo: se tornassero in lista, qualcuno gli rimonterebbe un
    // ThreadSegment sopra la scena.
    expect(SECTION_ORDER).not.toContain("scontrino");
    expect(SECTION_ORDER).not.toContain("services");
    expect(SECTION_ORDER).not.toContain("works");
    expect(SECTION_ORDER).not.toContain("journey");
  });

  it("ogni ancoraggio sta dentro la larghezza della pagina", () => {
    for (const anchor of Object.values(THREAD_ANCHORS)) {
      expect(anchor.in).toBeGreaterThanOrEqual(0);
      expect(anchor.in).toBeLessThanOrEqual(100);
      expect(anchor.out).toBeGreaterThanOrEqual(0);
      expect(anchor.out).toBeLessThanOrEqual(100);
    }
  });
});

describe("ThreadSegment", () => {
  it("si rimisura quando cambia altezza la sezione, non solo la finestra", () => {
    // La lunghezza del tratteggio e' in pixel di schermo, quindi dipende
    // dall'altezza della sezione. `weave` la ristende su onRefreshInit, ma
    // ScrollTrigger si aggiorna al resize della FINESTRA: se e' la sezione a
    // crescere da sola — un titolo che va a capo, un font che arriva tardi —
    // il tratteggio resta piu' corto del tracciato e il fondo della sezione
    // resta scoperto. E' successo davvero, stringendo un titolo.
    const src = readFileSync("src/components/thread/ThreadSegment.tsx", "utf8");
    expect(src).toContain("new ResizeObserver");
    expect(src).toContain("osservatore.disconnect()");
    // La corsa sua, non tutte: `ScrollTrigger.refresh()` globale rimisurerebbe
    // sei sezioni ogni volta che una cresce di un pixel.
    expect(src).toContain("st.refresh()");
    expect(src).not.toContain("ScrollTrigger.refresh()");
  });

  it("è decorativo e non viene letto dagli screen reader", () => {
    const { container } = render(<ThreadSegment section="hero" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("disegna il tratto dall'ancoraggio di entrata a quello di uscita", () => {
    const { container } = render(<ThreadSegment section="process" />);
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(d).toContain(`M${THREAD_ANCHORS.process.in} 0`);
    expect(d).toContain(`${THREAD_ANCHORS.process.out} 100`);
  });
});

describe("il filo si vede davvero", () => {
  it("usa il colore dedicato, non quello dei bordi", () => {
    const { container } = render(<ThreadSegment section="hero" />);
    expect(container.querySelector("path")).toHaveAttribute("stroke", "var(--filo)");
  });

  it("ha uno spessore che il browser riesce a dipingere", () => {
    // `vector-effect: non-scaling-stroke` rende lo strokeWidth pixel CSS, non
    // unita' del viewBox: 0.3 voleva dire 0.3 pixel, cioe' un tratto dipinto
    // al 29% dall'antialiasing. Misurato in pagina: 1.05:1 sulla carta, e
    // 1.09:1 sull'arancio dove si moltiplicava anche per opacity-40.
    const { container } = render(<ThreadSegment section="hero" />);
    const spessore = Number(container.querySelector("path")?.getAttribute("stroke-width"));
    expect(spessore).toBeGreaterThanOrEqual(1);
  });
});

describe("chi disegna il filo", () => {
  // Erano tre: <ThreadSegment>, i cavi del tavolo e la serpentina di «E in
  // pratica?». Adesso e' uno solo, perche' il tavolo non disegna piu' niente
  // (vedi la nota in anchors.ts) e con lui se ne sono andati gli altri due.
  // La prova resta perche' il difetto che chiude e' ancora possibile: un
  // tratto sotto il pixel esce dipinto al 29% dall'antialiasing, e --line e'
  // il colore dei bordi, che sull'arancio non si legge.
  const sorgenti = ["src/components/thread/ThreadSegment.tsx"];

  it("usa --filo, e non scende sotto il pixel", () => {
    for (const percorso of sorgenti) {
      const codice = readFileSync(path.resolve(__dirname, "../../../..", percorso), "utf8");
      expect(codice, `${percorso} disegna ancora il filo con --line`).not.toMatch(
        /stroke="var\(--line\)"/,
      );
      for (const [, valore] of codice.matchAll(/strokeWidth="([\d.]+)"/g)) {
        expect(Number(valore), `${percorso} ha un tratto di ${valore}px`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("nessun altro file disegna un tratto che somigli al filo", () => {
    // Il difetto che ha fatto tornare indietro due volte: tolto il filo dalla
    // sezione del tavolo restava la derivazione, un cavo dal laptop al
    // gestionale, con lo STESSO colore e lo STESSO spessore. Sulla pagina
    // nessuno puo' distinguerla dal filo, e infatti non e' stata distinta.
    for (const percorso of [
      "src/components/sections/Services/DeskTable.tsx",
    ]) {
      const codice = readFileSync(path.resolve(__dirname, "../../../..", percorso), "utf8");
      expect(codice, `${percorso} ha ricominciato a disegnare col colore del filo`).not.toMatch(
        /stroke="var\(--filo\)"/,
      );
    }
  });

  it("nessuna sezione sbiadisce il filo con opacity", () => {
    // Le due sezioni arancioni lo montavano con `opacity-40`, moltiplicando
    // per 0,4 un tratto gia' dipinto al 29%: l'11% misurato in pagina. Erano
    // anche le due in cui il colore era gia' il piu' debole.
    // Oggi nessuna sezione arancione monta il filo (vedi INTERRUZIONE): la
    // prova guarda tutte quelle che lo montano, perche' il difetto non e'
    // dell'arancio ma dell'opacity.
    // Process/ProcessView e' un componente nascosto (vedi NASCOSTE): si
    // controlla lo stesso, perche' rimetterlo in pagina e' una riga.
    for (const vista of ["Hero/HeroView", "Process/ProcessView", "Contact/ContactView"]) {
      const codice = readFileSync(
        path.resolve(__dirname, "../../sections", `${vista}.tsx`),
        "utf8",
      );
      expect(codice, `${vista} non monta piu' il filo`).toMatch(/<ThreadSegment/);
      expect(codice, `${vista} sbiadisce il filo`).not.toMatch(/<ThreadSegment[^>]*opacity-/);
    }
  });
});
