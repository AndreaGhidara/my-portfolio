"use client";

import { useTranslations } from "next-intl";
import type { IdLivello, LivelloProps } from "./Gioco";

/**
 * Il banco vuoto di un livello che non c'e' ancora: la testa col suo nome, il
 * titolo, e un «avanti» che fa girare il guscio. Serve finche' i quattro
 * livelli veri non prendono il loro posto; quando l'ultimo l'ha fatto, questo
 * file non lo importa piu' nessuno e se ne va.
 */
export function Segnaposto({
  parte,
  numero,
  onAvanti,
}: LivelloProps & { parte: IdLivello; numero: number }) {
  const comune = useTranslations("services.gioco.comune");
  const t = useTranslations(`services.gioco.${parte}`);

  return (
    <div className="banco" data-gioco-livello={parte}>
      <div className="sopra reticolo">
        <div className="testa">
          <span className="livello">{comune("etichetta", { numero, nome: comune(`livelli.${parte}`) })}</span>
        </div>
      </div>
      <div className="console">
        <h3>{t("titolo")}</h3>
        <div />
        <div className="palco" />
        <div className="azioni">
          <button type="button" className="giallo" onClick={onAvanti}>
            {comune("avanti")} <b aria-hidden="true">→</b>
          </button>
        </div>
      </div>
    </div>
  );
}
