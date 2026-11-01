// Server-side language helpers (server components, route handlers).
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale, type Messages } from './config';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getMessages<T>(messages: Messages<T>): T {
  return messages[getLocale()];
}
