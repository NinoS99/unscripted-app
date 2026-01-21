import { test, expect } from '@playwright/test';
import path from 'path';

test.use({
  storageState: path.join(__dirname, '../playwright/.clerk/user.json'),
});

test.describe('Authenticated Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('should show authenticated UI elements', async ({ page }) => {
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });

    const signInLink = page.locator('a[href="/sign-in"]:has-text("Login/Sign Up")');
    await expect(signInLink).not.toBeVisible();
  });

  test('should access protected route when authenticated', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).not.toContain('/sign-in');
    
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });
  });

  test('should show profile menu when clicking avatar', async ({ page }) => {
    const profileAvatar = page.getByRole('button', { name: 'Profile menu' }).filter({ has: page.locator('img[alt="Profile"]') });
    await expect(profileAvatar).toBeVisible({ timeout: 10000 });

    await profileAvatar.click();

    await expect(page.getByRole('link', { name: 'View Profile' })).toBeVisible();
    await expect(page.locator('button:has-text("Account Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });
});
