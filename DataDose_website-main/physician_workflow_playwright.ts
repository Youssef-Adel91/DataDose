import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

function pass(message: string) {
  console.log(`PASS: ${message}`);
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  throw new Error(message);
}

async function run() {
  console.log('=== Physician Workflow E2E (Playwright) ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  let scanResponseStatus: number | null = null;
  page.on('response', async (res) => {
    if (res.url().includes('/api/scan')) {
      scanResponseStatus = res.status();
      console.log(`TRACE: /api/scan -> ${scanResponseStatus}`);
    }
  });

  try {
    console.log('\n[Test Case 1] Auth & Navigation');
    let loggedIn = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForSelector('#email', { timeout: 120000 });
      await page.fill('#email', 'dr@datadose.ai');
      await page.fill('#password', 'password123');
      await page.click('#login-submit-btn');
      try {
        await page.waitForTimeout(6000);
        if (page.url().includes('/dashboard/physician')) {
          loggedIn = true;
          break;
        }
        console.log(`TRACE: Login attempt ${attempt} did not navigate, retrying...`);
      } catch {
        console.log(`TRACE: Login attempt ${attempt} errored, retrying...`);
      }
    }
    if (!loggedIn) {
      fail('Unable to route to Physician Dashboard after login attempts');
    }
    pass('Login routes to Physician Dashboard');

    console.log('\n[Test Case 2] Patient Records');
    await page.click('a:has-text("Patient Records")');
    await page.waitForSelector('#patients');
    const patientListVisible = await page.locator('#patients .space-y-2.max-h-96').isVisible();
    if (!patientListVisible) fail('Patient list did not mount');
    pass('Patient list mounted');

    await page.locator('#patients .space-y-2.max-h-96 div:has-text("Sara Patient")').first().click();
    await page.waitForFunction(() => {
      const detail = document.querySelector('#patients .lg\\:col-span-2');
      return !!detail && /Sara Patient/i.test(detail.textContent || '');
    });
    pass('Selected patient Sara (CKD + Penicillin allergy)');

    console.log('\n[Test Case 3] Create Prescription (New Grid UI)');
    await page.click('a:has-text("Create Prescription")');
    await page.locator('#prescription input[placeholder*="Drug name"]').fill('Amoxicillin');
    await page.locator('#prescription input[placeholder*="Dosage"]').fill('500mg');
    await page.locator('#prescription select').selectOption('2x daily');
    await page.click('#prescription button:has-text("Add")');

    const selectedMedsText = await page.locator('#prescription').innerText();
    if (!selectedMedsText.includes('Amoxicillin') || !selectedMedsText.includes('500mg') || !selectedMedsText.includes('2x daily')) {
      fail('Amoxicillin did not appear correctly in Selected Medications');
    }
    pass('Amoxicillin appears in Selected Medications');

    console.log('\n[Test Case 4] N-Degree Scanner & Risk Analysis');
    scanResponseStatus = null;
    await page.click('#prescription button:has-text("Check Interactions")');

    await page.waitForSelector('#polypharmacy-scan :text("Scanning Knowledge Graph")', { timeout: 30000 });
    pass('N-Degree Scanner enters loading/scanning state');

    await page.waitForFunction(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.some((e) => e.name.includes('/api/scan'));
    }, undefined, { timeout: 10000 });

    if (scanResponseStatus !== 200) {
      fail(`/api/scan did not return 200 OK (actual: ${scanResponseStatus})`);
    }
    pass('/api/scan returned 200 OK');

    await page.waitForFunction(() => {
      const section = document.querySelector('#risk');
      const text = section?.textContent || '';
      return /fatal|severe|critical|anaphylaxis/i.test(text);
    }, undefined, { timeout: 15000 });
    const riskText = await page.locator('#risk').innerText();
    if (!/fatal|severe|critical|anaphylaxis/i.test(riskText)) {
      fail('Risk Analysis did not flag severe/fatal allergy warning');
    }
    pass('Risk Analysis flags severe/fatal allergy risk');

    console.log('\n[Test Case 5] Smart Alternatives & Visual Map');
    await page.click('a:has-text("Smart Alternatives")');
    await page.locator('#smart-alternatives input[placeholder*="Warfarin"]').fill('Amoxicillin');
    await page.click('#smart-alternatives button:has-text("Find Safe Alternative")');
    await page.waitForSelector('#smart-alternatives :text("Azithromycin")', { timeout: 10000 });
    pass('Smart Alternatives suggests safe alternative (Azithromycin)');

    await page.click('a:has-text("Visual Map")');
    await page.waitForSelector('#visual-map svg', { timeout: 10000 });
    const nodeCount = await page.locator('#visual-map svg circle').count();
    if (nodeCount < 1) fail('Visual Map canvas rendered but has no nodes');
    pass('Visual Map canvas renders nodes without DOM crash');

    console.log('\n[Test Case 6] Clinical Reports');
    await page.click('a:has-text("Clinical Reports")');
    const reportButton = page.locator('#reports button:has-text("Generate Clinical Summary")');
    if (!(await reportButton.isEnabled())) {
      fail('Clinical report generation button is not clickable');
    }
    pass('Clinical report generation button is clickable');

    await reportButton.click();
    await page.waitForSelector('#reports :text("Generated Summary")', { timeout: 10000 });
    pass('Clinical summary is rendered');

    console.log('\n=== FINAL RESULT: ALL ASSERTIONS PASSED ===');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(`\nE2E RUN FAILED: ${err.message}`);
  process.exit(1);
});
