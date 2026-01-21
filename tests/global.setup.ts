import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env.test' });

setup('global setup', async () => {
  if (process.env.CLERK_FRONTEND_API_URL) {
    process.env.CLERK_FRONTEND_API = process.env.CLERK_FRONTEND_API_URL;
  }
  await clerkSetup();
});

const authFile = path.join(__dirname, '../playwright/.clerk/user.json');

setup('authenticate and save state to storage', async ({ page }) => {
  const testUsername = process.env.E2E_CLERK_USER_USERNAME;

  if (!testUsername) {
    console.warn(
      'E2E_CLERK_USER_USERNAME not set. ' +
      'Skipping auth state creation. Tests will need to authenticate individually.'
    );
    return;
  }

  await page.goto('/');

  const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL;
  
  if (!frontendApiUrl) {
    throw new Error('CLERK_FRONTEND_API_URL must be set in .env.test file.');
  }

  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'email_code',
      identifier: testUsername,
    },
  });

  await clerk.loaded({ page });
  await page.waitForSelector('nav', { timeout: 10000 });
  await page.waitForSelector("h1:has-text('Welcome back, testuser')", { timeout: 15000 });

  await page.context().storageState({ path: authFile });
  console.log('Auth state saved to:', authFile);
});
