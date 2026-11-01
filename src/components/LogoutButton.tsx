'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/i18n/client';
import { commonMessages } from '@/i18n/messages/common';

export default function LogoutButton() {
  const router = useRouter();
  const t = useMessages(commonMessages);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs border-white/10 hover:border-red-500/40 hover:text-red-400 bg-white/5"
    >
      {loading ? t.loggingOut : t.logout}
    </Button>
  );
}
