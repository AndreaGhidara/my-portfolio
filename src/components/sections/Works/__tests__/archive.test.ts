import { describe, it, expect } from "vitest";
import { TAB, ARCHIVE_PARAMS, fits, archiveCoverage, depths, shouldRedecide, returnTop, tabTone } from "../archive";

describe("copertura di una cartella che arriva", () => {
  it("e' zero finche' la cartella sta sotto lo schermo e uno quando e' ferma al suo posto", () => {
    expect(archiveCoverage({ top: 900, stop: 100, screen: 900 })).toBe(0);
    expect(archiveCoverage({ top: 1400, stop: 100, screen: 900 })).toBe(0);
    expect(archiveCoverage({ top: 100, stop: 100, screen: 900 })).toBe(1);
    expect(archiveCoverage({ top: 500, stop: 100, screen: 900 })).toBeCloseTo(0.5);
  });

  it("non va oltre uno: una cartella ferma non copre di piu' scorrendo", () => {
    expect(archiveCoverage({ top: 40, stop: 100, screen: 900 })).toBe(1);
  });

  it("uno schermo piu' basso del punto di sosta non da' NaN", () => {
    // Non dovrebbe succedere (sotto la soglia l'archivio e' spento), ma un NaN
    // finirebbe dritto in una custom property.
    expect(archiveCoverage({ top: 50, stop: 100, screen: 100 })).toBe(1);
    expect(archiveCoverage({ top: 150, stop: 100, screen: 100 })).toBe(0);
  });
});

describe("profondita delle cartelle", () => {
  const fermi = [100, 114, 128, 142];

  it("all'inizio nessuna e' sotto: le successive sono ancora fuori dallo schermo", () => {
    expect(depths([100, 1100, 2100, 3100], fermi, 900)).toEqual([0, 0, 0, 0]);
  });

  it("e' la somma di quanto la coprono le successive, e l'ultima non e' mai sotto", () => {
    // La seconda e' ferma, la terza a meta' strada, la quarta fuori.
    const cimaTerza = 128 + (900 - 128) / 2;
    const p = depths([100, 114, cimaTerza, 1700], fermi, 900);
    expect(p[0]).toBeCloseTo(1.5);
    expect(p[1]).toBeCloseTo(0.5);
    expect(p[2]).toBe(0);
    expect(p[3]).toBe(0);
  });

  it("ad archivio completo la prima e' sotto tre cartelle", () => {
    expect(depths(fermi, fermi, 900)).toEqual([3, 2, 1, 0]);
  });
});

describe("il ritorno a una cartella", () => {
  const fermi = [100, 114, 128, 142];

  it("e' lo scroll in cui quella cartella si e' appena fermata, quando li' e' ancora sola", () => {
    // La cartella i sta, a pagina ferma, a inizio + i * passo: tutte alte
    // uguali, tutte distanti uguali. Si ferma quando quel punto arriva al suo
    // `top` sticky. Su uno schermo da 900 la successiva e' ancora sotto.
    const schermo = 900;
    const passo = schermo - fermi[3] - 20 + schermo * 0.1;
    expect(returnTop({ start: 3000, step: passo, stops: fermi, i: 2, screen: schermo })).toBe(3000 + 2 * passo - 128);
    expect(returnTop({ start: 3000, step: passo, stops: fermi, i: 0, screen: schermo })).toBe(2900);
  });

  it("l'ultima torna dove si e' fermata: non ha nessuno dopo", () => {
    expect(returnTop({ start: 3000, step: 700, stops: fermi, i: 3, screen: 900 })).toBe(3000 + 2100 - 142);
  });

  it("li' la cartella dopo non la copre, nemmeno col telefono e la sua barra in basso", () => {
    // Sul telefono la cartella si toglie la barra in basso (52px), e quando
    // una si ferma la successiva spunta gia' dal fondo: misurato a 390x844,
    // 29px dentro lo schermo. Il ritorno allora si ferma un poco prima,
    // dove la successiva tocca il fondo: davanti c'e' lei sola, quasi ferma.
    for (const [schermo, barra] of [
      [900, 0],
      [844, 52],
      [700, 52],
    ]) {
      const altezza = schermo - fermi[3] - 20 - barra;
      const passo = altezza + schermo * 0.1;
      const inizio = 3000;
      for (let i = 0; i < 3; i++) {
        const y = returnTop({ start: inizio, step: passo, stops: fermi, i, screen: schermo });
        const cimaDopo = inizio + (i + 1) * passo - y;
        expect(archiveCoverage({ top: cimaDopo, stop: fermi[i + 1], screen: schermo })).toBe(0);
        // E la cartella stessa e' tutta a vista: non sta piu' giu' di un
        // passo di distanza dal punto in cui si ferma.
        const cima = inizio + i * passo - y;
        expect(cima).toBeGreaterThanOrEqual(fermi[i]);
        expect(cima - fermi[i]).toBeLessThanOrEqual(schermo * 0.1);
      }
    }
  });
});

