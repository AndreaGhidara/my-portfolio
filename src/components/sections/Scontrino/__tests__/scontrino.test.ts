import { describe, it, expect } from "vitest";
import { services } from "@/content/services";
import {
  FORME,
  LARGHEZZA,
  PASSO,
  POSTI,
  RITARDI,
  aiLati,
  aScatti,
  conPuntini,
  richiamo,
  righeScontrino,
  scattiTotali,
  stampante,
  statoIniziale,
  type DatiScontrino,
  type Evento,
  type Stampante,
} from "../scontrino";

const dati = (indice: number, data = ""): DatiScontrino => ({
  nome: "ANDREA GHIDARA",
  mestiere: "sviluppo web · full stack",
  data,
  numero: "N.",
  indice,
  quanti: 4,
  titolo: "Siti e landing",
  testo: "Niente temi comprati.",
  pezzi: ["struttura", "parole", "immagini"],
  totale: "TOTALE",
  daParlarne: "DA PARLARNE",
});

describe("le righe dello scontrino", () => {
  it("intestazione, titolo, testo, pezzi numerati e il totale, in quest'ordine", () => {
    const righe = righeScontrino(dati(0));
    expect(righe.map((r) => r.testo)).toEqual([
      "ANDREA GHIDARA",
      "sviluppo web · full stack",
      aiLati("", "N. 01/04"),
      "-".repeat(LARGHEZZA),
      "SITI E LANDING",
      "Niente temi comprati.",
      "-".repeat(LARGHEZZA),
      "1 struttura",
      "2 parole",
      "3 immagini",
      "-".repeat(LARGHEZZA),
      conPuntini("TOTALE", "DA PARLARNE"),
    ]);
    expect(righe.find((r) => r.tipo === "grosso")?.testo).toBe("SITI E LANDING");
    expect(righe.filter((r) => r.tipo === "voce")).toHaveLength(3);
  });

  it("il numero e il totale vengono dall'elenco, non da un 04 scritto a mano", () => {
    expect(righeScontrino({ ...dati(2), quanti: 7 })[2].testo).toMatch(/N\. 03\/07$/);
  });

  it("la data non cambia la lunghezza della riga: il server la scrive vuota", () => {
    // La data esiste solo nel browser (sul server sarebbe quella della build):
    // se allungasse la riga, lo scontrino fantasma e i tempi di stampa
    // cambierebbero dopo il montaggio.
    const senza = righeScontrino(dati(0, ""))[2].testo;
    const con = righeScontrino(dati(0, "27/09/2026"))[2].testo;
    expect(senza).toHaveLength(LARGHEZZA);
    expect(con).toHaveLength(LARGHEZZA);
    expect(con.startsWith("27/09/2026")).toBe(true);
    expect(con.endsWith("N. 01/04")).toBe(true);
  });

  it("il totale riempie la riga di puntini, con uno spazio ai due capi", () => {
    const riga = conPuntini("TOTALE", "DA PARLARNE");
    expect(riga).toHaveLength(LARGHEZZA);
    expect(riga).toMatch(/^TOTALE \.+ DA PARLARNE$/);
    expect(conPuntini("TOTAL", "LET'S TALK")).toMatch(/^TOTAL \.+ LET'S TALK$/);
  });
});

describe("la stampa carattere per carattere", () => {
  const righe = righeScontrino(dati(0));

  it("tre caratteri a colpo, uno solo sul titolo grande", () => {
    expect(PASSO.riga).toBe(3);
    expect(PASSO.grosso).toBe(1);
    const dopoUno = aScatti(righe, 1);
    expect(dopoUno).toEqual([{ testo: "AND", tipo: "riga" }]);
  });

  it("una riga finita lascia il colpo dopo alla riga seguente", () => {
    // «ANDREA GHIDARA» e' lunga 14: cinque colpi.
    expect(aScatti(righe, 5).map((r) => r.testo)).toEqual(["ANDREA GHIDARA"]);
    expect(aScatti(righe, 6).map((r) => r.testo)).toEqual(["ANDREA GHIDARA", "svi"]);
  });

  it("a colpi finiti lo scontrino e' intero", () => {
    const totale = scattiTotali(righe);
    expect(aScatti(righe, totale)).toEqual(righe);
    expect(aScatti(righe, totale + 50)).toEqual(righe);
    expect(aScatti(righe, totale - 1)).not.toEqual(righe);
  });
});

describe("la tavola", () => {
  it("ogni servizio ha il suo disegno", () => {
    expect(Object.keys(FORME).sort()).toEqual(services.map((s) => s.id).sort());
    for (const s of services) expect(FORME[s.id].length, s.id).toBeGreaterThan(3);
  });

  it("ci sono abbastanza posti per i pezzi di ogni servizio", () => {
    for (const s of services) expect(s.pezzi.length, s.id).toBeLessThanOrEqual(POSTI.length);
  });

  it("i richiami a sinistra scrivono verso sinistra, quelli a destra verso destra", () => {
    // Il testo parte dal gomito verso l'esterno: al contrario finirebbe sopra
    // il disegno.
    for (let k = 0; k < POSTI.length; k++) {
      const r = richiamo(k);
      const aSinistra = POSTI[k].l[0] < 300;
      expect(r.ancora).toBe(aSinistra ? "end" : "start");
      expect(r.x < POSTI[k].l[0]).toBe(aSinistra);
      expect(r.d.startsWith(`M${POSTI[k].p[0]} ${POSTI[k].p[1]}`)).toBe(true);
    }
  });

  it("i tempi sono quelli del prototipo: righe ogni 0,15s, richiami da 1,1s ogni 0,28s", () => {
    expect(RITARDI.riga(2)).toBeCloseTo(0.3);
    expect(richiamo(0).ritardo).toBeCloseTo(1.1);
    expect(richiamo(3).ritardo).toBeCloseTo(1.1 + 3 * 0.28);
    expect(richiamo(3).ritardoTesto).toBeCloseTo(richiamo(3).ritardo + 0.3);
  });
});

/**
 * La stampante e' uno stato solo, e ogni callback ritardato (il colpo di
 * stampa, lo scontrino che finisce di cadere) porta la generazione in cui e'
 * nato: se nel frattempo e' successo altro, arriva e non fa niente.
 */
describe("la stampante", () => {
  const TOTALI = [40, 30, 20, 10];
  const fai = (s: Stampante, ...eventi: Evento[]) =>
    eventi.reduce((acc, e) => stampante(acc, e, TOTALI), s);
  const vuota = fai(statoIniziale(TOTALI), { tipo: "svuota" });

  it("parte con il primo servizio gia' stampato: e' il markup del server", () => {
    const s = statoIniziale(TOTALI);
    expect(s).toMatchObject({ fase: "ferma", servizio: 0, scatti: 40, disegno: 0 });
  });

  it("un tasto su una stampante vuota comincia a stampare", () => {
    const s = fai(vuota, { tipo: "premi", servizio: 2, subito: false });
    expect(s).toMatchObject({ fase: "stampa", servizio: 2, scatti: 0, disegno: 2 });
    expect(s.tracciato).toBe(vuota.tracciato + 1);
  });

  it("stampa un colpo alla volta e si ferma a scontrino finito", () => {
    let s = fai(vuota, { tipo: "premi", servizio: 3, subito: false });
    for (let i = 0; i < 9; i++) s = fai(s, { tipo: "scatto", gen: s.gen });
    expect(s).toMatchObject({ fase: "stampa", scatti: 9 });
    s = fai(s, { tipo: "scatto", gen: s.gen });
    expect(s).toMatchObject({ fase: "ferma", servizio: 3, scatti: 10 });
  });

  it("un colpo di un'altra generazione non stampa niente", () => {
    const s = fai(vuota, { tipo: "premi", servizio: 1, subito: false });
    expect(fai(s, { tipo: "scatto", gen: s.gen - 1 })).toBe(s);
  });

  it("un altro tasto strappa il vecchio e stampa il nuovo quando e' caduto", () => {
    let s = fai(vuota, { tipo: "premi", servizio: 0, subito: false });
    s = fai(s, { tipo: "premi", servizio: 1, subito: false });
    expect(s).toMatchObject({ fase: "strappo", servizio: 0, poi: 1 });
    s = fai(s, { tipo: "caduto", gen: s.gen });
    expect(s).toMatchObject({ fase: "stampa", servizio: 1, scatti: 0, poi: null });
  });

  it("due tocchi di fila non fanno mai due scontrini", () => {
    let s = fai(vuota, { tipo: "premi", servizio: 0, subito: false });
    s = fai(s, { tipo: "premi", servizio: 1, subito: false });
    const cadutoDelPrimo = s.gen;
    s = fai(s, { tipo: "premi", servizio: 2, subito: false });
    // Il secondo tocco cambia solo cosa si stampa dopo: lo strappo resta uno.
    expect(s).toMatchObject({ fase: "strappo", poi: 2, gen: cadutoDelPrimo });
    s = fai(s, { tipo: "caduto", gen: cadutoDelPrimo });
    expect(s).toMatchObject({ fase: "stampa", servizio: 2 });
    // Un secondo «caduto» con la stessa generazione (lo StrictMode, un timer
    // rimasto) non ricomincia niente.
    expect(fai(s, { tipo: "caduto", gen: cadutoDelPrimo })).toBe(s);
  });

  it("l'autostampa non passa sopra a chi ha gia' toccato", () => {
    const toccata = fai(vuota, { tipo: "premi", servizio: 3, subito: false });
    expect(fai(toccata, { tipo: "autostampa" })).toBe(toccata);
    const strappata = fai(toccata, { tipo: "strappa", subito: true });
    expect(fai(strappata, { tipo: "autostampa" })).toBe(strappata);
  });

  it("svuota toglie anche il disegno, e la tavola resta bianca fino alla stampa", () => {
    // Sul telefono la tavola sta sopra i tasti: tracciata dal server e poi
    // cancellata e ridisegnata sotto gli occhi all'autostampa, era un salto.
    const iniziale = statoIniziale(TOTALI);
    expect(iniziale.tavolaVuota).toBe(false);
    const s = fai(iniziale, { tipo: "svuota" });
    expect(s.tavolaVuota).toBe(true);
    expect(s.tracciato).toBe(iniziale.tracciato + 1);
    const stampa = fai(s, { tipo: "autostampa" });
    expect(stampa).toMatchObject({ fase: "stampa", tavolaVuota: false });
    expect(stampa.tracciato).toBe(s.tracciato + 1);
    // Se il movimento si spegne prima, la tavola torna disegnata.
    expect(fai(s, { tipo: "completa" }).tavolaVuota).toBe(false);
  });

  it("svuota non toglie mai uno scontrino chiesto da qualcuno", () => {
    // Lo svuotamento arriva alla prima osservazione della stampante, un
    // fotogramma dopo il montaggio: se nel frattempo c'e' stato un tocco, lo
    // scontrino e' suo.
    const toccata = fai(statoIniziale(TOTALI), { tipo: "premi", servizio: 2, subito: false });
    expect(fai(toccata, { tipo: "svuota" })).toBe(toccata);
  });

  it("l'autostampa stampa il primo servizio, una volta", () => {
    const s = fai(vuota, { tipo: "autostampa" });
    expect(s).toMatchObject({ fase: "stampa", servizio: 0 });
    expect(fai(s, { tipo: "strappa", subito: true }, { tipo: "autostampa" })).toMatchObject({
      servizio: null,
    });
  });

  it("strappa senza un tasto dopo: lo scontrino cade e la stampante resta vuota", () => {
    let s = fai(vuota, { tipo: "premi", servizio: 1, subito: false });
    s = fai(s, { tipo: "strappa", subito: false });
    expect(s).toMatchObject({ fase: "strappo", servizio: 1, poi: null });
    s = fai(s, { tipo: "caduto", gen: s.gen });
    expect(s).toMatchObject({ fase: "ferma", servizio: null });
    // Il disegno resta quello di prima: la tavola non si cancella.
    expect(s.disegno).toBe(1);
  });

  it("senza movimento il tasto sostituisce subito lo scontrino, gia' stampato", () => {
    const s = fai(statoIniziale(TOTALI), { tipo: "premi", servizio: 2, subito: true });
    expect(s).toMatchObject({ fase: "ferma", servizio: 2, scatti: 20, disegno: 2 });
  });

  it("se il movimento si spegne a meta', lo scontrino resta intero", () => {
    let s = fai(vuota, { tipo: "premi", servizio: 1, subito: false }, { tipo: "completa" });
    expect(s).toMatchObject({ fase: "ferma", servizio: 1, scatti: 30 });
    s = fai(vuota, { tipo: "premi", servizio: 0, subito: false });
    s = fai(s, { tipo: "premi", servizio: 3, subito: false }, { tipo: "completa" });
    expect(s).toMatchObject({ fase: "ferma", servizio: 3, scatti: 10, disegno: 3 });
    // Prima di qualunque tocco la sezione si deve leggere: torna il primo.
    expect(fai(vuota, { tipo: "completa" })).toMatchObject({ servizio: 0, scatti: 40 });
  });
});
