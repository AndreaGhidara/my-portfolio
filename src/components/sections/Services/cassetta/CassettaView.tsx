import { Reveal } from "@/animations/components/Reveal";
import { Cassetta } from "./Cassetta";
import type { TestiCassetta } from "./tipi";

/**
 * Gli attrezzi: dove stava «E in pratica?», subito dopo il tavolo. Il tavolo
 * dice cosa c'e' sotto un sito, questa dice con cosa lo cucio.
 */
export function CassettaView({
  eyebrow,
  title,
  lead,
  testi,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  testi: TestiCassetta;
}) {
  return (
    <div data-cassetta-sezione>
      <Reveal data-cassetta-testa moto="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="titolo-sezione">{title}</h2>
        <p>{lead}</p>
      </Reveal>
      <Cassetta testi={testi} />
    </div>
  );
}
