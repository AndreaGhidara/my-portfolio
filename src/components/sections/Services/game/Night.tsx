"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { levelNumber, type LevelProps } from "./levels";
import { Icon } from "./icons";
import {
  NIGHT_EVENTS,
  NIGHT_MINUTES,
  NIGHT_STEPS,
  STEP_MS,
  NIGHT_ITEMS,
  minuteOfStep,
  clockTime,
  hoursOnline,
  uptimeStrip,
  outages,
  type NightItem,
} from "./nightData";

type Testi = Record<NightItem, { fatto: string; parato: string }>;

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
export function Night({ onNext: onAvanti, visible: visibile }: LevelProps) {
  const t = useTranslations("services.gioco.notte");
  const comune = useTranslations("services.gioco.comune");
  const eventi = t.raw("eventi") as Testi;

  const [pronti, setPronti] = useState<ReadonlySet<NightItem>>(() => new Set());
  const [dorme, setDorme] = useState(false);
  const [passo, setPasso] = useState(0);

  const mattina = dorme && passo >= NIGHT_STEPS;
  const corre = dorme && !mattina && visibile;

  useEffect(() => {
    if (!corre) return;
    const id = setInterval(() => setPasso((p) => Math.min(p + 1, NIGHT_STEPS)), STEP_MS);
    return () => clearInterval(id);
  }, [corre]);

  const adesso = minuteOfStep(passo);
  const accaduti = NIGHT_EVENTS.filter((e) => e.minute <= adesso);
  const pezzi = uptimeStrip(outages(pronti, adesso), adesso);
  const lungo = adesso / NIGHT_MINUTES;
  const tutto = pronti.size === NIGHT_ITEMS.length;

  const accendi = (voce: NightItem) =>
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
    <div className="bench" data-game-level="notte">
      <div className="above">
        <div className="stars" aria-hidden="true" />
        <div className="head">
          <span className="level">{comune("etichetta", { numero: levelNumber("notte"), nome: comune("livelli.notte") })}</span>
          <span className="right">{mattina ? t("cielo.apre") : t("titolo")}</span>
        </div>
        <div className="clock">
          <b data-night-time>{clockTime(adesso)}</b>
          <span>{t("cielo.orologio")}</span>
        </div>
        <span
          className="moon"
          aria-hidden="true"
          style={{ left: `${50 + lungo * 40}%`, top: `${3.4 - Math.sin(lungo * Math.PI) * 1.1}rem` }}
        />
        <div className="trace" aria-hidden="true">
          {pezzi.map((p, i) => (
            <i key={i} className={p.down ? "down" : "up"} style={{ inlineSize: `${(p.minutes / NIGHT_MINUTES) * 100}%` }} />
          ))}
        </div>
        <div className="hours" aria-hidden="true">
          {ORE.map((o) => (
            <span key={o}>{o}</span>
          ))}
        </div>
        <div className="log" data-night-log>
          {accaduti.map((e) => {
            const ok = pronti.has(e.item);
            return (
              <p key={e.item}>
                <b>{clockTime(e.minute)}</b>
                <span>{eventi[e.item].fatto}</span>
                <span className={`shield ${ok ? "yes" : "no"}`}>{ok ? t("parato") : t("giu")}</span>
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
            <p className="explain">{t("prepara.spiega")}</p>
            <div className="stage">
              <div className="list">
                {NIGHT_ITEMS.map((voce) => (
                  <button
                    key={voce}
                    type="button"
                    className="line"
                    aria-pressed={pronti.has(voce)}
                    onClick={() => accendi(voce)}
                  >
                    <span className="ic">
                      <Icon name={voce} />
                    </span>
                    <span>
                      <b>{t(`voci.${voce}`)}</b>
                    </span>
                    <span className="interr" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="actions">
              <button type="button" className="yellow" onClick={() => setDorme(true)}>
                <b aria-hidden="true">☾</b>
                {t("prepara.vai")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="mono">{mattina ? t("mattina.occhiello") : t("corsa.occhiello")}</p>
              <h3>{mattina ? (tutto ? t("mattina.tutto") : t("mattina.ore", { ore: hoursOnline(pronti) })) : t("corsa.titolo")}</h3>
            </div>
            <p className="explain">
              {mattina ? (tutto ? t("mattina.spiegaTutto") : t("mattina.spiegaParte")) : t("corsa.spiega")}
            </p>
            <div className="stage">
              <div className="list" aria-live="polite">
                {accaduti.map((e) => {
                  const ok = pronti.has(e.item);
                  return (
                    <div key={e.item} className="line short">
                      <span className="ic">
                        <Icon name={e.item} />
                      </span>
                      <span>
                        <b>{t(`voci.${e.item}`)}</b>
                        <small>{ok ? eventi[e.item].parato : danno(e.damage)}</small>
                      </span>
                      <span className={ok ? "yes" : "no"} aria-hidden="true">
                        {ok ? "✓" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {mattina ? (
              <div className="actions two">
                <button type="button" onClick={preparaDaCapo}>
                  <b aria-hidden="true">↺</b>
                  {tutto ? t("mattina.rifai") : t("mattina.meglio")}
                </button>
                <button type="button" className="yellow" onClick={onAvanti}>
                  {t("mattina.finale")} <b aria-hidden="true">→</b>
                </button>
              </div>
            ) : (
              <div className="actions">
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
