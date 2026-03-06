# Performance Testing Quick Start — Malas Tyres & Wheels

This guide explains how to run performance tests against **Malas** and analyze the results.

**Base URL:** `https://www.malas.co.za/`

---

## Prerequisites

- Node.js and npm installed
- Dependencies installed: `npm install`
- Playwright browsers installed: `npx playwright install chromium`

---

## Running Performance Tests

```bash
# Run all performance tests
npm run perf

# Run a specific performance test (match the test name from your suite)
npm test -- tests/Performance/PerformanceSmoke.spec.js --project=chromium --grep "homepage"
npm test -- tests/Performance/PerformanceSmoke.spec.js --project=chromium --grep "PLP"
npm test -- tests/Performance/PerformanceSmoke.spec.js --project=chromium --grep "PDP"
# Add one line per page you measure; match the "grep" to your test names
```

Tests write JSON files under `test-results/`.

---

## Pages We Measure

| Page key | Used in CLI | Description |
|----------|-------------|-------------|
| `home` | `npm run perf:analyze home` | Homepage |
| `plp` | `npm run perf:analyze plp` | Category/listing page (e.g. Tyres shop, Shop wheels) |
| `pdp` | `npm run perf:analyze pdp` | Product detail page |

Edit this table so the **Page key** column matches the `name` values in your performance test and in `utils/analyzePerf.js` (BUDGETS). Add or remove rows to match your tests.

---

## Analyzing Results

### Option 1: Use the analyzer script (recommended)

**By page name:**

```bash
npm run perf:analyze home
npm run perf:analyze plp
npm run perf:analyze pdp
```

**By file path:**

```bash
npm run perf:analyze test-results/<run-folder>/<page-name>.perf.json

# Or with node directly:
node utils/analyzePerf.js test-results/<run-folder>/home.perf.json
```

**Most recent file (any page):**

```bash
npm run perf:analyze
```

The analyzer will:

- Show metrics with severity (✅ Good, 📊 Medium, ⚠️ High, 🚨 Critical)
- Call out critical issues for immediate reporting
- List warnings to monitor
- Show slowest and failed requests
- Summarize what to report

### Option 2: Manual review

1. Open the `.perf.json` file from `test-results/`.
2. Compare metrics to your thresholds (e.g. in `PERFORMANCE_METRICS_GUIDE.md`).
3. Note any metrics that exceed your limits.

---

## Where Results Are Saved

```
test-results/<test-run-folder>/<page-name>.perf.json
```

Example:

```
test-results/Performance-Smoke-Malas-homepage-chromium-abc123/home.perf.json
```

---

## Quick Decision: Should I Report?

```
Is any metric above our "report" threshold?
├─ YES → 🚨 Report immediately (Critical)
└─ NO  → Continue…

Are metrics consistently in the "Poor" range?
├─ YES → ⚠️ Report (High priority)
└─ NO  → Continue…

Are metrics in the "Needs Improvement" range?
├─ YES → 📊 Monitor; report if the trend continues (Medium priority)
└─ NO  → ✅ No action needed
```

---

## Example Workflow

1. **Run tests:** `npm run perf`
2. **Analyze by page:**
   ```bash
   npm run perf:analyze home
   npm run perf:analyze plp
   npm run perf:analyze pdp
   ```
3. **Read the output** for 🚨 Critical and ⚠️ Warning lines.
4. **Report when needed** using your standard template (e.g. from `PERFORMANCE_METRICS_GUIDE.md`).

---

## Common Issues and What They Mean

| Issue | Meaning | Suggested action |
|-------|---------|------------------|
| 🚨 LCP above threshold | Main content takes too long to appear | Report and investigate |
| 🚨 CLS above threshold | Layout shifts during load | Report and investigate |
| ⚠️ Failed requests | Some resources did not load | Check network/env; report if consistent |
| ⚠️ Very large resources | Single files are very large | Report if above your size policy (e.g. > 2MB) |
| ⚠️ High request count | Page makes too many HTTP requests | Report if above your limit (e.g. > 200) |

---

## Need More Detail?

- **Metrics and thresholds:** see `docs/PERFORMANCE_METRICS_GUIDE.md` (or your project's equivalent).
- **Test code:** see `tests/Performance/PerformanceSmoke.spec.js` and `utils/perf.js` / `utils/analyzePerf.js`.
