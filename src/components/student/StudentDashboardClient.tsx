'use client';

import { useState } from 'react';
import BrowseClasses from './BrowseClasses';
import MyEnrollmentsList from './MyEnrollmentsList';
import { useMessages } from '@/i18n/client';
import { studentMessages } from '@/i18n/messages/student';

export default function StudentDashboardClient() {
  const t = useMessages(studentMessages);
  const [activeTab, setActiveTab] = useState<'browse' | 'enrolled'>('browse');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEnrollmentSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 bg-[#12121A] p-1.5 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'browse'
              ? 'bg-gradient-to-r from-[#4A00E0] to-[#5E17EB] text-white shadow-indigo'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.tabs.browse}
        </button>

        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'enrolled'
              ? 'bg-[#00D4FF] text-[#0A0A0F] shadow-cyan font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.tabs.enrolled}
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === 'browse' ? (
        <BrowseClasses onEnrollmentSuccess={handleEnrollmentSuccess} />
      ) : (
        <MyEnrollmentsList refreshTrigger={refreshKey} />
      )}
    </div>
  );
}
