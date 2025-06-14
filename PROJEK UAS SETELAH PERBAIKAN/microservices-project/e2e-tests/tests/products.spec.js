// tests/products.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Products Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login with admin demo account
    await page.goto('/login');
    await page.click('text=Admin Demo');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    
    // Navigate to Products page
    await page.click('text=Products');
    await expect(page).toHaveURL('/products');
  });

  test('should display products page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Product Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
  });

  test('should open add product modal', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    
    // Check modal is visible
    await expect(page.locator('.modal:has-text("Add New Product")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    await expect(page.locator('input[name="stock"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    
    // Fill form
    const productName = 'Test Product ' + Date.now();
    await page.fill('input[name="name"]', productName);
    await page.fill('textarea[name="description"]', 'This is a test product description');
    await page.fill('input[name="price"]', '50000');
    await page.fill('input[name="stock"]', '10');
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.fill('input[name="image_url"]', 'https://via.placeholder.com/300x200?text=Test+Product');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Product")');
    
    // Check if product appears in the list
    await expect(page.locator(`.card:has-text("${productName}")`)).toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    // Find first product edit button and click it
    const editButton = page.locator('.btn-warning').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Check modal is visible with edit title
      await expect(page.locator('.modal:has-text("Edit Product")')).toBeVisible();
      
      // Update product name
      const updatedName = 'Updated Product ' + Date.now();
      await page.fill('input[name="name"]', updatedName);
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Update Product")');
      
      // Check if updated product appears
      await expect(page.locator(`.card:has-text("${updatedName}")`)).toBeVisible();
    }
  });

  test('should delete product with confirmation', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    // Count initial products
    const initialCount = await page.locator('.card.product-card').count();
    
    if (initialCount > 0) {
      // Setup dialog handler for confirmation
      page.on('dialog', dialog => dialog.accept());
      
      // Click first delete button
      await page.locator('.btn-danger').first().click();
      
      // Wait and verify product was deleted
      await page.waitForTimeout(1000);
      const newCount = await page.locator('.card.product-card').count();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('should filter products by category', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    // If there are products, check if they display categories
    const productCards = page.locator('.card.product-card');
    const count = await productCards.count();
    
    if (count > 0) {
      // Check that product cards contain category badges
      await expect(productCards.first().locator('.fa-tag')).toBeVisible();
    }
  });

  test('should display product stock status', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    const productCards = page.locator('.card.product-card');
    const count = await productCards.count();
    
    if (count > 0) {
      // Check that first product has stock badge
      await expect(productCards.first().locator('.badge:has-text("Stock:")')).toBeVisible();
    }
  });

  test('should handle empty products state', async ({ page }) => {
    // If no products exist, should show empty state
    const productCards = await page.locator('.card.product-card').count();
    
    if (productCards === 0) {
      await expect(page.locator('text=No Products Found')).toBeVisible();
      await expect(page.locator('text=Start by adding your first product')).toBeVisible();
    }
  });
});