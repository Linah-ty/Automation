/**
 * Performance measurement utilities for Playwright tests.
 * Collects navigation timing, resources, and Core Web Vitals (LCP, CLS).
 * Used by tests/Performance/PerformanceSmoke.spec.js and utils/analyzePerf.js.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.malas.co.za/';

/**
 * Script run in browser to collect performance metrics (LCP, CLS, navigation, resources).
 * @returns {Promise<Object>} Metrics object
 */
function getCollectMetricsScript() {
  return `
    new Promise((resolve) => {
      const result = {
        navigation: null,
        resources: [],
        resourceCount: 0,
        failedRequestCount: 0,
        totalTransferSize: 0,
        lcp: null,
        cls: null,
        fcp: null,
        ttfb: null,
        domContentLoaded: null,
        loadComplete: null,
      };

      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        result.navigation = {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadEventEnd: nav.loadEventEnd - nav.startTime,
          domInteractive: nav.domInteractive - nav.startTime,
          responseStart: nav.responseStart - nav.startTime,
        };
        result.ttfb = nav.responseStart - nav.requestStart;
        result.domContentLoaded = result.navigation.domContentLoaded;
        result.loadComplete = result.navigation.loadEventEnd;
      }

      const resources = performance.getEntriesByType('resource');
      result.resourceCount = resources.length;
      result.resources = resources.map((r) => ({
        name: r.name,
        duration: r.duration,
        transferSize: r.transferSize || 0,
        encodedBodySize: r.encodedBodySize || 0,
        failed: r.responseStatus ? r.responseStatus >= 400 : false,
      }));
      result.failedRequestCount = result.resources.filter((r) => r.failed).length;
      result.totalTransferSize = result.resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) result.fcp = fcpEntry.startTime;

      if (typeof PerformanceObserver !== 'undefined') {
        let lcpResolved = false;
        let clsResolved = false;
        const check = () => {
          if (lcpResolved && clsResolved) resolve(result);
        };

        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) result.lcp = last.startTime;
            lcpResolved = true;
            check();
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          lcpResolved = true;
          check();
        }

        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) clsValue += entry.value;
            }
            result.cls = clsValue;
            clsResolved = true;
            check();
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
          clsResolved = true;
          check();
        }

        setTimeout(() => {
          if (!lcpResolved) { lcpResolved = true; check(); }
          if (!clsResolved) { clsResolved = true; check(); }
        }, 5000);
      } else {
        resolve(result);
      }
    });
  `;
}

/**
 * Collect performance metrics from the current page.
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<Object>} Collected metrics
 */
async function collectMetrics(page) {
  const script = getCollectMetricsScript();
  const metrics = await page.evaluate(script);
  return metrics;
}

/**
 * Write performance metrics to a JSON file (e.g. test-results/.../home.perf.json).
 * @param {Object} metrics - Metrics from collectMetrics()
 * @param {string} outputPath - Full path to write .perf.json
 * @param {string} [pageName] - Page key (home, plp, pdp) for metadata
 * @param {string} [url] - URL that was measured
 */
function writePerfJson(metrics, outputPath, pageName = '', url = '') {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const payload = {
    pageName: pageName || undefined,
    url: url || undefined,
    timestamp: new Date().toISOString(),
    ...metrics,
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
}

module.exports = {
  BASE_URL,
  collectMetrics,
  getCollectMetricsScript,
  writePerfJson,
};
