// ==============================================================================
// Linktich Domain & Database TypeScript Type Definitions
// ==============================================================================

export type UserRole = 'ADMIN' | 'CENTER' | 'TEACHER' | 'STUDENT';

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'EXPIRED'
  | 'INACTIVE';

export type SubscriptionPlan =
  | 'FREE_TRIAL'
  | 'CENTER_BASIC_MONTHLY'
  | 'CENTER_BASIC_YEARLY'
  | 'CENTER_PRO_MONTHLY'
  | 'CENTER_PRO_YEARLY'
  | 'CENTER_ENTERPRISE'
  | 'TEACHER_BASIC_MONTHLY'
  | 'TEACHER_BASIC_YEARLY'
  | 'TEACHER_PRO_MONTHLY'
  | 'TEACHER_PRO_YEARLY';

export type RelationStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export type BillingCycle = 'PER_SESSION' | 'MONTHLY';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'EXEMPT';

export type AttendanceStatus =
  | 'REGISTERED'
  | 'REGULAR'
  | 'AT_RISK'
  | 'DROPPED';

export interface ClassScheduleSlot {
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // HH:mm format (e.g. "16:00")
  endTime: string;   // HH:mm format (e.g. "18:00")
  room?: string;     // Tutoring room identifier inside the center
}

// ------------------------------------------------------------------------------
// Entity Interfaces
// ------------------------------------------------------------------------------

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string; // Normalized Egyptian phone (e.g. +201012345678)
  passwordHash?: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Center {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  phone?: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionCurrentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  id: string;
  userId: string;
  subject: string;
  bio?: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionCurrentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CenterTeacherRelation {
  id: string;
  centerId: string;
  teacherId: string;
  status: RelationStatus;
  commissionRate?: number | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  centerId: string;
  teacherId: string;
  name: string;
  schedule: ClassScheduleSlot[];
  price: number; // In Egyptian Pounds (EGP)
  billingCycle: BillingCycle;
  capacity?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  paymentStatus: PaymentStatus;
  attendanceStatus: AttendanceStatus;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface SessionAttendance {
  id: string;
  enrollmentId: string;
  classId: string;
  studentId: string;
  sessionDate: Date;
  status: SessionAttendanceStatus;
  isPaid: boolean;
  amountPaid?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueSplitAnalytics {
  classId: string;
  className: string;
  teacherName: string;
  centerName: string;
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  pricePerStudent: number;
  billingCycle: BillingCycle;
  grossRevenue: number;
  centerCommissionRate: number; // e.g. 20 (%)
  teacherCommissionRate: number; // e.g. 80 (%)
  centerShareRevenue: number;
  teacherShareRevenue: number;
  uncollectedRevenue: number;
}

export interface DashboardAnalyticsOverview {
  totalActiveStudents: number;
  totalActiveClasses: number;
  totalMonthlyRevenue: number;
  centerShareTotal: number;
  teacherShareTotal: number;
  averageAttendanceRate: number;
  classBreakdowns: RevenueSplitAnalytics[];
}

// ------------------------------------------------------------------------------
// Relational Aggregate Types (DTOs)
// ------------------------------------------------------------------------------

export interface ClassWithDetails extends Class {
  center: Center;
  teacher: Teacher & { user: Pick<User, 'name' | 'email' | 'phone'> };
  _count?: {
    enrollments: number;
  };
}

export interface EnrollmentWithDetails extends Enrollment {
  student: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  class: ClassWithDetails;
}

export interface CenterWithTeachers extends Center {
  teacherRelations: (CenterTeacherRelation & {
    teacher: Teacher & { user: Pick<User, 'id' | 'name' | 'email' | 'phone'> };
  })[];
}
