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
import { useLocale, useMessages } from '@/i18n/client';
import { formatEGP, formatNumber } from '@/i18n/config';
import { centerMessages } from '@/i18n/messages/center';

interface ClassItem {
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
  _count?: { enrollments: number };
  teacher: {
    user: {
      name: string;
    };
  };
}

interface CenterClassesListProps {
  refreshTrigger: number;
  onOpenCreateModal: () => void;
  onSelectClass?: (classId: string) => void;
}

export default function CenterClassesList({
  refreshTrigger,
  onOpenCreateModal,
  onSelectClass,
}: CenterClassesListProps) {
  const t = useMessages(centerMessages);
  const locale = useLocale();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/classes');
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
    fetchClasses();
  }, [refreshTrigger]);

  return (
    <Card className="border-white/10 overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{t.classes.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.classes.subtitle}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateModal}
          className="text-xs font-bold"
        >
          {t.classes.add}
        </Button>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">{t.classes.loading}</div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-white">{t.classes.emptyTitle}</p>
            <p className="text-xs text-slate-400">
              {t.classes.emptyHint}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colName}</TableHead>
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colTeacher}</TableHead>
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colSchedule}</TableHead>
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colSeats}</TableHead>
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colPrice}</TableHead>
                <TableHead className="text-start text-slate-400 font-bold">{t.classes.colBilling}</TableHead>
                <TableHead className="text-end text-slate-400 font-bold">{t.classes.colAction}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="font-bold text-white">{c.name}</TableCell>
                  <TableCell className="text-slate-300">{c.teacher.user.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {Array.isArray(c.schedule) &&
                        c.schedule.map((s, idx) => (
                          <div key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="text-[#00D4FF]">🗓️</span>
                            <span>{t.days[s.day] ?? s.day} • {s.startTime} - {s.endTime}</span>
                            {s.room && (
                              <span className="text-2xs px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                                {s.room}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-300">
                    <span className="font-bold text-white">{formatNumber(c._count?.enrollments || 0, locale)}</span>
                    {c.capacity
                      ? ` / ${formatNumber(c.capacity, locale)} ${t.classes.students}`
                      : ` ${t.classes.students}`}
                  </TableCell>
                  <TableCell className="font-extrabold text-[#00D4FF]">{formatEGP(c.price, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={c.billingCycle === 'MONTHLY' ? 'default' : 'cyan'}>
                      {c.billingCycle === 'MONTHLY' ? t.classes.monthly : t.classes.perSession}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    {onSelectClass && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectClass(c.id)}
                        className="text-xs h-8 border-white/10 hover:border-[#00D4FF]/40 hover:text-[#00D4FF]"
                      >
                        {t.classes.openRoster} {t.classes.arrow}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
