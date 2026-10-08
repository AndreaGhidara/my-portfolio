import { Reveal } from "@/animations/components/Reveal";
import {
  ReceiptPrinter,
  type PrintableService,
  type PrinterCopy,
} from "./ReceiptPrinter";

export type ReceiptViewProps = {
  eyebrow: string;
  title: string;
  lead: string;
  /** Per la data dello scontrino, che si scrive nel browser. */
  locale: string;
  services: PrintableService[];
  copy: PrinterCopy;
};

/**
 * La seconda sezione: la stampante dei servizi. A destra quattro tasti e una
 * stampante che fa uscire lo scontrino del servizio, a sinistra la tavola da
 * progetto che disegna lo stesso servizio con gli stessi pezzi.
 *
 * E' una scena a tutto schermo in flusso normale, senza aggancio: chi vuole
 * giocare si ferma con lo scroll. Passa sopra l'apertura come la sezione che
 * c'era prima (SottoIlFoglio).
 *
 * Il fondo e' arancione e di notte resta arancione: dentro solo carta e
 * inchiostro, come nel percorso. Le regole stanno in sezioni/scontrino.css.
 */
export function ReceiptView({ eyebrow, title, lead, locale, services: servizi, copy: testi }: ReceiptViewProps) {
  return (
    <section
      id="scontrino"
      aria-labelledby="titolo-scontrino"
      data-receipt
      className="relative bg-[var(--accent)]"
    >
      <Reveal motion="dietro" stagger={0.08} data-receipt-head>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="titolo-scontrino" className="section-title">{title}</h2>
        <p data-receipt-lead>{lead}</p>
      </Reveal>

      <ReceiptPrinter services={servizi} copy={testi} locale={locale} />
    </section>
  );
}
