import type { Garment, ZoneId } from "@/content/toolbox";
import { toolsIn, toolById, byZone } from "./graph";
import type { ToolboxCopy } from "./types";

// kind finisce in data-syntax: `k` parola chiave, `p` nome, `s` stringa,
// `c` commento, `n` nota a margine, `a` attrezzo toccabile che apre l'etichetta.
type Piece =
  | { kind: "t" | "k" | "p" | "s" | "c" | "n"; text: string }
  | { kind: "a"; id: string; text: string };

export type CodeLine = { pieces: Piece[]; isNew?: boolean };

const nameOf = (id: string) => toolById(id)?.name ?? id;

const t = (text: string): Piece => ({ kind: "t", text });
const tool = (id: string): Piece => ({
  kind: "a",
  id,
  text: `"${nameOf(id)}"`,
});

export function configLines(garment: Garment | null, copy: ToolboxCopy): CodeLine[] {
  const e = copy.editor;
  const lines: CodeLine[] = [
    {
      pieces: [
        { kind: "k", text: "import" },
        t(" { "),
        { kind: "p", text: e.func },
        t(" } "),
        { kind: "k", text: "from" },
        t(" "),
        { kind: "s", text: `"${e.package}"` },
      ],
    },
    { pieces: [] },
  ];
  const opening: CodeLine = {
    pieces: [
      { kind: "k", text: "export default" },
      t(" "),
      { kind: "p", text: e.func },
      t("({"),
    ],
  };

  if (!garment) {
    lines.push(
      { pieces: [{ kind: "c", text: `// ${e.empty}` }] },
      opening,
      { pieces: [t(`  ${e.type}: `), { kind: "s", text: '"?"' }, t(",")] },
      { pieces: [t("})")] },
    );
    return lines;
  }

  const c = copy.garments[garment.id];
  lines.push({ pieces: [{ kind: "c", text: `// ${c.why}` }] }, opening, {
    pieces: [t(`  ${e.type}: `), { kind: "s", text: `"${c.slug}"` }, t(",")],
    isNew: true,
  });
  for (const { zone, tools: used } of byZone(garment)) {
    const list: Piece[] = [];
    used.forEach((id, i) => {
      if (i) list.push(t(", "));
      list.push(tool(id));
    });
    lines.push({
      pieces: [
        t("  "),
        { kind: "p", text: copy.zones[zone].key },
        t(": ["),
        ...list,
        t("],"),
      ],
      isNew: true,
    });
  }
  lines.push(
    { pieces: [] },
    { pieces: [{ kind: "c", text: `  // ${e.ifNeeded}` }] },
  );
  for (const { from, to } of garment.alt) {
    lines.push({
      pieces: [
        {
          kind: "c",
          text: `  // ${nameOf(to)} ${copy.label.insteadOf} ${nameOf(from)}, ${c.alt[from]}`,
        },
      ],
      isNew: true,
    });
  }
  lines.push({ pieces: [t("})")] });
  return lines;
}

export function zoneLines(
  zone: ZoneId,
  garment: Garment | null,
  copy: ToolboxCopy,
): CodeLine[] {
  const z = copy.zones[zone];
  const lines: CodeLine[] = [
    { pieces: [{ kind: "c", text: `// ${z.what}` }] },
    {
      pieces: [
        { kind: "k", text: "export const" },
        t(" "),
        { kind: "p", text: z.key },
        t(" = {"),
      ],
    },
  ];
  for (const a of toolsIn(zone)) {
    const pieces: Piece[] = [
      t("  "),
      tool(a.id),
      t(": "),
      { kind: "s", text: `"${copy.tools[a.id].brief}"` },
      t(","),
    ];
    if (garment?.uses.includes(a.id))
      pieces.push(t(" "), { kind: "n", text: `// ${copy.editor.needed}` });
    lines.push({ pieces });
  }
  lines.push({ pieces: [t("}")] });
  return lines;
}
