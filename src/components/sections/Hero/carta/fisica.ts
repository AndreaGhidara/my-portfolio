/**
 * La fisica delle palline. Pura: prende uno stato e lo riporta avanti di un
 * fotogramma. Nessun DOM — cosi' il rimbalzo, l'attrito e il fermarsi si
 * possono provare senza un browser, che e' l'unico posto in cui il resto di
 * questo gesto vive.
 */

export type Pezzo = {
  /** In coordinate della FINESTRA: le palline si posano sul suo bordo basso. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gradi. */
  rot: number;
  /** Gradi al secondo. */
  vrot: number;
  raggio: number;
  /** Mentre e' in mano non cade. */
  tenuta: boolean;
};

export type Muri = { largo: number; alto: number };

/** Quanto scende al secondo. Piu' alta della gravita' vera: su uno schermo,
 *  9,8 m/s² si legge come un palloncino. */
export const GRAVITA = 2600;
/** Quanto la carta perde volando: e' leggera e frena. */
const ARIA = 0.994;
/** Quanto rimbalza toccando. Bassa: la carta non e' una pallina di gomma. */
const RIMBALZO = 0.4;
/** Quanto frena strisciando a terra. */
const ATTRITO = 0.8;
/** Sotto questa velocita' verticale non rimbalza piu': si posa. */
const POSA = 70;

/**
 * Un fotogramma. `scorrimento` e' di quanto si e' mosso lo scorrimento della
 * pagina: il bordo basso della finestra scappa in giu' e le palline restano
 * indietro, poi la gravita' le richiama. E' quello che fa leggere «la carta
 * scende con te» invece di «la carta e' incollata allo schermo».
 */
export function passo(p: Pezzo, dt: number, muri: Muri, scorrimento: number): Pezzo {
  if (p.tenuta) return p;

  p.y -= scorrimento;
  p.vy += GRAVITA * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= ARIA;
  p.vy *= ARIA;
  p.rot += p.vrot * dt;
  p.vrot *= 0.985;

  const basso = muri.alto - p.raggio - 10;
  if (p.y > basso) {
    p.y = basso;
    if (Math.abs(p.vy) > POSA) {
      p.vy = -p.vy * RIMBALZO;
      p.vrot *= 0.7;
    } else {
      p.vy = 0;
    }
    p.vx *= ATTRITO;
    // A terra rotola invece di girare per conto suo: la rotazione segue
    // quanto sta scorrendo. Senza, la pallina ferma continuava a ruotare.
    p.vrot = p.vx * 1.4;
  }
  if (p.y < p.raggio) {
    p.y = p.raggio;
    p.vy = Math.abs(p.vy) * RIMBALZO;
  }
  if (p.x < p.raggio) {
    p.x = p.raggio;
    p.vx = Math.abs(p.vx) * RIMBALZO;
    p.vrot *= -0.7;
  }
  if (p.x > muri.largo - p.raggio) {
    p.x = muri.largo - p.raggio;
    p.vx = -Math.abs(p.vx) * RIMBALZO;
    p.vrot *= -0.7;
  }
  return p;
}

/** Ferma o quasi: serve a sapere quando si puo' smettere di ridisegnare. */
export function aRiposo(p: Pezzo, muri: Muri): boolean {
  return (
    !p.tenuta &&
    Math.abs(p.vx) < 6 &&
    Math.abs(p.vy) < 6 &&
    p.y >= muri.alto - p.raggio - 11
  );
}

/** La velocita' del lancio, dalle ultime posizioni del puntatore. */
export function lancio(storia: readonly { x: number; y: number; t: number }[]): {
  vx: number;
  vy: number;
} {
  if (storia.length < 2) return { vx: 0, vy: 0 };
  const a = storia[0];
  const b = storia[storia.length - 1];
  const dt = Math.max(16, b.t - a.t);
  return { vx: ((b.x - a.x) / dt) * 1000, vy: ((b.y - a.y) / dt) * 1000 };
}
