'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SAAS_PLANS } from '@/config/plans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import { formatEGP, formatNumber } from '@/i18n/config';
import { useLocale, useMessages } from '@/i18n/client';
import { commonMessages } from '@/i18n/messages/common';
import { landingMessages } from '@/i18n/messages/landing';

export default function LandingPage() {
  const t = useMessages(landingMessages);
  const c = useMessages(commonMessages);
  const locale = useLocale();

  // Pricing section filters
  const [pricingRole, setPricingRole] = useState<'CENTER' | 'TEACHER'>('CENTER');
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Filter plans dynamically based on selected role & interval
  const activePlans = Object.values(SAAS_PLANS).filter(
    (p) => p.targetRole === pricingRole && p.interval === billingInterval
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground font-sans selection:bg-[#4A00E0] selection:text-white relative overflow-hidden">
      {/* =========================================================================
          BACKGROUND AMBIENT GLOWS
      ========================================================================= */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-[#4A00E0]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[600px] -left-40 w-[600px] h-[600px] bg-[#00D4FF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[1400px] right-10 w-[500px] h-[500px] bg-[#4A00E0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* =========================================================================
          1. NAVIGATION BAR
      ========================================================================= */}
      <nav className="sticky top-0 z-50 bg-[#0A0A0F]/85 backdrop-blur-xl border-b border-white/10 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1px] shadow-indigo group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0A0A0F] rounded-[11px] flex items-center justify-center font-extrabold text-white text-xl">
                {c.brandInitial}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-2xl tracking-tight">{c.brand}</span>
                <Badge variant="cyan" className="text-2xs font-extrabold">
                  {c.country}
                </Badge>
              </div>
              <span className="text-2xs text-slate-400 font-medium hidden sm:block">
                {t.nav.tagline}
              </span>
            </div>
          </Link>

          {/* Navigation Anchors */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-[#00D4FF] transition-colors">
              {t.nav.features}
            </a>
            <a href="#split-engine" className="hover:text-[#00D4FF] transition-colors">
              {t.nav.split}
            </a>
            <a href="#pricing" className="hover:text-[#00D4FF] transition-colors">
              {t.nav.pricing}
            </a>
            <Link href="/student-dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors">
              {t.nav.studentPortal}
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-300 hover:text-white">
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" className="text-xs font-bold shadow-indigo">
                {t.nav.startFree}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          2. HERO SECTION
      ========================================================================= */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Top Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181824] border border-white/10 shadow-glass">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
          <span className="text-xs font-bold text-slate-300">
            {t.hero.badge}
          </span>
          <Badge variant="gold" className="text-2xs font-extrabold ms-1">
            {t.hero.badgeNew}
          </Badge>
        </div>

        {/* Main Arabic Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.2] sm:leading-[1.15] max-w-5xl mx-auto">
          {t.hero.titleStart}{' '}
          <span className="bg-gradient-to-r from-[#00D4FF] via-indigo-300 to-[#4A00E0] bg-clip-text text-transparent">
            {t.hero.titleHighlight}
          </span>
        </h1>

        {/* High-Converting Subheadline */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          {t.hero.subtitle}
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          {/* CTA 1: Register as Center */}
          <Link href="/signup?role=CENTER" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-extrabold shadow-indigo gap-2"
            >
              <span>🏢</span>
              <span>{t.hero.ctaCenter}</span>
            </Button>
          </Link>

          {/* CTA 2: Register as Teacher */}
          <Link href="/signup?role=TEACHER" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-extrabold shadow-cyan gap-2"
            >
              <span>👨‍🏫</span>
              <span>{t.hero.ctaTeacher}</span>
            </Button>
          </Link>
        </div>

        {/* Secondary Student Link */}
        <div className="text-xs text-slate-400">
          {t.hero.studentQuestion}{' '}
          <Link href="/signup?role=STUDENT" className="text-[#00D4FF] font-bold hover:underline">
            {t.hero.studentLink}
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{t.hero.trustCenters}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{t.hero.trustPayments}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{t.hero.trustWhatsapp}</span>
          </div>
        </div>

        {/* Hero Product Mockup / Glass Dashboard Preview */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-2xl">
            <div className="bg-[#12121A]/95 rounded-[22px] p-6 sm:p-8 border border-white/10 text-start space-y-6">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ms-2">
                    linktich.eg/center-dashboard ({t.mockup.centerName})
                  </span>
                </div>
                <Badge variant="gold">{t.mockup.planBadge}</Badge>
              </div>

              {/* Mockup Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-[#181824] p-4 rounded-xl border border-white/5">
                  <div className="text-2xs text-slate-400 font-semibold">{t.mockup.totalStudents}</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{formatNumber(1240, locale)}</div>
                  <div className="text-2xs text-[#00D4FF] mt-0.5">{t.mockup.activeClasses(formatNumber(18, locale))}</div>
                </div>

                <div className="bg-[#181824] p-4 rounded-xl border border-white/5">
                  <div className="text-2xs text-slate-400 font-semibold">{t.mockup.monthRevenue}</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatEGP(148500, locale)}</div>
                  <div className="text-2xs text-slate-400 mt-0.5">{t.mockup.collectedFees}</div>
                </div>

                <div className="bg-[#181824] p-4 rounded-xl border border-white/5">
                  <div className="text-2xs text-slate-400 font-semibold">{t.mockup.centerShare('20%')}</div>
                  <div className="text-2xl font-extrabold text-[#00D4FF] mt-1">{formatEGP(29700, locale)}</div>
                  <div className="text-2xs text-slate-400 mt-0.5">{t.mockup.centerShareNote}</div>
                </div>

                <div className="bg-[#181824] p-4 rounded-xl border border-white/5">
                  <div className="text-2xs text-slate-400 font-semibold">{t.mockup.teacherShare('80%')}</div>
                  <div className="text-2xl font-extrabold text-indigo-300 mt-1">{formatEGP(118800, locale)}</div>
                  <div className="text-2xs text-slate-400 mt-0.5">{t.mockup.teacherShareNote(formatNumber(12, locale))}</div>
                </div>
              </div>

              {/* Mockup Live Roster Row */}
              <div className="bg-[#181824]/60 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                  <span className="font-bold text-white">{t.mockup.sessionTitle}</span>
                  <span className="text-slate-400 hidden sm:inline">{t.mockup.sessionTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-300">{t.mockup.paidCount(formatNumber(58, locale), formatNumber(60, locale))}</span>
                  <Badge variant="cyan" className="font-bold">{t.mockup.liveNow}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURES SECTION
      ========================================================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="cyan" className="text-xs px-3 py-1 font-bold">
            {t.features.badge}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {t.features.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* 3 Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: QR Attendance */}
          <Card className="border-white/10 hover:border-[#00D4FF]/40 transition-all duration-300 group">
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 flex items-center justify-center text-2xl font-bold shadow-cyan group-hover:scale-110 transition-transform">
                📱
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                  {t.features.attendanceTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t.features.attendanceBody}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span> {t.features.attendancePoint1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span> {t.features.attendancePoint2}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 2: Automated Revenue Splits */}
          <Card id="split-engine" className="border-white/10 hover:border-[#4A00E0]/60 transition-all duration-300 group">
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#4A00E0]/20 text-indigo-400 border border-[#4A00E0]/40 flex items-center justify-center text-2xl font-bold shadow-indigo group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {t.features.splitTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t.features.splitBody}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span> {t.features.splitPoint1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span> {t.features.splitPoint2}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 3: Multi-Center Affiliation */}
          <Card className="border-white/10 hover:border-amber-400/40 transition-all duration-300 group">
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center text-2xl font-bold glow-gold group-hover:scale-110 transition-transform">
                🏢
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {t.features.multiTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t.features.multiBody}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t.features.multiPoint1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t.features.multiPoint2}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          4. PRICING SECTION (DYNAMIC FROM config/plans.ts)
      ========================================================================= */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="gold" className="text-xs px-3 py-1 font-bold">
            {t.pricing.badge}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {t.pricing.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            {t.pricing.subtitle}
          </p>

          {/* Role Tabs: Centers vs Teachers */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPricingRole('CENTER')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                pricingRole === 'CENTER'
                  ? 'bg-[#4A00E0] text-white shadow-indigo'
                  : 'bg-[#12121A] text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {t.pricing.tabCenters}
            </button>
            <button
              type="button"
              onClick={() => setPricingRole('TEACHER')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                pricingRole === 'TEACHER'
                  ? 'bg-[#00D4FF] text-[#0A0A0F] shadow-cyan font-extrabold'
                  : 'bg-[#12121A] text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {t.pricing.tabTeachers}
            </button>
          </div>

          {/* Interval Toggle: Monthly vs Yearly */}
          <div className="inline-flex items-center p-1 bg-[#181824] rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setBillingInterval('MONTHLY')}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                billingInterval === 'MONTHLY'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('YEARLY')}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                billingInterval === 'YEARLY'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pricing.yearly}
            </button>
          </div>
        </div>

        {/* Dynamic Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {activePlans.map((plan) => {
            const isPro = plan.id.includes('PRO');

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between p-8 transition-all duration-300 ${
                  isPro
                    ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/25 shadow-cyan bg-[#181824]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="gold" className="text-2xs font-extrabold px-3 py-1">
                      {t.pricing.popular}
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-xl">{plan.name[locale]}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {pricingRole === 'CENTER'
                        ? t.pricing.centerPlanNote
                        : t.pricing.teacherPlanNote}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-white">
                      {formatNumber(plan.priceEGP, locale)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {plan.interval === 'YEARLY' ? t.pricing.perYear : t.pricing.perMonth}
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300 border-t border-white/5 pt-6">
                    {plan.features[locale].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span className="text-[#00D4FF] font-bold">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link href={`/signup?role=${pricingRole}`}>
                    <Button
                      variant={isPro ? 'secondary' : 'outline'}
                      size="lg"
                      className="w-full font-extrabold h-12"
                    >
                      {t.pricing.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          5. FOOTER
      ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#0A0A0F]/90 backdrop-blur-md pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-start">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1px]">
                <div className="w-full h-full bg-[#0A0A0F] rounded-[7px] flex items-center justify-center font-extrabold text-white text-base">
                  {c.brandInitial}
                </div>
              </div>
              <span className="font-extrabold text-white text-xl">{c.brand}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footer.about}
            </p>
          </div>

          {/* Quick Links: Centers & Teachers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.footer.linksTitle}</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/signup?role=CENTER" className="hover:text-[#00D4FF] transition-colors">
                  {t.footer.signupCenter}
                </Link>
              </li>
              <li>
                <Link href="/signup?role=TEACHER" className="hover:text-[#00D4FF] transition-colors">
                  {t.footer.signupTeacher}
                </Link>
              </li>
              <li>
                <Link href="/student-dashboard" className="hover:text-[#00D4FF] transition-colors">
                  {t.footer.studentPortal}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#00D4FF] transition-colors">
                  {t.footer.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Gateways in Egypt */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.footer.paymentsTitle}</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span>📱</span> {t.footer.paymentWallets}
              </li>
              <li className="flex items-center gap-1.5">
                <span>💳</span> {t.footer.paymentCards}
              </li>
              <li className="flex items-center gap-1.5">
                <span>⚡</span> {t.footer.paymentFawry}
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.footer.supportTitle}</h4>
            <p className="text-xs text-slate-400">
              {t.footer.supportBody}
            </p>
            <div className="pt-1">
              <a
                href="https://wa.me/201012345678"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all"
              >
                <span>💬</span> {t.footer.whatsapp}
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-400 gap-4">
          <div>{t.footer.copyright}</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">{t.footer.privacy}</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">{t.footer.terms}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
