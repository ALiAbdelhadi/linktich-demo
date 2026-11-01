import { PrismaClient, UserRole, SubscriptionStatus, SubscriptionPlan, RelationStatus, BillingCycle, PaymentStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Linktich Egypt...');

  // 1. Create Admin User
  const defaultPasswordHash = '$2a$10$epRsf5.2kXk/3Bf.O7zZeu8wN3K6wM5H8cO1l/Gqf3PzWpLw2mNiu'; // "password123"

  const admin = await prisma.user.upsert({
    where: { email: 'admin@linktich.eg' },
    update: {},
    create: {
      name: 'Linktich Platform Admin',
      email: 'admin@linktich.eg',
      phone: '+201000000001',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  // 2. Create Center Owner & Center
  const centerOwner = await prisma.user.upsert({
    where: { email: 'manager@al-rowad.eg' },
    update: {},
    create: {
      name: 'Ahmed Mansour (Al-Rowad Center)',
      email: 'manager@al-rowad.eg',
      phone: '+201012345678',
      passwordHash: defaultPasswordHash,
      role: UserRole.CENTER,
    },
  });

  const center = await prisma.center.upsert({
    where: { ownerId: centerOwner.id },
    update: {},
    create: {
      ownerId: centerOwner.id,
      name: 'Al-Rowad Educational Center',
      location: 'Dokki, Giza, Egypt',
      phone: '+201012345678',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.CENTER_PRO_MONTHLY,
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Create Teacher & Profile
  const teacherUser = await prisma.user.upsert({
    where: { email: 'dr.tamer.physics@linktich.eg' },
    update: {},
    create: {
      name: 'Mr. Tamer El-Sayed',
      email: 'dr.tamer.physics@linktich.eg',
      phone: '+201123456789',
      passwordHash: defaultPasswordHash,
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      subject: 'Physics (Thanaweya Amma)',
      bio: 'Senior Physics Instructor with 15+ years experience in the Egyptian curriculum.',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.TEACHER_PRO_MONTHLY,
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Link Teacher to Center
  await prisma.centerTeacherRelation.upsert({
    where: {
      centerId_teacherId: {
        centerId: center.id,
        teacherId: teacher.id,
      },
    },
    update: {},
    create: {
      centerId: center.id,
      teacherId: teacher.id,
      status: RelationStatus.ACTIVE,
      commissionRate: 20.00, // 20% center facility cut
    },
  });

  // 5. Create Class / Group
  const physicsClass = await prisma.class.create({
    data: {
      centerId: center.id,
      teacherId: teacher.id,
      name: '3rd Secondary Physics - Advanced Group A',
      schedule: [
        { day: 'Sunday', startTime: '17:00', endTime: '19:30', room: 'Hall 3' },
        { day: 'Wednesday', startTime: '17:00', endTime: '19:30', room: 'Hall 3' },
      ],
      price: 450.00, // 450 EGP / month
      billingCycle: BillingCycle.MONTHLY,
      capacity: 60,
      isActive: true,
    },
  });

  // 6. Create Student User & Enrollment
  const studentUser = await prisma.user.upsert({
    where: { email: 'omar.khalil@student.eg' },
    update: {},
    create: {
      name: 'Omar Khalil',
      email: 'omar.khalil@student.eg',
      phone: '+201234567890',
      passwordHash: defaultPasswordHash,
      role: UserRole.STUDENT,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_classId: {
        studentId: studentUser.id,
        classId: physicsClass.id,
      },
    },
    update: {},
    create: {
      studentId: studentUser.id,
      classId: physicsClass.id,
      paymentStatus: PaymentStatus.PAID,
      attendanceStatus: AttendanceStatus.REGULAR,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
