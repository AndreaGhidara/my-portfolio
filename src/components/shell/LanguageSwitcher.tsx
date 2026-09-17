"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Due lingue sole: due link, non una tendina. Meno codice e un tocco solo
 * su mobile.
 */
export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 text-xs font-bold tracking-widest">
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => router.replace(pathname, { locale: code })}
          aria-current={code === locale ? "true" : undefined}
          // px/py sono bersaglio e non decorazione: due lettere da 12px
          // facevano un'area da 26x16, sotto i 24x24 che WCAG 2.2 chiede.
          // L'altezza della barra non cambia: la detta il bottone del tema,
          // che e' piu' alto di cosi'.
          className={
            code === locale
              ? "px-2 py-2.5 text-[var(--fg)]"
              : "px-2 py-2.5 text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
