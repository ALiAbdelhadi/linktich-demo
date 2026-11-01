import { getSession } from '@/lib/auth';
import { requireActiveSubscription } from '@/lib/subscriptionGate';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import LanguageToggle from '@/components/LanguageToggle';
import { getMessages } from '@/i18n/server';
import { commonMessages } from '@/i18n/messages/common';
import { centerMessages } from '@/i18n/messages/center';
import CenterDashboardClient from '@/components/center/CenterDashboardClient';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function CenterDashboardPage() {
  const t = getMessages(centerMessages);
  const common = getMessages(commonMessages);
  const session = await getSession();

  if (!session || (session.role !== 'CENTER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  // Enforce SaaS Subscription Gate for Centers
  const subscription = await requireActiveSubscription();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Top Navigation */}
      <header className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Electric Indigo & Bright Cyan Gradient Brand Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1px] shadow-indigo">
              <div className="w-full h-full bg-[#0A0A0F] rounded-[11px] flex items-center justify-center font-extrabold text-white text-xl">
                {common.brandInitial}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xl tracking-tight">{common.brand}</span>
                <Badge variant="cyan" className="text-2xs font-extrabold">
                  {t.page.portalBadge}
                </Badge>
              </div>
              <span className="text-2xs text-slate-400 font-medium hidden sm:block">
                {t.page.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-start sm:text-end hidden sm:block">
              <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                <span>{session.name}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
              </div>
              <div className="text-xs text-slate-400 font-mono">{session.email}</div>
            </div>
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Center Overview Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#12121A] via-[#181824] to-[#12121A] border border-white/10 p-6 sm:p-8 shadow-glass">
          {/* Subtle Glow Spheres */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#4A00E0]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#00D4FF]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {t.page.title}
                </h1>
                {/* Gold Accent Badge for Active SaaS Subscription */}
                <Badge variant="gold" className="px-3 py-1 text-xs">
                  {t.page.subscriptionBadge}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {t.page.intro}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <Link
                href="/renew-subscription"
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition underline underline-offset-4"
              >
                {t.page.billingLink} {t.page.arrow}
              </Link>
            </div>
          </div>
        </div>

        {/* Client Interactive Modules: Real-time Analytics, Teacher Relations & Classes */}
        <CenterDashboardClient />
      </main>
    </div>
  );
}
