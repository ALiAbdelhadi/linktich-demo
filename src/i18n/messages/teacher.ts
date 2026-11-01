import { defineMessages } from '../config';

export const teacherMessages = defineMessages({
  ar: {
    page: {
      portal: 'بوابة المدرس',
      subtitle: 'تابع الحصص والحضور وصافي دخلك',
      title: 'لوحة تحكم المدرس',
      planBadge: '★ باقة المدرس نشطة',
      welcome: (name: string) =>
        `مرحباً بك يا أستاذ ${name}. من هنا تسجل حضور الطلاب وغيابهم، وتتابع المدفوعات، وتعرف صافي أرباحك في كل سنتر.`,
    },
    classes: {
      title: 'مجموعاتي',
      subtitle: 'المواعيد وكشوف الحضور ونصيبك من الإيراد',
      loading: 'جارٍ تحميل مجموعاتك...',
      emptyTitle: 'لا توجد مجموعات نشطة حالياً',
      emptyText: 'السنتر الذي تعمل معه ينشئ المجموعات ويضيفك كمدرس فيها.',
      colName: 'المجموعة',
      colCenter: 'السنتر',
      colStudents: 'الطلاب',
      colEarnings: 'صافي ربحي',
      colSplit: 'تقسيم الإيراد',
      colAction: 'الإجراء',
      paid: 'مدفوع',
      split: (teacher: number, center: number) => `${teacher}% مدرس / ${center}% سنتر`,
      openRoster: 'كشف الحضور والمدفوعات ←',
    },
  },
  en: {
    page: {
      portal: 'Teacher portal',
      subtitle: 'Track sessions, attendance and your net income',
      title: 'Teacher dashboard',
      planBadge: '★ Teacher plan active',
      welcome: (name: string) =>
        `Welcome, ${name}. Here you can mark attendance, follow payments, and see your net earnings at each center.`,
    },
    classes: {
      title: 'My classes',
      subtitle: 'Schedules, attendance sheets and your share of revenue',
      loading: 'Loading your classes...',
      emptyTitle: 'No active classes yet',
      emptyText: 'The center you work with creates classes and adds you as the teacher.',
      colName: 'Class',
      colCenter: 'Center',
      colStudents: 'Students',
      colEarnings: 'My net earnings',
      colSplit: 'Revenue split',
      colAction: 'Action',
      paid: 'paid',
      split: (teacher: number, center: number) => `${teacher}% teacher / ${center}% center`,
      openRoster: 'Attendance and payments →',
    },
  },
});
