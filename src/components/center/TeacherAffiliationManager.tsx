'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useMessages } from '@/i18n/client';
import { centerMessages } from '@/i18n/messages/center';

interface TeacherUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AffiliatedTeacher {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  commissionRate: number | null;
  joinedAt: string;
  teacher: {
    id: string;
    subject: string;
    bio: string | null;
    user: TeacherUser;
  };
}

interface DiscoverableTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  bio: string | null;
  currentRelation: {
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
    commissionRate: number | null;
  } | null;
}

export default function TeacherAffiliationManager() {
  const m = useMessages(centerMessages);
  const t = m.teachers;
  const [affiliated, setAffiliated] = useState<AffiliatedTeacher[]>([]);
  const [discoverable, setDiscoverable] = useState<DiscoverableTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'invite'>('current');

  // Form states for sending invite
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [commissionRate, setCommissionRate] = useState('20');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAffiliations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/center/teachers');
      const data = await res.json();
      if (data.success) {
        setAffiliated(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverable = async () => {
    try {
      const res = await fetch('/api/center/teachers?mode=discover');
      const data = await res.json();
      if (data.success) {
        setDiscoverable(data.data);
        if (data.data.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAffiliations();
    fetchDiscoverable();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/center/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          commissionRate: Number(commissionRate) || 0,
          status: 'PENDING',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.sendFailed);
      }

      setMessage({ type: 'success', text: t.sendSuccess });
      fetchAffiliations();
      fetchDiscoverable();
      setActiveTab('current');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.sendError });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (relationId: string, status: 'ACTIVE' | 'TERMINATED') => {
    try {
      const res = await fetch('/api/center/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAffiliations();
        fetchDiscoverable();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{t.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#181824] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'current'
                ? 'bg-[#4A00E0] text-white shadow-indigo'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.tabCurrent(affiliated.length)}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'invite'
                ? 'bg-[#00D4FF] text-[#0A0A0F] shadow-cyan font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.tabInvite}
          </button>
        </div>
      </div>

      <CardContent className="p-6">
        {message && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-xs font-semibold border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* TAB 1: CURRENT AFFILIATED TEACHERS */}
        {activeTab === 'current' && (
          <div>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">{t.loading}</div>
            ) : affiliated.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-semibold text-white">{t.emptyTitle}</p>
                <p className="text-xs text-slate-400">
                  {t.emptyHint}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-start text-slate-400 font-bold">{t.colName}</TableHead>
                    <TableHead className="text-start text-slate-400 font-bold">{t.colSubject}</TableHead>
                    <TableHead className="text-start text-slate-400 font-bold">{t.colPhone}</TableHead>
                    <TableHead className="text-start text-slate-400 font-bold">{t.colShare}</TableHead>
                    <TableHead className="text-start text-slate-400 font-bold">{t.colStatus}</TableHead>
                    <TableHead className="text-end text-slate-400 font-bold">{t.colAction}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliated.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.03]">
                      <TableCell>
                        <div className="font-bold text-white">{item.teacher.user.name}</div>
                        <div className="text-2xs text-slate-400">{item.teacher.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-200">{item.teacher.subject}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {item.teacher.user.phone}
                      </TableCell>
                      <TableCell className="font-extrabold text-[#00D4FF]">
                        {item.commissionRate ? `${item.commissionRate}%` : '20%'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'ACTIVE'
                              ? 'success'
                              : item.status === 'PENDING'
                              ? 'gold'
                              : 'outline'
                          }
                        >
                          {m.status[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end space-x-2 rtl:space-x-reverse">
                        {item.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, 'ACTIVE')}
                            className="text-xs h-8"
                          >
                            {t.accept}
                          </Button>
                        )}
                        {item.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, 'TERMINATED')}
                            className="text-xs h-8 border-white/10 hover:border-red-500/30 hover:text-red-400"
                          >
                            {t.end}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 2: INVITE FORM */}
        {activeTab === 'invite' && (
          <form onSubmit={handleSendInvite} className="bg-[#181824]/60 p-5 rounded-2xl border border-white/5 space-y-4">
            <div>
              <div className="text-sm font-bold text-white">{t.inviteTitle}</div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.inviteHint}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.pickTeacher}
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl text-sm bg-[#12121A] text-white focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
                >
                  {discoverable.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.subject} ({d.phone}){' '}
                      {d.currentRelation
                        ? `[${m.status[d.currentRelation.status] ?? d.currentRelation.status}]`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.shareLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl text-sm bg-[#12121A] text-white focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
                />
                <span className="text-2xs text-slate-400 mt-1 block">
                  {t.shareHint}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('current')}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
              >
                {submitting ? t.sending : t.send}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
