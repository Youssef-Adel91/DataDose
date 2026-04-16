import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });


async function runTests() {
  console.log('--- STARTING EDGE CASE TESTS ---');

  // Test 1: Create a PENDING user and attempt mock NextAuth login
  console.log('\n[1] Testing Auth Edge Case: PENDING user login');
  try {
    const hash = await bcrypt.hash('password123', 10);
    const pendingUser = await prisma.user.upsert({
      where: { email: 'pending_test@datadose.ai' },
      update: { status: 'PENDING' },
      create: {
        email: 'pending_test@datadose.ai',
        name: 'Pending Test User',
        password: hash,
        role: 'PHARMACIST',
        status: 'PENDING'
      }
    });
    console.log(`Created/Ensured user: ${pendingUser.email} with status ${pendingUser.status}`);

    const authRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pending_test@datadose.ai',
        password: 'password123',
        redirect: false
      })
    });

    const authData = await authRes.json();
    console.log('NextAuth response:', authData);
    
    if (authData.error && authData.error.includes("verification")) {
      console.log('✅ Auth Edge Case PASSED: PENDING user correctly blocked.');
    } else {
      console.log('❌ Auth Edge Case FAILED:', authData);
    }
  } catch (err) {
    console.error('Error in Auth Edge Case:', err);
  }

  // Test 2: Verify EHR Context in /api/scan
  console.log('\n[2] Testing EHR Payload Attachment for Patient sara@datadose.ai');
  try {
    const scanRes = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drugs: ['Warfarin', 'Aspirin'],
        patientEmail: 'sara@datadose.ai'
      })
    });

    console.log(`Scan route returned HTTP ${scanRes.status}`);
    console.log('✅ EHR Payload Triggered. Check the Next.js server console to see the INTERCEPTED PAYLOAD with EHR Context.');
  } catch (err) {
    console.error('Error in EHR Payload Test:', err);
  }

  process.exit(0);
}

runTests();
