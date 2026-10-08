import { describe, it, expect } from "vitest";
import { ARCHIVE_PARAMS, TAB, archiveCoverage, depths, fits, returnTop, shouldRedecide, tabTone } from "../archive";

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
    // Sotto la soglia l'archivio e' spento, ma un NaN finirebbe in una custom property.
    expect(archiveCoverage({ top: 50, stop: 100, screen: 100 })).toBe(1);
    expect(archiveCoverage({ top: 150, stop: 100, screen: 100 })).toBe(0);
  });
});

describe("profondita delle cartelle", () => {
  const stops = [100, 114, 128, 142];

  it("all'inizio nessuna e' sotto: le successive sono ancora fuori dallo schermo", () => {
    expect(depths([100, 1100, 2100, 3100], stops, 900)).toEqual([0, 0, 0, 0]);
  });

  it("e' la somma di quanto la coprono le successive, e l'ultima non e' mai sotto", () => {
    // La seconda e' ferma, la terza a meta' strada, la quarta fuori.
    const thirdTop = 128 + (900 - 128) / 2;
    const p = depths([100, 114, thirdTop, 1700], stops, 900);
    expect(p[0]).toBeCloseTo(1.5);
    expect(p[1]).toBeCloseTo(0.5);
    expect(p[2]).toBe(0);
    expect(p[3]).toBe(0);
  });

  it("ad archivio completo la prima e' sotto tre cartelle", () => {
    expect(depths(stops, stops, 900)).toEqual([3, 2, 1, 0]);
  });
});

describe("il ritorno a una cartella", () => {
  const stops = [100, 114, 128, 142];

  it("e' lo scroll in cui quella cartella si e' appena fermata, quando li' e' ancora sola", () => {
    // Su uno schermo da 900 la successiva e' ancora sotto.
    const screen = 900;
    const step = screen - stops[3] - 20 + screen * 0.1;
    expect(returnTop({ start: 3000, step, stops, i: 2, screen })).toBe(3000 + 2 * step - 128);
    expect(returnTop({ start: 3000, step, stops, i: 0, screen })).toBe(2900);
  });

  it("l'ultima torna dove si e' fermata: non ha nessuno dopo", () => {
    expect(returnTop({ start: 3000, step: 700, stops, i: 3, screen: 900 })).toBe(3000 + 2100 - 142);
  });

  it("li' la cartella dopo non la copre, nemmeno col telefono e la sua barra in basso", () => {
    // Sul telefono, senza la barra in basso, la successiva spunta gia' dal fondo (29px a 390x844).
    for (const [screen, bar] of [
      [900, 0],
      [844, 52],
      [700, 52],
    ]) {
      const height = screen - stops[3] - 20 - bar;
      const step = height + screen * 0.1;
      const start = 3000;
      for (let i = 0; i < 3; i++) {
        const y = returnTop({ start, step, stops, i, screen });
        const nextTop = start + (i + 1) * step - y;
        expect(archiveCoverage({ top: nextTop, stop: stops[i + 1], screen })).toBe(0);
        const top = start + i * step - y;
        expect(top).toBeGreaterThanOrEqual(stops[i]);
        expect(top - stops[i]).toBeLessThanOrEqual(screen * 0.1);
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
    // Zero su zero accenderebbe l'archivio dove non si e' misurato niente.
    expect(fits([{ content: 0, room: 0 }])).toBe(false);
  });
});

describe("quando si ridecide fra archivio e colonna", () => {
  it("se cambia la larghezza si decide subito: la riga va a capo in un altro modo", () => {
    expect(shouldRedecide({ widthChanged: true, finePointer: false, inView: true })).toBe("now");
    expect(shouldRedecide({ widthChanged: true, finePointer: true, inView: true })).toBe("now");
  });

  it("su touch un cambio di sola altezza non conta: e' la barra del browser", () => {
    expect(shouldRedecide({ widthChanged: false, finePointer: false, inView: false })).toBe("never");
    expect(shouldRedecide({ widthChanged: false, finePointer: false, inView: true })).toBe("never");
  });

  it("col puntatore fine un cambio di sola altezza aspetta che l'archivio sia uscito dallo schermo", () => {
    expect(shouldRedecide({ widthChanged: false, finePointer: true, inView: true })).toBe("later");
    expect(shouldRedecide({ widthChanged: false, finePointer: true, inView: false })).toBe("now");
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
    // Senza il minimo c'e' un tratto in cui ne' l'inchiostro ne' la carta arrivano a 4,5:1.
    expect(TAB.full).toBeLessThan(TAB.light);
    expect(TAB.minDark).toBeGreaterThan(TAB.light * ARCHIVE_PARAMS.darkens);
  });
});

describe("i parametri tarati", () => {
  it("sono quelli approvati", () => {
    expect(ARCHIVE_PARAMS).toEqual({
      step: 14,
      distance: 10,
      darkens: 0.22,
      narrows: 0.03,
      tabWidth: 23,
    });
  });
});
