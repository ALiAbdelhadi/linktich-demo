'use client';

import { useState, useEffect } from 'react';
import DashboardAnalyticsSummary from '@/components/analytics/DashboardAnalyticsSummary';
import ClassRosterAttendanceModal from '@/components/operations/ClassRosterAttendanceModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale, useMessages } from '@/i18n/client';
import { formatEGP } from '@/i18n/config';
import { teacherMessages } from '@/i18n/messages/teacher';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface TeacherClassItem {
  classId: string;
  className: string;
  centerName: string;
  totalStudents: number;
  paidStudents: number;
  teacherShareRevenue: number;
  teacherCommissionRate: number;
  centerCommissionRate: number;
}

export default function TeacherDashboardClient() {
  const t = useMessages(teacherMessages);
  const locale = useLocale();
  const [selectedClassIdForRoster, setSelectedClassIdForRoster] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/overview');
      const data = await res.json();
      if (data.success && data.data?.classBreakdowns) {
        setClasses(data.data.classBreakdowns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [refreshKey]);

  return (
    <div className="space-y-8">
      {/* 1. Live Performance & Take-Home Revenue Analytics */}
      <DashboardAnalyticsSummary
        role="TEACHER"
        refreshTrigger={refreshKey}
        onSelectClass={(classId) => setSelectedClassIdForRoster(classId)}
      />

      {/* 2. Interactive Groups Roster */}
      <Card className="border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {t.classes.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.classes.subtitle}
            </p>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">{t.classes.loading}</div>
          ) : classes.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-white">{t.classes.emptyTitle}</p>
              <p className="text-xs text-slate-400">
                {t.classes.emptyText}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-start text-slate-400 font-bold">{t.classes.colName}</TableHead>
                  <TableHead className="text-start text-slate-400 font-bold">{t.classes.colCenter}</TableHead>
                  <TableHead className="text-start text-slate-400 font-bold">{t.classes.colStudents}</TableHead>
                  <TableHead className="text-start text-slate-400 font-bold">{t.classes.colEarnings}</TableHead>
                  <TableHead className="text-start text-slate-400 font-bold">{t.classes.colSplit}</TableHead>
                  <TableHead className="text-end text-slate-400 font-bold">{t.classes.colAction}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.classId} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell className="font-bold text-white">{c.className}</TableCell>
                    <TableCell className="text-slate-300 font-medium">{c.centerName}</TableCell>
                    <TableCell className="text-slate-300">
                      <span className="font-bold text-white">{c.paidStudents}</span> / {c.totalStudents} {t.classes.paid}
                    </TableCell>
                    <TableCell className="font-extrabold text-[#00D4FF]">
                      {formatEGP(c.teacherShareRevenue ?? 0, locale)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-indigo-300">
                      {t.classes.split(c.teacherCommissionRate, c.centerCommissionRate)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedClassIdForRoster(c.classId)}
                        className="text-xs h-8 font-bold"
                      >
                        {t.classes.openRoster}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Class Attendance & Revenue Modal */}
      <ClassRosterAttendanceModal
        classId={selectedClassIdForRoster}
        onClose={() => setSelectedClassIdForRoster(null)}
        onSaved={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
