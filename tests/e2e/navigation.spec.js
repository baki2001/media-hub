import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have sidebar with navigation items', async ({ page }) => {
        await expect(page.locator('aside')).toBeVisible();
        await expect(page.getByText('Library')).toBeVisible();
        await expect(page.getByText('Settings')).toBeVisible();
    });

    test('should navigate to Library', async ({ page }) => {
        await page.getByRole('button', { name: 'Library' }).click();
        await expect(page).toHaveURL(/\/library/);
        await expect(page.locator('h1')).toContainText('Library');
    });

    test('should navigate to Settings', async ({ page }) => {
        await page.getByRole('button', { name: 'Settings' }).click();
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByText('Service Connections')).toBeVisible();
    });

    test('should navigate to Stats', async ({ page }) => {
        await page.getByRole('button', { name: 'Stats' }).click();
        await expect(page).toHaveURL(/\/stats/);
    });
});
