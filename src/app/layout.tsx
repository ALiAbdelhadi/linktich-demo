import type { Metadata } from 'next';
import './globals.css';
import { dirOf } from '@/i18n/config';
import { getLocale } from '@/i18n/server';
import { LocaleProvider } from '@/i18n/client';

const META = {
  ar: {
    title: 'لينكتك | إدارة سناتر الدروس الخصوصية في مصر',
    description:
      'لينكتك تربط السنتر والمدرس والطالب في مكان واحد: حضور بالباركود، تحصيل المصاريف، وحساب نسبة كل طرف تلقائياً.',
  },
  en: {
    title: 'Linktich | Tutoring center management in Egypt',
    description:
      'Linktich connects tutoring centers, teachers and students in one place: QR attendance, fee collection and automatic revenue splits.',
  },
};

export function generateMetadata(): Metadata {
  return META[getLocale()];
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();

  return (
    <html lang={locale} dir={dirOf(locale)} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0A0A0F] text-foreground font-sans antialiased selection:bg-[#4A00E0] selection:text-white">
        {/* Ambient Dark Glow Gradients */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-[#4A00E0]/15 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[#00D4FF]/10 rounded-full blur-[140px]" />
        </div>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
