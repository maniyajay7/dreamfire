/**
 * DreamFire Unified Test Runner
 * 
 * Zero-dependency, ultra-fast test runner executing all test tiers (1-4).
 * Usage:
 *   node tests/run_all_tests.cjs
 *   node tests/run_all_tests.cjs --tier=1
 *   node tests/run_all_tests.cjs --bail
 */

const path = require('node:path');
const process = require('node:process');
const { pathToFileURL } = require('node:url');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

const TIERS = [
  {
    tier: 'Tier 1',
    name: 'Realm Catalog Indexing & Routing',
    file: 'realm_routing.test.js'
  },
  {
    tier: 'Tier 2',
    name: 'Visual Scene Inspection & 3D Spatial Contracts',
    file: 'visual_scene_inspection.test.js'
  },
  {
    tier: 'Tier 2',
    name: 'Flagship Showcase 3D Geometry & Devotee Simulation (M3)',
    file: 'm3_flagship_geometry.test.js'
  },
  {
    tier: 'Tier 3',
    name: 'Multimedia, VideoTexture & Audio Synthesis',
    file: 'multimedia.test.js'
  },
  {
    tier: 'Tier 4',
    name: 'Dynamic AI Prompt Parsing & Scene Graph Mutation',
    file: 'prompt_mutation.test.js'
  },
  {
    tier: 'Tier 5',
    name: 'White-Box Adversarial Hardening (Area A)',
    file: 'm6_challenger_area_a.test.js'
  },
  {
    tier: 'Tier 5',
    name: 'White-Box Adversarial Hardening (Area B)',
    file: 'm6_challenger_area_b.test.js'
  }
];

function printBanner() {
  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🔥 DREAMFIRE: UNIVERSAL DIMENSIONAL REALITY TEST RUNNER (DIWALI 2026)${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.gray}Node: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}${colors.reset}\n`);
}

async function main() {
  printBanner();

  const args = process.argv.slice(2);
  const tierFilterArg = args.find((a) => a.startsWith('--tier='));
  const requestedTier = tierFilterArg ? tierFilterArg.split('=')[1].trim() : null;
  const bail = args.includes('--bail');

  const selectedTiers = requestedTier
    ? TIERS.filter((t) => t.tier.toLowerCase().includes(requestedTier.toLowerCase()) || t.tier.endsWith(requestedTier))
    : TIERS;

  if (selectedTiers.length === 0) {
    console.error(`${colors.red}Error: No test suite matched tier filter '${requestedTier}'${colors.reset}`);
    process.exit(1);
  }

  const harnessUrl = pathToFileURL(path.join(__dirname, 'harness.js')).href;
  const harness = await import(harnessUrl);

  const aggregateResults = {
    totalSuites: 0,
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    tierBreakdown: {},
    failures: [],
    startTime: Date.now()
  };

  for (const tierDef of selectedTiers) {
    const testFilePath = path.join(__dirname, tierDef.file);
    const testFileUrl = pathToFileURL(testFilePath).href;

    // Reset registry before loading suite
    harness.registry.suites = [];
    harness.registry.currentSuite = null;

    try {
      await import(`${testFileUrl}?t=${Date.now()}`);
    } catch (err) {
      console.error(`${colors.red}Failed to load test suite ${tierDef.file}:${colors.reset}`, err);
      aggregateResults.totalFailed++;
      aggregateResults.failures.push({
        tier: tierDef.tier,
        suite: tierDef.name,
        test: 'Suite Load',
        error: err
      });
      if (bail) break;
      continue;
    }

    const tierResults = await harness.registry.run({ bail });

    aggregateResults.totalSuites += tierResults.suitesCount;
    aggregateResults.totalTests += tierResults.testsCount;
    aggregateResults.totalPassed += tierResults.passedCount;
    aggregateResults.totalFailed += tierResults.failedCount;
    aggregateResults.totalSkipped += tierResults.skippedCount;
    aggregateResults.failures.push(...tierResults.failures);

    aggregateResults.tierBreakdown[tierDef.tier] = {
      name: tierDef.name,
      tests: tierResults.testsCount,
      passed: tierResults.passedCount,
      failed: tierResults.failedCount,
      skipped: tierResults.skippedCount,
      durationMs: tierResults.durationMs
    };

    if (bail && tierResults.failedCount > 0) {
      console.log(`\n${colors.yellow}Execution halted early due to --bail flag.${colors.reset}`);
      break;
    }
  }

  const totalDuration = Date.now() - aggregateResults.startTime;

  // Print Summary Table
  console.log(`\n${colors.bold}${colors.white}----------------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}${colors.white}                 TEST EXECUTION SUMMARY BY TIER                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.white}----------------------------------------------------------------------${colors.reset}`);

  for (const [tierKey, data] of Object.entries(aggregateResults.tierBreakdown)) {
    const statusColor = data.failed > 0 ? colors.red : colors.green;
    const statusLabel = data.failed > 0 ? 'FAIL' : 'PASS';
    console.log(
      ` ${colors.bold}${tierKey.padEnd(8)}${colors.reset} | ${data.name.padEnd(46)} | ` +
      `${statusColor}${statusLabel.padEnd(6)}${colors.reset} ` +
      `(${data.passed}/${data.tests} passed, ${data.durationMs}ms)`
    );
  }

  console.log(`${colors.bold}${colors.white}----------------------------------------------------------------------${colors.reset}`);
  console.log(
    ` ${colors.bold}TOTALS${colors.reset}   | Tests: ${colors.bold}${aggregateResults.totalTests}${colors.reset} | ` +
    `Passed: ${colors.green}${aggregateResults.totalPassed}${colors.reset} | ` +
    `Failed: ${aggregateResults.totalFailed > 0 ? colors.red : colors.green}${aggregateResults.totalFailed}${colors.reset} | ` +
    `Skipped: ${colors.yellow}${aggregateResults.totalSkipped}${colors.reset} | ` +
    `Duration: ${totalDuration}ms`
  );
  console.log(`${colors.bold}${colors.white}----------------------------------------------------------------------${colors.reset}`);

  if (aggregateResults.totalFailed > 0) {
    console.log(`\n${colors.bold}${colors.red}❌ BASELINE STATUS: ${aggregateResults.totalFailed} TEST(S) FAILED${colors.reset}`);
    console.log(`${colors.gray}The failing tests reflect unmigrated baseline specifications scheduled for implementation milestones M1-M5.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.bold}${colors.green}✔ ALL TEST SUITES PASSED CLEANLY (100% SUCCESS)${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Fatal Runner Error:${colors.reset}`, err);
  process.exit(1);
});
