import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { config } from 'dotenv';

/**
 * Load environment variables from .env.test
 */
config({ path: '.env.test' });

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state (not authenticated)
    // Navigate to an unprotected page so Clerk loads (required by Clerk helpers)
    await page.goto('/');
    // Wait for navbar to load
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('should sign in an existing user', async ({ page }) => {
    // Get test user from environment variable
    const testUserEmail = process.env.E2E_CLERK_USER_USERNAME;
    
    if (!testUserEmail) {
      test.skip();
      return;
    }

    // Verify we start unauthenticated (sign-in link visible)
    const signInLink = page.locator('a[href="/sign-in"]:has-text("Login/Sign Up")');
    await expect(signInLink).toBeVisible({ timeout: 15000 });

    // Sign in using Clerk helper (bypasses UI interactions)
    // Since Clerk is configured for email code authentication, use email_code strategy
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: testUserEmail,
      },
    });

    // Wait for Clerk to fully load
    await clerk.loaded({ page });

    // Verify authenticated - profile avatar should be visible
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });

    // Verify sign-in link is no longer visible
    await expect(signInLink).not.toBeVisible();

    // Sign out using Clerk helper
    await clerk.signOut({ page });

    // Wait for Clerk to fully load after sign-out
    await clerk.loaded({ page });

    // Verify signed out - sign-in link should be visible
    await expect(signInLink).toBeVisible({ timeout: 10000 });
    await expect(profileAvatar).not.toBeVisible();

    // Sign in again to verify we can re-authenticate
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: testUserEmail,
      },
    });

    await clerk.loaded({ page });

    // Verify authenticated again
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });
    await expect(signInLink).not.toBeVisible();
  });

  test('should sign out successfully', async ({ page }) => {
    // Get test user from environment variable
    const testUserEmail = process.env.E2E_CLERK_USER_USERNAME;
    
    if (!testUserEmail) {
      test.skip();
      return;
    }

    // Sign in using Clerk helper
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: testUserEmail,
      },
    });

    // Wait for Clerk to fully load
    await clerk.loaded({ page });

    // Verify authenticated - profile avatar should be visible
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });

    // Sign out using Clerk helper
    await clerk.signOut({ page });

    // Wait for Clerk to fully load after sign-out
    await clerk.loaded({ page });

    // Verify signed out - sign-in link should be visible
    const signInLink = page.locator('a[href="/sign-in"]:has-text("Login/Sign Up")');
    await expect(signInLink).toBeVisible({ timeout: 10000 });

    // Profile avatar should not be visible
    await expect(profileAvatar).not.toBeVisible();
  });

  test('should show authenticated UI elements when signed in', async ({ page }) => {
    // Get test user from environment variable
    const testUserEmail = process.env.E2E_CLERK_USER_USERNAME;
    
    if (!testUserEmail) {
      test.skip();
      return;
    }

    // Sign in using Clerk helper
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: testUserEmail,
      },
    });

    await clerk.loaded({ page });

    // Verify authenticated UI elements are visible
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });

    // Click profile avatar to open menu
    await profileAvatar.click();

    // Verify profile menu items are visible
    await expect(page.getByRole('link', { name: 'View Profile' })).toBeVisible();
    await expect(page.locator('button:has-text("Account Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });
});
