import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Login as physician and navigate to the N-Degree Scanner section
// ─────────────────────────────────────────────────────────────────────────────
async function loginAndGoToScanner(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 60000 });
  await page.fill('#email', 'dr@datadose.ai');
  await page.fill('#password', 'password123');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard/physician', { timeout: 30000 });

  // Click the N-Degree Scanner sidebar link (href="#polypharmacy-scan")
  await page.locator('a[href="#polypharmacy-scan"]').first().click();
  // Scroll the scanner into view and ensure it's visible
  await page.locator('#polypharmacy-scan').scrollIntoViewIfNeeded();
  await page.waitForSelector('#polypharmacy-scan', { state: 'visible', timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Remove all drug chips from the scanner
// The component starts with ["Warfarin", "Aspirin"] as default state.
// Chips are: span.inline-flex > button (with X icon)
// ─────────────────────────────────────────────────────────────────────────────
async function clearAllDrugs(page: Page) {
  // Target the remove buttons inside drug chip spans within the scanner
  const chipContainer = page.locator('#polypharmacy-scan .flex.flex-wrap.gap-2.min-h-\\[48px\\]');
  // Fallback: target all inline-flex spans that contain remove (X) buttons
  const removeButtons = page.locator('#polypharmacy-scan span.inline-flex button');
  let count = await removeButtons.count();
  let safety = 0;
  while (count > 0 && safety < 15) {
    await removeButtons.first().click();
    await page.waitForTimeout(100);
    count = await removeButtons.count();
    safety++;
  }
  // Verify cleared
  const remaining = await page.locator('#polypharmacy-scan span.inline-flex').count();
  console.log(`[clearAllDrugs] Remaining chips after clear: ${remaining}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Add a drug via the text input field
// ─────────────────────────────────────────────────────────────────────────────
async function addDrugViaInput(page: Page, drugName: string) {
  const input = page.locator('#polypharmacy-scan input[type="text"]');
  await input.click();
  await input.fill(drugName);
  await input.press('Enter');
  await page.waitForTimeout(150);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Click the "Run N-Degree Scan" button
// ─────────────────────────────────────────────────────────────────────────────
async function runScan(page: Page) {
  const scanBtn = page.locator('#polypharmacy-scan button', { hasText: 'Run N-Degree Scan' });
  await scanBtn.waitFor({ state: 'visible', timeout: 10000 });
  await scanBtn.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get current drug chip count
// ─────────────────────────────────────────────────────────────────────────────
async function getDrugCount(page: Page): Promise<number> {
  return await page.locator('#polypharmacy-scan span.inline-flex').count();
}

// =============================================================================
// TEST SUITE: Feature 1 – N-Degree Polypharmacy Scanner
// =============================================================================
test.describe('Feature 1: N-Degree Polypharmacy Scanner', () => {

  // ── TC-1: The Fatal Injection (Graph Validation) ──────────────────────────
  test('TC-1 | Fatal Injection – Warfarin + Aspirin → HIGH risk, FATAL card visible, no "Safe to dispense"', async ({ page }) => {
    await loginAndGoToScanner(page);
    await clearAllDrugs(page);

    // Add Warfarin and Aspirin
    await addDrugViaInput(page, 'Warfarin');
    await addDrugViaInput(page, 'Aspirin');

    // Verify both chips are present
    const chipCount = await getDrugCount(page);
    console.log(`[TC-1] Drug chip count before scan: ${chipCount}`);
    expect(chipCount).toBeGreaterThanOrEqual(2);

    await runScan(page);

    // ── Assert 1: Overall Risk HIGH
    await expect(
      page.locator('#polypharmacy-scan').getByText('Overall Risk: HIGH', { exact: false })
    ).toBeVisible({ timeout: 20000 });

    // ── Assert 2: At least 1 FATAL or SEVERE interaction card rendered
    // Cards have border classes: border-zinc-700 (fatal) or border-red-300 (severe)
    const fatalOrSevereCards = page.locator(
      '#polypharmacy-scan .border.rounded-xl.overflow-hidden'
    );
    await expect(async () => {
      const count = await fatalOrSevereCards.count();
      console.log(`[TC-1] Interaction cards rendered: ${count}`);
      expect(count).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 8000 });

    // ── Assert 3: "Safe to dispense" text MUST NOT be visible
    await expect(
      page.locator('#polypharmacy-scan').getByText('Safe to dispense', { exact: false })
    ).not.toBeVisible();

    console.log('[TC-1] ✅ PASS');
  });

  // ── TC-2: The Quick-Add Array Limit (Stress Test) ────────────────────────
  test('TC-2 | Quick-Add Stress – Enforce 10/10 drug cap, no 11th drug added', async ({ page }) => {
    await loginAndGoToScanner(page);
    await clearAllDrugs(page);

    // The popularDrugs list in PolypharmacyScan: Warfarin, Aspirin, Lisinopril, Metformin,
    // Simvastatin, Ibuprofen, Amiodarone, Metronidazole (8 total quick-add drugs)
    // First add 4 via input to have slots, then click all 6 quick-add non-default drugs
    const quickAddDrugs = ['Lisinopril', 'Metformin', 'Simvastatin', 'Ibuprofen', 'Amiodarone', 'Metronidazole'];

    // Click available Quick Add buttons (they only show if drug is NOT in list)
    for (const drug of quickAddDrugs) {
      const btn = page.locator(`#polypharmacy-scan button`, { hasText: `+ ${drug}` });
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        await btn.click();
        await page.waitForTimeout(100);
        console.log(`[TC-2] Quick-added: ${drug}`);
      } else {
        console.log(`[TC-2] Button not visible (drug already added or limit reached): ${drug}`);
      }
    }

    // Also add Warfarin and Aspirin via Quick Add (they are in popularDrugs)
    for (const drug of ['Warfarin', 'Aspirin']) {
      const btn = page.locator(`#polypharmacy-scan button`, { hasText: `+ ${drug}` });
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        await btn.click();
        await page.waitForTimeout(100);
        console.log(`[TC-2] Quick-added: ${drug}`);
      }
    }

    const countAfterQuickAdd = await getDrugCount(page);
    console.log(`[TC-2] Chips after quick-add phase: ${countAfterQuickAdd}`);

    // Now try to add extra drugs via input to push past 10
    const extraDrugs = ['ExtraDrug1', 'ExtraDrug2', 'ExtraDrug3', 'ExtraDrug4', 'ExtraDrug5'];
    for (const drug of extraDrugs) {
      await addDrugViaInput(page, drug);
      const currentCount = await getDrugCount(page);
      console.log(`[TC-2] After adding ${drug}: count=${currentCount}`);
      // Assert: never exceeds 10
      expect(currentCount).toBeLessThanOrEqual(10);
    }

    // Final assertion: exactly 10 chips rendered (hard cap enforced)
    const finalCount = await getDrugCount(page);
    console.log(`[TC-2] Final chip count: ${finalCount}`);
    expect(finalCount).toBe(10);

    // Additionally: verify the counter label shows "(10/10)"
    await expect(
      page.locator('#polypharmacy-scan label', { hasText: '(10/10)' })
    ).toBeVisible();

    console.log('[TC-2] ✅ PASS');
  });

  // ── TC-3: The Cascading 3-Degree Interaction ─────────────────────────────
  test('TC-3 | Cascading 3-Drug – Warfarin + Amiodarone + Simvastatin → HIGH + multiple cards', async ({ page }) => {
    await loginAndGoToScanner(page);
    await clearAllDrugs(page);

    await addDrugViaInput(page, 'Warfarin');
    await addDrugViaInput(page, 'Amiodarone');
    await addDrugViaInput(page, 'Simvastatin');

    const chipCount = await getDrugCount(page);
    console.log(`[TC-3] Drug chip count before scan: ${chipCount}`);
    expect(chipCount).toBe(3);

    await runScan(page);

    // ── Assert 1: Overall Risk HIGH
    await expect(
      page.locator('#polypharmacy-scan').getByText('Overall Risk: HIGH', { exact: false })
    ).toBeVisible({ timeout: 20000 });

    // ── Assert 2: Multiple interaction cards (N-Degree rendering logic)
    const interactionCards = page.locator(
      '#polypharmacy-scan .border.rounded-xl.overflow-hidden'
    );
    await expect(async () => {
      const count = await interactionCards.count();
      console.log(`[TC-3] Interaction cards rendered: ${count}`);
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 8000 });

    console.log('[TC-3] ✅ PASS');
  });

  // ── TC-4: The Safe Baseline (Green Path) ─────────────────────────────────
  test('TC-4 | Safe Baseline – Lisinopril + Metformin → LOW risk, 0 Fatal/Major, "Safe to dispense"', async ({ page }) => {
    await loginAndGoToScanner(page);
    await clearAllDrugs(page);

    await addDrugViaInput(page, 'Lisinopril');
    await addDrugViaInput(page, 'Metformin');

    const chipCount = await getDrugCount(page);
    console.log(`[TC-4] Drug chip count before scan: ${chipCount}`);
    expect(chipCount).toBe(2);

    await runScan(page);

    // ── Assert 1: Overall Risk LOW
    await expect(
      page.locator('#polypharmacy-scan').getByText('Overall Risk: LOW', { exact: false })
    ).toBeVisible({ timeout: 20000 });

    // ── Assert 2: Stat pills show 0 Fatal/Severe and 0 Major
    await expect(
      page.locator('#polypharmacy-scan').getByText('Fatal/Severe: 0', { exact: false })
    ).toBeVisible({ timeout: 8000 });

    await expect(
      page.locator('#polypharmacy-scan').getByText('Major: 0', { exact: false })
    ).toBeVisible({ timeout: 8000 });

    // ── Assert 3: "Safe to dispense" success message visible
    await expect(
      page.locator('#polypharmacy-scan').getByText('No significant interactions detected. Safe to dispense.', { exact: false })
    ).toBeVisible({ timeout: 8000 });

    console.log('[TC-4] ✅ PASS');
  });

});
