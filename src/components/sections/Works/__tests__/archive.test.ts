import { describe, it, expect } from "vitest";
import { LINGUETTA, PARAMETRI, ciSta, copertura, profondita, ridecidere, ritorno, tonoLinguetta } from "../archive";

describe("copertura di una cartella che arriva", () => {
  it("e' zero finche' la cartella sta sotto lo schermo e uno quando e' ferma al suo posto", () => {
    expect(copertura({ cima: 900, fermo: 100, schermo: 900 })).toBe(0);
    expect(copertura({ cima: 1400, fermo: 100, schermo: 900 })).toBe(0);
    expect(copertura({ cima: 100, fermo: 100, schermo: 900 })).toBe(1);
    expect(copertura({ cima: 500, fermo: 100, schermo: 900 })).toBeCloseTo(0.5);
  });

  it("non va oltre uno: una cartella ferma non copre di piu' scorrendo", () => {
    expect(copertura({ cima: 40, fermo: 100, schermo: 900 })).toBe(1);
  });

  it("uno schermo piu' basso del punto di sosta non da' NaN", () => {
    // Non dovrebbe succedere (sotto la soglia l'archivio e' spento), ma un NaN
    // finirebbe dritto in una custom property.
    expect(copertura({ cima: 50, fermo: 100, schermo: 100 })).toBe(1);
    expect(copertura({ cima: 150, fermo: 100, schermo: 100 })).toBe(0);
  });
});

describe("profondita delle cartelle", () => {
  const fermi = [100, 114, 128, 142];

  it("all'inizio nessuna e' sotto: le successive sono ancora fuori dallo schermo", () => {
    expect(profondita([100, 1100, 2100, 3100], fermi, 900)).toEqual([0, 0, 0, 0]);
  });

  it("e' la somma di quanto la coprono le successive, e l'ultima non e' mai sotto", () => {
    // La seconda e' ferma, la terza a meta' strada, la quarta fuori.
    const cimaTerza = 128 + (900 - 128) / 2;
    const p = profondita([100, 114, cimaTerza, 1700], fermi, 900);
    expect(p[0]).toBeCloseTo(1.5);
    expect(p[1]).toBeCloseTo(0.5);
    expect(p[2]).toBe(0);
    expect(p[3]).toBe(0);
  });

  it("ad archivio completo la prima e' sotto tre cartelle", () => {
    expect(profondita(fermi, fermi, 900)).toEqual([3, 2, 1, 0]);
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
    expect(ritorno({ inizio: 3000, passo, fermi, i: 2, schermo })).toBe(3000 + 2 * passo - 128);
    expect(ritorno({ inizio: 3000, passo, fermi, i: 0, schermo })).toBe(2900);
  });

  it("l'ultima torna dove si e' fermata: non ha nessuno dopo", () => {
    expect(ritorno({ inizio: 3000, passo: 700, fermi, i: 3, schermo: 900 })).toBe(3000 + 2100 - 142);
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
        const y = ritorno({ inizio, passo, fermi, i, schermo });
        const cimaDopo = inizio + (i + 1) * passo - y;
        expect(copertura({ cima: cimaDopo, fermo: fermi[i + 1], schermo })).toBe(0);
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
    expect(ciSta([{ contenuto: 500, posto: 520 }, { contenuto: 520, posto: 520 }])).toBe(true);
  });

  it("no se anche una sola faccia deborda: «Apri il caso» finirebbe tagliato", () => {
    expect(ciSta([{ contenuto: 500, posto: 520 }, { contenuto: 540, posto: 520 }])).toBe(false);
  });

  it("un pixel di arrotondamento non la spegne", () => {
    expect(ciSta([{ contenuto: 521, posto: 520 }])).toBe(true);
  });

  it("senza cartelle non c'e' archivio da accendere", () => {
    expect(ciSta([])).toBe(false);
  });

  it("una faccia senza altezza non e' una faccia che ci sta: vuol dire che non c'e' layout", () => {
    // Zero su zero passerebbe la prova qui sopra, e accenderebbe l'archivio
    // dove non si e' misurato niente (una scheda nascosta, un test).
    expect(ciSta([{ contenuto: 0, posto: 0 }])).toBe(false);
  });
});

describe("quando si ridecide fra archivio e colonna", () => {
  it("se cambia la larghezza si decide subito: la riga va a capo in un altro modo", () => {
    expect(ridecidere({ larghezzaCambiata: true, puntatoreFine: false, inVista: true })).toBe("ora");
    expect(ridecidere({ larghezzaCambiata: true, puntatoreFine: true, inVista: true })).toBe("ora");
  });

  it("su touch un cambio di sola altezza non conta: e' la barra del browser", () => {
    expect(ridecidere({ larghezzaCambiata: false, puntatoreFine: false, inVista: false })).toBe("mai");
    expect(ridecidere({ larghezzaCambiata: false, puntatoreFine: false, inVista: true })).toBe("mai");
  });

  it("col puntatore fine un cambio di sola altezza aspetta che l'archivio sia uscito dallo schermo", () => {
    // Ridecidere li' farebbe saltare la pagina sotto gli occhi di chi legge.
    expect(ridecidere({ larghezzaCambiata: false, puntatoreFine: true, inVista: true })).toBe("dopo");
    expect(ridecidere({ larghezzaCambiata: false, puntatoreFine: true, inVista: false })).toBe("ora");
  });
});

describe("il tono del testo della linguetta", () => {
  it("davanti e poco sotto resta quello di sempre: nome pieno, anno tenue", () => {
    expect(tonoLinguetta(0)).toBe(0);
    expect(tonoLinguetta(LINGUETTA.pieno - 0.01)).toBe(0);
  });

  it("appena il fondo si scurisce l'anno diventa pieno anche lui", () => {
    expect(tonoLinguetta(LINGUETTA.pieno)).toBe(1);
    expect(tonoLinguetta(1)).toBe(1);
    expect(tonoLinguetta(2)).toBe(1);
  });

  it("in fondo al cassetto il testo diventa carta", () => {
    expect(tonoLinguetta(LINGUETTA.chiaro)).toBe(2);
    expect(tonoLinguetta(3)).toBe(2);
  });

  it("le soglie stanno in ordine, e il buio minimo del tono chiaro supera quello della soglia", () => {
    // Senza il minimo, fra la soglia e il punto in cui la carta regge da sola
    // c'e' un tratto in cui ne' l'inchiostro ne' la carta arrivano a 4,5:1.
    expect(LINGUETTA.pieno).toBeLessThan(LINGUETTA.chiaro);
    expect(LINGUETTA.buioMinimo).toBeGreaterThan(LINGUETTA.chiaro * PARAMETRI.scurisce);
  });
});

describe("i parametri tarati nel prototipo", () => {
  it("sono quelli approvati", () => {
    // docs/prototipi/2026-09-27-cartelle-archivio.html: cambiarli qui senza
    // ripassare da li' e' ritarare a occhio chiuso.
    expect(PARAMETRI).toEqual({
      passo: 14,
      distanza: 10,
      scurisce: 0.22,
      stringe: 0.03,
      larghezzaLinguetta: 23,
    });
  });
});
