import { chromium, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

type CaseResult = {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
};

const results: CaseResult[] = [];

function record(name: string, expected: string, actual: string, pass: boolean) {
  results.push({ name, expected, actual, pass });
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${status}: ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
}

async function loginAndOpenPhysician(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#email', { timeout: 60000 });
  await page.fill('#email', 'dr@datadose.ai');
  await page.fill('#password', 'password123');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard/physician', { timeout: 30000 });
}

async function selectSara(page: Page) {
  await page.click('a:has-text("Patient Records")');
  await page.waitForSelector('#patients');
  await page.locator('#patients .space-y-2.max-h-96 div:has-text("Sara Patient")').first().click();
  await page.waitForFunction(() => {
    const detail = document.querySelector('#patients .lg\\:col-span-2');
    return !!detail && /Sara Patient/i.test(detail.textContent || '');
  });
}

async function clearAddedMeds(page: Page) {
  await page.click('a:has-text("Create Prescription")');
  // Remove all meds from selected list (including default Metformin)
  while ((await page.locator('#prescription .space-y-2 button').count()) > 0) {
    await page.locator('#prescription .space-y-2 button').first().click();
    await page.waitForTimeout(100);
  }
}

async function addMed(page: Page, drug: string, dose: string, freq: string) {
  await page.locator('#prescription input[placeholder*="Drug name"]').fill(drug);
  await page.locator('#prescription input[placeholder*="Dosage"]').fill(dose);
  await page.locator('#prescription select').selectOption(freq);
  await page.click('#prescription button:has-text("Add")');
}

async function dismissPaywallIfShown(page: Page) {
  const dismissBtn = page.locator('#prescription button:has-text("Not now")');
  if ((await dismissBtn.count()) > 0) {
    await dismissBtn.first().click();
    await page.waitForTimeout(200);
  }
}

async function run() {
  console.log('=== Prescription Feature QA Execution ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await loginAndOpenPhysician(page);
    await selectSara(page);

    // المستوى الأول: AI & Clinical Engine
    await clearAddedMeds(page);
    await addMed(page, 'Amoxicillin', '500mg', '2x daily');
    await page.click('#prescription button:has-text("Check Interactions")');
    await page.waitForTimeout(2000);
    const allergyRiskText = await page.locator('#risk').innerText();
    record(
      'Allergy Trap (Amoxicillin/Penicillin)',
      'FATAL red alert and prescription rejection for Sara penicillin allergy',
      allergyRiskText.replace(/\s+/g, ' ').slice(0, 220),
      /fatal|critical|anaphylaxis|contraindication/i.test(allergyRiskText)
    );

    await clearAddedMeds(page);
    await addMed(page, 'Ibuprofen', '400mg', '2x daily');
    await page.click('#prescription button:has-text("Check Interactions")');
    await page.waitForTimeout(2500);
    const ckdRiskText = await page.locator('#risk').innerText();
    record(
      'Condition Trap (Ibuprofen + CKD)',
      'SEVERE/ORANGE warning for CKD patient risk',
      ckdRiskText.replace(/\s+/g, ' ').slice(0, 220),
      /(ibuprofen)/i.test(ckdRiskText) &&
      /(ckd|kidney|renal)/i.test(ckdRiskText) &&
      /(severe|major|critical|high)/i.test(ckdRiskText)
    );

    await clearAddedMeds(page);
    await addMed(page, 'Warfarin', '5mg', '1x daily');
    await addMed(page, 'Aspirin', '100mg', '1x daily');
    await page.click('#prescription button:has-text("Check Interactions")');
    await page.waitForTimeout(2500);
    const ddiText = await page.locator('#risk').innerText();
    record(
      'Drug-Drug Interaction (Warfarin + Aspirin)',
      'Very high bleeding risk alert',
      ddiText.replace(/\s+/g, ' ').slice(0, 220),
      /bleeding|critical|severe|fatal|stop combination/i.test(ddiText)
    );

    // المستوى الثاني: Freemium & Quota
    await clearAddedMeds(page);
    // Three scans were already consumed in level one.
    for (let i = 0; i < 3; i++) {
      await addMed(page, 'Panadol', '500mg', '1x daily');
      await page.click('#prescription button:has-text("Check Interactions")');
      await page.waitForTimeout(900);
      if (i < 2) {
        await clearAddedMeds(page);
      }
    }
    const paywallVisible = (await page.locator('#prescription :text("Daily Limit Reached")').count()) > 0;
    record(
      'Paywall Crash (6 scans)',
      '6th attempt should show glassmorphism paywall + block submit',
      paywallVisible ? 'Paywall visible' : 'Paywall not visible',
      paywallVisible
    );

    await page.reload();
    await page.waitForTimeout(1200);
    await page.click('a:has-text("Create Prescription")');
    await addMed(page, 'Panadol', '500mg', '1x daily');
    const verifyBtn = page.locator('#prescription button:has-text("Verify & Submit")');
    let bypassStatus = 'No backend enforcement detected from UI';
    let bypassPass = false;
    if (await verifyBtn.isVisible() && !(await verifyBtn.isDisabled())) {
      await verifyBtn.click();
      await page.waitForTimeout(1000);
      const quotaTextVisible = (await page.locator('#prescription :text("403 Forbidden: QUOTA_EXCEEDED")').count()) > 0;
      const quotaModalVisible = (await page.locator('#prescription :text("Daily Limit Reached")').count()) > 0;
      bypassPass = quotaTextVisible || quotaModalVisible;
      bypassStatus = bypassPass
        ? 'Server/UI blocked submit with quota enforcement'
        : 'Verify clicked; no 403 surfaced in UI path';
    } else {
      const disabledState = await verifyBtn.isDisabled();
      bypassPass = disabledState;
      bypassStatus = disabledState ? 'Verify is hard-disabled under quota' : 'Verify button missing';
    }
    record(
      'Bypass Attempt (Refresh then Verify quickly)',
      'Server should reject with 403 Forbidden',
      bypassStatus,
      bypassPass
    );

    // المستوى الثالث: UI/UX Edge Cases
    await dismissPaywallIfShown(page);
    await clearAddedMeds(page);
    const isVerifyDisabled = await verifyBtn.isDisabled();
    record(
      'Ghost Prescription (empty submit)',
      'Verify button disabled or validation message shown',
      isVerifyDisabled ? 'Verify button disabled' : 'Verify button enabled with empty meds',
      isVerifyDisabled
    );

    await addMed(page, 'Metformin', '500mg', '2x daily');
    for (let i = 0; i < 9; i++) {
      await addMed(page, 'Metformin', '500mg', '2x daily');
    }
    const medCount = await page.locator('#prescription .space-y-2 .bg-white\\/50').count();
    record(
      'Add Button Spamming',
      'Same medication should not duplicate uncontrollably',
      `Medication cards count: ${medCount}`,
      medCount <= 1
    );

    await clearAddedMeds(page);
    await addMed(page, 'Lisinopril', '10mg', '1x daily');
    await addMed(page, 'Atorvastatin', '20mg', '1x daily');
    await addMed(page, 'Metformin', '500mg', '2x daily');
    const beforeRemove = await page.locator('#prescription .space-y-2 .bg-white\\/50').count();
    await page.locator('#prescription .space-y-2 button').first().click();
    await page.waitForTimeout(300);
    const afterRemove = await page.locator('#prescription .space-y-2 .bg-white\\/50').count();
    record(
      'Fast Undo (remove with X)',
      'Doctor can smoothly remove medications from Selected Medications',
      `Count before: ${beforeRemove}, after: ${afterRemove}`,
      afterRemove === beforeRemove - 1
    );
  } finally {
    await browser.close();
  }

  console.log('\n=== QA Summary ===');
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  for (const r of results) {
    console.log(`- ${r.pass ? 'PASS' : 'FAIL'} | ${r.name}`);
  }

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(`\nQA EXECUTION FAILED: ${err.message}`);
  process.exit(1);
});

