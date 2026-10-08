"use client";

import { useEffect, useState } from "react";
import { pad2 } from "@/lib/format";

/**
 * La data di oggi, scritta dal browser.
 *
 * La pagina e' generata una volta sola: una data presa sul server resterebbe
 * quella della build per sempre. Vuota sul server e al primo render, cosi'
 * l'html e l'idratazione coincidono; la data vera arriva subito dopo, come
 * nello scontrino.
 *
 * - "annullo": gg.mm.aa, come su un timbro postale.
 * - "anno": l'anno a quattro cifre, per il copyright.
 */
export function Today({ format }: { format: "postmark" | "year" }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const now = new Date();
    if (format === "year") {
      setText(String(now.getFullYear()));
      return;
    }
    setText(`${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${String(now.getFullYear()).slice(-2)}`);
  }, [format]);
  return <>{text}</>;
}
