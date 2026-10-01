"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { numeroLivello, type LivelloProps } from "./livelli";
import { Icona } from "./icone";
import {
  EVENTI,
  NOTTE_MINUTI,
  PASSI,
  PASSO_MS,
  VOCI,
  minutoDelPasso,
  oraDi,
  oreOnline,
  striscia,
  tagli,
  type Voce,
} from "./notteDati";

type Testi = Record<Voce, { fatto: string; parato: string }>;

/** Le ore scritte sotto la striscia: una ogni due, dalle 23 alle 7. */
const ORE = [23, 1, 3, 5, 7];

/**
 * Livello 4, il cloud: la notte del forno. Alle 23 si sceglie cosa preparare,
 * poi la notte corre da sola fino alle 7 e succedono sei cose; quello che era
 * pronto le para, il resto manda giu' il sito e la striscia diventa rossa. La
 * mattina il resoconto, e si puo' rifare la notte con le scelte di prima.
 *
 * Tutto quello che si vede discende da `passo`: la cronaca, gli esiti, la
 * striscia e la luna si ricalcolano, e l'intervallo non fa altro che contare.
 * Per questo fermarlo e farlo ripartire (fuori dallo schermo, in StrictMode)
 * non perde niente e non conta doppio.
 */
export function Notte({ onAvanti, visibile }: LivelloProps) {
  const t = useTranslations("services.gioco.notte");
  const comune = useTranslations("services.gioco.comune");
  const eventi = t.raw("eventi") as Testi;

  const [pronti, setPronti] = useState<ReadonlySet<Voce>>(() => new Set());
  const [dorme, setDorme] = useState(false);
  const [passo, setPasso] = useState(0);

  const mattina = dorme && passo >= PASSI;
  const corre = dorme && !mattina && visibile;

  useEffect(() => {
    if (!corre) return;
    const id = setInterval(() => setPasso((p) => Math.min(p + 1, PASSI)), PASSO_MS);
    return () => clearInterval(id);
  }, [corre]);

  const adesso = minutoDelPasso(passo);
  const accaduti = EVENTI.filter((e) => e.minuto <= adesso);
  const pezzi = striscia(tagli(pronti, adesso), adesso);
  const lungo = adesso / NOTTE_MINUTI;
  const tutto = pronti.size === VOCI.length;

  const accendi = (voce: Voce) =>
    setPronti((prima) => {
      const dopo = new Set(prima);
      if (!dopo.delete(voce)) dopo.add(voce);
      return dopo;
    });

  const preparaDaCapo = () => {
    setDorme(false);
    setPasso(0);
  };

  const danno = (minuti: number) =>
    minuti < 60 ? t("giuMin", { min: minuti }) : t("giuOre", { ore: minuti / 60 });

  return (
    <div className="banco" data-gioco-livello="notte">
      <div className="sopra">
        <div className="stelle" aria-hidden="true" />
        <div className="testa">
          <span className="livello">{comune("etichetta", { numero: numeroLivello("notte"), nome: comune("livelli.notte") })}</span>
          <span className="destra">{mattina ? t("cielo.apre") : t("titolo")}</span>
        </div>
        <div className="orologio">
          <b data-notte-ora>{oraDi(adesso)}</b>
          <span>{t("cielo.orologio")}</span>
        </div>
        <span
          className="luna"
          aria-hidden="true"
          style={{ left: `${50 + lungo * 40}%`, top: `${3.4 - Math.sin(lungo * Math.PI) * 1.1}rem` }}
        />
        <div className="traccia" aria-hidden="true">
          {pezzi.map((p, i) => (
            <i key={i} className={p.giu ? "giu" : "su"} style={{ inlineSize: `${(p.minuti / NOTTE_MINUTI) * 100}%` }} />
          ))}
        </div>
        <div className="ore" aria-hidden="true">
          {ORE.map((o) => (
            <span key={o}>{o}</span>
          ))}
        </div>
        <div className="cronaca" data-notte-cronaca>
          {accaduti.map((e) => {
            const ok = pronti.has(e.voce);
            return (
              <p key={e.voce}>
                <b>{oraDi(e.minuto)}</b>
                <span>{eventi[e.voce].fatto}</span>
                <span className={`scudo ${ok ? "si" : "no"}`}>{ok ? t("parato") : t("giu")}</span>
              </p>
            );
          })}
        </div>
      </div>

      <div className="console">
        {!dorme ? (
          <>
            <div>
              <p className="mono">{t("prepara.occhiello")}</p>
              <h3>{t("prepara.titolo")}</h3>
            </div>
            <p className="spiega">{t("prepara.spiega")}</p>
            <div className="palco">
              <div className="lista">
                {VOCI.map((voce) => (
                  <button
                    key={voce}
                    type="button"
                    className="riga"
                    aria-pressed={pronti.has(voce)}
                    onClick={() => accendi(voce)}
                  >
                    <span className="ic">
                      <Icona nome={voce} />
                    </span>
                    <span>
                      <b>{t(`voci.${voce}`)}</b>
                    </span>
                    <span className="interr" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="azioni">
              <button type="button" className="giallo" onClick={() => setDorme(true)}>
                <b aria-hidden="true">☾</b>
                {t("prepara.vai")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="mono">{mattina ? t("mattina.occhiello") : t("corsa.occhiello")}</p>
              <h3>{mattina ? (tutto ? t("mattina.tutto") : t("mattina.ore", { ore: oreOnline(pronti) })) : t("corsa.titolo")}</h3>
            </div>
            <p className="spiega">
              {mattina ? (tutto ? t("mattina.spiegaTutto") : t("mattina.spiegaParte")) : t("corsa.spiega")}
            </p>
            <div className="palco">
              <div className="lista" aria-live="polite">
                {accaduti.map((e) => {
                  const ok = pronti.has(e.voce);
                  return (
                    <div key={e.voce} className="riga corta">
                      <span className="ic">
                        <Icona nome={e.voce} />
                      </span>
                      <span>
                        <b>{t(`voci.${e.voce}`)}</b>
                        <small>{ok ? eventi[e.voce].parato : danno(e.danno)}</small>
                      </span>
                      <span className={ok ? "si" : "no"} aria-hidden="true">
                        {ok ? "✓" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {mattina ? (
              <div className="azioni due">
                <button type="button" onClick={preparaDaCapo}>
                  <b aria-hidden="true">↺</b>
                  {tutto ? t("mattina.rifai") : t("mattina.meglio")}
                </button>
                <button type="button" className="giallo" onClick={onAvanti}>
                  {t("mattina.finale")} <b aria-hidden="true">→</b>
                </button>
              </div>
            ) : (
              <div className="azioni">
                <button type="button" disabled>
                  <b aria-hidden="true">☾</b>
                  {t("corsa.zzz")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
