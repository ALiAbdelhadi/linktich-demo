// ==============================================================================
// Linktich SaaS Monetization & Pricing Tiers Configuration
// Recurring B2B SaaS pricing for Centers & Teachers in Egypt (EGP)
// Students use the platform for free.
// Plan names and features are written in both languages: use plan.name[locale].
// ==============================================================================

import type { Locale } from '@/i18n/config';

type Localized<T> = Record<Locale, T>;

export interface PricingPlan {
  id: string;
  name: Localized<string>;
  targetRole: 'CENTER' | 'TEACHER';
  interval: 'MONTHLY' | 'YEARLY';
  priceEGP: number;
  features: Localized<string[]>;
  maxTeachers?: number;
  maxClasses?: number;
  maxStudents?: number;
}

export const SAAS_PLANS: Record<string, PricingPlan> = {
  // Center Subscription Tiers
  CENTER_BASIC_MONTHLY: {
    id: 'CENTER_BASIC_MONTHLY',
    name: { ar: 'باقة السنتر الأساسية', en: 'Center Starter' },
    targetRole: 'CENTER',
    interval: 'MONTHLY',
    priceEGP: 799,
    features: {
      ar: ['حتى 5 مدرسين', 'حتى 15 مجموعة', 'تسجيل حضور الطلاب', 'تنبيهات الدفع على واتساب'],
      en: ['Up to 5 teachers', 'Up to 15 classes', 'Student attendance', 'WhatsApp payment alerts'],
    },
    maxTeachers: 5,
    maxClasses: 15,
  },
  CENTER_BASIC_YEARLY: {
    id: 'CENTER_BASIC_YEARLY',
    name: { ar: 'باقة السنتر الأساسية (سنوي)', en: 'Center Starter (Yearly)' },
    targetRole: 'CENTER',
    interval: 'YEARLY',
    priceEGP: 7990,
    features: {
      ar: ['حتى 5 مدرسين', 'حتى 15 مجموعة', 'تسجيل حضور الطلاب', 'تنبيهات الدفع على واتساب', 'شهرين مجاناً'],
      en: ['Up to 5 teachers', 'Up to 15 classes', 'Student attendance', 'WhatsApp payment alerts', '2 months free'],
    },
    maxTeachers: 5,
    maxClasses: 15,
  },
  CENTER_PRO_MONTHLY: {
    id: 'CENTER_PRO_MONTHLY',
    name: { ar: 'باقة السنتر برو', en: 'Center Pro' },
    targetRole: 'CENTER',
    interval: 'MONTHLY',
    priceEGP: 1599,
    features: {
      ar: [
        'عدد مدرسين غير محدود',
        'عدد مجموعات غير محدود',
        'الحضور بمسح الباركود',
        'الدفع بفوري والمحافظ الإلكترونية',
        'تقارير الإيرادات والنسب',
      ],
      en: [
        'Unlimited teachers',
        'Unlimited classes',
        'QR code attendance',
        'Fawry and mobile wallet payments',
        'Revenue and split reports',
      ],
    },
  },
  CENTER_PRO_YEARLY: {
    id: 'CENTER_PRO_YEARLY',
    name: { ar: 'باقة السنتر برو (سنوي)', en: 'Center Pro (Yearly)' },
    targetRole: 'CENTER',
    interval: 'YEARLY',
    priceEGP: 15990,
    features: {
      ar: ['كل مميزات باقة برو', 'مدير حساب مخصص لك', 'رصيد رسائل SMS', 'شهرين مجاناً'],
      en: ['Everything in Pro', 'Dedicated account manager', 'SMS credits', '2 months free'],
    },
  },

  // Teacher Subscription Tiers
  TEACHER_BASIC_MONTHLY: {
    id: 'TEACHER_BASIC_MONTHLY',
    name: { ar: 'باقة المدرس الأساسية', en: 'Teacher Solo' },
    targetRole: 'TEACHER',
    interval: 'MONTHLY',
    priceEGP: 299,
    features: {
      ar: ['حتى 3 مجموعات', 'كشف حضور إلكتروني', 'متابعة المصاريف'],
      en: ['Up to 3 classes', 'Digital attendance sheet', 'Fee tracking'],
    },
    maxClasses: 3,
  },
  TEACHER_BASIC_YEARLY: {
    id: 'TEACHER_BASIC_YEARLY',
    name: { ar: 'باقة المدرس الأساسية (سنوي)', en: 'Teacher Solo (Yearly)' },
    targetRole: 'TEACHER',
    interval: 'YEARLY',
    priceEGP: 2990,
    features: {
      ar: ['حتى 3 مجموعات', 'كشف حضور إلكتروني', 'متابعة المصاريف', 'شهرين مجاناً'],
      en: ['Up to 3 classes', 'Digital attendance sheet', 'Fee tracking', '2 months free'],
    },
    maxClasses: 3,
  },
  TEACHER_PRO_MONTHLY: {
    id: 'TEACHER_PRO_MONTHLY',
    name: { ar: 'باقة المدرس برو', en: 'Teacher Pro' },
    targetRole: 'TEACHER',
    interval: 'MONTHLY',
    priceEGP: 599,
    features: {
      ar: [
        'عدد مجموعات غير محدود',
        'التدريس في أكثر من سنتر',
        'تواصل مباشر مع الطلاب',
        'تقارير الأداء ونتائج الامتحانات',
      ],
      en: [
        'Unlimited classes',
        'Teach at more than one center',
        'Message students directly',
        'Performance and exam reports',
      ],
    },
  },
  TEACHER_PRO_YEARLY: {
    id: 'TEACHER_PRO_YEARLY',
    name: { ar: 'باقة المدرس برو (سنوي)', en: 'Teacher Pro (Yearly)' },
    targetRole: 'TEACHER',
    interval: 'YEARLY',
    priceEGP: 5990,
    features: {
      ar: ['كل مميزات باقة برو', 'دعم فني بأولوية', 'صفحة طلاب باسمك وشعارك', 'شهرين مجاناً'],
      en: ['Everything in Teacher Pro', 'Priority support', 'Student page with your own branding', '2 months free'],
    },
  },
};
