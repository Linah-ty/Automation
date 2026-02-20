// @ts-check
import { test, expect } from '@playwright/test';

const HOMEPAGE_URL = 'https://www.malas.co.za/';

test.describe('sTAGING Malas Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOMEPAGE_URL);
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Malas Tyres & Wheels/);
  });

  test('loads and shows main navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: /shop tyres/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /shop wheels/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /shop packages/i })).toBeVisible();
  });

  test('shows header contact and account links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();
  });

  test('shows main hero CTAs', async ({ page }) => {
    await expect(page.getByRole('link', { name: /shop tyres/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /shop wheels/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /shop packages/i }).first()).toBeVisible();
  });

  test('shows "How Our Online Store Works" section', async ({ page }) => {
    await expect(page.getByText(/how our online store works/i)).toBeVisible();
    await expect(page.getByText(/SEARCH/)).toBeVisible();
    await expect(page.getByText(/CHOOSE/)).toBeVisible();
    await expect(page.getByText(/PAY/)).toBeVisible();
  });


  test('shows footer with contact info', async ({ page }) => {
    await expect(page.getByText(/0861 062 527/)).toBeVisible();
    await expect(page.getByText(/contact us/i)).toBeVisible();
  });

  test('search is accessible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible();
  });
});
