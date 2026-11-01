'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocale, useMessages } from '@/i18n/client';
import { formatEGP } from '@/i18n/config';
import { studentMessages } from '@/i18n/messages/student';

interface BrowseClass {
  id: string;
  name: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
  price: number;
  billingCycle: 'MONTHLY' | 'PER_SESSION';
  capacity: number | null;
  enrolledCount: number;
  isFull: boolean;
  isEnrolled: boolean;
  enrollmentDetails?: {
    paymentStatus: string;
    attendanceStatus: string;
  } | null;
  center: {
    id: string;
    name: string;
    location: string;
    phone: string | null;
  };
  teacher: {
    id: string;
    subject: string;
    bio: string | null;
    user: {
      name: string;
      email: string;
    };
  };
}

interface BrowseClassesProps {
  onEnrollmentSuccess?: () => void;
}

export default function BrowseClasses({ onEnrollmentSuccess }: BrowseClassesProps) {
  const t = useMessages(studentMessages).browse;
  const locale = useLocale();
  const [classes, setClasses] = useState<BrowseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchClasses = async (searchTerm?: string) => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `/api/classes?browse=true&search=${encodeURIComponent(searchTerm)}`
        : `/api/classes?browse=true`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEnroll = async (classId: string) => {
    setEnrollingId(classId);
    setFeedback(null);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.joinFailed);
      }

      setFeedback({ type: 'success', text: t.joinSuccess });

      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId
            ? {
                ...c,
                isEnrolled: true,
                enrolledCount: c.enrolledCount + 1,
                enrollmentDetails: { paymentStatus: 'PENDING', attendanceStatus: 'REGISTERED' },
              }
            : c
        )
      );

      if (onEnrollmentSuccess) {
        onEnrollmentSuccess();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || t.joinError });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar Card */}
      <Card className="border-white/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.searchLabel}
            </label>
            <Input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="bg-[#181824]"
            />
          </div>
          <div className="text-xs text-slate-400 sm:self-end pb-2">
            {t.found(classes.length)}
          </div>
        </div>
      </Card>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Class Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">{t.loading}</div>
      ) : classes.length === 0 ? (
        <div className="py-12 text-center bg-[#12121A] rounded-2xl border border-white/10 p-8 space-y-2">
          <p className="text-sm font-semibold text-white">{t.emptyTitle}</p>
          <p className="text-xs text-slate-400">{t.emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <Card
              key={c.id}
              className="hover:border-[#00D4FF]/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">{c.teacher.subject}</Badge>
                  <span className="text-sm font-extrabold text-[#00D4FF]">
                    {formatEGP(c.price, locale)} <span className="text-2xs text-slate-400">/ {c.billingCycle === 'MONTHLY' ? t.perMonth : t.perSession}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#00D4FF] transition-colors">
                    {c.name}
                  </h3>
                  <div className="text-xs text-slate-300 mt-1">
                    {t.teacher} <span className="font-semibold text-white">{c.teacher.user.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.center} <span className="font-medium text-slate-300">{c.center.name}</span> ({c.center.location})
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-[#181824]/80 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">{t.schedule}</div>
                  {Array.isArray(c.schedule) &&
                    c.schedule.map((s, idx) => (
                      <div key={idx} className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="text-[#00D4FF]">🗓️</span>
                        <span>{s.day} • {s.startTime} - {s.endTime}</span>
                        {s.room && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {s.room}
                          </span>
                        )}
                      </div>
                    ))}
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{t.seats} {c.enrolledCount} {c.capacity ? `/ ${c.capacity}` : t.students}</span>
                  {c.isFull && !c.isEnrolled && (
                    <span className="text-xs font-semibold text-red-400">{t.roomFull}</span>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {c.isEnrolled ? (
                    <div className="w-full py-2.5 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl text-center">
                      {t.enrolled} ({c.enrollmentDetails?.paymentStatus === 'PAID' ? t.paymentPaid : t.paymentPending})
                    </div>
                  ) : c.isFull ? (
                    <div className="w-full py-2.5 px-3 bg-white/5 border border-white/10 text-slate-500 text-xs font-semibold rounded-xl text-center">
                      {t.classFull}
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleEnroll(c.id)}
                      disabled={enrollingId === c.id}
                      className="w-full text-xs font-bold h-10"
                    >
                      {enrollingId === c.id ? t.joining : t.join}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
