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

// Scena a tutto schermo in flusso normale, senza aggancio: chi vuole giocare si
// ferma con lo scroll. Il fondo resta arancione anche di notte, quindi dentro solo
// carta e inchiostro (sections/receipt.css).
export function ReceiptView({ eyebrow, title, lead, locale, services, copy }: ReceiptViewProps) {
  return (
    <section
      id="scontrino"
      aria-labelledby="receipt-title"
      data-receipt
      className="relative bg-[var(--accent)]"
    >
      <Reveal motion="behind" stagger={0.08} data-receipt-head>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="receipt-title" className="section-title">{title}</h2>
        <p data-receipt-lead>{lead}</p>
      </Reveal>

      <ReceiptPrinter services={services} copy={copy} locale={locale} />
    </section>
  );
}
