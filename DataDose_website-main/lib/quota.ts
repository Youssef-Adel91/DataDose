import prisma from '@/lib/prisma';

const FALLBACK_LIMIT = 5;
const fallbackDailyUsage = new Map<string, { date: string; count: number }>();

function todayKey() {
  return new Date().toDateString();
}

function fallbackCheck(email: string, increment: boolean) {
  const key = todayKey();
  const existing = fallbackDailyUsage.get(email);
  if (!existing || existing.date !== key) {
    fallbackDailyUsage.set(email, { date: key, count: 0 });
  }
  const current = fallbackDailyUsage.get(email)!;
  if (current.count >= FALLBACK_LIMIT) {
    return { exceeded: true, count: current.count };
  }
  if (increment) {
    current.count += 1;
    fallbackDailyUsage.set(email, current);
  }
  return { exceeded: false, count: current.count };
}

export async function enforceDailyQuota(email: string, increment: boolean) {
  if (!email) return { exceeded: false, source: 'none' as const };

  try {
    const actingUser = await prisma.user.findUnique({ where: { email } });
    if (!actingUser) {
      const fallback = fallbackCheck(email, increment);
      return { exceeded: fallback.exceeded, source: 'fallback' as const };
    }

    if (actingUser.subscriptionTier !== 'FREE') {
      return { exceeded: false, source: 'db' as const };
    }

    const today = new Date();
    const lastScan = new Date(actingUser.lastScanDate);
    let currentCount = actingUser.dailyScansCount;

    if (today.toDateString() !== lastScan.toDateString()) {
      currentCount = 0;
      await prisma.user.update({
        where: { email: actingUser.email },
        data: { dailyScansCount: 0, lastScanDate: today },
      });
    }

    if (currentCount >= FALLBACK_LIMIT) {
      return { exceeded: true, source: 'db' as const };
    }

    if (increment) {
      await prisma.user.update({
        where: { email: actingUser.email },
        data: { dailyScansCount: currentCount + 1, lastScanDate: today },
      });
    }
    return { exceeded: false, source: 'db' as const };
  } catch {
    const fallback = fallbackCheck(email, increment);
    return { exceeded: fallback.exceeded, source: 'fallback' as const };
  }
}
