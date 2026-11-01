'use client';

import { useState, useEffect } from 'react';
import { DashboardAnalyticsOverview } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocale, useMessages } from '@/i18n/client';
import { formatEGP, formatNumber } from '@/i18n/config';
import { analyticsMessages } from '@/i18n/messages/analytics';

interface DashboardAnalyticsSummaryProps {
  role: 'CENTER' | 'TEACHER';
  refreshTrigger?: number;
  onSelectClass?: (classId: string) => void;
}

export default function DashboardAnalyticsSummary({
  role,
  refreshTrigger,
  onSelectClass,
}: DashboardAnalyticsSummaryProps) {
  const t = useMessages(analyticsMessages);
  const locale = useLocale();
  const [data, setData] = useState<DashboardAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/analytics/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-400 animate-pulse">
        {t.loading}
      </div>
    );
  }

  if (!data) return null;

  const centerPercentage =
    data.totalMonthlyRevenue > 0
      ? Math.round((data.centerShareTotal / data.totalMonthlyRevenue) * 100)
      : 20;
  const teacherPercentage = 100 - centerPercentage;

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Students */}
        <Card className="relative overflow-hidden group hover:border-[#00D4FF]/40 transition-all duration-300">
          <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.students}</span>
              <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center text-sm">
                👥
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              {formatNumber(data.totalActiveStudents, locale)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
              {t.studentsInClasses(data.totalActiveClasses)}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="relative overflow-hidden group hover:border-[#4A00E0]/60 transition-all duration-300">
          <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#4A00E0] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.revenue}</span>
              <div className="w-8 h-8 rounded-lg bg-[#4A00E0]/20 text-indigo-400 flex items-center justify-center text-sm">
                💰
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              {formatEGP(data.totalMonthlyRevenue, locale)}
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span className="font-bold">↑</span> {t.revenueHint}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Split Share */}
        <Card className="relative overflow-hidden group hover:border-amber-400/40 transition-all duration-300">
          <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                {role === 'CENTER' ? t.centerShare : t.teacherShare}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center text-sm glow-gold">
                ⚡
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-3 tracking-tight">
              {formatEGP(role === 'CENTER' ? data.centerShareTotal : data.teacherShareTotal, locale)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t.shareHint}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Attendance Rate */}
        <Card className="relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.attendance}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">
                📈
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-3 tracking-tight">
              {formatNumber(data.averageAttendanceRate, locale)}%
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">
              {t.attendanceHint}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Split Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Revenue Split Bar */}
        <Card className="border-white/10">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">{t.splitTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.splitSubtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="h-6 w-full bg-[#181824] rounded-full overflow-hidden flex border border-white/5 p-0.5">
                <div
                  style={{ width: `${centerPercentage}%` }}
                  className="bg-gradient-to-r from-[#4A00E0] to-[#5E17EB] h-full rounded-s-full flex items-center justify-center text-white text-2xs font-extrabold shadow-indigo"
                  title={t.centerTitle(centerPercentage)}
                >
                  {centerPercentage > 15 ? t.centerBar(centerPercentage) : ''}
                </div>
                <div
                  style={{ width: `${teacherPercentage}%` }}
                  className="bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] h-full rounded-e-full flex items-center justify-center text-[#0A0A0F] text-2xs font-extrabold shadow-cyan"
                  title={t.teacherTitle(teacherPercentage)}
                >
                  {teacherPercentage > 15 ? t.teacherBar(teacherPercentage) : ''}
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between text-indigo-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4A00E0] inline-block shadow-indigo" />
                    <span>{t.centerShareLabel}</span>
                  </div>
                  <span className="font-bold">{formatEGP(data.centerShareTotal, locale)} ({centerPercentage}%)</span>
                </div>
                <div className="flex items-center justify-between text-[#00D4FF]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] inline-block shadow-cyan" />
                    <span>{t.teacherShareLabel}</span>
                  </div>
                  <span className="font-bold">{formatEGP(data.teacherShareTotal, locale)} ({teacherPercentage}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Group Performance List */}
        <Card className="lg:col-span-2 border-white/10">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{t.classesTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.classesSubtitle}
                </p>
              </div>
            </div>

            {data.classBreakdowns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t.noClasses}
              </div>
            ) : (
              <div className="space-y-3">
                {data.classBreakdowns.map((c) => {
                  const collectionRatio =
                    c.totalStudents > 0 ? Math.round((c.paidStudents / c.totalStudents) * 100) : 0;

                  return (
                    <div
                      key={c.classId}
                      className="p-4 rounded-xl border border-white/5 bg-[#181824]/60 hover:bg-[#181824] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="font-bold text-sm text-white group-hover:text-[#00D4FF] transition-colors">
                          {c.className}
                        </div>
                        <div className="text-xs text-slate-400">
                          {role === 'CENTER' ? t.teacherName(c.teacherName) : t.centerName(c.centerName)} •{' '}
                          <span className="font-semibold text-slate-200">{t.studentCount(c.totalStudents)}</span>{' '}
                          {t.collectedCount(c.paidStudents)}
                        </div>
                        <div className="w-52 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            style={{ width: `${collectionRatio}%` }}
                            className={`h-full ${
                              collectionRatio >= 80 ? 'bg-[#00D4FF]' : 'bg-amber-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-start sm:text-end">
                          <div className="text-sm font-extrabold text-white">
                            {formatEGP(c.grossRevenue, locale)}
                          </div>
                          <div className="text-2xs text-slate-400">
                            {t.rates(c.centerCommissionRate, c.teacherCommissionRate)}
                          </div>
                        </div>

                        {onSelectClass && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectClass(c.classId)}
                            className="text-xs h-8"
                          >
                            {t.openRoster} {t.arrow}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
