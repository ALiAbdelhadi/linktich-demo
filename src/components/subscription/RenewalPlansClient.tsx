'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SAAS_PLANS } from '@/config/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocale, useMessages } from '@/i18n/client';
import { formatDate, formatEGP, formatNumber } from '@/i18n/config';
import { subscriptionMessages } from '@/i18n/messages/subscription';

interface RenewalPlansClientProps {
  role: 'CENTER' | 'TEACHER';
  currentStatus: string;
  entityName: string;
  redirectTo: string;
}

export default function RenewalPlansClient({
  role,
  currentStatus,
  entityName,
  redirectTo,
}: RenewalPlansClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const m = useMessages(subscriptionMessages);
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState(
    role === 'CENTER' ? 'CENTER_PRO_MONTHLY' : 'TEACHER_PRO_MONTHLY'
  );
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'VODAFONE_CASH'>('CARD');
  const [walletPhone, setWalletPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [paymobIframeUrl, setPaymobIframeUrl] = useState<string | null>(null);
  const [walletRedirectUrl, setWalletRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relevantPlans = Object.values(SAAS_PLANS).filter(
    (p) => p.targetRole === role && p.interval === interval
  );

  const selectedPlan = SAAS_PLANS[selectedPlanId];

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    setPaymobIframeUrl(null);
    setWalletRedirectUrl(null);

    // Validate wallet phone if Vodafone Cash selected
    if (paymentMethod === 'VODAFONE_CASH') {
      const cleanPhone = walletPhone.trim().replace(/\s+/g, '');
      const egPhoneRegex = /^(010|011|012|015)[0-9]{8}$/;
      if (!egPhoneRegex.test(cleanPhone)) {
        setError(m.payment.walletInvalid);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          paymentMethod,
          billingInterval: interval,
          walletPhone: walletPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || m.payment.failed);
      }

      // Case 1: Card payment -> Display Paymob iframe
      if (data.paymentType === 'IFRAME' && data.iframeUrl) {
        setPaymobIframeUrl(data.iframeUrl);
        return;
      }

      // Case 2: Mobile Wallet -> Redirect to Vodafone Cash confirmation page
      if (data.paymentType === 'REDIRECT' && data.redirectUrl) {
        setWalletRedirectUrl(data.redirectUrl);
        window.location.href = data.redirectUrl;
        return;
      }

      // Case 3: Direct activation / Mock
      if (data.data) {
        setSuccessResult(data.data);
        setTimeout(() => {
          router.push(data.redirectTo || redirectTo);
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || m.payment.connectionFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Expiration Banner */}
      <Card className="border-amber-400/30 bg-amber-400/5 glow-gold">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-bold text-amber-300">
                {m.banner.statusLabel} {m.banner.statuses[currentStatus] ?? currentStatus}
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {m.banner.account} <span className="font-bold text-white">{entityName}</span>. {m.banner.locked}
            </p>
          </div>

          <Badge variant="gold" className="text-xs w-fit">
            {m.banner.badge}
          </Badge>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={m.iframe.dismissError}
            className="text-red-400 hover:text-white font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paymob Hosted Card Iframe Modal */}
      {paymobIframeUrl && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#12121A] border border-[#00D4FF]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-[#181824] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{m.iframe.title}</h3>
                  <p className="text-2xs text-slate-400">
                    {selectedPlan ? m.iframe.amount(formatEGP(selectedPlan.priceEGP, locale), selectedPlan.name[locale]) : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymobIframeUrl(null)}
                className="text-slate-400 hover:text-white text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
              >
                {m.iframe.close}
              </button>
            </div>

            <div className="p-2 bg-black min-h-[600px] flex items-center justify-center">
              <iframe
                src={paymobIframeUrl}
                title={m.iframe.frameTitle}
                className="w-full h-[620px] border-0 rounded-xl"
                allow="payment"
              />
            </div>

            <div className="p-3 bg-[#181824] border-t border-white/10 flex items-center justify-between text-2xs text-slate-400">
              <span>{m.iframe.secure}</span>
              <a
                href={paymobIframeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#00D4FF] hover:underline"
              >
                {m.iframe.openNew}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Wallet Pending Redirect Modal */}
      {walletRedirectUrl && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0F]/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-[#00D4FF]/40 bg-[#12121A] text-center p-6 space-y-4 shadow-glass">
            <div className="w-14 h-14 bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              📱
            </div>
            <h3 className="text-xl font-bold text-white">{m.walletRedirect.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {m.walletRedirect.body}
            </p>
            <div className="pt-2">
              <a
                href={walletRedirectUrl}
                className="inline-block px-6 py-2.5 bg-[#00D4FF] text-black font-bold text-xs rounded-xl shadow-cyan"
              >
                {m.walletRedirect.link}
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* Direct Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0F]/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-emerald-500/40 bg-[#12121A] text-center p-6 space-y-4 shadow-glass">
            <div className="w-14 h-14 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white">{m.success.title}</h3>
            <p className="text-xs text-slate-400">
              {m.success.body}
            </p>
            <div className="bg-[#181824] p-3 rounded-xl text-start text-xs space-y-1 font-mono border border-white/5">
              <div>{m.success.transactionId} <span className="text-[#00D4FF] font-bold">{successResult.transactionId}</span></div>
              <div>{m.success.amount} <span className="text-emerald-400 font-bold">{formatEGP(successResult.amountEGP, locale)}</span></div>
              <div>{m.success.validUntil} <span className="text-white">{formatDate(successResult.periodEnd, locale)}</span></div>
            </div>
            <p className="text-xs text-[#00D4FF] animate-pulse">
              {m.success.redirecting}
            </p>
          </Card>
        </div>
      )}

      {/* Billing Interval Toggle */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-extrabold text-white">{m.plans.title}</h3>
        <p className="text-xs text-slate-400">
          {m.plans.subtitle}
        </p>

        <div className="inline-flex items-center p-1 bg-[#181824] rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setInterval('MONTHLY');
              setSelectedPlanId(role === 'CENTER' ? 'CENTER_PRO_MONTHLY' : 'TEACHER_PRO_MONTHLY');
            }}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              interval === 'MONTHLY'
                ? 'bg-[#4A00E0] text-white shadow-indigo'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {m.plans.monthly}
          </button>
          <button
            type="button"
            onClick={() => {
              setInterval('YEARLY');
              setSelectedPlanId(role === 'CENTER' ? 'CENTER_PRO_YEARLY' : 'TEACHER_PRO_YEARLY');
            }}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              interval === 'YEARLY'
                ? 'bg-[#00D4FF] text-[#0A0A0F] shadow-cyan font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {m.plans.yearly} <span className="text-amber-400 font-extrabold">{m.plans.yearlyBonus}</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {relevantPlans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isPro = plan.id.includes('PRO');

          return (
            <Card
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative cursor-pointer transition-all duration-300 flex flex-col justify-between p-6 ${
                isSelected
                  ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/30 shadow-cyan bg-[#181824]'
                  : 'hover:border-white/20'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                  <Badge variant="gold">{m.plans.popular}</Badge>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-lg">{plan.name[locale]}</h4>
                  <input
                    type="radio"
                    name="planSelect"
                    checked={isSelected}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="w-4 h-4 text-[#00D4FF] focus:ring-[#00D4FF]"
                  />
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {formatNumber(plan.priceEGP, locale)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {m.plans.currency} / {plan.interval === 'YEARLY' ? m.plans.perYear : m.plans.perMonth}
                  </span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  {plan.features[locale].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[#00D4FF] font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div
                  className={`text-center py-2.5 text-xs font-bold rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30'
                      : 'text-slate-500'
                  }`}
                >
                  {isSelected ? m.plans.selected : m.plans.select}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Gateway Options & Checkout */}
      <Card className="max-w-2xl mx-auto border-white/10 p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">{m.payment.title}</h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {m.payment.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('CARD')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              paymentMethod === 'CARD'
                ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-white shadow-cyan'
                : 'border-white/10 bg-[#181824] text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="font-bold text-sm">💳 {m.payment.card}</div>
            <div className="text-xs text-slate-400 mt-1">{m.payment.cardHint}</div>
            <div className="text-2xs text-emerald-400 mt-2 font-semibold">{m.payment.cardNote}</div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('VODAFONE_CASH')}
            className={`p-4 rounded-xl border text-start transition cursor-pointer ${
              paymentMethod === 'VODAFONE_CASH'
                ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-white shadow-cyan'
                : 'border-white/10 bg-[#181824] text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="font-bold text-sm">📱 {m.payment.wallet}</div>
            <div className="text-xs text-slate-400 mt-1">{m.payment.walletHint}</div>
            <div className="text-2xs text-[#00D4FF] mt-2 font-semibold">{m.payment.walletNote}</div>
          </button>
        </div>

        {/* Vodafone Cash Phone Input */}
        {paymentMethod === 'VODAFONE_CASH' && (
          <div className="p-4 bg-[#181824] border border-[#00D4FF]/30 rounded-xl space-y-2 animate-fadeIn">
            <label className="text-xs font-bold text-white block">
              {m.payment.walletLabel} <span className="text-red-400">*</span>
            </label>
            <Input
              type="tel"
              placeholder="01012345678"
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              className="text-start font-mono tracking-wider"
              dir="ltr"
            />
            <p className="text-2xs text-slate-400">
              {m.payment.walletHelp}
            </p>
          </div>
        )}

        <div className="bg-[#181824]/60 p-4 rounded-xl border border-white/5 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{m.payment.summaryPlan}</span>
            <span className="font-bold text-white">{selectedPlan?.name[locale]}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{m.payment.summaryCycle}</span>
            <span className="text-white">{interval === 'YEARLY' ? m.payment.cycleYearly : m.payment.cycleMonthly}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
            <span className="text-sm font-bold text-white">{m.payment.total}</span>
            <span className="text-2xl font-black text-[#00D4FF]">
              {selectedPlan ? formatEGP(selectedPlan.priceEGP, locale) : ''}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={handlePayment}
          disabled={loading}
          className="w-full font-bold shadow-cyan text-sm py-6"
        >
          {loading
            ? m.payment.connecting
            : paymentMethod === 'CARD'
            ? m.payment.payCard
            : m.payment.payWallet}
        </Button>
      </Card>
    </div>
  );
}
