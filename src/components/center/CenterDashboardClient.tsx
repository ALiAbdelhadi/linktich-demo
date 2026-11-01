'use client';

import { useState } from 'react';
import TeacherAffiliationManager from './TeacherAffiliationManager';
import CenterClassesList from './CenterClassesList';
import CreateClassModal from './CreateClassModal';
import DashboardAnalyticsSummary from '@/components/analytics/DashboardAnalyticsSummary';
import ClassRosterAttendanceModal from '@/components/operations/ClassRosterAttendanceModal';

export default function CenterDashboardClient() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClassIdForRoster, setSelectedClassIdForRoster] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* 1. Live Operations & Revenue Analytics Summary */}
      <DashboardAnalyticsSummary
        role="CENTER"
        refreshTrigger={refreshKey}
        onSelectClass={(classId) => setSelectedClassIdForRoster(classId)}
      />

      {/* 2. Teacher Relations & Join Requests Section */}
      <TeacherAffiliationManager />

      {/* 3. Classes & Timetable Section */}
      <CenterClassesList
        refreshTrigger={refreshKey}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSelectClass={(classId) => setSelectedClassIdForRoster(classId)}
      />

      {/* 4. Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={handleDataChanged}
      />

      {/* 5. Class Roster, Attendance & Revenue Split Modal */}
      <ClassRosterAttendanceModal
        classId={selectedClassIdForRoster}
        onClose={() => setSelectedClassIdForRoster(null)}
        onSaved={handleDataChanged}
      />
    </div>
  );
}
