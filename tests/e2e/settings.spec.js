import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
    });

    test('should show import/export buttons in Connections tab', async ({ page }) => {
        // Default tab is Connections
        await expect(page.getByText('Service Connections')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
        await expect(page.locator('label[title="Import Configuration"]')).toBeVisible();
    });

    test('should switch to Appearance tab and show theme options', async ({ page }) => {
        await page.getByRole('button', { name: 'Appearance' }).click();

        await expect(page.getByText('Personalize your MediaHub experience')).toBeVisible();

        // Check Theme Mode buttons
        await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
    });

    // Test theme switching (check if data-theme attribute changes)
    test('should switch theme mode', async ({ page }) => {
        await page.getByRole('button', { name: 'Appearance' }).click();

        // Initial state (defaults to dark or saved)
        // Click Light
        await page.getByRole('button', { name: 'Light' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

        // Click Dark
        await page.getByRole('button', { name: 'Dark' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
});
