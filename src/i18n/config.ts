// Language setup shared by server and client code.
// Arabic is the default; the visitor's choice is kept in a cookie.

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ar';
export const LOCALE_COOKIE = 'linktich_locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'ar' || value === 'en';
}

export function dirOf(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * A message set holds the same keys in both languages.
 * `en` must match the shape of `ar`, so a missing key is a type error.
 */
export type Messages<T> = { ar: T; en: NoInfer<T> };

export function defineMessages<T>(messages: Messages<T>): Messages<T> {
  return messages;
}

/** Format a number with Western digits in both languages (common in Egypt). */
export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');
}

/** Format an amount in Egyptian pounds, e.g. "1,250 ج.م" / "EGP 1,250". */
export function formatEGP(value: number, locale: Locale): string {
  const n = formatNumber(value, locale);
  return locale === 'ar' ? `${n} ج.م` : `EGP ${n}`;
}

/** Format a date, e.g. "1 نوفمبر 2026" / "1 Nov 2026". */
export function formatDate(value: string | number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
