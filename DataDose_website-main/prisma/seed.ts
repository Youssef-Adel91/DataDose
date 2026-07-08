import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ─── Demo credentials — must stay in sync with lib/auth.ts DEMO_USERS ─────────
// and app/login/page.tsx DEMO_ACCOUNTS
const DEMO_USERS = [
  {
    name: 'Hospital Administrator',
    email: 'admin@datadose.demo',
    password: 'Demo@Admin2026',
    role: 'ADMIN' as const,
  },
  {
    name: 'Dr. Alex Care',
    email: 'physician@datadose.demo',
    password: 'Demo@Physician2026',
    role: 'PHYSICIAN' as const,
  },
  {
    name: 'Pharm. Sarah Dose',
    email: 'pharmacist@datadose.demo',
    password: 'Demo@Pharmacist2026',
    role: 'PHARMACIST' as const,
  },
  {
    name: 'John Patient',
    email: 'patient@datadose.demo',
    password: 'Demo@Patient2026',
    role: 'PATIENT' as const,
    withEHR: true,
  },
];

async function main() {
  console.log('\n🌱  Starting DataDose database seed…\n');

  // ─── 0. Super Admin — Platform Owner ──────────────────────────────────────
  const superAdminPwd = await bcrypt.hash('SuperAdmin@DataDose2026!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'youssef@datadose.ai' },
    update: { role: 'SUPER_ADMIN', status: 'APPROVED' },
    create: {
      email: 'youssef@datadose.ai',
      name: 'Youssef Super Admin',
      password: superAdminPwd,
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
    },
  });

  // ─── 1–4. Demo Accounts (synced with auth.ts & login page) ────────────────
  const seeded = [];
  for (const demo of DEMO_USERS) {
    const hashedPwd = await bcrypt.hash(demo.password, 10);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { status: 'APPROVED', name: demo.name, role: demo.role },
      create: {
        email: demo.email,
        name: demo.name,
        password: hashedPwd,
        role: demo.role,
        status: 'APPROVED',
        ...((demo as any).withEHR
          ? {
              PatientEHR: {
                create: {
                  chronicConditions: ['Chronic Kidney Disease', 'Peptic Ulcer'],
                  allergies: ['Penicillin'],
                },
              },
            }
          : {}),
      },
    });
    seeded.push({ user, demo });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('✅  Database Seeding Completed Successfully!\n');
  console.log('👑  Super Admin :', superAdmin.email, '[SUPER_ADMIN] — password: SuperAdmin@DataDose2026!');
  console.log('');
  console.log('🎭  Demo Accounts (for login page & testing):');
  for (const { user, demo } of seeded) {
    const icon =
      user.role === 'ADMIN' ? '🛡️ ' :
      user.role === 'PHYSICIAN' ? '🩺' :
      user.role === 'PHARMACIST' ? '💊' : '🏥';
    console.log(`  ${icon}  ${user.role.padEnd(12)} : ${user.email.padEnd(32)} password: ${demo.password}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌  Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
