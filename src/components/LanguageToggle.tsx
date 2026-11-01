'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALE_COOKIE } from '@/i18n/config';
import { useLocale, useMessages } from '@/i18n/client';
import { commonMessages } from '@/i18n/messages/common';
import { cn } from '@/lib/utils';

/** Switches between Arabic and English. The choice is saved for a year. */
export default function LanguageToggle({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useMessages(commonMessages);
  const [pending, startTransition] = useTransition();

  const switchLanguage = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={pending}
      aria-label={t.switchLanguageLabel}
      lang={locale === 'ar' ? 'en' : 'ar'}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-slate-300 transition-colors hover:border-[#00D4FF]/40 hover:text-white disabled:opacity-60',
        className
      )}
    >
      <span aria-hidden="true">🌐</span>
      <span>{t.switchLanguage}</span>
    </button>
  );
}
