/**
 * Analyzer for performance test results (.perf.json).
 * Compares metrics to BUDGETS and prints severity (Good / Medium / High / Critical).
 * Usage: node utils/analyzePerf.js [pageName|filePath]
 *   pageName: home | plp | pdp  → finds latest test-results/<run-folder>/<page>.perf.json
 *   filePath: path to a .perf.json file
 *   (no args): finds most recent .perf.json in test-results
 */

const fs = require('fs');
const path = require('path');

const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');

/**
 * Page keys must match test names / output file names: home.perf.json, plp.perf.json, pdp.perf.json.
 * Thresholds: [report (critical), poor (high), needs improvement (medium)]. Below = good.
 */
const BUDGETS = {
  home: {
    lcp: { report: 4000, poor: 2500, needsImprovement: 2500 },
    cls: { report: 0.25, poor: 0.1, needsImprovement: 0.1 },
    ttfb: { report: 800, poor: 600, needsImprovement: 600 },
    resourceCount: { report: 200, poor: 150, needsImprovement: 150 },
    failedRequestCount: { report: 1, poor: 0, needsImprovement: 0 },
    totalTransferSize: { report: 5 * 1024 * 1024, poor: 3 * 1024 * 1024, needsImprovement: 3 * 1024 * 1024 },
  },
  plp: {
    lcp: { report: 4000, poor: 2500, needsImprovement: 2500 },
    cls: { report: 0.25, poor: 0.1, needsImprovement: 0.1 },
    ttfb: { report: 800, poor: 600, needsImprovement: 600 },
    resourceCount: { report: 200, poor: 150, needsImprovement: 150 },
    failedRequestCount: { report: 1, poor: 0, needsImprovement: 0 },
    totalTransferSize: { report: 5 * 1024 * 1024, poor: 3 * 1024 * 1024, needsImprovement: 3 * 1024 * 1024 },
  },
  pdp: {
    lcp: { report: 4000, poor: 2500, needsImprovement: 2500 },
    cls: { report: 0.25, poor: 0.1, needsImprovement: 0.1 },
    ttfb: { report: 800, poor: 600, needsImprovement: 600 },
    resourceCount: { report: 200, poor: 150, needsImprovement: 150 },
    failedRequestCount: { report: 1, poor: 0, needsImprovement: 0 },
    totalTransferSize: { report: 5 * 1024 * 1024, poor: 3 * 1024 * 1024, needsImprovement: 3 * 1024 * 1024 },
  },
};

const SEVERITY = {
  good: '✅ Good',
  medium: '📊 Medium (Needs Improvement)',
  high: '⚠️ High (Poor)',
  critical: '🚨 Critical (Report)',
};

function getSeverity(value, budget, lowerIsBetter = true) {
  if (value == null || budget == null) return null;
  const { report, poor, needsImprovement } = budget;
  if (lowerIsBetter) {
    if (value >= report) return 'critical';
    if (value >= poor) return 'high';
    if (value >= needsImprovement) return 'medium';
    return 'good';
  }
  if (value <= report) return 'critical';
  if (value <= poor) return 'high';
  if (value <= needsImprovement) return 'medium';
  return 'good';
}

function formatBytes(bytes) {
  if (bytes == null) return 'N/A';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
}

function findLatestPerfFile(pageName) {
  if (!fs.existsSync(TEST_RESULTS_DIR)) return null;
  const runDirs = fs.readdirSync(TEST_RESULTS_DIR)
    .map((name) => path.join(TEST_RESULTS_DIR, name))
    .filter((p) => fs.statSync(p).isDirectory());
  let best = { path: null, mtime: 0 };
  for (const dir of runDirs) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.perf.json') && (!pageName || f === `${pageName}.perf.json`));
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.mtimeMs > best.mtime) {
        best = { path: full, mtime: stat.mtimeMs };
      }
    }
  }
  return best.path;
}

function resolveInput(arg) {
  if (!arg) return findLatestPerfFile(null);
  const lower = arg.toLowerCase();
  if (['home', 'plp', 'pdp'].includes(lower)) return findLatestPerfFile(lower);
  if (path.isAbsolute(arg) || arg.startsWith('.')) {
    const resolved = path.resolve(process.cwd(), arg);
    return fs.existsSync(resolved) ? resolved : null;
  }
  const asPath = path.join(process.cwd(), arg);
  return fs.existsSync(asPath) ? asPath : null;
}

function analyze(metrics, pageKey) {
  const budget = BUDGETS[pageKey] || BUDGETS.home;
  const lines = [];
  const criticals = [];
  const warnings = [];

  const checks = [
    { key: 'lcp', label: 'LCP (ms)', value: metrics.lcp, budget: budget.lcp },
    { key: 'cls', label: 'CLS', value: metrics.cls, budget: budget.cls },
    { key: 'ttfb', label: 'TTFB (ms)', value: metrics.ttfb, budget: budget.ttfb },
    { key: 'resourceCount', label: 'Request count', value: metrics.resourceCount, budget: budget.resourceCount },
    { key: 'failedRequestCount', label: 'Failed requests', value: metrics.failedRequestCount, budget: budget.failedRequestCount },
    { key: 'totalTransferSize', label: 'Total transfer size', value: metrics.totalTransferSize, budget: budget.totalTransferSize, format: formatBytes },
  ];

  for (const { key, label, value, budget: b, format } of checks) {
    const sev = getSeverity(value, b, true);
    if (sev == null) continue;
    const display = format ? format(value) : value;
    const msg = `${SEVERITY[sev]} ${label}: ${display}`;
    lines.push(msg);
    if (sev === 'critical') criticals.push(msg);
    if (sev === 'high') warnings.push(msg);
  }

  return { lines, criticals, warnings };
}

function printSlowAndFailed(metrics) {
  const resources = metrics.resources || [];
  const failed = resources.filter((r) => r.failed);
  const byDuration = [...resources].sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 10);
  const bySize = [...resources].filter((r) => (r.transferSize || 0) > 0).sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 5);

  if (failed.length > 0) {
    console.log('\n⚠️ Failed requests:');
    failed.forEach((r) => console.log('  -', r.name));
  }
  if (byDuration.length > 0) {
    console.log('\nSlowest requests (by duration):');
    byDuration.forEach((r) => console.log('  ', (r.duration || 0).toFixed(0), 'ms', r.name));
  }
  if (bySize.length > 0) {
    console.log('\nLargest resources:');
    bySize.forEach((r) => console.log('  ', formatBytes(r.transferSize), r.name));
  }
}

function main() {
  const arg = process.argv[2];
  const filePath = resolveInput(arg);
  if (!filePath) {
    console.error('No .perf.json found. Run performance tests first (npm run perf) or pass a file path.');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const pageKey = (data.pageName || path.basename(filePath, '.perf.json')).toLowerCase();
  const budgetsKey = ['home', 'plp', 'pdp'].includes(pageKey) ? pageKey : 'home';

  console.log('Analyzing:', filePath);
  console.log('Page:', data.pageName || pageKey);
  if (data.url) console.log('URL:', data.url);
  console.log('');

  const { lines, criticals, warnings } = analyze(data, budgetsKey);
  lines.forEach((l) => console.log(l));

  if (criticals.length > 0) {
    console.log('\n🚨 Critical – report immediately:');
    criticals.forEach((c) => console.log(' ', c));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings – monitor / report if trend continues:');
    warnings.forEach((w) => console.log(' ', w));
  }

  printSlowAndFailed(data);
  console.log('\nSummarise: report when any metric is Critical; report High if trend continues; Medium = monitor.');
}

main();
