"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

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
          // px/py portano il bersaglio sopra i 24x24 di WCAG 2.2 (erano 26x16).
          // La barra non si alza: la sua altezza la detta il bottone del tema.
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
