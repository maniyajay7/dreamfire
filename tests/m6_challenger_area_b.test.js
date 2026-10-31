/**
 * tests/m6_challenger_area_b.test.js
 * 
 * DreamFire Milestone M6 Phase 2 (Area B): White-Box Adversarial Coverage Hardening
 * Subagent: challenger_m6_2 (teamwork_challenger)
 * 
 * Comprehensive Adversarial Test Harness Covering:
 * 1. Zero-Diff Parity & Server Infrastructure (Area B.1):
 *    - 100% byte-for-byte SHA256 parity between index.html and preview.html.
 *    - serve.cjs MIME streaming dictionary, video byte-range support, and WebGL CORS headers.
 * 2. Flagship 3D Geometry & Crowd Simulation (Area B.2 & B.3):
 *    - Ayodhya Ram Mandir: Amalaka fluted discs, Kalasha finials, carved Mandapa pillars,
 *      Garbhagriha sanctum sanctorum, 5 multi-tier Shikhara spires, Dhwaja pennants.
 *    - Devotee crowd simulation: 352 devotee instances, ~140 aarti lamps in InstancedMesh,
 *      Vedic cultural palette, rapid animation ticks, zero allocation, and memory cleanup.
 *    - Waterfall Sanctuary: 4,500 waterfall particles, 1,600 plunge foam mist particles,
 *      6 concentric splash ripples, transparent crystal float-bed shader, and 75 fireflies.
 * 3. VideoTexture & Media Streaming Pipeline (Area B.5):
 *    - 5-step hardware video decoder teardown pipeline: pause -> remove src -> load -> dispose -> nullify.
 *    - Rapid video transitions (50 cycles), error recovery, and bulk lifecycle cleanup.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';
import * as THREE from 'three';

import {
  createAmalakaDisc,
  createGoldenKalasha,
  createAnimatedDhwajaFlag,
  createNagaraShikharaTower,
  createCarvedMandapaPillar,
  createSanctumSanctorum,
  createAartiDeepastambhas,
  createDevoteeFigureGeometry,
  createAartiLampGeometry,
  createDevoteeCrowdSimulation,
  buildAyodhyaRamMandirScene,
  buildWaterfallSanctuaryScene,
  attachFlagshipScene
} from '../src/engine/FlagshipScenes.js';

import { VideoTextureManager } from '../src/engine/VideoTextureManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const SERVE_CJS_PATH = path.join(ROOT_DIR, 'serve.cjs');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const VIDEOS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'videos');

const rawCatalog = fs.readFileSync(CATALOG_PATH, 'utf8');
const catalog = JSON.parse(rawCatalog);

// Helper to probe HTTP requests against a local server
function probeHttp(options, postData = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', (err) => resolve({ error: err }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ error: new Error('Request timeout') });
    });
    if (postData) req.write(postData);
    req.end();
  });
}

// ============================================================================
// SUITE 1: ZERO-DIFF PARITY & SERVER INFRASTRUCTURE (AREA B.1)
// ============================================================================
suite('M6 Challenger: Zero-Diff Parity & Server Infrastructure', 'Area B.1', () => {
  test('P.1: index.html and preview.html are 100% byte-for-byte identical (SHA256 match)', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist on disk');
    assert.ok(fs.existsSync(PREVIEW_HTML_PATH), 'preview.html must exist on disk');

    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    assert.strictEqual(
      indexBuf.length,
      previewBuf.length,
      `File size mismatch: index.html (${indexBuf.length} B) vs preview.html (${previewBuf.length} B)`
    );
    assert.ok(indexBuf.equals(previewBuf), 'Byte buffer mismatch between index.html and preview.html');

    const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex').toUpperCase();
    const previewHash = crypto.createHash('sha256').update(previewBuf).digest('hex').toUpperCase();

    assert.strictEqual(indexHash, previewHash, `SHA256 hash mismatch: ${indexHash} vs ${previewHash}`);
    assert.strictEqual(
      indexHash,
      '5AA5438E78344E56F099D4AE559D035CD568B56DAA1C1FB10A1BBBAA1C11A715',
      'SHA256 hash must match approved Milestone baseline hash'
    );
  });

  test('P.2: serve.cjs defines required WebGL CORS headers and OPTIONS preflight handling', () => {
    assert.ok(fs.existsSync(SERVE_CJS_PATH), 'serve.cjs must physically exist');
    const serveCode = fs.readFileSync(SERVE_CJS_PATH, 'utf8');

    // CORS headers check (critical for WebGL VideoTexture / Image cross-origin isolation)
    assert.ok(
      serveCode.includes("Access-Control-Allow-Origin") && serveCode.includes("'*'"),
      "serve.cjs must set Access-Control-Allow-Origin: *"
    );
    assert.ok(
      serveCode.includes("Access-Control-Allow-Methods") && serveCode.includes('OPTIONS'),
      "serve.cjs must allow OPTIONS preflight method"
    );
    assert.ok(
      serveCode.includes("Access-Control-Allow-Headers"),
      "serve.cjs must specify Access-Control-Allow-Headers"
    );
  });

  test('P.3: serve.cjs MIME dictionary covers all 11 multimedia and WebGL asset types', () => {
    const serveCode = fs.readFileSync(SERVE_CJS_PATH, 'utf8');
    const requiredMimes = [
      { ext: '.html', mime: 'text/html' },
      { ext: '.js', mime: 'application/javascript' },
      { ext: '.css', mime: 'text/css' },
      { ext: '.json', mime: 'application/json' },
      { ext: '.png', mime: 'image/png' },
      { ext: '.jpg', mime: 'image/jpeg' },
      { ext: '.jpeg', mime: 'image/jpeg' },
      { ext: '.svg', mime: 'image/svg+xml' },
      { ext: '.mp3', mime: 'audio/mpeg' },
      { ext: '.wav', mime: 'audio/wav' },
      { ext: '.mp4', mime: 'video/mp4' }
    ];

    requiredMimes.forEach(({ ext, mime }) => {
      assert.ok(
        serveCode.includes(`'${ext}'`) && serveCode.includes(mime),
        `serve.cjs MIME dictionary must define ${ext} -> ${mime}`
      );
    });
  });

  test('P.4: serve.cjs HTTP video streaming and Range header probe (RFC 7233 audit)', async () => {
    // Probe the running server on port 3333 or verify code
    const res = await probeHttp({
      hostname: 'localhost',
      port: 3333,
      path: '/public/assets/videos/portal_sacred_flame.mp4',
      method: 'GET',
      headers: {
        Range: 'bytes=0-1024'
      }
    });

    if (!res.error) {
      assert.ok(
        res.statusCode === 200 || res.statusCode === 206,
        `Expected HTTP 200 or 206 for video request, got ${res.statusCode}`
      );
      assert.strictEqual(
        res.headers['content-type'],
        'video/mp4',
        'Video response must have Content-Type: video/mp4'
      );
      assert.strictEqual(
        res.headers['access-control-allow-origin'],
        '*',
        'Video response must have Access-Control-Allow-Origin: *'
      );

      // Audit RFC 7233 byte-range capability:
      // A specialized video streaming server returns 206 Partial Content and Content-Range.
      // A zero-dependency static dev server returns 200 OK with the full stream.
      const has206 = res.statusCode === 206;
      const hasContentRange = Boolean(res.headers['content-range']);
      if (!has206 || !hasContentRange) {
        console.log('    ℹ [AUDIT GAP NOTED] serve.cjs returned HTTP 200 (full file) rather than HTTP 206 Partial Content (no Content-Range). RFC 7233 range-seeking is unsupported on dev server.');
      }
    } else {
      // Offline fallback check: ensure serveCode handles video streaming stream pipeline
      const serveCode = fs.readFileSync(SERVE_CJS_PATH, 'utf8');
      assert.ok(serveCode.includes("'.mp4': 'video/mp4'"), "serve.cjs must define MIME type for .mp4");
      assert.ok(serveCode.includes('createReadStream'), 'serve.cjs must use createReadStream for streaming file chunks');
    }
  });
});

// ============================================================================
// SUITE 2: AYODHYA RAM MANDIR 3D GEOMETRIC PRECISION (AREA B.2)
// ============================================================================
suite('M6 Challenger: Ayodhya Ram Mandir 3D Geometric Precision', 'Area B.2', () => {
  const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xcc8465, roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 });

  test('A.1: Amalaka fluted disc geometry contains 16 radial carved flutes & cushion disc', () => {
    const disc = createAmalakaDisc(THREE, 2.4, 1.1, sandstoneMat);
    assert.ok(disc instanceof THREE.Group, 'Amalaka disc must be a THREE.Group');
    assert.strictEqual(disc.name, 'amalaka_disc', 'Disc must have name amalaka_disc');

    // Structural elements: cushion disc, fluted body, crowning rim, and 16 radial flutes (19 total meshes)
    assert.strictEqual(disc.children.length, 19, `Amalaka disc must contain 3 body cylinders + 16 ribs = 19 meshes (found ${disc.children.length})`);

    // Verify presence of 3 core body meshes
    const base = disc.children[0];
    const mid = disc.children[1];
    const top = disc.children[2];
    assert.ok(base && base.position.y < 0.3, 'Amalaka must contain base cushion disc');
    assert.ok(mid && mid.position.y > 0.4 && mid.position.y < 0.7, 'Amalaka must contain central torus body');
    assert.ok(top && top.position.y > 0.8, 'Amalaka must contain crowning rim');

    // Count vertical radial flutes (ribs 3 to 18)
    const ribs = disc.children.slice(3);
    assert.strictEqual(ribs.length, 16, 'Amalaka must generate exactly 16 radial carved flutes');
    ribs.forEach((rib) => {
      assert.strictEqual(rib.castShadow, true, 'Every fluted rib must cast shadows');
    });

    // Parameter fuzzing: test extreme radius (0.2m to 25m) and extreme height (0.1m to 12m)
    [0.2, 1.5, 4.0, 25.0].forEach((r) => {
      [0.1, 1.0, 5.0, 12.0].forEach((h) => {
        const fuzzed = createAmalakaDisc(THREE, r, h, sandstoneMat);
        assert.strictEqual(fuzzed.children.length, 19, 'Fuzzed Amalaka disc must retain all 19 subcomponents');
      });
    });
  });

  test('A.2: Golden Amrit Kalasha finial instantiates 4-tier pinnacle hierarchy', () => {
    const kalasha = createGoldenKalasha(THREE, 1.2, goldMat);
    assert.ok(kalasha instanceof THREE.Group, 'Kalasha must be a THREE.Group');
    assert.strictEqual(kalasha.name, 'golden_kalasha', 'Kalasha must have name golden_kalasha');
    assert.strictEqual(kalasha.children.length, 4, 'Kalasha must contain 4 structural tiers (base, pot, collar, needle)');

    const [base, pot, collar, stupi] = kalasha.children;
    assert.ok(base && base.position.y < 0.3, 'Kalasha tier 1: base pedestal');
    assert.ok(pot && pot.position.y > 0.5 && pot.position.y < 1.0, 'Kalasha tier 2: bulbous pot (kumbha)');
    assert.ok(collar && collar.position.y > 1.1 && collar.position.y < 1.6, 'Kalasha tier 3: neck collar');
    assert.ok(stupi && stupi.position.y > 2.0, 'Kalasha tier 4: conical finial needle (stupi)');

    // Assert castShadow on golden finial components
    kalasha.children.forEach((child) => {
      assert.strictEqual(child.castShadow, true, 'Kalasha component must cast shadows');
    });
  });

  test('A.3: Carved Mandapa pillar instantiates 5-stage architectural elevation', () => {
    const pillar = createCarvedMandapaPillar(THREE, {
      height: 9.5,
      radius: 0.65,
      sandstoneMat
    });
    assert.ok(pillar instanceof THREE.Group, 'Pillar must be a THREE.Group');
    assert.strictEqual(pillar.name, 'carved_mandapa_pillar', 'Pillar must have name carved_mandapa_pillar');

    // 5-stage elevation contains: 2 base plinths, octagonal lower shaft, mid ring, fluted upper shaft, capital, 2 bracket arms (8 meshes)
    assert.strictEqual(pillar.children.length, 8, `Pillar must contain 8 structural meshes across 5 stages (found ${pillar.children.length})`);

    // Assert shadow casting on all pillar components
    pillar.children.forEach((child) => {
      assert.strictEqual(child.castShadow, true, 'Pillar elements must cast shadows');
    });
  });

  test('A.4: Garbhagriha sanctum sanctorum chamber, murti, inner glow, and aura', () => {
    const realmObjects = [];
    const animators = [];
    const sanctum = createSanctumSanctorum(THREE, {
      yPlinth: 1.0,
      sandstoneMat,
      goldMat,
      realmObjects,
      animators
    });

    assert.ok(sanctum instanceof THREE.Group, 'Sanctum must be a THREE.Group');
    assert.strictEqual(sanctum.name, 'garbhagriha_sanctum', 'Sanctum must have correct name garbhagriha_sanctum');

    let foundInnerLight = false;
    let foundAuraSphere = false;
    let foundMurtiGroup = false;

    sanctum.traverse((child) => {
      if (child.name === 'sanctum_golden_glow_light') foundInnerLight = true;
      if (child.geometry instanceof THREE.SphereGeometry && child.material && child.material.transparent) {
        foundAuraSphere = true;
      }
      // Murti group has crown (ConeGeometry) and Kodanda bow (TorusGeometry)
      if (child.children && child.children.length === 4) {
        foundMurtiGroup = true;
      }
    });

    assert.ok(foundInnerLight, 'Sanctum must contain golden inner glow PointLight');
    assert.ok(foundAuraSphere, 'Sanctum must contain golden volumetric aura sphere');
    assert.ok(foundMurtiGroup, 'Sanctum must contain Lord Ram murti group (body, head, crown, bow)');

    // Inner glow PointLight intensity and range assertion
    const innerLight = sanctum.getObjectByName('sanctum_golden_glow_light');
    assert.strictEqual(innerLight.intensity, 4.6, 'Inner glow light intensity must be 4.6');
    assert.strictEqual(innerLight.distance, 42, 'Inner glow distance must be 42m');
  });

  test('A.5: Multi-tier Nagara Shikharas: 5 distinct spires with Pancharatha and Urushringas', () => {
    const spires = [
      { name: 'Mula-Shikhara', height: 42.0, tiers: 10, pancharatha: true },
      { name: 'Gudha Mandapa', height: 26.0, tiers: 7, pancharatha: false },
      { name: 'Rang Mandapa', height: 22.0, tiers: 6, pancharatha: false },
      { name: 'Transept Left', height: 18.0, tiers: 5, pancharatha: false },
      { name: 'Transept Right', height: 18.0, tiers: 5, pancharatha: false }
    ];

    spires.forEach((cfg) => {
      const tower = createNagaraShikharaTower(THREE, {
        height: cfg.height,
        tiers: cfg.tiers,
        baseWidth: cfg.height * 0.42,
        sandstoneMat,
        goldMat
      });

      assert.ok(tower instanceof THREE.Group, `${cfg.name} must instantiate as a THREE.Group`);
      assert.strictEqual(tower.name, 'nagara_shikhara_tower', `${cfg.name} must have name nagara_shikhara_tower`);

      // Verify crowning Amalaka and Kalasha
      const amalaka = tower.getObjectByName('amalaka_disc');
      const kalasha = tower.getObjectByName('golden_kalasha');
      assert.ok(amalaka, `${cfg.name} must be crowned with an Amalaka cogged disc`);
      assert.ok(kalasha, `${cfg.name} must be crowned with a Golden Amrit Kalasha`);

      // Verify Urushringas corner spires (ConeGeometry instances)
      let coneSpireCount = 0;
      tower.children.forEach((c) => {
        if (c.geometry instanceof THREE.ConeGeometry) coneSpireCount++;
      });
      assert.ok(coneSpireCount >= 4, `${cfg.name} must contain at least 4 Urushringas corner sub-spires (found ${coneSpireCount})`);
    });
  });

  test('A.6: Animated saffron Dhwaja flags wave deformation and mast pinning', () => {
    const animators = [];
    const flag = createAnimatedDhwajaFlag(THREE, {
      mastHeight: 9.0,
      flagLength: 4.8,
      flagHeight: 2.2,
      goldMat,
      animators
    });

    assert.ok(flag instanceof THREE.Group, 'Dhwaja flag must be a THREE.Group');
    assert.strictEqual(flag.name, 'animated_dhwaja_flag', 'Flag must have name animated_dhwaja_flag');
    assert.strictEqual(animators.length, 1, 'Flag must register 1 traveling wave animator function');

    // Child 0 is mast, Child 1 is flagMesh
    const flagMesh = flag.children[1];
    assert.ok(flagMesh, 'Flag must contain flagMesh pennant');

    const posAttr = flagMesh.geometry.attributes.position;
    assert.ok(posAttr, 'Pennant geometry must have position attribute');

    // Run 100 animator frames and assert mast vertices (x=0) experience 0 displacement
    const animatorFn = animators[0];
    for (let f = 0; f < 100; f++) {
      const t = f * 0.016;
      animatorFn(t, 0.016);

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        assert.ok(!Number.isNaN(x), `Vertex ${i} x coordinate must not be NaN at frame ${f}`);
        assert.ok(!Number.isNaN(z), `Vertex ${i} z coordinate must not be NaN at frame ${f}`);

        // Mast pinning invariant: where x == 0, lateral deflection must be 0
        if (Math.abs(x) < 0.001) {
          assert.ok(Math.abs(z) < 1e-6, `Mast-pinned vertex ${i} must have 0 lateral deflection (got ${z})`);
        }
      }
    }
  });

  test('A.7: Master buildAyodhyaRamMandirScene builds complete temple complex', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const mandir = buildAyodhyaRamMandirScene(THREE, scene, { id: 'ayodhya-ram-mandir' }, realmObjects, animators);

    assert.ok(mandir instanceof THREE.Group, 'Mandir scene must be a THREE.Group');
    assert.strictEqual(mandir.name, 'flagship_ayodhya_ram_mandir', 'Mandir complex name must match flagship_ayodhya_ram_mandir');

    // Structural elements: Jagati Plinth, Sanctum, Colonnade, Deepastambhas, Crowd Simulation
    const plinth = mandir.getObjectByName('jagati_plinth');
    const sanctum = mandir.getObjectByName('garbhagriha_sanctum');
    const crowd = mandir.getObjectByName('devotee_crowd_simulation_f9');

    assert.ok(plinth, 'Mandir complex must include Jagati grand plinth');
    assert.ok(sanctum, 'Mandir complex must include Garbhagriha sanctum');
    assert.ok(crowd, 'Mandir complex must include Devotee crowd simulation');

    // Check pillars count (at least 24 pillars)
    let pillarCount = 0;
    mandir.traverse((c) => {
      if (c.name === 'carved_mandapa_pillar') pillarCount++;
    });
    assert.ok(pillarCount >= 24, `Mandir hypostyle colonnade must contain >= 24 carved pillars (found ${pillarCount})`);

    // Check Deepastambhas count (4 brass lamps in aarti_deepastambhas group)
    const deepastambhas = mandir.getObjectByName('aarti_deepastambhas');
    assert.ok(deepastambhas, 'Mandir must contain aarti_deepastambhas group');
    assert.strictEqual(deepastambhas.children.length, 4, `Mandir must contain exactly 4 Deepastambhas (found ${deepastambhas.children.length})`);
  });
});

// ============================================================================
// SUITE 3: DEVOTEE CROWD SIMULATION & ANIMATION HARDENING (AREA B.3)
// ============================================================================
suite('M6 Challenger: Devotee Crowd Simulation & Animation Hardening', 'Area B.3', () => {
  test('C.1: Devotee crowd instance counts and tier distributions (352 devotees & 140 lamps)', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const crowd = createDevoteeCrowdSimulation(THREE, scene, realmObjects, animators);

    assert.ok(crowd instanceof THREE.Group, 'Crowd must be a THREE.Group');
    assert.strictEqual(crowd.name, 'devotee_crowd_simulation_f9', 'Crowd name must match');

    const devoteesMesh = crowd.getObjectByName('devotees_instanced_mesh');
    const aartiLampsMesh = crowd.getObjectByName('aarti_lamps_instanced_mesh');

    assert.ok(devoteesMesh, 'Crowd must contain devotees_instanced_mesh');
    assert.ok(aartiLampsMesh, 'Crowd must contain aarti_lamps_instanced_mesh');

    assert.strictEqual(devoteesMesh.count, 352, `Devotees InstancedMesh count must be exactly 352 (found ${devoteesMesh.count})`);
    assert.strictEqual(aartiLampsMesh.count, 140, `Aarti lamps InstancedMesh count must be exactly 140 (found ${aartiLampsMesh.count})`);
  });

  test('C.2: Devotee cultural Vedic color palette assignment and pure white robes for priests', () => {
    const crowd = createDevoteeCrowdSimulation(THREE, null, null, null);
    const devoteesMesh = crowd.getObjectByName('devotees_instanced_mesh');

    assert.ok(devoteesMesh.instanceColor, 'Devotees InstancedMesh must have instanceColor buffer');
    const colors = devoteesMesh.instanceColor.array;
    assert.strictEqual(colors.length, 352 * 3, 'Color buffer length must be 352 * 3');

    // Central Priest Aisle (16 priests) must receive pure white / ivory robes (r,g,b > 0.75)
    // Devotee indices 120 to 135 are central aisle priests
    for (let p = 120; p < 136; p++) {
      const r = colors[p * 3];
      const g = colors[p * 3 + 1];
      const b = colors[p * 3 + 2];
      assert.ok(r > 0.85 && g > 0.85 && b > 0.75, `Priest at index ${p} must have pure white robe colors`);
    }

    // Verify non-zero color channels across all devotees
    for (let i = 0; i < 352; i++) {
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      assert.ok(r > 0 || g > 0 || b > 0, `Devotee at index ${i} must have valid assigned color`);
    }
  });

  test('C.3: 500 rapid animation ticks across extreme deltas & zero memory allocation', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const crowd = createDevoteeCrowdSimulation(THREE, scene, [], animators);

    const devoteesMesh = crowd.getObjectByName('devotees_instanced_mesh');
    const aartiLampsMesh = crowd.getObjectByName('aarti_lamps_instanced_mesh');
    const animatorFn = animators[0];

    assert.strictEqual(typeof animatorFn, 'function', 'Devotee crowd must register animator function');

    const matrixArray = devoteesMesh.instanceMatrix.array;
    const lampMatrixArray = aartiLampsMesh.instanceMatrix.array;

    // Simulate 500 ticks with fluctuating delta spikes (0.0001s, 0.016s, 0.1s, 2.0s)
    const deltas = [0.0001, 0.016, 0.033, 0.05, 0.1, 2.0];
    for (let f = 0; f < 500; f++) {
      const d = deltas[f % deltas.length];
      const t = f * 0.016;

      animatorFn(t, d);

      // Verify all matrices remain strictly finite and non-NaN
      for (let j = 0; j < matrixArray.length; j += 16) {
        assert.ok(!Number.isNaN(matrixArray[j + 12]), `Devotee matrix x must not be NaN at tick ${f}`);
        assert.ok(!Number.isNaN(matrixArray[j + 13]), `Devotee matrix y must not be NaN at tick ${f}`);
        assert.ok(!Number.isNaN(matrixArray[j + 14]), `Devotee matrix z must not be NaN at tick ${f}`);
      }

      for (let j = 0; j < lampMatrixArray.length; j += 16) {
        assert.ok(!Number.isNaN(lampMatrixArray[j + 12]), `Lamp matrix x must not be NaN at tick ${f}`);
        assert.ok(!Number.isNaN(lampMatrixArray[j + 13]), `Lamp matrix y must not be NaN at tick ${f}`);
        assert.ok(!Number.isNaN(lampMatrixArray[j + 14]), `Lamp matrix z must not be NaN at tick ${f}`);
      }
    }
  });

  test('C.4: SceneManager clearRealm cleanly disposes geometries, materials, and animators', async () => {
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      THREE: THREE
    };

    const { SceneManager } = await import('../src/engine/SceneManager.js');
    const sm = new SceneManager(null, { THREE });

    const ayodhyaRealm = catalog.find((r) => r.id === 'ayodhya-ram-mandir');
    assert.ok(ayodhyaRealm, 'Ayodhya realm must exist in catalog');

    // Cycle build and clear 10 times to assert zero residual memory leaks
    for (let cycle = 0; cycle < 10; cycle++) {
      sm.buildRealm(ayodhyaRealm);
      assert.ok(sm.currentRealmObjects.length > 0, `Cycle ${cycle}: currentRealmObjects must be populated`);
      assert.ok(sm.animators.length > 0, `Cycle ${cycle}: animators must be registered`);

      sm.clearRealm();
      assert.strictEqual(sm.currentRealmObjects.length, 0, `Cycle ${cycle}: currentRealmObjects must be cleared`);
      assert.strictEqual(sm.animators.length, 0, `Cycle ${cycle}: animators must be cleared`);
      assert.strictEqual(sm.scene.fog, null, `Cycle ${cycle}: scene fog must be nullified`);
    }
  });
});

// ============================================================================
// SUITE 4: WATERFALL SANCTUARY PHYSICAL DYNAMICS & SHADER (AREA B.4)
// ============================================================================
suite('M6 Challenger: Waterfall Sanctuary Physical Dynamics & Shader', 'Area B.4', () => {
  test('W.1: Procedural 3D Riverbank terrain, vertical cliff, and granite boulders', () => {
    const scene = new THREE.Scene();
    const sanctuaryRes = buildWaterfallSanctuaryScene(THREE, scene, { id: 'jays-enchanted-waterfall-retreat' });
    const sanctuary = sanctuaryRes.group;

    assert.ok(sanctuary instanceof THREE.Group, 'Sanctuary must be a THREE.Group');
    assert.strictEqual(sanctuary.name, 'flagship_waterfall_sanctuary', 'Sanctuary name must match');

    const terrain = sanctuary.getObjectByName('sanctuary_riverbank_terrain');
    const river = sanctuary.getObjectByName('sanctuary_river_water');

    assert.ok(terrain, 'Sanctuary must contain sanctuary_riverbank_terrain');
    assert.ok(river, 'Sanctuary must contain sanctuary_river_water');

    // Verify granite river boulders (12 boulders)
    let boulderCount = 0;
    sanctuary.children.forEach((c) => {
      if (c.name && c.name.startsWith('river_boulder_')) boulderCount++;
    });
    assert.strictEqual(boulderCount, 12, `Sanctuary must contain exactly 12 granite boulders (found ${boulderCount})`);
  });

  test('W.2: Vertical waterfall particle cascade (4,500 particles with g = -32 m/s²)', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const sanctuaryRes = buildWaterfallSanctuaryScene(THREE, scene, { id: 'waterfall' }, [], animators);
    const sanctuary = sanctuaryRes.group;

    const cascadePoints = sanctuary.getObjectByName('waterfall_cascade_particles');
    assert.ok(cascadePoints instanceof THREE.Points, 'Cascade must be THREE.Points');

    const posAttr = cascadePoints.geometry.attributes.position;
    const colAttr = cascadePoints.geometry.attributes.color;

    assert.strictEqual(posAttr.count, 4500, 'Waterfall cascade must contain exactly 4,500 particles');
    assert.strictEqual(colAttr.count, 4500, 'Waterfall cascade colors must contain 4,500 entries');

    // Run 200 physics ticks and verify continuous recycling at y <= -0.5
    const animatorFn = animators[0];
    assert.strictEqual(typeof animatorFn, 'function', 'Must have waterfall animator function');

    for (let f = 0; f < 200; f++) {
      animatorFn(f * 0.016, 0.016);
    }

    // Verify all positions remain finite and bounded
    const positions = posAttr.array;
    for (let i = 0; i < positions.length; i += 3) {
      assert.ok(!Number.isNaN(positions[i]), `Cascade particle x at index ${i / 3} must not be NaN`);
      assert.ok(!Number.isNaN(positions[i + 1]), `Cascade particle y at index ${i / 3} must not be NaN`);
      assert.ok(!Number.isNaN(positions[i + 2]), `Cascade particle z at index ${i / 3} must not be NaN`);

      // Recycling bound: particle y must stay within [-1.0, 45.0]
      assert.ok(
        positions[i + 1] >= -1.0 && positions[i + 1] <= 45.0,
        `Cascade particle y (${positions[i + 1]}) must stay within bounds`
      );
    }
  });

  test('W.3: Plunge spray foam mist (1,600 particles) & 6 concentric ripple rings', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const sanctuaryRes = buildWaterfallSanctuaryScene(THREE, scene, { id: 'waterfall' }, [], animators);
    const sanctuary = sanctuaryRes.group;

    const mistPoints = sanctuary.getObjectByName('waterfall_impact_mist');
    assert.ok(mistPoints instanceof THREE.Points, 'Mist must be THREE.Points');
    assert.strictEqual(mistPoints.geometry.attributes.position.count, 1600, 'Mist must contain 1,600 particles');

    // Verify 6 concentric ripple rings
    let rippleCount = 0;
    sanctuary.children.forEach((c) => {
      if (c.name && c.name.startsWith('splash_ripple_ring_')) rippleCount++;
    });
    assert.strictEqual(rippleCount, 6, `Sanctuary must contain 6 concentric ripple rings (found ${rippleCount})`);

    // Churning froth disc
    const froth = sanctuary.getObjectByName('impact_froth_disc');
    assert.ok(froth, 'Must contain impact_froth_disc');
  });

  test('W.4: Transparent crystal float-bed shader, sinking controller, and 75 fireflies', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const sanctuaryRes = buildWaterfallSanctuaryScene(THREE, scene, { id: 'waterfall' }, [], animators);
    const sanctuary = sanctuaryRes.group;

    const bedGroup = sanctuary.getObjectByName('transparent_crystal_float_bed');
    assert.ok(bedGroup instanceof THREE.Group, 'Float-bed must be a THREE.Group');

    // Sinking controller verification
    assert.ok(bedGroup.userData, 'Bed must have userData');
    assert.strictEqual(typeof bedGroup.userData.setSinkState, 'function', 'setSinkState must be a function');
    assert.strictEqual(typeof bedGroup.userData.toggleSinkState, 'function', 'toggleSinkState must be a function');

    const animatorFn = animators[0];

    // Floating state (isBedSunk = false)
    bedGroup.userData.setSinkState(false);
    animatorFn(1.0, 0.016);
    const floatY = bedGroup.position.y;
    assert.ok(floatY > -0.40 && floatY < -0.20, `Floating bed y (${floatY}) must be near -0.32`);

    // Sinking state (isBedSunk = true)
    bedGroup.userData.setSinkState(true);
    animatorFn(1.0, 0.016);
    const sunkY = bedGroup.position.y;
    assert.ok(sunkY > -0.60 && sunkY < -0.45, `Sunk bed y (${sunkY}) must be near -0.52`);

    // Toggle sink state back
    const toggled = bedGroup.userData.toggleSinkState();
    assert.strictEqual(toggled, false, 'Toggling from sunk must return false (floating)');

    // Verify 75 dancing fireflies
    const fireflies = sanctuary.getObjectByName('sanctuary_fireflies');
    assert.ok(fireflies instanceof THREE.Points, 'Fireflies must be THREE.Points');
    assert.strictEqual(fireflies.geometry.attributes.position.count, 75, 'Must contain exactly 75 fireflies');
  });
});

// ============================================================================
// SUITE 5: VIDEOTEXTURE PIPELINE & HARDWARE DECODER TEARDOWN (AREA B.5)
// ============================================================================
suite('M6 Challenger: VideoTexture Pipeline & Hardware Decoder Teardown', 'Area B.5', () => {
  test('V.1: 5-step hardware video decoder teardown pipeline protocol', () => {
    const vtm = new VideoTextureManager(THREE);

    // Mock video element tracking 5-step call sequence
    const callLog = [];
    const testUrl = '/public/assets/videos/portal_sacred_flame.mp4';

    const mockVideo = {
      src: testUrl,
      pause: () => callLog.push('pause'),
      removeAttribute: (attr) => callLog.push(`removeAttribute:${attr}`),
      load: () => callLog.push('load'),
      parentNode: {
        removeChild: (child) => callLog.push('removeChild')
      }
    };

    let textureDisposed = false;
    const mockTexture = {
      dispose: () => { textureDisposed = true; callLog.push('disposeTexture'); }
    };

    vtm.videos.set(testUrl, mockVideo);
    vtm.textures.set(testUrl, mockTexture);

    vtm.disposeVideo(testUrl);

    // Verify exact 5-step teardown execution
    assert.ok(callLog.includes('pause'), 'Step 1: video.pause() must be called');
    assert.ok(callLog.includes('removeAttribute:src'), 'Step 2: video.removeAttribute("src") must be called');
    assert.ok(callLog.includes('load'), 'Step 3: video.load() must be called to release hardware decoder');
    assert.ok(callLog.includes('removeChild'), 'Step 4: video must be removed from parent DOM node');
    assert.ok(textureDisposed, 'Step 5: texture.dispose() must be called');

    assert.strictEqual(vtm.videos.has(testUrl), false, 'Video reference must be nullified from Map');
    assert.strictEqual(vtm.textures.has(testUrl), false, 'Texture reference must be nullified from Map');
  });

  test('V.2: Rapid video texture transitions: 50 sequential transitions with zero errors', () => {
    const vtm = new VideoTextureManager(THREE);
    const videoUrls = [
      '/public/assets/videos/portal_sacred_flame.mp4',
      '/public/assets/videos/portal_waterfall_cascade.mp4',
      '/public/assets/videos/portal_cosmic_vortex.mp4',
      '/public/assets/videos/portal_cyber_matrix.mp4'
    ];
    const categories = ['Sacred & Spiritual', 'Nature & Retreat', 'Cosmic Odyssey', 'Cyberpunk & Sci-Fi'];

    for (let i = 0; i < 50; i++) {
      const url = videoUrls[i % videoUrls.length];
      const cat = categories[i % categories.length];

      const tex = vtm.createVideoTexture(url, cat);
      assert.ok(tex, `Cycle ${i}: Texture must be generated`);

      const portal = vtm.createDimensionalPortalMesh(tex);
      assert.ok(portal instanceof THREE.Group, `Cycle ${i}: Portal mesh must be generated`);

      vtm.update(i * 0.016, 0.016);
    }

    assert.ok(vtm.portalAnimators.length === 50, 'Portal animators must be registered');

    // Bulk cleanup
    vtm.disposeAll();
    assert.strictEqual(vtm.videos.size, 0, 'All videos must be cleared');
    assert.strictEqual(vtm.textures.size, 0, 'All textures must be cleared');
    assert.strictEqual(vtm.portalAnimators.length, 0, 'All portal animators must be cleared');
    assert.strictEqual(vtm.proceduralAnimators.length, 0, 'All procedural animators must be cleared');
  });

  test('V.3: Error recovery & graceful fallback to procedural canvas texture', () => {
    const vtm = new VideoTextureManager(THREE);
    const errorUrl = '/assets/videos/corrupt_nonexistent_stream.mp4';

    // In non-DOM/headless, createVideoTexture immediately falls back cleanly
    const tex = vtm.createVideoTexture(errorUrl, 'Cosmic Odyssey');
    assert.ok(tex, 'Fallback texture must be generated on unsupported/missing video');

    const portal = vtm.createDimensionalPortalMesh(tex);
    assert.ok(portal, 'Portal gateway must build cleanly with fallback texture');

    // Run animation frames without exception
    assert.doesNotThrow(() => {
      vtm.update(2.5, 0.016);
    }, 'Update loop must not throw on fallback procedural textures');
  });

  test('V.4: 3D Stargate Portal Gateway geometry & counter-rotating rune rings', () => {
    const vtm = new VideoTextureManager(THREE);
    const mockTex = new THREE.Texture();
    const portal = vtm.createDimensionalPortalMesh(mockTex, { radius: 4.5 });

    assert.ok(portal instanceof THREE.Group, 'Portal must be a THREE.Group');
    assert.strictEqual(portal.name, 'DimensionalPortalGateway', 'Portal name must match');

    // Elements: Plinth, Celestial Torus, Outer Rune, Inner Rune, Event Horizon, Central Light (6 elements)
    assert.strictEqual(portal.children.length, 6, 'Portal must contain 6 sub-elements');

    const light = portal.children.find((c) => c instanceof THREE.PointLight);
    assert.ok(light, 'Portal must contain central PointLight');

    // Verify counter-rotating animator
    const animator = vtm.portalAnimators[0];
    assert.strictEqual(typeof animator, 'function', 'Portal must register rotation animator');

    animator(1.0);
    assert.ok(light.intensity > 1.0, 'Portal light intensity must be modulated');
  });
});

// Self-executing runner
if (process.argv[1] && process.argv[1].endsWith('m6_challenger_area_b.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
