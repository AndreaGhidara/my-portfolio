'use client'

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find((lang) => lang.code === locale);

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      const newPath = pathname.startsWith(`/${locale}`)
        ? pathname.substring(locale.length + 1)
        : pathname;
      router.replace(`/${newLocale}${newPath}`);
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Change language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >

        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase">
          {currentLanguage?.code}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <ul>
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center w-full px-4 py-3 text-sm text-left ${locale === lang.code
                    ? 'font-semibold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  } transition-colors`}
                >
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
