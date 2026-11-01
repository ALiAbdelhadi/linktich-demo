'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale, useMessages } from '@/i18n/client';
import { formatDate, formatEGP } from '@/i18n/config';
import { studentMessages } from '@/i18n/messages/student';

interface EnrollmentItem {
  id: string;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'EXEMPT';
  attendanceStatus: 'REGISTERED' | 'REGULAR' | 'AT_RISK' | 'DROPPED';
  enrolledAt: string;
  class: {
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
    center: {
      id: string;
      name: string;
      location: string;
      phone: string | null;
    };
    teacher: {
      id: string;
      subject: string;
      name: string;
    };
  };
}

interface MyEnrollmentsListProps {
  refreshTrigger?: number;
}

export default function MyEnrollmentsList({ refreshTrigger }: MyEnrollmentsListProps) {
  const t = useMessages(studentMessages).enrollments;
  const locale = useLocale();
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/enrollments');
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">{t.loading}</div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card className="border-white/10 p-8 text-center space-y-3">
        <div className="text-3xl">📚</div>
        <h3 className="text-base font-bold text-white">{t.emptyTitle}</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {t.emptyText}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrollments.map((e) => (
        <Card
          key={e.id}
          className="hover:border-[#00D4FF]/40 transition-all duration-300 flex flex-col justify-between"
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={e.paymentStatus === 'PAID' ? 'success' : 'gold'}>
                {e.paymentStatus === 'PAID' ? t.paid : t.pending}
              </Badge>
              <span className="text-xs font-bold text-[#00D4FF]">{formatEGP(e.class.price, locale)}</span>
            </div>

            <div>
              <h3 className="font-bold text-white text-base leading-snug">{e.class.name}</h3>
              <div className="text-xs text-slate-300 mt-1">
                {t.teacher} <span className="font-semibold text-white">{e.class.teacher.name}</span> ({e.class.teacher.subject})
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t.center} <span className="font-medium text-slate-300">{e.class.center.name}</span> ({e.class.center.location})
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-[#181824]/80 p-3 rounded-xl border border-white/5 space-y-1">
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">{t.schedule}</div>
              {Array.isArray(e.class.schedule) &&
                e.class.schedule.map((slot, idx) => (
                  <div key={idx} className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-[#00D4FF]">🗓️</span>
                    <span>{slot.day} • {slot.startTime} - {slot.endTime}</span>
                    {slot.room && (
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {slot.room}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>{t.joinedOn} {formatDate(e.enrolledAt, locale)}</span>
              <span className="text-[#00D4FF] font-semibold cursor-pointer hover:underline">
                {t.centerLocation}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
