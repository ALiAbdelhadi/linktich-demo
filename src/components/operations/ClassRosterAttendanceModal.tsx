'use client';

import { useState, useEffect } from 'react';
import { RevenueSplitAnalytics, SessionAttendanceStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale, useMessages } from '@/i18n/client';
import { formatEGP } from '@/i18n/config';
import { operationsMessages } from '@/i18n/messages/operations';

interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  enrolledAt: string;
  masterPaymentStatus: string;
  masterAttendanceStatus: string;
  sessionStatus: SessionAttendanceStatus;
  isPaidForSession: boolean;
  amountPaid: number;
}

interface ClassDetails {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  center: { id: string; name: string; location: string };
  teacher: { id: string; name: string; phone: string; subject: string };
}

interface ClassRosterAttendanceModalProps {
  classId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ClassRosterAttendanceModal({
  classId,
  onClose,
  onSaved,
}: ClassRosterAttendanceModalProps) {
  const t = useMessages(operationsMessages);
  const locale = useLocale();
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [revenueSplit, setRevenueSplit] = useState<RevenueSplitAnalytics | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRoster = async () => {
    if (!classId) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/classes/${classId}/roster?date=${sessionDate}`);
      const data = await res.json();

      if (data.success) {
        setClassDetails(data.data.classDetails);
        setRevenueSplit(data.data.revenueSplit);
        setRoster(data.data.roster);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [classId, sessionDate]);

  if (!classId) return null;

  const handleToggleAttendance = (studentId: string, status: SessionAttendanceStatus) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, sessionStatus: status } : s))
    );
  };

  const handleTogglePayment = (studentId: string, isPaid: boolean) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, isPaidForSession: isPaid } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, sessionStatus: 'PRESENT' })));
  };

  const handleMarkAllPaid = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, isPaidForSession: true })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        sessionDate,
        records: roster.map((r) => ({
          studentId: r.studentId,
          enrollmentId: r.enrollmentId,
          status: r.sessionStatus,
          isPaid: r.isPaidForSession,
          amountPaid: r.amountPaid,
        })),
      };

      const res = await fetch(`/api/classes/${classId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.saveFailed);
      }

      setFeedback({ type: 'success', text: t.saveSuccess });
      fetchRoster();
      if (onSaved) onSaved();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || t.saveError });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#12121A] rounded-3xl shadow-glass border border-white/10 max-w-4xl w-full p-6 sm:p-8 space-y-6 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {classDetails?.name || t.defaultTitle}
              </h2>
              <Badge variant="cyan">{t.liveBadge}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.teacher}: <span className="font-semibold text-slate-200">{classDetails?.teacher.name}</span> •{' '}
              {t.center}: <span className="font-semibold text-slate-200">{classDetails?.center.name}</span>
            </p>
          </div>

          <button
            type="button"
            aria-label={t.closeLabel}
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Date Selector & Session Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181824]/70 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300">{t.sessionDate}</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold bg-[#12121A] text-white shadow-sm focus:border-[#00D4FF] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-2xs h-7 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              {t.markAllPresent}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPaid}
              className="text-2xs h-7 border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10"
            >
              {t.markAllPaid}
            </Button>
          </div>
        </div>

        {/* Revenue Split Analytics Panel */}
        {revenueSplit && (
          <div className="bg-gradient-to-r from-[#4A00E0]/15 via-[#181824] to-[#00D4FF]/15 p-5 rounded-2xl border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xs uppercase font-bold text-slate-400">{t.collected}</div>
              <div className="text-xl font-extrabold text-white mt-1">
                {formatEGP(revenueSplit.grossRevenue, locale)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">
                {t.paidOfTotal(revenueSplit.paidStudents, revenueSplit.totalStudents)}
              </div>
            </div>

            <div>
              <div className="text-2xs uppercase font-bold text-[#00D4FF]">
                {t.centerShare(revenueSplit.centerCommissionRate)}
              </div>
              <div className="text-xl font-extrabold text-[#00D4FF] mt-1">
                {formatEGP(revenueSplit.centerShareRevenue, locale)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">{t.centerShareHint}</div>
            </div>

            <div>
              <div className="text-2xs uppercase font-bold text-indigo-300">
                {t.teacherShare(revenueSplit.teacherCommissionRate)}
              </div>
              <div className="text-xl font-extrabold text-indigo-300 mt-1">
                {formatEGP(revenueSplit.teacherShareRevenue, locale)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">{t.teacherShareHint}</div>
            </div>

            <div>
              <div className="text-2xs uppercase font-bold text-amber-400">{t.uncollected}</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {formatEGP(revenueSplit.uncollectedRevenue, locale)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">
                {t.unpaidStudents(revenueSplit.unpaidStudents)}
              </div>
            </div>
          </div>
        )}

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

        {/* Enrolled Students Table */}
        <div className="flex-1 overflow-y-auto border border-white/5 rounded-2xl bg-[#0A0A0F]/50">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">{t.loading}</div>
          ) : roster.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-white">{t.emptyTitle}</p>
              <p className="text-xs text-slate-400">{t.emptyHint}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-[#181824] text-slate-400 text-xs font-semibold text-start sticky top-0">
                <tr>
                  <th className="px-4 py-3">{t.colStudent}</th>
                  <th className="px-4 py-3">{t.colParentPhone}</th>
                  <th className="px-4 py-3 text-center">{t.colAttendance}</th>
                  <th className="px-4 py-3 text-center">{t.colPayment}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roster.map((student) => {
                  const cleanPhone = student.studentPhone.replace(/\D/g, '');
                  const waUrl = `https://wa.me/${cleanPhone.startsWith('20') ? cleanPhone : '2' + cleanPhone}`;

                  return (
                    <tr key={student.studentId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{student.studentName}</div>
                        <div className="text-2xs text-slate-400">{student.studentEmail}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5"
                          title={t.whatsappTitle}
                        >
                          <span>💬</span> {student.studentPhone}
                        </a>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-[#181824] border border-white/5">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.studentId, 'PRESENT')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              student.sessionStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.present}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.studentId, 'ABSENT')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              student.sessionStatus === 'ABSENT'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.absent}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-[#181824] border border-white/5">
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(student.studentId, true)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              student.isPaidForSession
                                ? 'bg-[#00D4FF] text-[#0A0A0F] font-extrabold shadow-cyan'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.paid(formatEGP(classDetails?.price ?? 0, locale))}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(student.studentId, false)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              !student.isPaidForSession
                                ? 'bg-amber-400 text-slate-950 font-bold shadow-gold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.unpaid}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            {t.close}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveAttendance}
            disabled={saving || roster.length === 0}
            className="px-6 font-bold"
          >
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
