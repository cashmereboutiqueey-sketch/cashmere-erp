import { test, expect } from '@playwright/test';

test.describe('Brand Flow Verification', () => {

    test('Create Product and Place Order via POS', async ({ page }) => {
        // Capture console logs and errors
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));

        // 1. Create Product
        console.log('Navigating to Products page...');
        await page.goto('http://localhost:3000/brand/products');

        // Check for loading state first
        console.log('Waiting for Loading state to disappear...');
        try {
            await expect(page.getByText('Loading Catalog')).toBeHidden({ timeout: 15000 });
            console.log('Loading state disappeared.');
        } catch (e) {
            console.log('Timeout waiting for Loading state to disappear.');
            console.log(await page.content());
            throw e;
        }

        // Check if "Add Product" button exists and click it
        console.log('Clicking Add Product...');
        // Support both English and Arabic
        // Support English, Arabic, and fallback key
        const addButton = page.getByRole('button', { name: /Add|إضافة|brandProducts\.add/i }).first();
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Fill Product Form
        console.log('Filling form...');
        await page.getByPlaceholder(/e.g. Classic White/i).fill('E2E Test T-Shirt');
        await page.getByPlaceholder(/e.g. Summer 2024/i).fill('Test Collection');

        // SKU
        // SKU (Label is not associated, use sibling selector)
        await page.locator('label:has-text("SKU") + input').fill('E2E-TS-001');

        // Price inputs
        await page.locator('input[type="number"]').first().fill('50');
        await page.locator('input[type="number"]').nth(1).fill('10');
        await page.locator('input[type="number"]').nth(2).fill('100'); // 100% margin

        // Wait for retail calculation
        await expect(page.getByText(/Calculated Retail Price|سعر التجزئة/i)).toBeVisible();

        // Save
        console.log('Saving...');
        page.on('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.accept();
        });
        await page.getByRole('button', { name: /Save|حفظ/i }).click();

        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden();

        // 2. POS Order
        console.log('Navigating to POS...');
        await page.goto('http://localhost:3000/brand/pos');

        // Search for product
        // Search for product (specific regex to avoid customer search)
        const searchInput = page.getByPlaceholder(/Search product|بحث منتج/i);
        await searchInput.fill('E2E-TS-001');
        await searchInput.press('Enter');

        // Add to cart
        console.log('Adding to cart...');
        const productCard = page.getByText('E2E Test T-Shirt').first();
        await expect(productCard).toBeVisible();
        await productCard.click();

        // Verify Cart has item
        await expect(page.getByText('E2E Test T-Shirt', { exact: false })).toBeVisible();

        // Checkout
        console.log('Checking out...');
        await page.getByRole('button', { name: /Checkout|دفع/i }).click();

        // Payment Modal
        await expect(page.getByText(/Payment Total|الإجمالي/i)).toBeVisible();

        // Confirm Checkout
        const modalCheckoutBtn = page.locator('.fixed').getByRole('button', { name: /Checkout|تأكيد|Submit/i });
        await modalCheckoutBtn.click();

        // Expect empty cart (Success)
        console.log('Verifying success...');
        await expect(page.getByText(/Empty Cart|السلة فارغة/i)).toBeVisible({ timeout: 10000 });
    });

});
