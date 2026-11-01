'use client';

// Client-side language helpers. The root layout wraps the app in
// <LocaleProvider>, so any client component can call useLocale/useMessages.
import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale, type Messages } from './config';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useMessages<T>(messages: Messages<T>): T {
  return messages[useLocale()];
}
