// tests/auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Pastikan error message muncul
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should login with admin credentials (admin/admin123)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Redirect ke halaman utama
    await expect(page).toHaveURL('/');

    // Klik dropdown username
    await page.click('button.nav-link.dropdown-toggle');

    // Verifikasi tombol Logout muncul
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should login with demo user credentials', async ({ page }) => {
    await page.goto('/login');

    // Klik tombol User Demo
    await page.click('text=User Demo');
    await page.click('button[type="submit"]');

    // Redirect ke home
    await expect(page).toHaveURL('/');

    // Buka dropdown dan cek Logout
    await page.click('button.nav-link.dropdown-toggle');
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should show registration form', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Don\'t have an account? Register');

    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Create Account")')).toBeVisible();
  });

});
