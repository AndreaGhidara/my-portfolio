import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import it from "../../messages/it.json";
import en from "../../messages/en.json";

const MESSAGGI = { it, en } as const;

/**
 * Il render dei componenti che si leggono i testi da soli, con
 * useTranslations. In pagina il provider lo mette layout.tsx con tutti i
 * messaggi; qui si passano i dizionari veri, non un finto: una chiave che
 * manca deve far cadere la prova, non comparire come testo inventato.
 *
 * Il fuso e' fisso perche' next-intl, senza, avvisa a ogni render: nessuno di
 * questi componenti scrive una data.
 */
export function renderWithMessages(
  ui: ReactElement,
  { locale = "it", ...opzioni }: { locale?: keyof typeof MESSAGGI } & Omit<RenderOptions, "wrapper"> = {},
) {
  function Testi({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={MESSAGGI[locale]} timeZone="Europe/Rome">
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Testi, ...opzioni });
}
