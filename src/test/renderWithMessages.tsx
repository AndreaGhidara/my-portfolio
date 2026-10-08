import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import it from "../../messages/it.json";
import en from "../../messages/en.json";

const MESSAGES = { it, en } as const;

// I dizionari veri e non un finto: una chiave che manca deve far cadere la prova.
// Il fuso e' fisso perche' senza next-intl avvisa a ogni render.
export function renderWithMessages(
  ui: ReactElement,
  { locale = "it", ...options }: { locale?: keyof typeof MESSAGES } & Omit<RenderOptions, "wrapper"> = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Rome">
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
