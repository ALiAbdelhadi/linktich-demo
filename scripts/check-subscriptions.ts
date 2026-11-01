import { SubscriptionService } from '../src/services/subscriptionService';
import { prisma } from '../src/lib/prisma';

async function runCron() {
  console.log('⏰ Running scheduled subscription expiration checker...');
  try {
    const result = await SubscriptionService.checkAndUpdateExpiredSubscriptions();
    console.log('✅ Cron execution finished successfully:');
    console.table(result);
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCron();
