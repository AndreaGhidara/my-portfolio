import { Reveal } from "@/animations/components/Reveal";
import { Toolbox } from "./Toolbox";
import type { ToolboxCopy } from "./types";

export function ToolboxView({
  eyebrow,
  title,
  lead,
  copy,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  copy: ToolboxCopy;
}) {
  return (
    <div data-toolbox-section>
      <Reveal data-toolbox-head motion="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        <p>{lead}</p>
      </Reveal>
      <Toolbox copy={copy} />
    </div>
  );
}
