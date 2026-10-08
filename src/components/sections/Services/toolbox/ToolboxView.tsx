import { Reveal } from "@/animations/components/Reveal";
import { Toolbox } from "./Toolbox";
import type { ToolboxCopy } from "./types";

/**
 * Gli attrezzi: dove stava «E in pratica?», subito dopo il tavolo. Il tavolo
 * dice cosa c'e' sotto un sito, questa dice con cosa lo cucio.
 */
export function ToolboxView({
  eyebrow,
  title,
  lead,
  copy: testi,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  copy: ToolboxCopy;
}) {
  return (
    <div data-cassetta-sezione>
      <Reveal data-cassetta-testa motion="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="titolo-sezione">{title}</h2>
        <p>{lead}</p>
      </Reveal>
      <Toolbox copy={testi} />
    </div>
  );
}
