// ==============================================================================
// Zod Validation Schemas for Linktich SaaS Platform
// Handles request payload validation and domain constraints
// ==============================================================================

import { z } from 'zod';

// Egyptian mobile number validation regex (+2010xxxxxxxx, 010xxxxxxxx, etc.)
export const egyptianPhoneRegex = /^(?:\+20|0020|0)?1[0125][0-9]{8}$/;

// Enums
export const UserRoleSchema = z.enum(['ADMIN', 'CENTER', 'TEACHER', 'STUDENT']);

export const SubscriptionStatusSchema = z.enum([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'EXPIRED',
  'INACTIVE',
]);

export const SubscriptionPlanSchema = z.enum([
  'FREE_TRIAL',
  'CENTER_BASIC_MONTHLY',
  'CENTER_BASIC_YEARLY',
  'CENTER_PRO_MONTHLY',
  'CENTER_PRO_YEARLY',
  'CENTER_ENTERPRISE',
  'TEACHER_BASIC_MONTHLY',
  'TEACHER_BASIC_YEARLY',
  'TEACHER_PRO_MONTHLY',
  'TEACHER_PRO_YEARLY',
]);

export const RelationStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
]);

export const BillingCycleSchema = z.enum(['PER_SESSION', 'MONTHLY']);

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'OVERDUE',
  'REFUNDED',
  'EXEMPT',
]);

export const AttendanceStatusSchema = z.enum([
  'REGISTERED',
  'REGULAR',
  'AT_RISK',
  'DROPPED',
]);

export const ScheduleSlotSchema = z.object({
  day: z.enum([
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'invalidTime'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'invalidTime'),
  room: z.string().optional(),
});

// ------------------------------------------------------------------------------
// Entity Input Schemas
// ------------------------------------------------------------------------------

// ------------------------------------------------------------------------------
// Authentication Input Schemas
// ------------------------------------------------------------------------------

export const SignUpSchema = z.object({
  name: z.string().min(2, 'nameTooShort').max(255),
  email: z.string().email('invalidEmail').max(255),
  phone: z
    .string()
    .regex(egyptianPhoneRegex, 'invalidPhone'),
  password: z.string().min(8, 'passwordTooShort'),
  role: z.enum(['CENTER', 'TEACHER', 'STUDENT']),
  // Role specific optional fields:
  centerName: z.string().min(2, 'centerNameRequired').max(255).optional(),
  centerLocation: z.string().min(3, 'centerLocationRequired').max(255).optional(),
  subject: z.string().min(2, 'subjectRequired').max(120).optional(),
  bio: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'CENTER') {
    if (!data.centerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'centerNameRequired',
        path: ['centerName'],
      });
    }
    if (!data.centerLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'centerLocationRequired',
        path: ['centerLocation'],
      });
    }
  }
  if (data.role === 'TEACHER') {
    if (!data.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'subjectRequired',
        path: ['subject'],
      });
    }
  }
});

export const LoginSchema = z.object({
  email: z.string().email('invalidEmail'),
  password: z.string().min(1, 'passwordRequired'),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'nameTooShort').max(255),
  email: z.string().email('invalidEmail').max(255),
  phone: z
    .string()
    .regex(egyptianPhoneRegex, 'invalidPhone'),
  role: UserRoleSchema.default('STUDENT'),
  avatarUrl: z.string().url().optional().nullable(),
});

export const CreateCenterSchema = z.object({
  ownerId: z.string().uuid('Invalid owner UUID'),
  name: z.string().min(2, 'centerNameRequired').max(255),
  location: z.string().min(3, 'centerLocationRequired').max(255),
  phone: z.string().regex(egyptianPhoneRegex, 'invalidPhone').optional().nullable(),
  subscriptionPlan: SubscriptionPlanSchema.default('FREE_TRIAL'),
});

export const CreateTeacherSchema = z.object({
  userId: z.string().uuid('Invalid user UUID'),
  subject: z.string().min(2, 'subjectRequired').max(120),
  bio: z.string().max(1000).optional().nullable(),
  subscriptionPlan: SubscriptionPlanSchema.default('FREE_TRIAL'),
});

export const LinkCenterTeacherSchema = z.object({
  centerId: z.string().uuid('Invalid Center UUID'),
  teacherId: z.string().uuid('Invalid Teacher UUID'),
  status: RelationStatusSchema.default('ACTIVE'),
  commissionRate: z.number().min(0).max(100).optional().default(0),
});

export const CreateClassSchema = z.object({
  centerId: z.string().uuid('Invalid Center UUID'),
  teacherId: z.string().uuid('Invalid Teacher UUID'),
  name: z.string().min(2, 'classNameRequired').max(255),
  schedule: z.array(ScheduleSlotSchema).min(1, 'scheduleRequired'),
  price: z.number().nonnegative('invalidPrice'),
  billingCycle: BillingCycleSchema.default('MONTHLY'),
  capacity: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const CreateEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid Student UUID'),
  classId: z.string().uuid('Invalid Class UUID'),
  paymentStatus: PaymentStatusSchema.default('PENDING'),
  attendanceStatus: AttendanceStatusSchema.default('REGISTERED'),
});
