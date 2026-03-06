// @ts-check
const { test } = require('@playwright/test');
const path = require('path');
const { BASE_URL, collectMetrics, writePerfJson } = require('../../utils/perf.js');

test.describe('Performance Smoke — Malas', () => {
  test('homepage', async ({ page }, testInfo) => {
    const url = BASE_URL;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await new Promise((r) => setTimeout(r, 1000));

    const metrics = await collectMetrics(page);
    const outputPath = path.join(testInfo.outputDir, 'home.perf.json');
    writePerfJson(metrics, outputPath, 'home', url);
  });

  test('PLP', async ({ page }, testInfo) => {
    const url = `${BASE_URL}tyres/shop`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await new Promise((r) => setTimeout(r, 1000));

    const metrics = await collectMetrics(page);
    const outputPath = path.join(testInfo.outputDir, 'plp.perf.json');
    writePerfJson(metrics, outputPath, 'plp', url);
  });

  test('PDP', async ({ page }, testInfo) => {
    // Use a product listing page; replace with a specific product URL if desired (e.g. from tyres/shop)
    const url = `${BASE_URL}tyres/shop/by-size`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await new Promise((r) => setTimeout(r, 1000));

    const metrics = await collectMetrics(page);
    const outputPath = path.join(testInfo.outputDir, 'pdp.perf.json');
    writePerfJson(metrics, outputPath, 'pdp', url);
  });
});
