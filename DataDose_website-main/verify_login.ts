/**
 * verify_login.ts  — Playwright simulation for DataDose login
 *
 * Asserts:
 *   1. The submit button EXISTS and is VISIBLE (not transparent / hidden)
 *   2. Its background colour is NOT transparent
 *   3. Filling credentials + clicking submits and redirects correctly
 *
 * Run: npx playwright install chromium --with-deps && npx tsx verify_login.ts
 */

import { chromium, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const EMAIL    = 'youssef@datadose.ai';
const PASSWORD = 'password123';

const PASS = (msg: string) => console.log(`  ✔  ${msg}`);
const FAIL = (msg: string) => { console.error(`  ✖  ${msg}`); process.exit(1); };
const LOG  = (msg: string) => console.log(`  →  ${msg}`);

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  DataDose — Playwright Login Verification');
  console.log('══════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  // Capture browser console so we see "1. Button clicked" and "2. NextAuth Response"
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('1.') || text.startsWith('2.')) {
      console.log(`  [BROWSER LOG] ${text}`);
    }
  });

  // ── STEP 1: Navigate to login page ─────────────────────────────────────
  console.log('[STEP 1] Navigating to /login …');
  const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  LOG(`HTTP status: ${response?.status()}`);
  if (response?.status() !== 200) FAIL(`/login returned ${response?.status()}`);
  PASS('Page loaded with 200 OK');

  // ── STEP 2: Assert button EXISTS ────────────────────────────────────────
  console.log('\n[STEP 2] Asserting submit button presence …');
  const btn = page.locator('#login-submit-btn');
  const btnCount = await btn.count();
  if (btnCount === 0) FAIL('Button #login-submit-btn NOT FOUND in DOM');
  PASS(`Button found in DOM (count: ${btnCount})`);

  // ── STEP 3: Assert button is VISIBLE ────────────────────────────────────
  console.log('\n[STEP 3] Asserting button visibility …');
  const isVisible = await btn.isVisible();
  if (!isVisible) FAIL('Button is NOT visible (display:none or opacity:0?)');
  PASS('Button is visible');

  // ── STEP 4: Assert background colour is NOT transparent ─────────────────
  console.log('\n[STEP 4] Asserting button is NOT transparent …');
  const bgColor: string = await page.evaluate(() => {
    const el = document.getElementById('login-submit-btn');
    if (!el) return 'NOT_FOUND';
    return window.getComputedStyle(el).backgroundColor;
  });
  LOG(`Computed background-color: ${bgColor}`);

  if (bgColor === 'NOT_FOUND') FAIL('Button element not found via getElementById');
  if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
    FAIL(`Button is TRANSPARENT: ${bgColor}`);
  }
  PASS(`Button has solid background: ${bgColor}`);

  // ── STEP 5: Assert button text colour is NOT transparent ─────────────────
  console.log('\n[STEP 5] Asserting button text colour …');
  const textColor: string = await page.evaluate(() => {
    const el = document.getElementById('login-submit-btn');
    if (!el) return 'NOT_FOUND';
    return window.getComputedStyle(el).color;
  });
  LOG(`Computed color (text): ${textColor}`);
  if (textColor === 'transparent' || textColor === 'rgba(0, 0, 0, 0)') {
    FAIL(`Button text is transparent: ${textColor}`);
  }
  PASS(`Button text colour is solid: ${textColor}`);

  // ── STEP 6: Fill email ───────────────────────────────────────────────────
  console.log('\n[STEP 6] Filling email …');
  await page.fill('#email', EMAIL);
  const filledEmail = await page.inputValue('#email');
  if (filledEmail !== EMAIL) FAIL(`Email field value mismatch: "${filledEmail}"`);
  PASS(`Email set to: ${filledEmail}`);

  // ── STEP 7: Fill password ────────────────────────────────────────────────
  console.log('\n[STEP 7] Filling password …');
  await page.fill('#password', PASSWORD);
  const filledPwd = await page.inputValue('#password');
  if (filledPwd !== PASSWORD) FAIL('Password field value mismatch');
  PASS('Password field filled');

  // ── STEP 8: Click submit & wait for navigation ───────────────────────────
  console.log('\n[STEP 8] Clicking submit button …');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/login'), {
      timeout: 15_000,
      waitUntil: 'networkidle',
    }),
    btn.click(),
  ]);

  const finalUrl = page.url();
  LOG(`Redirected to: ${finalUrl}`);

  if (finalUrl.includes('/login')) {
    // If still on login, check for error box
    const errorVisible = await page.locator('#login-error-box').isVisible();
    if (errorVisible) {
      const errorText = await page.locator('#login-error-box').innerText();
      FAIL(`Login FAILED — error box visible: "${errorText}"`);
    }
    FAIL('Login did not redirect away from /login (no error box either)');
  }

  if (!finalUrl.includes('/dashboard')) {
    FAIL(`Unexpected redirect target: ${finalUrl}`);
  }

  PASS(`Login SUCCEEDED — redirected to: ${finalUrl}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('  ALL ASSERTIONS PASSED ✔');
  console.log('  Button: Visible, Solid, Clickable');
  console.log(`  Auth  : Redirected to ${finalUrl}`);
  console.log('══════════════════════════════════════════════════\n');

  await browser.close();
}

run().catch((err) => {
  console.error('\n[PLAYWRIGHT ERROR]', err);
  process.exit(1);
});
