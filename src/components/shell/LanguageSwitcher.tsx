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
          className={
            code === locale
              ? "px-1.5 text-[var(--fg)]"
              : "px-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
