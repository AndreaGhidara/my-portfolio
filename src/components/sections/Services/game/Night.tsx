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

type NightCopy = Record<NightItem, { fatto: string; parato: string }>;

/** Le ore scritte sotto la striscia: una ogni due, dalle 23 alle 7. */
const HOURS = [23, 1, 3, 5, 7];

/**
 * Livello 4, il cloud: la notte del forno. Alle 23 si sceglie cosa preparare,
 * poi la notte corre da sola fino alle 7 e succedono sei cose; quello che era
 * pronto le para, il resto manda giu' il sito e la striscia diventa rossa. La
 * mattina il resoconto, e si puo' rifare la notte con le scelte di prima.
 *
 * Tutto quello che si vede discende da `step`: la cronaca, gli esiti, la
 * striscia e la luna si ricalcolano, e l'intervallo non fa altro che contare.
 * Per questo fermarlo e farlo ripartire (fuori dallo schermo, in StrictMode)
 * non perde niente e non conta doppio.
 */
export function Night({ onNext, visible }: LevelProps) {
  const t = useTranslations("services.gioco.notte");
  const common = useTranslations("services.gioco.comune");
  const events = t.raw("eventi") as NightCopy;

  const [ready, setReady] = useState<ReadonlySet<NightItem>>(() => new Set());
  const [asleep, setAsleep] = useState(false);
  const [step, setStep] = useState(0);

  const morning = asleep && step >= NIGHT_STEPS;
  const running = asleep && !morning && visible;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStep((p) => Math.min(p + 1, NIGHT_STEPS)), STEP_MS);
    return () => clearInterval(id);
  }, [running]);

  const now = minuteOfStep(step);
  const happened = NIGHT_EVENTS.filter((e) => e.minute <= now);
  const segments = uptimeStrip(outages(ready, now), now);
  const progress = now / NIGHT_MINUTES;
  const allReady = ready.size === NIGHT_ITEMS.length;

  const toggle = (item: NightItem) =>
    setReady((prev) => {
      const next = new Set(prev);
      if (!next.delete(item)) next.add(item);
      return next;
    });

  const prepareAgain = () => {
    setAsleep(false);
    setStep(0);
  };

  const damageLabel = (minutes: number) =>
    minutes < 60 ? t("giuMin", { min: minutes }) : t("giuOre", { ore: minutes / 60 });

  return (
    <div className="bench" data-game-level="notte">
      <div className="above">
        <div className="stars" aria-hidden="true" />
        <div className="head">
          <span className="level">{common("etichetta", { numero: levelNumber("notte"), nome: common("livelli.notte") })}</span>
          <span className="right">{morning ? t("cielo.apre") : t("titolo")}</span>
        </div>
        <div className="clock">
          <b data-night-time>{clockTime(now)}</b>
          <span>{t("cielo.orologio")}</span>
        </div>
        <span
          className="moon"
          aria-hidden="true"
          style={{ left: `${50 + progress * 40}%`, top: `${3.4 - Math.sin(progress * Math.PI) * 1.1}rem` }}
        />
        <div className="trace" aria-hidden="true">
          {segments.map((p, i) => (
            <i key={i} className={p.down ? "down" : "up"} style={{ inlineSize: `${(p.minutes / NIGHT_MINUTES) * 100}%` }} />
          ))}
        </div>
        <div className="hours" aria-hidden="true">
          {HOURS.map((o) => (
            <span key={o}>{o}</span>
          ))}
        </div>
        <div className="log" data-night-log>
          {happened.map((e) => {
            const ok = ready.has(e.item);
            return (
              <p key={e.item}>
                <b>{clockTime(e.minute)}</b>
                <span>{events[e.item].fatto}</span>
                <span className={`shield ${ok ? "yes" : "no"}`}>{ok ? t("parato") : t("giu")}</span>
              </p>
            );
          })}
        </div>
      </div>

      <div className="console">
        {!asleep ? (
          <>
            <div>
              <p className="mono">{t("prepara.occhiello")}</p>
              <h3>{t("prepara.titolo")}</h3>
            </div>
            <p className="explain">{t("prepara.spiega")}</p>
            <div className="stage">
              <div className="list">
                {NIGHT_ITEMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="line"
                    aria-pressed={ready.has(item)}
                    onClick={() => toggle(item)}
                  >
                    <span className="ic">
                      <Icon name={item} />
                    </span>
                    <span>
                      <b>{t(`voci.${item}`)}</b>
                    </span>
                    <span className="interr" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="actions">
              <button type="button" className="yellow" onClick={() => setAsleep(true)}>
                <b aria-hidden="true">☾</b>
                {t("prepara.vai")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="mono">{morning ? t("mattina.occhiello") : t("corsa.occhiello")}</p>
              <h3>{morning ? (allReady ? t("mattina.tutto") : t("mattina.ore", { ore: hoursOnline(ready) })) : t("corsa.titolo")}</h3>
            </div>
            <p className="explain">
              {morning ? (allReady ? t("mattina.spiegaTutto") : t("mattina.spiegaParte")) : t("corsa.spiega")}
            </p>
            <div className="stage">
              <div className="list" aria-live="polite">
                {happened.map((e) => {
                  const ok = ready.has(e.item);
                  return (
                    <div key={e.item} className="line short">
                      <span className="ic">
                        <Icon name={e.item} />
                      </span>
                      <span>
                        <b>{t(`voci.${e.item}`)}</b>
                        <small>{ok ? events[e.item].parato : damageLabel(e.damage)}</small>
                      </span>
                      <span className={ok ? "yes" : "no"} aria-hidden="true">
                        {ok ? "✓" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {morning ? (
              <div className="actions two">
                <button type="button" onClick={prepareAgain}>
                  <b aria-hidden="true">↺</b>
                  {allReady ? t("mattina.rifai") : t("mattina.meglio")}
                </button>
                <button type="button" className="yellow" onClick={onNext}>
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
