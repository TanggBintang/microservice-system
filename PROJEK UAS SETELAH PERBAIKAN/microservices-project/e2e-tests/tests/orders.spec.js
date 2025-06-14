// tests/orders.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Orders Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login with admin demo account
    await page.goto('/login');
    await page.click('text=Admin Demo');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    
    // Navigate to Orders page
    await page.click('text=Orders');
    await expect(page).toHaveURL('/orders');
  });

  test('should display orders page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Order Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Create New Order")')).toBeVisible();
  });

  test('should open create order modal', async ({ page }) => {
    await page.click('button:has-text("Create New Order")');
    
    // Check modal is visible
    await expect(page.locator('.modal:has-text("Create New Order")')).toBeVisible();
    await expect(page.locator('input[value="admin"]')).toBeVisible(); // customer name should be pre-filled
    await expect(page.locator('textarea')).toBeVisible(); // shipping address
  });

  test('should create new order with products', async ({ page }) => {
    await page.click('button:has-text("Create New Order")');
    
    // Fill customer information
    await page.fill('input[value="admin"]', 'Test Customer');
    const testEmail = 'test' + Date.now() + '@example.com';
    await page.locator('input[type="email"]').fill(testEmail);
    await page.fill('input[type="tel"]', '081234567890');
    await page.fill('textarea', 'Test Shipping Address, Jakarta, Indonesia');
    
    // Wait for products to load and add one to cart
    await page.waitForTimeout(2000);
    const addButtons = page.locator('.btn-outline-primary:has(.fa-plus)');
    const buttonCount = await addButtons.count();
    
    if (buttonCount > 0) {
      // Add first product to cart
      await addButtons.first().click();
      
      // Verify item is added to cart
      await expect(page.locator('h6:has-text("Order Items (1)")')).toBeVisible();
      
      // Submit order
      await page.click('button[type="submit"]:has-text("Create Order")');
      
      // Check for success message or modal close
      await page.waitForTimeout(1000);
      
      // Modal should close
      await expect(page.locator('.modal:has-text("Create New Order")')).not.toBeVisible();
    }
  });

  test('should display orders table', async ({ page }) => {
    // Wait for orders to load
    await page.waitForTimeout(2000);
    
    // Check if orders table exists
    const ordersExist = await page.locator('.table').isVisible();
    
    if (ordersExist) {
      // Check table headers
      await expect(page.locator('th:has-text("Order ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Customer")')).toBeVisible();
      await expect(page.locator('th:has-text("Total Amount")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    } else {
      // Check empty state
      await expect(page.locator('text=No orders found')).toBeVisible();
    }
  });

  test('should update order status', async ({ page }) => {
    // Wait for orders to load
    await page.waitForTimeout(2000);
    
    const statusDropdowns = page.locator('.dropdown-toggle:has(.fa-edit)');
    const dropdownCount = await statusDropdowns.count();
    
    if (dropdownCount > 0) {
      // Click first status dropdown
      await statusDropdowns.first().click();
      
      // Click confirm option
      await page.click('button.dropdown-item:has-text("Confirm")');
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Should see success alert
      await expect(page.locator('.alert-success')).toBeVisible();
    }
  });

  test('should view order details', async ({ page }) => {
    // Wait for orders to load
    await page.waitForTimeout(2000);
    
    const viewButtons = page.locator('.btn-outline-primary:has(.fa-eye)');
    const buttonCount = await viewButtons.count();
    
    if (buttonCount > 0) {
      // Click first view button
      await viewButtons.first().click();
      
      // Check detail modal is visible
      await expect(page.locator('.modal:has-text("Order Details")')).toBeVisible();
      await expect(page.locator('td:has-text("Name:")')).toBeVisible();
      await expect(page.locator('td:has-text("Status:")')).toBeVisible();
    }
  });

  test('should manage cart in create order', async ({ page }) => {
    await page.click('button:has-text("Create New Order")');
    
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    const addButtons = page.locator('.btn-outline-primary:has(.fa-plus)');
    const buttonCount = await addButtons.count();
    
    if (buttonCount > 0) {
      // Add product to cart
      await addButtons.first().click();
      
      // Verify cart has 1 item
      await expect(page.locator('h6:has-text("Order Items (1)")')).toBeVisible();
      
      // Increase quantity
      const plusButton = page.locator('.btn-outline-secondary:has-text("+")');
      if (await plusButton.isVisible()) {
        await plusButton.click();
        
        // Should show quantity 2
        await expect(page.locator('.mx-2:has-text("2")')).toBeVisible();
      }
      
      // Remove item from cart
      const removeButton = page.locator('.btn-outline-danger:has(.fa-trash)');
      if (await removeButton.isVisible()) {
        await removeButton.click();
        
        // Cart should be empty
        await expect(page.locator('p:has-text("No items added")')).toBeVisible();
      }
    }
  });


  test('should handle empty orders state', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    const ordersTable = await page.locator('.table tbody tr').count();
    
    if (ordersTable === 0) {
      await expect(page.locator('text=No orders found')).toBeVisible();
      await expect(page.locator('text=Create your first order to get started')).toBeVisible();
    }
  });

});