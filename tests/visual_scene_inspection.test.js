/**
 * Tier 2 Test Suite: Visual Scene Inspection & 3D Spatial Contracts
 * 
 * Verifies:
 * - Total ABSENCE of flat 2D image backdrops (#panorama-layer and #foreground-layer CSS transform fallbacks)
 * - Contextual gating: 0 floating diyas / water planes on dry, secular, or cosmic realms
 *   (e.g., Giza pyramids, Kedarnath glacial peak, Orion nebula, Tokyo cyberpunk)
 * - Presence of true 3D spatial geometry: Three.js 3D Skydome Sphere and procedural terrain meshes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const CONTEXTUAL_ENTITIES_PATH = path.join(ROOT_DIR, 'src', 'engine', 'ContextualEntities.js');
const SCENE_MANAGER_PATH = path.join(ROOT_DIR, 'src', 'engine', 'SceneManager.js');

suite('Tier 2: Visual Scene Inspection & 3D Spatial Contracts', 'Tier 2', () => {
  let indexHtml = '';
  let catalogData = [];

  test('Load project files for visual scene inspection', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist');
    indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    assert.ok(fs.existsSync(CATALOG_PATH), 'realms_catalog.json must exist');
    catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  });

  test('Confirms ABSENCE of flat 2D image backdrop fallbacks (#panorama-layer and CSS transforms)', () => {
    // In accordance with R2 and F4:
    // Flat 2D image transforms (#panorama-layer, #foreground-layer) must be eliminated
    // in favor of authentic 3D spatial rendering via Three.js Skydomes.
    const hasPanoramaLayerId = /id=["']panorama-layer["']/i.test(indexHtml);
    const hasForegroundLayerId = /id=["']foreground-layer["']/i.test(indexHtml);
    const hasUpdatePanoramaTransform = /function\s+updatePanoramaTransform\s*\(/i.test(indexHtml);

    const violations = [];
    if (hasPanoramaLayerId) violations.push('#panorama-layer element present in DOM');
    if (hasForegroundLayerId) violations.push('#foreground-layer element present in DOM');
    if (hasUpdatePanoramaTransform) violations.push('updatePanoramaTransform() CSS transform fallback present');

    assert.strictEqual(
      violations.length,
      0,
      `Flat 2D image backdrop fallback detected in index.html:\n- ${violations.join('\n- ')}\n` +
      `Must be replaced with Three.js 3D Spherical Skydomes as specified in R2 & F4.`
    );
  });

  test('Confirms festive diya assets are strictly context-gated (0 diyas on secular/dry/cosmic realms)', async () => {
    // Context-gating contract:
    // Secular / dry / cosmic / cyberpunk realms MUST NOT spawn floating diyas or Sarayu river planes.
    // Floating diyas are only permissible in sacred cultural water bodies (e.g. Ayodhya, Varanasi).

    const drySecularRealmIds = [
      'giza-pyramids-orion-alignment', // Giza pyramids (Ancient Wonders, desert)
      'kedarnath-himalayan-peak',     // Kedarnath (Glacial mountain peak)
      'orion-deep-nebula',            // Orion Nebula (Cosmic Odyssey)
      'neo-tokyo-shinjuku-crossing'   // Tokyo (Cyberpunk & Sci-Fi)
    ];

    const sacredWaterRealmIds = [
      'ayodhya-ram-mandir',           // Ayodhya Ram Mandir (Sacred & Spiritual, Sarayu river)
      'varanasi-maha-aarti'           // Varanasi Maha Aarti (Sacred & Spiritual, Ganga river)
    ];

    // Check if modular ContextualEntities.js engine module exists
    let contextualModule = null;
    if (fs.existsSync(CONTEXTUAL_ENTITIES_PATH)) {
      try {
        const fileUrl = 'file:///' + CONTEXTUAL_ENTITIES_PATH.replace(/\\/g, '/');
        contextualModule = await import(fileUrl);
      } catch (e) {
        console.warn(`Could not import ContextualEntities.js: ${e.message}`);
      }
    }

    if (contextualModule && typeof contextualModule.canSpawnDiyas === 'function') {
      // Test the modular engine contract
      for (const id of drySecularRealmIds) {
        const realm = catalogData.find((r) => r.id === id);
        assert.ok(realm, `Realm '${id}' must exist in catalog`);
        const allowed = contextualModule.canSpawnDiyas(realm);
        assert.strictEqual(
          allowed,
          false,
          `Contextual gating violation: canSpawnDiyas returned true for dry/secular realm '${id}'`
        );
      }

      for (const id of sacredWaterRealmIds) {
        const realm = catalogData.find((r) => r.id === id);
        assert.ok(realm, `Realm '${id}' must exist in catalog`);
        const allowed = contextualModule.canSpawnDiyas(realm);
        assert.strictEqual(
          allowed,
          true,
          `canSpawnDiyas must allow festive diyas for sacred water realm '${id}'`
        );
      }
    } else {
      // Inspect inline buildPhotographicWorld implementation in index.html
      // Baseline check: Does buildPhotographicWorld conditionally guard diya/sarayuRiverMesh spawning?
      const fnMatch = indexHtml.match(/function\s+buildPhotographicWorld\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s{2,4}function|\n\s{2,4}\/\/|\n\s*<\/script>)/);
      assert.ok(fnMatch, 'buildPhotographicWorld function must be present in index.html');

      const fnBody = fnMatch[1];

      // Check whether sarayuRiverMesh is spawned unconditionally without gating
      const spawnsRiverUnconditionally =
        fnBody.includes('sarayuRiverMesh = new THREE.Mesh') &&
        !/if\s*\([^)]*(festiveContext|hasWaterBody|isSacredWater|isAyodhya|isVaranasi)[^)]*\)\s*\{[\s\S]*?sarayuRiverMesh/i.test(fnBody);

      // Check whether floating diyas are spawned unconditionally
      const spawnsDiyasUnconditionally =
        fnBody.includes('createDiyaMesh') &&
        !/if\s*\([^)]*(festiveContext|hasWaterBody|isSacredWater)[^)]*\)\s*\{[\s\S]*?createDiyaMesh/i.test(fnBody);

      const violations = [];
      if (spawnsRiverUnconditionally) {
        violations.push('sarayuRiverMesh is added to scene unconditionally for all realms');
      }
      if (spawnsDiyasUnconditionally) {
        violations.push('createDiyaMesh adds floating diyas indiscriminately to dry/secular realms');
      }

      assert.strictEqual(
        violations.length,
        0,
        `Indiscriminate diya/water placement detected in buildPhotographicWorld:\n- ${violations.join('\n- ')}\n` +
        `Festive diya assets must be strictly gated (0 diyas on Giza, Kedarnath, Orion, Tokyo) as required by R2 & F5.`
      );
    }
  });

  test('Asserts 3D spatial geometry presence (Skydome sphere and procedural terrain)', () => {
    // Check for Three.js 3D spherical skydome geometry instantiation
    // (e.g., THREE.SphereGeometry with radius >= 100 and BackSide material)
    const hasSphereGeometry =
      /THREE\.SphereGeometry\s*\(\s*(?:[1-9]\d{2,}|500|1000)/i.test(indexHtml) ||
      (fs.existsSync(SCENE_MANAGER_PATH) && /SphereGeometry/i.test(fs.readFileSync(SCENE_MANAGER_PATH, 'utf8')));

    // Check for procedural 3D terrain mesh (e.g., PlaneGeometry with height/noise displacement)
    const hasProceduralTerrain =
      /THREE\.PlaneGeometry\s*\(/i.test(indexHtml) ||
      (fs.existsSync(SCENE_MANAGER_PATH) && /PlaneGeometry/i.test(fs.readFileSync(SCENE_MANAGER_PATH, 'utf8')));

    // Check for WebGLRenderer
    const hasWebGLRenderer =
      /THREE\.WebGLRenderer\s*\(/i.test(indexHtml) ||
      (fs.existsSync(SCENE_MANAGER_PATH) && /WebGLRenderer/i.test(fs.readFileSync(SCENE_MANAGER_PATH, 'utf8')));

    assert.ok(hasWebGLRenderer, 'Scene engine must instantiate THREE.WebGLRenderer for 3D spatial rendering');
    assert.ok(
      hasSphereGeometry,
      'Scene engine must instantiate THREE.SphereGeometry (radius >= 100) for 3D panoramic skydome, replacing flat 2D planes (F4)'
    );
    assert.ok(hasProceduralTerrain, 'Scene engine must define 3D terrain geometry for environmental immersion (F6)');
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('visual_scene_inspection.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