describe("la soglia: l'archivio si accende solo se ogni faccia ci sta", () => {
  it("si' quando il contenuto sta nel posto che la faccia ha", () => {
    expect(fits([{ content: 500, room: 520 }, { content: 520, room: 520 }])).toBe(true);
  });

  it("no se anche una sola faccia deborda: «Apri il caso» finirebbe tagliato", () => {
    expect(fits([{ content: 500, room: 520 }, { content: 540, room: 520 }])).toBe(false);
  });

  it("un pixel di arrotondamento non la spegne", () => {
    expect(fits([{ content: 521, room: 520 }])).toBe(true);
  });

  it("senza cartelle non c'e' archivio da accendere", () => {
    expect(fits([])).toBe(false);
  });

  it("una faccia senza altezza non e' una faccia che ci sta: vuol dire che non c'e' layout", () => {
    // Zero su zero passerebbe la prova qui sopra, e accenderebbe l'archivio
    // dove non si e' misurato niente (una scheda nascosta, un test).
    expect(fits([{ content: 0, room: 0 }])).toBe(false);
  });
});

describe("quando si ridecide fra archivio e colonna", () => {
  it("se cambia la larghezza si decide subito: la riga va a capo in un altro modo", () => {
    expect(shouldRedecide({ widthChanged: true, finePointer: false, inView: true })).toBe("ora");
    expect(shouldRedecide({ widthChanged: true, finePointer: true, inView: true })).toBe("ora");
  });

  it("su touch un cambio di sola altezza non conta: e' la barra del browser", () => {
    expect(shouldRedecide({ widthChanged: false, finePointer: false, inView: false })).toBe("mai");
    expect(shouldRedecide({ widthChanged: false, finePointer: false, inView: true })).toBe("mai");
  });

  it("col puntatore fine un cambio di sola altezza aspetta che l'archivio sia uscito dallo schermo", () => {
    // Ridecidere li' farebbe saltare la pagina sotto gli occhi di chi legge.
    expect(shouldRedecide({ widthChanged: false, finePointer: true, inView: true })).toBe("dopo");
    expect(shouldRedecide({ widthChanged: false, finePointer: true, inView: false })).toBe("ora");
  });
});

describe("il tono del testo della linguetta", () => {
  it("davanti e poco sotto resta quello di sempre: nome pieno, anno tenue", () => {
    expect(tabTone(0)).toBe(0);
    expect(tabTone(TAB.full - 0.01)).toBe(0);
  });

  it("appena il fondo si scurisce l'anno diventa pieno anche lui", () => {
    expect(tabTone(TAB.full)).toBe(1);
    expect(tabTone(1)).toBe(1);
    expect(tabTone(2)).toBe(1);
  });

  it("in fondo al cassetto il testo diventa carta", () => {
    expect(tabTone(TAB.light)).toBe(2);
    expect(tabTone(3)).toBe(2);
  });

  it("le soglie stanno in ordine, e il buio minimo del tono chiaro supera quello della soglia", () => {
    // Senza il minimo, fra la soglia e il punto in cui la carta regge da sola
    // c'e' un tratto in cui ne' l'inchiostro ne' la carta arrivano a 4,5:1.
    expect(TAB.full).toBeLessThan(TAB.light);
    expect(TAB.minDark).toBeGreaterThan(TAB.light * ARCHIVE_PARAMS.darkens);
  });
});

describe("i parametri tarati nel prototipo", () => {
  it("sono quelli approvati", () => {
    // docs/prototipi/2026-09-27-cartelle-archivio.html: cambiarli qui senza
    // ripassare da li' e' ritarare a occhio chiuso.
    expect(ARCHIVE_PARAMS).toEqual({
      step: 14,
      distance: 10,
      darkens: 0.22,
      narrows: 0.03,
      tabWidth: 23,
    });
  });
});
