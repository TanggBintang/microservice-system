const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Try to access protected route
    await page.goto('/products');
    await expect(page).toHaveURL('/login');
    
    await page.goto('/orders');
    await expect(page).toHaveURL('/login');
  });

  test('should navigate between pages when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigate to Products
    await page.click('text=Products');
    await expect(page).toHaveURL('/products');
    
    // Navigate to Orders
    await page.click('text=Orders');
    await expect(page).toHaveURL('/orders');
    
    // Navigate back to Home
    await page.click('text=Home');
    await expect(page).toHaveURL('/');
  });

});
