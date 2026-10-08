// Pura, senza DOM: rimbalzo, attrito e il fermarsi si provano senza un browser.

export type Piece = {
  /** In coordinate della FINESTRA: le palline si posano sul suo bordo basso. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gradi. */
  rot: number;
  /** Gradi al secondo. */
  vrot: number;
  radius: number;
  /** Mentre e' in mano non cade. */
  held: boolean;
};

export type Walls = { width: number; height: number };

/** Quanto scende al secondo. Piu' alta della gravita' vera: su uno schermo,
 *  9,8 m/s² si legge come un palloncino. */
export const GRAVITY = 2600;
/** Quanto la carta perde volando: e' leggera e frena. */
const AIR_DRAG = 0.994;
/** Quanto rimbalza toccando. Bassa: la carta non e' una pallina di gomma. */
const BOUNCE = 0.4;
const FRICTION = 0.8;
/** Sotto questa velocita' verticale non rimbalza piu': si posa. */
const SETTLE_SPEED = 70;

// `scrollDelta`: il bordo basso della finestra scappa in giu', le palline restano
// indietro e la gravita' le richiama. Cosi' la carta scende con chi scorre.
export function physicsStep(p: Piece, dt: number, walls: Walls, scrollDelta: number): Piece {
  if (p.held) return p;

  p.y -= scrollDelta;
  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= AIR_DRAG;
  p.vy *= AIR_DRAG;
  p.rot += p.vrot * dt;
  p.vrot *= 0.985;

  const floor = walls.height - p.radius - 10;
  if (p.y > floor) {
    p.y = floor;
    if (Math.abs(p.vy) > SETTLE_SPEED) {
      p.vy = -p.vy * BOUNCE;
      p.vrot *= 0.7;
    } else {
      p.vy = 0;
    }
    p.vx *= FRICTION;
    // A terra rotola invece di girare per conto suo: la rotazione segue
    // quanto sta scorrendo. Senza, la pallina ferma continuava a ruotare.
    p.vrot = p.vx * 1.4;
  }
  if (p.y < p.radius) {
    p.y = p.radius;
    p.vy = Math.abs(p.vy) * BOUNCE;
  }
  if (p.x < p.radius) {
    p.x = p.radius;
    p.vx = Math.abs(p.vx) * BOUNCE;
    p.vrot *= -0.7;
  }
  if (p.x > walls.width - p.radius) {
    p.x = walls.width - p.radius;
    p.vx = -Math.abs(p.vx) * BOUNCE;
    p.vrot *= -0.7;
  }
  return p;
}

/** Ferma o quasi: serve a sapere quando si puo' smettere di ridisegnare. */
export function atRest(p: Piece, walls: Walls): boolean {
  return (
    !p.held &&
    Math.abs(p.vx) < 6 &&
    Math.abs(p.vy) < 6 &&
    p.y >= walls.height - p.radius - 11
  );
}

export function fling(trail: readonly { x: number; y: number; t: number }[]): {
  vx: number;
  vy: number;
} {
  if (trail.length < 2) return { vx: 0, vy: 0 };
  const a = trail[0];
  const b = trail[trail.length - 1];
  const dt = Math.max(16, b.t - a.t);
  return { vx: ((b.x - a.x) / dt) * 1000, vy: ((b.y - a.y) / dt) * 1000 };
}
