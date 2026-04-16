import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── 0. Super Admin — Platform Owner ──────────────────────────────────────
  // This is the only account that can elevate users to ADMIN role.
  const superAdmin = await prisma.user.upsert({
    where: { email: 'youssef@datadose.ai' },
    update: { role: 'SUPER_ADMIN', status: 'APPROVED' },
    create: {
      email: 'youssef@datadose.ai',
      name: 'Youssef Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
    },
  });

  // ─── 1. Physician Profile ──────────────────────────────────────────────────
  const physician = await prisma.user.upsert({
    where: { email: 'dr@datadose.ai' },
    update: { status: 'APPROVED' },
    create: {
      email: 'dr@datadose.ai',
      name: 'Dr. Youssef',
      password: hashedPassword,
      role: 'PHYSICIAN',
      status: 'APPROVED',
    },
  });

  // ─── 2. Pharmacist Profile ─────────────────────────────────────────────────
  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharm@datadose.ai' },
    update: { status: 'APPROVED' },
    create: {
      email: 'pharm@datadose.ai',
      name: 'Ahmed Pharm',
      password: hashedPassword,
      role: 'PHARMACIST',
      status: 'APPROVED',
    },
  });

  // ─── 3. Mock Admin ─────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@datadose.ai' },
    update: { status: 'APPROVED' },
    create: {
      email: 'admin@datadose.ai',
      name: 'DataDose Admin',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  // ─── 4. Patient & Critical EHR Matrix ─────────────────────────────────────
  const patient = await prisma.user.upsert({
    where: { email: 'sara@datadose.ai' },
    update: { status: 'APPROVED' },
    create: {
      email: 'sara@datadose.ai',
      name: 'Sara Patient',
      password: hashedPassword,
      role: 'PATIENT',
      status: 'APPROVED',
      PatientEHR: {
        create: {
          chronicConditions: ['Chronic Kidney Disease', 'Peptic Ulcer'],
          allergies: ['Penicillin'],
        },
      },
    },
  });

  console.log('\n✅ Database Seeding Completed Successfully!\n');
  console.log('👑 Super Admin :', superAdmin.email, `[${superAdmin.role}]`);
  console.log('🛡️  Admin       :', admin.email, `[${admin.role}]`);
  console.log('🩺 Physician   :', physician.email, `[${physician.role}]`);
  console.log('💊 Pharmacist  :', pharmacist.email, `[${pharmacist.role}]`);
  console.log('🏥 Patient EHR  :', patient.email, '| Allergies: Penicillin | Condition: CKD');
}

main()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
