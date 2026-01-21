import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Check for common homepage elements
    // Adjust these selectors based on your actual homepage
    await expect(page).toHaveTitle(/unscripted/i);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for navbar to load (semantic nav element)
    const nav = page.locator('nav').first();
    
    // Wait for navbar to be visible
    await expect(nav).toBeVisible({ timeout: 10000 });
    
    // Verify the logo is present (this is always visible)
    const logo = page.locator('nav img[alt=""]').first();
    await expect(logo).toBeVisible();
  });

  test('should have sign in link when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Simple approach: just wait for any link to /sign-in to appear
    // This works regardless of Clerk loading state or mobile/desktop differences
    const signInLink = page.locator('a[href="/sign-in"]');
    
    // Wait for the link to appear with a reasonable timeout
    await expect(signInLink).toBeVisible({ timeout: 15000 });
    
    // Verify it has the expected text
    await expect(signInLink).toContainText(/Login|Sign/i);
  });
});
