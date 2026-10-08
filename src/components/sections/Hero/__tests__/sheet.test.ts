import { describe, it, expect } from "vitest";
import { attacco, copertura } from "../sheet";

/**
 * Un Hero da 700px e una testata da 60: i numeri non contano, contano i
 * rapporti. I rettangoli sono quelli che darebbe getBoundingClientRect.
 */
const HERO = { top: 60, bottom: 760, height: 700 };

describe("copertura", () => {
  it("e' zero finche' la seconda sezione sta sotto il fondo della prima", () => {
    expect(copertura(HERO, { top: 760 })).toBe(0);
    // Non negativa: la seconda che sta ancora piu' giu' non «scopre» niente.
    expect(copertura(HERO, { top: 900 })).toBe(0);
  });

  it("cresce con quanto la seconda e' salita sopra la prima", () => {
    expect(copertura(HERO, { top: 410 })).toBeCloseTo(0.5);
    expect(copertura(HERO, { top: 585 })).toBeCloseTo(0.25);
  });

  it("e' uno quando la seconda ne raggiunge la cima, e non va oltre", () => {
    expect(copertura(HERO, { top: 60 })).toBe(1);
    // Dopo, Hero se ne va con il resto della pagina: resta coperto e basta.
    expect(copertura(HERO, { top: -300 })).toBe(1);
  });

  it("una prima sezione senza altezza non e' coperta: niente divisioni per zero", () => {
    expect(copertura({ top: 0, bottom: 0, height: 0 }, { top: -10 })).toBe(0);
  });
});

describe("attacco", () => {
  it("se la prima sta nello spazio visibile si ferma sotto la testata", () => {
    expect(attacco({ testata: 60, palco: 900, barraBassa: 0, altezza: 700 })).toBe(60);
  });

  it("se e' piu' alta si ferma quando il suo fondo tocca il fondo visibile", () => {
    // Spazio 840, Hero 1000: il fondo arriva al fondo dello schermo quando la
    // cima e' 160px sopra la testata.
    expect(attacco({ testata: 60, palco: 900, barraBassa: 0, altezza: 1000 })).toBe(-100);
  });

  it("sul telefono il fondo visibile e' sopra la barra in basso", () => {
    // 548 - 60 - 52 = 436 di spazio, Hero da 600: fondo sul bordo della barra.
    const cima = attacco({ testata: 60, palco: 548, barraBassa: 52, altezza: 600 });
    expect(cima).toBe(60 + 436 - 600);
    expect(cima + 600).toBe(548 - 52);
  });
});
