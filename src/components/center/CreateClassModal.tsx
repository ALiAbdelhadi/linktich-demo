'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessages } from '@/i18n/client';
import { centerMessages } from '@/i18n/messages/center';

interface AffiliatedTeacher {
  id: string;
  status: string;
  teacher: {
    id: string;
    subject: string;
    user: {
      name: string;
      email: string;
    };
  };
}

interface ScheduleSlot {
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  room?: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onClassCreated,
}: CreateClassModalProps) {
  const m = useMessages(centerMessages);
  const t = m.create;
  const [teachers, setTeachers] = useState<AffiliatedTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [price, setPrice] = useState('450');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'PER_SESSION'>('MONTHLY');
  const [capacity, setCapacity] = useState('50');

  // Multi-day schedule builder
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([
    { day: 'Sunday', startTime: '17:00', endTime: '19:30', room: t.defaultRoom },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingTeachers(true);
      fetch('/api/center/teachers')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const active = data.data.filter((x: AffiliatedTeacher) => x.status === 'ACTIVE');
            setTeachers(active);
            if (active.length > 0) {
              setTeacherId(active[0].teacher.id);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTeachers(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSlot = () => {
    setSchedule([
      ...schedule,
      { day: 'Wednesday', startTime: '17:00', endTime: '19:30', room: t.defaultRoom },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (schedule.length <= 1) return;
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    const updated = [...schedule];
    (updated[index] as any)[field] = value;
    setSchedule(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!teacherId) {
        throw new Error(t.pickTeacherError);
      }

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          teacherId,
          schedule,
          price: Number(price),
          billingCycle,
          capacity: capacity ? Number(capacity) : null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.createFailed);
      }

      onClassCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12121A] rounded-2xl shadow-glass border border-white/10 max-w-xl w-full p-6 space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{t.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.subtitle}
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

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.nameLabel} <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
            />
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.teacherLabel} <span className="text-red-400">*</span>
            </label>
            {loadingTeachers ? (
              <div className="text-xs text-slate-400 py-2">{t.loadingTeachers}</div>
            ) : teachers.length === 0 ? (
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-xl text-xs">
                {t.noTeachers}
              </div>
            ) : (
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl text-sm bg-[#181824] text-white focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              >
                {teachers.map((x) => (
                  <option key={x.teacher.id} value={x.teacher.id}>
                    {x.teacher.user.name} ({x.teacher.subject})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pricing & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.priceLabel} <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                required
                min="0"
                step="5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.billingLabel} <span className="text-red-400">*</span>
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl text-sm bg-[#181824] text-white focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              >
                <option value="MONTHLY">{t.billingMonthly}</option>
                <option value="PER_SESSION">{t.billingPerSession}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.capacityLabel}
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          {/* Schedule Builder */}
          <div className="border-t border-white/5 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {t.scheduleLabel}
              </label>
              <button
                type="button"
                onClick={handleAddSlot}
                className="text-xs text-[#00D4FF] hover:text-[#38BDF8] font-bold"
              >
                {t.addDay}
              </button>
            </div>

            {schedule.map((slot, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center bg-[#181824]/60 p-3 rounded-xl border border-white/5"
              >
                <div className="col-span-4 sm:col-span-3">
                  <select
                    value={slot.day}
                    onChange={(e) => handleUpdateSlot(index, 'day', e.target.value)}
                    className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-xs bg-[#12121A] text-white"
                  >
                    <option value="Saturday">{m.days.Saturday}</option>
                    <option value="Sunday">{m.days.Sunday}</option>
                    <option value="Monday">{m.days.Monday}</option>
                    <option value="Tuesday">{m.days.Tuesday}</option>
                    <option value="Wednesday">{m.days.Wednesday}</option>
                    <option value="Thursday">{m.days.Thursday}</option>
                    <option value="Friday">{m.days.Friday}</option>
                  </select>
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <input
                    type="time"
                    required
                    value={slot.startTime}
                    onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                    className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-xs bg-[#12121A] text-white"
                  />
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <input
                    type="time"
                    required
                    value={slot.endTime}
                    onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                    className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-xs bg-[#12121A] text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <input
                    type="text"
                    value={slot.room || ''}
                    placeholder={t.roomPlaceholder}
                    onChange={(e) => handleUpdateSlot(index, 'room', e.target.value)}
                    className="w-full px-2 py-1.5 border border-white/10 rounded-lg text-xs bg-[#12121A] text-white"
                  />
                </div>

                <div className="col-span-12 sm:col-span-1 text-end">
                  {schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      aria-label={t.removeSlot}
                      className="text-red-400 hover:text-red-300 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || teachers.length === 0}
            >
              {submitting ? t.saving : t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
