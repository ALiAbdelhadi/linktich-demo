import { defineMessages } from '../config';

// Words used across the whole app. Area-specific text lives in its own file.
export const commonMessages = defineMessages({
  ar: {
    brand: 'لينكتك',
    brandInitial: 'ل',
    tagline: 'إدارة السناتر والمدرسين في مكان واحد',
    country: 'مصر',
    switchLanguage: 'English',
    switchLanguageLabel: 'Switch to English',
    logout: 'تسجيل الخروج',
    loggingOut: 'جارٍ تسجيل الخروج...',
    loading: 'جارٍ التحميل...',
    retry: 'حاول مرة أخرى',
    cancel: 'إلغاء',
    close: 'إغلاق',
    save: 'حفظ',
    genericError: 'حدثت مشكلة. حاول مرة أخرى.',
  },
  en: {
    brand: 'Linktich',
    brandInitial: 'L',
    tagline: 'Run your centers and teachers in one place',
    country: 'Egypt',
    switchLanguage: 'العربية',
    switchLanguageLabel: 'التبديل إلى العربية',
    logout: 'Log out',
    loggingOut: 'Logging out...',
    loading: 'Loading...',
    retry: 'Try again',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    genericError: 'Something went wrong. Please try again.',
  },
});
