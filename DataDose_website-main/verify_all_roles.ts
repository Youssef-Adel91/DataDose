import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
// Artifacts directory for AntiGravity
const ARTIFACT_DIR = process.env.USERPROFILE + '/.gemini/antigravity/brain/780f7fd8-3776-4957-aa73-7661563d5efa/';

const roles = [
  { name: 'Super Admin', email: 'youssef@datadose.ai', ext: 'super_admin' },
  { name: 'Admin', email: 'admin@datadose.ai', ext: 'admin' },
  { name: 'Physician', email: 'dr@datadose.ai', ext: 'physician' },
  { name: 'Pharmacist', email: 'pharmacist@datadose.ai', ext: 'pharmacist' },
  { name: 'Patient (Sara)', email: 'sara@datadose.ai', ext: 'patient' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  for (const role of roles) {
    console.log(`\nTesting login for ${role.name}...`);
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', 'password123');
      
      const navPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 8000 });
      await page.click('button[type="submit"]');
      await navPromise;
      
      // Give the layout time to animate in
      await page.waitForTimeout(2000);
      
      const url = page.url();
      console.log(`  -> Redirected exactly to: ${url}`);
      
      if (!url.includes('/dashboard')) {
        console.error(`  -> [FAIL] Expected dashboard, got ${url}`);
      } else {
         console.log(`  -> [SUCCESS] Dashboard reached.`);
         const scPath = path.join(ARTIFACT_DIR, `dashboard_${role.ext}.png`);
         await page.screenshot({ path: scPath, fullPage: true });
         console.log(`  -> Screenshot saved for ${role.name}.`);
      }
    } catch(err) {
      console.error(`  -> [ERROR] Failed to login ${role.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nVerification complete!');
}

run().catch(console.error);
