'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import { useMessages } from '@/i18n/client';
import { authMessages } from '@/i18n/messages/auth';
import { commonMessages } from '@/i18n/messages/common';

type UserRole = 'CENTER' | 'TEACHER' | 'STUDENT';

export default function SignUpPage() {
  const router = useRouter();
  const t = useMessages(authMessages).signup;
  const common = useMessages(commonMessages);

  const [role, setRole] = useState<UserRole>('STUDENT');

  // Preselect the role from links like /signup?role=CENTER
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('role')?.toUpperCase();
    if (fromUrl === 'CENTER' || fromUrl === 'TEACHER' || fromUrl === 'STUDENT') {
      setRole(fromUrl);
    }
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Center-specific fields
  const [centerName, setCenterName] = useState('');
  const [centerLocation, setCenterLocation] = useState('');

  // Teacher-specific fields
  const [subject, setSubject] = useState('');
  const [bio, setBio] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        phone,
        password,
        role,
      };

      if (role === 'CENTER') {
        payload.centerName = centerName;
        payload.centerLocation = centerLocation;
      } else if (role === 'TEACHER') {
        payload.subject = subject;
        payload.bio = bio;
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.failed);
      }

      router.push(data.redirectTo || '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.failedRetry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-32 right-1/3 w-[500px] h-[500px] bg-[#4A00E0]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-[#00D4FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-4 end-4 z-20">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1.5px] shadow-indigo mx-auto">
          <div className="w-full h-full bg-[#0A0A0F] rounded-[14px] flex items-center justify-center font-extrabold text-white text-2xl">
            {common.brandInitial}
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{t.title}</h2>
        <p className="text-xs text-slate-400">{t.subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <Card className="border-white/10 bg-[#12121A]/90 shadow-glass">
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-300 font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {t.stepRole} <span className="text-[#00D4FF]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CENTER')}
                    className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                      role === 'CENTER'
                        ? 'border-[#00D4FF] bg-[#00D4FF]/10 ring-1 ring-[#00D4FF] shadow-cyan'
                        : 'border-white/10 bg-[#181824] hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-white text-sm">{t.roles.center}</div>
                    <div className="text-2xs text-slate-400 mt-1">{t.roles.centerHint}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                      role === 'TEACHER'
                        ? 'border-[#4A00E0] bg-[#4A00E0]/15 ring-1 ring-[#4A00E0] shadow-indigo'
                        : 'border-white/10 bg-[#181824] hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-white text-sm">{t.roles.teacher}</div>
                    <div className="text-2xs text-slate-400 mt-1">{t.roles.teacherHint}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                      role === 'STUDENT'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                        : 'border-white/10 bg-[#181824] hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-white text-sm">{t.roles.student}</div>
                    <div className="text-2xs text-slate-400 mt-1">{t.roles.studentHint}</div>
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                <div className="font-bold text-xs text-slate-300">
                  {t.stepDetails}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t.name}</label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t.email}</label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {t.phone}
                    </label>
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t.password}</label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </div>
              </div>

              {/* Role-Specific Additional Fields */}
              {role === 'CENTER' && (
                <div className="border-t border-white/5 pt-5 space-y-4 bg-[#181824]/50 p-4 rounded-xl border border-white/5">
                  <div className="font-bold text-xs text-[#00D4FF]">
                    {t.stepCenter}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.centerName}</label>
                    <Input
                      type="text"
                      required
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder={t.centerNamePlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.centerLocation}
                    </label>
                    <Input
                      type="text"
                      required
                      value={centerLocation}
                      onChange={(e) => setCenterLocation(e.target.value)}
                      placeholder={t.centerLocationPlaceholder}
                    />
                  </div>
                </div>
              )}

              {role === 'TEACHER' && (
                <div className="border-t border-white/5 pt-5 space-y-4 bg-[#181824]/50 p-4 rounded-xl border border-white/5">
                  <div className="font-bold text-xs text-indigo-300">
                    {t.stepTeacher}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.subject}
                    </label>
                    <Input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t.subjectPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.bio}
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t.bioPlaceholder}
                      className="w-full px-3.5 py-2 border border-white/10 rounded-xl text-sm bg-[#12121A] text-white focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full h-11 text-sm font-bold shadow-indigo"
              >
                {loading ? t.submitting : t.submit}
              </Button>
            </form>

            <div className="border-t border-white/5 pt-5 text-center">
              <p className="text-xs text-slate-400">
                {t.haveAccount}{' '}
                <Link href="/login" className="font-bold text-[#00D4FF] hover:underline">
                  {t.loginLink}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
