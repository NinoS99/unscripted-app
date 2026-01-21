import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';
import { config } from 'dotenv';

/**
 * Load environment variables from .env.test
 * This is necessary because global setup runs in a separate process
 * and needs access to environment variables
 */
config({ path: '.env.test' });

// Configure Playwright with Clerk
setup('global setup', async () => {
  // If Frontend API URL is provided, make sure it's available to clerkSetup
  // clerkSetup may need this to properly configure the Testing Token
  if (process.env.CLERK_FRONTEND_API_URL) {
    // Set it in the environment for clerkSetup to use
    process.env.CLERK_FRONTEND_API = process.env.CLERK_FRONTEND_API_URL;
  }
  await clerkSetup();
});

// Define the path to the storage file
const authFile = path.join(__dirname, '../playwright/.clerk/user.json');

/**
 * Authenticate and save auth state for reuse across tests
 * This runs once before all tests and saves the authenticated session
 */
setup('authenticate and save state to storage', async ({ page }) => {
  // Check if test user credentials are provided
  // For email code auth, we only need username/email (no password)
  const testUsername = process.env.E2E_CLERK_USER_USERNAME;

  if (!testUsername) {
    console.warn(
      'E2E_CLERK_USER_USERNAME not set. ' +
      'Skipping auth state creation. Tests will need to authenticate individually.'
    );
    return;
  }

  // Navigate to the app
  await page.goto('/');

  // Setup Testing Token - this must be done before clerk.signIn()
  // clerk.signIn() internally calls setupClerkTestingToken, which needs the Frontend API URL
  const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL;
  
  if (!frontendApiUrl) {
    throw new Error(
      'CLERK_FRONTEND_API_URL must be set in .env.test file.\n' +
      'To find your Frontend API URL:\n' +
      '1. Go to your Clerk Dashboard: https://dashboard.clerk.com\n' +
      '2. Navigate to API Keys\n' +
      '3. Look for "Frontend API URL" or check your instance name\n' +
      '4. Format: your-instance-name.frontend-api.clerk.dev (without https://)\n' +
      '5. Add to .env.test: CLERK_FRONTEND_API_URL=your-instance-name.frontend-api.clerk.dev'
    );
  }

  // Explicitly setup Testing Token with Frontend API URL
  // This is required because clerk.signIn() internally calls setupClerkTestingToken
  // Type assertion needed because TypeScript definitions may not include frontendApiUrl
  // but it's required at runtime
  //await setupClerkTestingToken({ page });

  // Perform authentication using Clerk helper
  // Since Clerk is configured for email code authentication (username/email → code),
  // we use the 'email_code' strategy with test codes in development
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'email_code',
      identifier: testUsername, // Can be email or username
    },
  });

  // Wait for Clerk to fully load before checking for UI elements
  await clerk.loaded({ page });

  // Wait for navigation to be visible first
  await page.waitForSelector('nav', { timeout: 10000 });

  // Verify authentication by checking for authenticated UI elements
  // Use .first() since there are 2 profile buttons (mobile and desktop) but only one is visible
  // Wait for the button to be visible (not just present in DOM)
  await page.waitForSelector("h1:has-text('Welcome back, testuser')", { timeout: 15000 });

  // Save the authenticated state to a file
  await page.context().storageState({ path: authFile });
  console.log('Auth state saved to:', authFile);
});
