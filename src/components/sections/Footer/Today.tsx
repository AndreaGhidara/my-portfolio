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
export function Today({ format: formato }: { format: "annullo" | "anno" }) {
  const [testo, setTesto] = useState("");
  useEffect(() => {
    const oggi = new Date();
    if (formato === "anno") {
      setTesto(String(oggi.getFullYear()));
      return;
    }
    setTesto(`${pad2(oggi.getDate())}.${pad2(oggi.getMonth() + 1)}.${String(oggi.getFullYear()).slice(-2)}`);
  }, [formato]);
  return <>{testo}</>;
}
