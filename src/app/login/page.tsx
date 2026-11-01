'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import LanguageToggle from '@/components/LanguageToggle';
import { useMessages } from '@/i18n/client';
import { authMessages } from '@/i18n/messages/auth';
import { commonMessages } from '@/i18n/messages/common';

function LoginForm() {
  const t = useMessages(authMessages).login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.invalidCredentials);
      }

      const targetUrl = callbackUrl || data.redirectTo || '/';
      router.push(targetUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/10 bg-[#12121A]/90 shadow-glass">
      <CardContent className="p-8 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-300 font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.email}
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="dir-ltr text-start"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.password}
            </label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="dir-ltr text-start"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full h-11 text-sm font-bold mt-2 shadow-indigo"
          >
            {loading ? t.submitting : t.submit}
          </Button>
        </form>

        <div className="border-t border-white/5 pt-5 text-center">
          <p className="text-xs text-slate-400">
            {t.noAccount}{' '}
            <Link href="/signup" className="font-bold text-[#00D4FF] hover:underline">
              {t.signupLink}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const t = useMessages(authMessages).login;
  const common = useMessages(commonMessages);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-32 right-1/3 w-[500px] h-[500px] bg-[#4A00E0]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-[#00D4FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-4 end-4 z-20">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A00E0] to-[#00D4FF] p-[1.5px] shadow-indigo mx-auto">
          <div className="w-full h-full bg-[#0A0A0F] rounded-[14px] flex items-center justify-center font-extrabold text-white text-2xl">
            {common.brandInitial}
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{t.title}</h2>
        <p className="text-xs text-slate-400">{t.subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">{common.loading}</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
