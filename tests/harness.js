/**
 * DreamFire Zero-Dependency Test Harness
 * 
 * Provides suite, test, assert, and colored formatting for Node.js test execution.
 */
import assert from 'node:assert/strict';

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
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

class TestRegistry {
  constructor() {
    this.currentSuite = null;
    this.suites = [];
  }

  suite(name, tier, fn) {
    if (typeof tier === 'function') {
      fn = tier;
      tier = 'Unclassified';
    }
    const suiteObj = {
      name,
      tier,
      tests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: []
    };
    this.suites.push(suiteObj);
    const prevSuite = this.currentSuite;
    this.currentSuite = suiteObj;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.suite('Default Suite', 'General', () => {});
      this.currentSuite = this.suites[this.suites.length - 1];
    }
    this.currentSuite.tests.push({
      name,
      fn,
      skip: false
    });
  }

  skip(name, fn) {
    if (!this.currentSuite) {
      this.suite('Default Suite', 'General', () => {});
      this.currentSuite = this.suites[this.suites.length - 1];
    }
    this.currentSuite.tests.push({
      name,
      fn,
      skip: true
    });
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllFns.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllFns.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachFns.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachFns.push(fn);
  }

  async run(options = {}) {
    const { quiet = false, bail = false } = options;
    const results = {
      suitesCount: this.suites.length,
      testsCount: 0,
      passedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      startTime: Date.now(),
      endTime: null,
      durationMs: 0,
      failures: []
    };

    for (const suite of this.suites) {
      if (!quiet) {
        console.log(`\n${colors.bold}${colors.cyan}▶ [${suite.tier}] ${suite.name}${colors.reset}`);
      }

      for (const bAll of suite.beforeAllFns) {
        await bAll();
      }

      for (const t of suite.tests) {
        results.testsCount++;
        if (t.skip) {
          results.skippedCount++;
          if (!quiet) {
            console.log(`  ${colors.yellow}⊘ SKIP:${colors.reset} ${t.name}`);
          }
          continue;
        }

        const tStart = Date.now();
        let error = null;

        for (const bEach of suite.beforeEachFns) {
          try {
            await bEach();
          } catch (err) {
            error = err;
            break;
          }
        }

        if (!error) {
          try {
            await t.fn();
          } catch (err) {
            error = err;
          }
        }

        for (const aEach of suite.afterEachFns) {
          try {
            await aEach();
          } catch (err) {
            if (!error) error = err;
          }
        }

        const duration = Date.now() - tStart;

        if (error) {
          results.failedCount++;
          const failureEntry = {
            suite: suite.name,
            tier: suite.tier,
            test: t.name,
            error,
            duration
          };
          results.failures.push(failureEntry);

          if (!quiet) {
            console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${t.name} ${colors.gray}(${duration}ms)${colors.reset}`);
            const errorMsg = error.stack || error.message || String(error);
            const indented = errorMsg.split('\n').map(l => `    ${colors.red}${l}${colors.reset}`).join('\n');
            console.log(indented);
          }

          if (bail) {
            break;
          }
        } else {
          results.passedCount++;
          if (!quiet) {
            console.log(`  ${colors.green}✔ PASS:${colors.reset} ${t.name} ${colors.gray}(${duration}ms)${colors.reset}`);
          }
        }
      }

      for (const aAll of suite.afterAllFns) {
        try {
          await aAll();
        } catch (err) {
          console.error(`Error in afterAll: ${err.message}`);
        }
      }

      if (bail && results.failedCount > 0) {
        break;
      }
    }

    results.endTime = Date.now();
    results.durationMs = results.endTime - results.startTime;
    return results;
  }
}

const registry = new TestRegistry();

export const suite = (name, tier, fn) => registry.suite(name, tier, fn);
export const test = (name, fn) => registry.test(name, fn);
export const skip = (name, fn) => registry.skip(name, fn);
export const beforeAll = (fn) => registry.beforeAll(fn);
export const afterAll = (fn) => registry.afterAll(fn);
export const beforeEach = (fn) => registry.beforeEach(fn);
export const afterEach = (fn) => registry.afterEach(fn);
export const run = (options) => registry.run(options);
export { assert, colors, registry };
