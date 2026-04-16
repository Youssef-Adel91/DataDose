/**
 * ============================================================
 * DataDose – PrescriptionCreator E2E Test Suite
 * Playwright v1.59.1  |  5 strict test cases
 * ============================================================
 */
import { test, expect, Page } from '@playwright/test';

const PHYSICIAN_URL = 'http://localhost:3000/dashboard/physician';
const CREDS = { email: 'dr@datadose.ai', password: 'password123' };

// ── Helpers ──────────────────────────────────────────────────

/** If redirected to /login, authenticate and wait for dashboard */
async function loginIfNeeded(page: Page) {
  if (page.url().includes('/login')) {
    console.log('  [auth] Login page detected – authenticating...');
    await page.fill('input[type="email"]', CREDS.email);
    await page.fill('input[type="password"]', CREDS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 20_000 });
    console.log('  [auth] ✓ Authenticated');
  }
}

/** Bring the #prescription section fully into view */
async function scrollToPrescription(page: Page) {
  await page.evaluate(() => {
    document.getElementById('prescription')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);
}

/** Exact locators derived from PrescriptionCreator.tsx DOM */
const sel = {
  nameInput:    'input[placeholder="Drug name (e.g., Metformin)"]',
  dosageInput:  'input[placeholder="Dosage (e.g., 500mg)"]',
  freqSelect:   '#prescription select',
  addBtn:       '#prescription button:has(svg.lucide-plus)',
  checkBtn:     '#prescription >> text=Check Interactions',
  submitBtn:    '#prescription >> text=Verify & Submit',
  medList:      '#prescription .space-y-2',
  removeBtn:    (name: string) =>
    `#prescription .space-y-2 >> text=${name} >> .. >> .. >> button`,
  formMessage:  '#prescription p.text-sm',
};

// ── Setup: navigate once per test, mock /api/scan ────────────

test.beforeEach(async ({ page }) => {
  // Intercept NEXT scan endpoint – return a clean 200 with no interactions
  await page.route('/api/scan', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        interactions: [],
        message: 'No interactions found.',
      }),
    });
  });

  await page.goto(PHYSICIAN_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await loginIfNeeded(page);
  await scrollToPrescription(page);
});

// ── TEST 1: Form Validation & State Update (Happy Path) ──────

test('TC-01 | Add Amoxicillin – fields reset & card appears', async ({ page }) => {
  console.log('\n▶ TC-01: Happy Path');

  // Fill the form
  await page.fill(sel.nameInput, 'Amoxicillin');
  await page.fill(sel.dosageInput, '500mg');
  await page.selectOption(sel.freqSelect, '3x daily');

  // Click Add
  await page.click(sel.addBtn);
  await page.waitForTimeout(400);

  // ① Drug card must appear in the list
  const card = page.locator(`#prescription .space-y-2 p.font-semibold`, { hasText: 'Amoxicillin' });
  await expect(card).toBeVisible({ timeout: 3_000 });
  console.log('  ✓ Amoxicillin card is visible in Selected Medications');

  // ② Input fields must be cleared
  await expect(page.locator(sel.nameInput)).toHaveValue('');
  await expect(page.locator(sel.dosageInput)).toHaveValue('');
  const freqVal = await page.locator(sel.freqSelect).inputValue();
  expect(freqVal).toBe('');
  console.log('  ✓ Input fields cleared after add');
});

// ── TEST 2: Duplicate Prevention ─────────────────────────────

test('TC-02 | Duplicate Metformin – blocked with error message', async ({ page }) => {
  console.log('\n▶ TC-02: Duplicate Prevention');

  // Metformin is pre-seeded in the component's initial state
  // Confirm it already exists
  const existing = page.locator(`#prescription .space-y-2 p.font-semibold`, { hasText: 'Metformin' });
  await expect(existing).toBeVisible({ timeout: 3_000 });
  console.log('  ✓ Metformin already in list (pre-seeded)');

  // Count current drug cards
  const beforeCount = await page.locator('#prescription .space-y-2 .rounded-lg').count();

  // Attempt to add Metformin again
  await page.fill(sel.nameInput, 'Metformin');
  await page.fill(sel.dosageInput, '500mg');
  await page.selectOption(sel.freqSelect, '2x daily');
  await page.click(sel.addBtn);
  await page.waitForTimeout(400);

  // ① Card count MUST NOT increase
  const afterCount = await page.locator('#prescription .space-y-2 .rounded-lg').count();
  expect(afterCount).toBe(beforeCount);
  console.log(`  ✓ Card count unchanged: ${beforeCount} → ${afterCount}`);

  // ② An error message MUST be visible
  const msg = page.locator(sel.formMessage);
  await expect(msg).toBeVisible({ timeout: 2_000 });
  const msgText = await msg.textContent();
  expect(msgText?.toLowerCase()).toContain('already');
  console.log(`  ✓ Error message shown: "${msgText?.trim()}"`);
});

