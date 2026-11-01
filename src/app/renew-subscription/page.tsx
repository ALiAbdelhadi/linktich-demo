import { getSession, getDashboardRoute } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubscriptionService } from '@/services/subscriptionService';
import LogoutButton from '@/components/LogoutButton';
import RenewalPlansClient from '@/components/subscription/RenewalPlansClient';
import { Badge } from '@/components/ui/badge';
import LanguageToggle from '@/components/LanguageToggle';
import { getMessages } from '@/i18n/server';
import { commonMessages } from '@/i18n/messages/common';
import { subscriptionMessages } from '@/i18n/messages/subscription';

export default async function RenewSubscriptionPage() {
  const common = getMessages(commonMessages);
  const t = getMessages(subscriptionMessages).header;
  const session = await getSession();

  if (!session) {
    redirect('/login?callbackUrl=/renew-subscription');
  }

  // Students and Admins do not pay subscriptions
  if (session.role === 'STUDENT') {
    redirect('/student-dashboard');
  }

  const role = session.role as 'CENTER' | 'TEACHER';
  const subStatus = await SubscriptionService.checkSubscriptionStatus(session.userId, role);

  // If already subscribed and not expired, redirect to their role dashboard
  if (subStatus && subStatus.isSubscribed) {
    redirect(getDashboardRoute(session.role));
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Top Navigation */}
      <header className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1px] shadow-indigo">
              <div className="w-full h-full bg-[#0A0A0F] rounded-[11px] flex items-center justify-center font-extrabold text-white text-xl">
                {common.brandInitial}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xl tracking-tight">{common.brand}</span>
                <Badge variant="gold" className="text-2xs">
                  {t.badge}
                </Badge>
              </div>
              <span className="text-2xs text-slate-400 font-medium hidden sm:block">
                {t.subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-start hidden sm:block">
              <div className="text-sm font-bold text-white">{session.name}</div>
              <div className="text-xs text-slate-400 font-mono">{session.email}</div>
            </div>
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <RenewalPlansClient
          role={role}
          currentStatus={subStatus ? subStatus.status : 'INACTIVE'}
          entityName={subStatus ? subStatus.name : session.name}
          redirectTo={getDashboardRoute(session.role)}
        />
      </main>
    </div>
  );
}
