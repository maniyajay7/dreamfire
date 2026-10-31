/**
 * Tier 1 Test Suite: Realm Catalog, Indexing & Routing
 * 
 * Verifies:
 * - All 110 realms are properly indexed in realms_catalog.json
 * - Unique, non-empty, kebab-case IDs
 * - Mandatory schema compliance (title, category, description, soundscape, tags, etc.)
 * - All referenced image & video assets physically exist on disk
 * - Category coverage and accurate filtering across all 6 canonical categories
 * - Search query matching across title, category, description, and tags
 * - Consistency with inline database in index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

const CANONICAL_CATEGORIES = [
  'Sacred & Spiritual',
  'Nature & Retreat',
  'Cosmic Odyssey',
  'Cyberpunk & Sci-Fi',
  'Ancient Wonders',
  'Zen Meditation'
];

suite('Tier 1: Realm Catalog Indexing & Routing', 'Tier 1', () => {
  let catalogData = [];

  test('Catalog file exists and parses as a valid JSON array', () => {
    assert.ok(fs.existsSync(CATALOG_PATH), `realms_catalog.json not found at ${CATALOG_PATH}`);
    const rawContent = fs.readFileSync(CATALOG_PATH, 'utf8');
    assert.ok(rawContent.trim().length > 0, 'realms_catalog.json is empty');
    catalogData = JSON.parse(rawContent);
    assert.ok(Array.isArray(catalogData), 'Catalog data must be an array');
  });

  test('Catalog contains all 110 realms with unique kebab-case IDs', () => {
    assert.strictEqual(
      catalogData.length,
      110,
      `Expected exactly 110 indexed realms, but found ${catalogData.length}`
    );

    const seenIds = new Set();
    const idRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    catalogData.forEach((realm, index) => {
      assert.ok(realm.id, `Realm at index ${index} is missing an 'id'`);
      assert.strictEqual(typeof realm.id, 'string', `Realm id at index ${index} must be a string`);
      assert.ok(
        idRegex.test(realm.id),
        `Realm id '${realm.id}' does not match kebab-case pattern /^[a-z0-9]+(-[a-z0-9]+)*$/`
      );
      assert.ok(!seenIds.has(realm.id), `Duplicate realm ID detected: '${realm.id}' at index ${index}`);
      seenIds.add(realm.id);
    });

    assert.strictEqual(seenIds.size, 110, 'Total unique IDs must equal 110');
  });

  test('Every realm satisfies mandatory schema contract', () => {
    catalogData.forEach((realm) => {
      // Title
      assert.ok(realm.title && typeof realm.title === 'string', `Realm '${realm.id}' missing valid title`);
      assert.ok(realm.title.trim().length >= 3, `Realm '${realm.id}' title too short: '${realm.title}'`);

      // Category
      assert.ok(
        CANONICAL_CATEGORIES.includes(realm.category),
        `Realm '${realm.id}' has invalid category '${realm.category}'. Allowed: ${CANONICAL_CATEGORIES.join(', ')}`
      );

      // Tagline
      assert.ok(realm.tagline && typeof realm.tagline === 'string', `Realm '${realm.id}' missing tagline`);
      assert.ok(realm.tagline.trim().length > 0, `Realm '${realm.id}' tagline is empty`);

      // Description
      assert.ok(realm.description && typeof realm.description === 'string', `Realm '${realm.id}' missing description`);
      assert.ok(
        realm.description.trim().length >= 15,
        `Realm '${realm.id}' description too short: '${realm.description}'`
      );

      // Soundscape
      assert.ok(realm.soundscape && typeof realm.soundscape === 'string', `Realm '${realm.id}' missing soundscape`);
      assert.ok(realm.soundscape.trim().length > 0, `Realm '${realm.id}' soundscape is empty`);

      // Tags
      assert.ok(Array.isArray(realm.tags), `Realm '${realm.id}' tags must be an array`);
      assert.ok(realm.tags.length >= 1, `Realm '${realm.id}' must have at least 1 tag`);
      realm.tags.forEach((tag, tIdx) => {
        assert.ok(typeof tag === 'string' && tag.trim().length > 0, `Realm '${realm.id}' tag at ${tIdx} is empty`);
      });

      // Souls visiting and resonance
      assert.ok(
        typeof realm.soulsVisiting === 'number' && realm.soulsVisiting > 0,
        `Realm '${realm.id}' soulsVisiting must be a positive number`
      );
      assert.ok(
        typeof realm.resonance === 'string' && /^\d+(\.\d+)?%$/.test(realm.resonance),
        `Realm '${realm.id}' resonance '${realm.resonance}' must be a percentage string (e.g. 99.5%)`
      );
    });
  });

  test('All referenced image and media assets physically exist on disk in Z:\\dreamfire', () => {
    const missingAssets = [];

    catalogData.forEach((realm) => {
      // bgImage
      assert.ok(realm.bgImage && typeof realm.bgImage === 'string', `Realm '${realm.id}' missing bgImage`);
      const normalizedPath = realm.bgImage.replace(/^[/\\]+/, '');
      const fullPath = path.join(ROOT_DIR, normalizedPath);

      if (!fs.existsSync(fullPath)) {
        missingAssets.push({ realm: realm.id, type: 'bgImage', path: normalizedPath });
      } else {
        const stats = fs.statSync(fullPath);
        assert.ok(stats.isFile() && stats.size > 0, `Asset file is empty: ${fullPath}`);
      }

      // videoLoop (optional)
      if (realm.videoLoop) {
        const videoNorm = realm.videoLoop.replace(/^[/\\]+/, '');
        const videoFullPath = path.join(ROOT_DIR, videoNorm);
        if (!fs.existsSync(videoFullPath)) {
          missingAssets.push({ realm: realm.id, type: 'videoLoop', path: videoNorm });
        } else {
          const vStats = fs.statSync(videoFullPath);
          assert.ok(vStats.isFile() && vStats.size > 0, `Video file is empty: ${videoFullPath}`);
        }
      }
    });

    assert.strictEqual(
      missingAssets.length,
      0,
      `Detected missing disk assets: ${JSON.stringify(missingAssets, null, 2)}`
    );
  });

  test('Category coverage ensures robust distribution across all 6 canonical categories', () => {
    const distribution = {};
    CANONICAL_CATEGORIES.forEach((cat) => {
      distribution[cat] = 0;
    });

    catalogData.forEach((realm) => {
      distribution[realm.category]++;
    });

    CANONICAL_CATEGORIES.forEach((cat) => {
      assert.ok(
        distribution[cat] >= 10,
        `Category '${cat}' has insufficient realm coverage: ${distribution[cat]} (minimum 10 required)`
      );
    });

    // Verify filter logic partitions catalog cleanly
    let totalFiltered = 0;
    CANONICAL_CATEGORIES.forEach((cat) => {
      const filtered = catalogData.filter((r) => r.category === cat);
      assert.strictEqual(filtered.length, distribution[cat]);
      totalFiltered += filtered.length;
    });
    assert.strictEqual(totalFiltered, 110, 'Sum of category partitions must equal total realms');
  });

  test('Search querying matches realms accurately by title, tags, and keywords', () => {
    // Simulation of search algorithm matching application logic
    function searchRealms(query, realms) {
      if (!query || !query.trim()) return realms;
      const terms = query.toLowerCase().trim().split(/\s+/);
      return realms.filter((realm) => {
        const title = (realm.title || '').toLowerCase();
        const tagline = (realm.tagline || '').toLowerCase();
        const desc = (realm.description || '').toLowerCase();
        const cat = (realm.category || '').toLowerCase();
        const tags = (realm.tags || []).map((t) => t.toLowerCase());

        return terms.every(
          (term) =>
            title.includes(term) ||
            tagline.includes(term) ||
            desc.includes(term) ||
            cat.includes(term) ||
            tags.some((tag) => tag.includes(term)) ||
            realm.id.includes(term)
        );
      });
    }

    // Test specific well-known realms
    const ramMandirResults = searchRealms('Ram Mandir', catalogData);
    assert.ok(ramMandirResults.some((r) => r.id === 'ayodhya-ram-mandir'), 'Query "Ram Mandir" must match Ayodhya realm');

    const gizaResults = searchRealms('Pyramids Giza', catalogData);
    assert.ok(gizaResults.some((r) => r.id === 'giza-pyramids-orion-alignment'), 'Query "Pyramids Giza" must match Giza realm');

    const tokyoResults = searchRealms('Tokyo Shinjuku', catalogData);
    assert.ok(tokyoResults.some((r) => r.id === 'neo-tokyo-shinjuku-crossing'), 'Query "Tokyo Shinjuku" must match Tokyo realm');

    const kedarnathResults = searchRealms('Kedarnath Shiva', catalogData);
    assert.ok(kedarnathResults.some((r) => r.id === 'kedarnath-himalayan-peak'), 'Query "Kedarnath Shiva" must match Kedarnath');

    const orionResults = searchRealms('Orion Nebula', catalogData);
    assert.ok(orionResults.some((r) => r.id === 'orion-deep-nebula'), 'Query "Orion Nebula" must match Orion realm');

    // Case insensitivity & padding test
    const paddedSearch = searchRealms('   kYOTO   ', catalogData);
    assert.ok(paddedSearch.length > 0, 'Padded mixed-case search "   kYOTO   " must find results');

    // Negative search test
    const nonExistent = searchRealms('nonexistent_realm_query_123456789', catalogData);
    assert.strictEqual(nonExistent.length, 0, 'Non-matching query must return 0 results');
  });

  test('Inline database in index.html is synchronized with realms_catalog.json', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html not found');
    const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Look for ALL_REALMS assignment
    const match = indexHtml.match(/const\s+ALL_REALMS\s*=\s*(\[[\s\S]*?\]);/);
    assert.ok(match, "index.html must contain 'const ALL_REALMS = [...]'");

    let inlineRealms = [];
    try {
      inlineRealms = JSON.parse(match[1]);
    } catch (e) {
      assert.fail(`Failed to parse ALL_REALMS JSON in index.html: ${e.message}`);
    }

    assert.strictEqual(inlineRealms.length, 110, `ALL_REALMS in index.html must have 110 items, found ${inlineRealms.length}`);

    // Verify all IDs match
    const catalogIds = catalogData.map((r) => r.id);
    const inlineIds = inlineRealms.map((r) => r.id);
    assert.deepStrictEqual(inlineIds, catalogIds, 'ALL_REALMS in index.html does not match realms_catalog.json IDs');
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('realm_routing.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
