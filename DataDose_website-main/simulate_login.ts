/**
 * simulate_login.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a full NextAuth credentials login by:
 *   1. Fetching the CSRF token (required by NextAuth for POST)
 *   2. POSTing credentials to /api/auth/callback/credentials
 *   3. Printing the exact response so we know EXACTLY where the chain breaks
 *
 * Run with:  npx tsx simulate_login.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'youssef@datadose.ai';
const TEST_PASSWORD = 'password123';

async function simulateLogin() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  DataDose Auth Simulation — Login Flow Trace');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Target  : ${BASE_URL}`);
  console.log(`  Email   : ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log('───────────────────────────────────────────────────────\n');

  // ── Step 1: Get CSRF token ────────────────────────────────────────────────
  let csrfToken = '';
  let cookiesFromCsrf = '';

  try {
    console.log('[STEP 1] Fetching CSRF token from /api/auth/csrf ...');
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    console.log(`         → Status: ${csrfRes.status} ${csrfRes.statusText}`);

    if (!csrfRes.ok) {
      console.error('         ✖ CSRF endpoint failed. Is the Next.js server running?');
      process.exit(1);
    }

    const csrfData = await csrfRes.json() as { csrfToken?: string };
    csrfToken = csrfData.csrfToken ?? '';
    cookiesFromCsrf = csrfRes.headers.get('set-cookie') ?? '';

    console.log(`         ✔ CSRF Token: ${csrfToken}`);
    console.log(`         ✔ Cookies   : ${cookiesFromCsrf.slice(0, 120)}...\n`);
  } catch (err) {
    console.error('[STEP 1] ✖ NETWORK ERROR — Cannot reach localhost:3000');
    console.error('         Is "npm run dev" running?\n', err);
    process.exit(1);
  }

  // ── Step 2: POST credentials ──────────────────────────────────────────────
  console.log('[STEP 2] POSTing credentials to /api/auth/callback/credentials ...');

  const body = new URLSearchParams({
    csrfToken,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    callbackUrl: `${BASE_URL}/dashboard/physician`,
    json: 'true',
  });

  let signInRes: Response;
  try {
    signInRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookiesFromCsrf,
      },
      redirect: 'manual',
      body: body.toString(),
    });
  } catch (err) {
    console.error('[STEP 2] ✖ NETWORK ERROR during credential POST\n', err);
    process.exit(1);
  }

  console.log(`         → Status     : ${signInRes.status} ${signInRes.statusText}`);
  console.log(`         → Location   : ${signInRes.headers.get('location') ?? 'none'}`);
  console.log(`         → Set-Cookie : ${(signInRes.headers.get('set-cookie') ?? 'none').slice(0, 120)}`);

  let rawBody = '';
  try {
    rawBody = await signInRes.text();
  } catch {}
  console.log(`         → Body       : ${rawBody.slice(0, 500)}`);

  // ── Step 3: Interpret the result ──────────────────────────────────────────
  console.log('\n───────────────────────────────────────────────────────');
  console.log('  DIAGNOSIS');
  console.log('───────────────────────────────────────────────────────');

  const location = signInRes.headers.get('location') ?? '';

  if (signInRes.status === 302 && location.includes('error')) {
    const url = new URL(location, BASE_URL);
    const errorCode = url.searchParams.get('error');
    console.log(`\n  ✖ AUTH FAILED — NextAuth redirected with error: "${errorCode}"`);
    console.log('  ↳ Possible causes:');
    console.log('    • User does not exist in DB (check Prisma seed)');
    console.log('    • Password hash does not match');
    console.log('    • User status is PENDING or REJECTED');
    console.log('    • Prisma DB connection error (check B_ERR in server logs)');
  } else if (signInRes.status === 302 && !location.includes('error')) {
    console.log(`\n  ✔ AUTH SUCCEEDED — Redirected to: ${location}`);
    console.log('  ↳ Login works! Check middleware if dashboard is inaccessible.');
  } else if (signInRes.status === 200) {
    console.log('\n  ✔ AUTH SUCCEEDED (JSON mode) — Body:', rawBody.slice(0, 200));
  } else {
    console.log(`\n  ✖ UNEXPECTED STATUS: ${signInRes.status}`);
    console.log('  ↳ This may indicate a server crash or 500 error.');
    console.log('  ↳ Check the Next.js dev server terminal for error output.');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

simulateLogin().catch((err) => {
  console.error('Unhandled error in simulateLogin:', err);
  process.exit(1);
});
