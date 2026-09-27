import { Reveal } from "@/animations/components/Reveal";
import {
  ScontrinoStampante,
  type ServizioStampabile,
  type TestiStampante,
} from "./ScontrinoStampante";

export type ScontrinoViewProps = {
  eyebrow: string;
  title: string;
  lead: string;
  /** Per la data dello scontrino, che si scrive nel browser. */
  locale: string;
  servizi: ServizioStampabile[];
  testi: TestiStampante;
};

/**
 * La seconda sezione: la stampante dei servizi. A destra quattro tasti e una
 * stampante che fa uscire lo scontrino del servizio, a sinistra la tavola da
 * progetto che disegna lo stesso servizio con gli stessi pezzi.
 *
 * E' una scena a tutto schermo in flusso normale, senza aggancio: chi vuole
 * giocare si ferma con lo scroll. Passa sopra l'apertura come la sezione che
 * c'era prima (SottoIlFoglio), e il filo qui non passa: la tavola ha le sue
 * linee, e una verticale le taglierebbe (vedi INTERRUZIONE in anchors.ts).
 *
 * Il fondo e' arancione e di notte resta arancione: dentro solo carta e
 * inchiostro, come nel percorso. Le regole stanno in tokens.css.
 */
export function ScontrinoView({ eyebrow, title, lead, locale, servizi, testi }: ScontrinoViewProps) {
  return (
    <section
      id="scontrino"
      data-fondo="accento"
      data-scontrino
      className="relative bg-[var(--accent)]"
    >
      <Reveal moto="dietro" stagger={0.08} data-scontrino-testa>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p data-scontrino-lead>{lead}</p>
      </Reveal>

      <ScontrinoStampante servizi={servizi} testi={testi} locale={locale} />
    </section>
  );
}