// ── TEST 3: Blind Submit Block ────────────────────────────────

test('TC-03 | Submit disabled before interaction check', async ({ page }) => {
  console.log('\n▶ TC-03: Blind Submit Block');

  const submitBtn = page.locator(sel.submitBtn).first();

  // Must be disabled straight after page load (no check has been performed)
  await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
  console.log('  ✓ "Verify & Submit" is disabled before Check Interactions');

  // Add a new drug to confirm that mutation keeps it disabled
  await page.fill(sel.nameInput, 'Aspirin');
  await page.fill(sel.dosageInput, '100mg');
  await page.selectOption(sel.freqSelect, '1x daily');
  await page.click(sel.addBtn);
  await page.waitForTimeout(400);

  await expect(submitBtn).toBeDisabled({ timeout: 2_000 });
  console.log('  ✓ Still disabled after adding a new drug');
});

// ── TEST 4: Interaction Unlock ────────────────────────────────

test('TC-04 | Submit enabled after successful Check Interactions', async ({ page }) => {
  console.log('\n▶ TC-04: Interaction Unlock');

  const submitBtn = page.locator(sel.submitBtn).first();
  const checkBtn  = page.locator(sel.checkBtn).first();

  // Confirm disabled initially
  await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
  console.log('  ✓ Initially disabled');

  // Click Check Interactions (mocked → 200 OK, no interactions)
  await checkBtn.click();

  // Wait for the "Scanning…" spinner to disappear and button to re-enable
  await expect(submitBtn).toBeEnabled({ timeout: 15_000 });
  console.log('  ✓ "Verify & Submit" enabled after successful interaction check');

  // Also assert the button does NOT have cursor-not-allowed styling
  const cursor = await submitBtn.evaluate((el) =>
    window.getComputedStyle(el).cursor
  );
  expect(cursor).not.toBe('not-allowed');
  console.log(`  ✓ Cursor style is "${cursor}" (not "not-allowed")`);
});

// ── TEST 5: Mutation Reset – Security Check ───────────────────

test('TC-05 | Mutation resets submit gate after unlock', async ({ page }) => {
  console.log('\n▶ TC-05: Mutation Reset (Security Check)');

  const submitBtn = page.locator(sel.submitBtn).first();
  const checkBtn  = page.locator(sel.checkBtn).first();

  // Add a second drug so removing one leaves us with >0 drugs
  await page.fill(sel.nameInput, 'Lisinopril');
  await page.fill(sel.dosageInput, '10mg');
  await page.selectOption(sel.freqSelect, '1x daily');
  await page.click(sel.addBtn);
  await page.waitForTimeout(400);

  // First, unlock submit via a successful check
  await checkBtn.click();
  await expect(submitBtn).toBeEnabled({ timeout: 15_000 });
  console.log('  ✓ Submit unlocked after Check Interactions');

  // Sub-test 5A: Remove a drug → Submit must revert to disabled
  const removeButtons = page.locator('#prescription .space-y-2 button');
  const firstRemove = removeButtons.last(); // Remove the one we just added
  await firstRemove.click();
  await page.waitForTimeout(300);

  await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
  console.log('  ✓ Submit re-locked after removing a drug (mutation reset)');

  // Sub-test 5B: Add a new drug → Submit must stay disabled until re-checked
  // First re-unlock so we can test the "add" mutation path
  await checkBtn.click();
  await expect(submitBtn).toBeEnabled({ timeout: 15_000 });
  console.log('  ✓ Re-unlocked for add-mutation sub-test');

  await page.fill(sel.nameInput, 'Lisinopril');
  await page.fill(sel.dosageInput, '10mg');
  await page.selectOption(sel.freqSelect, '1x daily');
  await page.click(sel.addBtn);
  await page.waitForTimeout(400);

  await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
  console.log('  ✓ Submit re-locked after adding a new drug (mutation reset)');
});
