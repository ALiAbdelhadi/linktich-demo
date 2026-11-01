import { defineMessages } from '../config';

// Error messages the API sends back to users. Keys are thrown as AppError('<key>')
// or used as Zod validation messages, and turned into text by errorText().
export const errorMessages = defineMessages({
  ar: {
    // General
    generic: 'حدثت مشكلة. حاول مرة أخرى.',
    invalidInput: 'بعض البيانات غير صحيحة. راجعها وحاول مرة أخرى.',
    missingFields: 'بعض البيانات المطلوبة ناقصة.',
    unauthorized: 'سجّل الدخول أولاً للمتابعة.',
    centerOnly: 'هذه الخطوة متاحة لحسابات السناتر فقط.',
    teacherOnly: 'هذه الخطوة متاحة لحسابات المدرسين فقط.',
    studentOnly: 'هذه الخطوة متاحة لحسابات الطلاب فقط.',
    centersAndTeachersOnly: 'الاشتراكات متاحة للسناتر والمدرسين فقط.',

    // Auth
    emailTaken: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    loginFailed: 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
    signupFailed: 'تعذّر إنشاء الحساب. حاول مرة أخرى.',

    // Records
    centerNotFound: 'لم نجد بيانات السنتر.',
    teacherNotFound: 'لم نجد بيانات المدرس.',
    classNotFound: 'لم نجد هذه المجموعة.',

    // Classes, partnerships and enrollment
    teacherNotPartner: 'هذا المدرس ليس شريكاً نشطاً مع السنتر. أرسل دعوة أولاً وانتظر موافقته.',
    classClosed: 'هذه المجموعة لا تقبل طلاباً جدداً الآن.',
    alreadyEnrolled: 'أنت مشترك في هذه المجموعة بالفعل.',
    classFull: 'هذه المجموعة اكتمل عددها.',

    // Subscription and payment
    subscriptionInactive: 'اشتراكك منتهي أو غير مفعّل. جدّد الاشتراك للمتابعة.',
    paymentFailed: 'تعذّر بدء الدفع. حاول مرة أخرى.',

    // Validation
    nameTooShort: 'يجب أن يكون الاسم حرفين على الأقل.',
    invalidEmail: 'البريد الإلكتروني غير صحيح.',
    invalidPhone: 'رقم الموبايل غير صحيح. اكتبه مثل 01012345678.',
    passwordTooShort: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
    passwordRequired: 'اكتب كلمة المرور.',
    centerNameRequired: 'اكتب اسم السنتر.',
    centerLocationRequired: 'اكتب مكان السنتر أو المحافظة.',
    subjectRequired: 'اكتب المادة التي تدرّسها.',
    classNameRequired: 'اكتب اسم المجموعة.',
    scheduleRequired: 'أضف موعداً واحداً على الأقل.',
    invalidTime: 'الوقت غير صحيح. اكتبه مثل 16:30.',
    invalidPrice: 'السعر لا يمكن أن يكون أقل من صفر.',
  },
  en: {
    // General
    generic: 'Something went wrong. Please try again.',
    invalidInput: 'Some details are not valid. Please check them and try again.',
    missingFields: 'Some required details are missing.',
    unauthorized: 'Please log in to continue.',
    centerOnly: 'Only center accounts can do this.',
    teacherOnly: 'Only teacher accounts can do this.',
    studentOnly: 'Only student accounts can do this.',
    centersAndTeachersOnly: 'Subscriptions are only for centers and teachers.',

    // Auth
    emailTaken: 'An account with this email already exists.',
    invalidCredentials: 'Wrong email or password.',
    loginFailed: "We couldn't log you in. Please try again.",
    signupFailed: "We couldn't create your account. Please try again.",

    // Records
    centerNotFound: "We couldn't find this center.",
    teacherNotFound: "We couldn't find this teacher.",
    classNotFound: "We couldn't find this class.",

    // Classes, partnerships and enrollment
    teacherNotPartner: 'This teacher is not an active partner of your center. Send an invite and wait for them to accept.',
    classClosed: 'This class is not taking new students right now.',
    alreadyEnrolled: 'You are already in this class.',
    classFull: 'This class is full.',

    // Subscription and payment
    subscriptionInactive: 'Your subscription has ended or is not active. Renew it to continue.',
    paymentFailed: "We couldn't start the payment. Please try again.",

    // Validation
    nameTooShort: 'Name must be at least 2 letters.',
    invalidEmail: 'Please enter a valid email.',
    invalidPhone: 'Please enter a valid mobile number, like 01012345678.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordRequired: 'Please enter your password.',
    centerNameRequired: 'Please enter the center name.',
    centerLocationRequired: 'Please enter the center location or governorate.',
    subjectRequired: 'Please enter the subject you teach.',
    classNameRequired: 'Please enter a class name.',
    scheduleRequired: 'Add at least one class time.',
    invalidTime: 'Please enter a valid time, like 16:30.',
    invalidPrice: 'Price cannot be less than zero.',
  },
});
