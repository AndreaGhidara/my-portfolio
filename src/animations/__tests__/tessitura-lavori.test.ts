import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CORSA_FRECCIA, TESSITURA, TESSITURA_LAVORI, FINESTRE_FILO } from "../finestre";

const riga = (s: string) => Number.parseFloat(s.split(" ")[1]);

describe("il filo dei Lavori non anticipa la freccia della pratica", () => {
  it("apre sempre dopo che la freccia si e' posata, su ogni schermo sensato", () => {
    // I due inneschi guardano elementi diversi: il bordo alto dei Lavori sta
    // 128px sotto il fondo del percorso (il padding di chiusura della pratica).
    // Quindi quando la freccia si posa, il bordo dei Lavori non e' sulla riga
    // della freccia: e' piu' in basso di 128px, che in punti percentuali vale
    // tanto piu' quanto la finestra e' bassa. Il filo apre dopo finche' la sua
    // riga resta sopra quella dove il bordo dei Lavori si trova in quel momento.
    const GAP = 128;
    // Il tetto dichiarato in finestre.ts. Non e' un numero di comodo: e'
    // l'altezza di finestra oltre la quale la configurazione attuale smette di
    // garantire l'ordine, e sta scritto qui perche' chi alza RITARDO_LAVORI
    // veda cadere la prova invece di scoprirlo da un monitor grande.
    const TETTO = 1400;
    for (let H = 600; H <= TETTO; H += 50) {
      const bordoLavoriQuandoLaFrecciaSiPosa = riga(CORSA_FRECCIA.fine) + (GAP / H) * 100;
      expect(
        riga(TESSITURA_LAVORI.inizio),
        `a ${H}px di finestra il filo anticiperebbe la freccia`,
      ).toBeLessThanOrEqual(bordoLavoriQuandoLaFrecciaSiPosa);
    }
  });
  it("chiude come tutte le altre, cosi' la consegna alla sezione dopo non cambia", () => {
    expect(TESSITURA_LAVORI.fine).toBe(TESSITURA.fine);
  });

  it("e' davvero piu' tardi del default, altrimenti non serviva a niente", () => {
    expect(riga(TESSITURA_LAVORI.inizio)).toBeLessThan(riga(TESSITURA.inizio));
  });
  it("lascia un respiro, ma corto: non deve leggersi come un'attesa", () => {
    const respiro = riga(TESSITURA_LAVORI.inizio) - riga(CORSA_FRECCIA.fine);
    expect(respiro).toBeGreaterThan(0);
    expect(respiro).toBeLessThanOrEqual(10);
  });
  it("resta una finestra sensata: apre prima di chiudere", () => {
    expect(riga(TESSITURA_LAVORI.inizio)).toBeGreaterThan(0);
    expect(riga(TESSITURA_LAVORI.inizio)).toBeLessThan(riga(TESSITURA_LAVORI.fine));
  });

  it("la freccia legge la sua finestra dalla costante condivisa", () => {
    const src = readFileSync("src/components/sections/Services/pratica/freccia.ts", "utf8");
    expect(src).toContain("CORSA_FRECCIA.inizio");
    expect(src).toContain("CORSA_FRECCIA.fine");
  });

  it("i Lavori hanno la loro finestra nella mappa, non come proprieta'", () => {
    expect(FINESTRE_FILO.works).toEqual(TESSITURA_LAVORI);
  });

  it("ThreadSegment sceglie la finestra da se', dentro il lato client", () => {
    const src = readFileSync("src/components/thread/ThreadSegment.tsx", "utf8");
    expect(src).toContain("FINESTRE_FILO[section]");
    expect(src).toMatch(/start:\s*finestra\?\.inizio/);
  });

  it("nessun Server Component prende la finestra da un modulo client", () => {
    // E' il difetto che e' costato tre correzioni a vuoto. WorksView non ha
    // "use client": un valore importato da presets.ts — che invece ce l'ha —
    // gli arriva come riferimento, e leggerne una proprieta' da' undefined.
    // Il filo ripiegava sul default e la pagina ignorava la modifica, mentre
    // le prove passavano perche' importano il modulo senza quel confine.
    const src = readFileSync("src/components/sections/Works/WorksView.tsx", "utf8");
    expect(src.startsWith('"use client"')).toBe(false);
    expect(src).not.toContain("@/animations/presets");
  });

  it("il modulo delle finestre non e' un modulo client, o il buco torna", () => {
    const src = readFileSync("src/animations/finestre.ts", "utf8");
    expect(src.startsWith('"use client"')).toBe(false);
    expect(src).not.toContain('from "./gsap"');
  });
});
