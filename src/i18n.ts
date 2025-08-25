import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

export const locales = ['en', 'it'];
export const defaultLocale = 'it';

export default getRequestConfig(async ({locale}) => {
  if (!locale || !locales.includes(locale)) {
    notFound();
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
