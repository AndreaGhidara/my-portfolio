import { DeskTable, type DeskLayerData } from "./DeskTable";

/**
 * Il palco: il titolo, il tavolo, la tesi. Per ora e' tutto fermo — data-motion
 * dice "none" — e i tre blocchi stanno uno sotto l'altro nell'ordine in cui si
 * leggono. La camera arriva dopo e li sovrappone: e' li' che il titolo esce
 * mentre entra il primo strato, e la tesi arriva a tavolo completo.
 *
 * Fermo non e' un ripiego: e' lo stato di riposo, e' quello che si vede senza
 * JavaScript, ed e' quello che vede il telefono. Se non regge qui non regge
 * da nessuna parte, ed e' il motivo per cui viene prima del movimento.
 */
export function DeskStage({
  eyebrow,
  title,
  lead,
  centre,
  punch,
  layers,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  centre: string;
  punch: string;
  layers: DeskLayerData[];
}) {
  return (
    <div data-desk data-motion="none">
      <div data-desk-track>
        <div data-desk-stage>
          <header data-desk-title>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{lead}</p>
          </header>

          <DeskTable layers={layers} centre={centre} layout="wide" />
          <DeskTable layers={layers} centre={centre} layout="tall" ghost />

          <p data-desk-punch>{punch}</p>
        </div>
      </div>
    </div>
  );
}
