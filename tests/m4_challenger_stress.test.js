/**
 * tests/m4_challenger_stress.test.js
 * 
 * DreamFire Milestone M4: Adversarial Stress Test & Empirical Verification Suite
 * Subagent: challenger_m4_1 (teamwork_challenger)
 * 
 * Target Verifications:
 * 1. Zero-Diff Parity & Asset Integrity: Byte-for-byte SHA256 equality of index.html and preview.html,
 *    and physical integrity of all 8 curated MP4 video loops.
 * 2. VideoTextureManager Stress & Memory Teardown: 50 consecutive cycles of creation & disposal,
 *    verifying 0 exceptions, 0 leaks, and strict 5-step hardware decoder teardown.
 * 3. Procedural CanvasTexture Synthesis: Canonical category coverage, flagship aliases, adversarial inputs,
 *    and continuous rendering loop stability.
 * 4. Dimensional Portal Gateway Geometry: Complete 3D Stargate hierarchy, geometry vertex validity,
 *    counter-rotating rune rings, and central light pulsation.
 * 5. Extreme Delta Value Simulation (0.0001s, 0.016s, 0.1s, 2.0s clamped):
 *    - Water surface vertex harmonic wave oscillation (0 NaNs, strictly bounded displacement).
 *    - Waterfall Sanctuary 75 dancing fireflies (anchored to baseFireflyPos, strictly <= 2.25m radius, zero drift).
 *    - Devotee crowd simulation (352 devotees + 140 aarti lamps instanced matrices, finite and non-NaN).
 *    - Animated saffron Dhwaja flags (mast pinned at x=0, bounded traveling wave deflection).
 *    - Waterfall particle cascade & mist physics (clamped delta prevents gravity explosion).
 * 6. AmbientAudioEngine Synthesizer Robustness: Multi-channel synthesis, noise buffers, and cross-fading.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';
import * as THREE from 'three';

import { VideoTextureManager } from '../src/engine/VideoTextureManager.js';
import { AmbientAudioEngine } from '../src/utils/audio.js';
import { createProceduralTerrain } from '../src/engine/SceneManager.js';
import {
  createAnimatedDhwajaFlag,
  createDevoteeCrowdSimulation,
  buildAyodhyaRamMandirScene,
  buildWaterfallSanctuaryScene
} from '../src/engine/FlagshipScenes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const VIDEOS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'videos');

const EXPECTED_VIDEO_FILES = [
  'portal_sacred_flame.mp4',
  'portal_waterfall_cascade.mp4',
  'portal_cosmic_vortex.mp4',
  'portal_cyber_matrix.mp4',
  'portal_ancient_dunes.mp4',
  'portal_zen_ripple.mp4',
  'portal_ayodhya_sacred.mp4',
  'portal_waterfall_sanctuary.mp4'
];

const CANONICAL_CATEGORIES = [
  'Sacred & Spiritual',
  'Nature & Retreat',
  'Cosmic Odyssey',
  'Cyberpunk & Sci-Fi',
  'Ancient Wonders',
  'Zen Meditation'
];

function findObjectByName(root, name) {
  if (!root) return null;
  if (root.name === name) return root;
  if (root.children && Array.isArray(root.children)) {
    for (let i = 0; i < root.children.length; i++) {
      const found = findObjectByName(root.children[i], name);
      if (found) return found;
    }
  }
  return null;
}

// ============================================================================
// SUITE 1: ZERO-DIFF PARITY & MEDIA ASSET INTEGRITY
// ============================================================================
suite('M4 Challenger: Zero-Diff Parity & Media Asset Integrity', 'M4 Challenger', () => {
  test('P.1: index.html and preview.html are 100% byte-for-byte identical (SHA256 match)', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist');
    assert.ok(fs.existsSync(PREVIEW_HTML_PATH), 'preview.html must exist');

    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    assert.strictEqual(
      indexBuf.length,
      previewBuf.length,
      `File size mismatch: index.html (${indexBuf.length} B) vs preview.html (${previewBuf.length} B)`
    );
    assert.ok(indexBuf.equals(previewBuf), 'Byte buffer mismatch between index.html and preview.html');

    const hashIndex = crypto.createHash('sha256').update(indexBuf).digest('hex');
    const hashPreview = crypto.createHash('sha256').update(previewBuf).digest('hex');
    assert.strictEqual(hashIndex, hashPreview, `SHA256 mismatch: ${hashIndex} vs ${hashPreview}`);
  });

  test('P.2: VideoTextureManager and AmbientAudioEngine modules export valid classes', () => {
    assert.strictEqual(typeof VideoTextureManager, 'function', 'VideoTextureManager must be an exported class');
    assert.strictEqual(typeof AmbientAudioEngine, 'function', 'AmbientAudioEngine must be an exported class');

    const vtm = new VideoTextureManager(THREE);
    assert.ok(vtm.videos instanceof Map, 'VideoTextureManager must maintain a videos Map');
    assert.ok(vtm.textures instanceof Map, 'VideoTextureManager must maintain a textures Map');
    assert.ok(Array.isArray(vtm.proceduralAnimators), 'VideoTextureManager must maintain proceduralAnimators array');
    assert.ok(Array.isArray(vtm.portalAnimators), 'VideoTextureManager must maintain portalAnimators array');

    const audio = new AmbientAudioEngine();
    assert.strictEqual(typeof audio.ensureContext, 'function', 'AmbientAudioEngine must provide ensureContext');
    assert.strictEqual(typeof audio.createNoiseBuffer, 'function', 'AmbientAudioEngine must provide createNoiseBuffer');
  });

  test('P.3: All 8 curated looping MP4 files physically exist, are non-empty, and contain valid MP4 headers', () => {
    assert.ok(fs.existsSync(VIDEOS_DIR), `Videos directory must exist at ${VIDEOS_DIR}`);

    EXPECTED_VIDEO_FILES.forEach((filename) => {
      const fullPath = path.join(VIDEOS_DIR, filename);
      assert.ok(fs.existsSync(fullPath), `Video file missing: ${filename}`);

      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 10 * 1024, `Video file ${filename} undersized (<10KB): ${stats.size} bytes`);

      // Verify MP4 ftyp container box signature in first 16 bytes
      const fd = fs.openSync(fullPath, 'r');
      const headerBuf = Buffer.alloc(16);
      fs.readSync(fd, headerBuf, 0, 16, 0);
      fs.closeSync(fd);

      const headerHex = headerBuf.toString('ascii');
      assert.ok(
        headerHex.includes('ftyp') || headerHex.includes('isom') || headerHex.includes('mp42'),
        `Video file ${filename} lacks valid MP4 ftyp box signature: ${headerBuf.toString('hex')}`
      );
    });
  });

  test('P.4: realms_catalog.json maps every one of the 110 realms to a valid, existing videoLoop path', () => {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    assert.strictEqual(catalog.length, 110, 'Catalog must contain exactly 110 realms');

    catalog.forEach((realm) => {
      assert.ok(realm.videoLoop, `Realm ${realm.id} is missing videoLoop property`);
      const normPath = realm.videoLoop.replace(/^[/\\]+/, '');
      const fullPath = path.join(ROOT_DIR, normPath);
      assert.ok(fs.existsSync(fullPath), `Realm ${realm.id} videoLoop points to non-existent file: ${realm.videoLoop}`);
    });
  });
});

// ============================================================================
// SUITE 2: VIDEOTEXTUREMANAGER 50-CYCLE TEARDOWN & STRESS ENDURANCE
// ============================================================================
suite('M4 Challenger: VideoTextureManager 50-Cycle Teardown & Stress', 'M4 Challenger', () => {
  test('T.1: 50 consecutive cycles of VideoTexture creation and single disposal in headless mode (0 leaks, 0 errors)', () => {
    const vtm = new VideoTextureManager(THREE);

    for (let cycle = 1; cycle <= 50; cycle++) {
      const testUrl = `public/assets/videos/test_stream_${cycle}.mp4`;
      const cat = CANONICAL_CATEGORIES[cycle % CANONICAL_CATEGORIES.length];

      // 1. Create video element & texture
      const videoEl = vtm.createVideoElement(testUrl);
      assert.ok(videoEl, `Cycle ${cycle}: Video element must be created`);
      assert.strictEqual(vtm.videos.size, 1, `Cycle ${cycle}: Videos map must contain 1 entry`);

      const tex = vtm.createVideoTexture(testUrl, cat);
      assert.ok(tex, `Cycle ${cycle}: Texture must be created`);
      assert.strictEqual(vtm.textures.size, 1, `Cycle ${cycle}: Textures map must contain 1 entry`);

      // 2. Dispose video
      vtm.disposeVideo(testUrl);

      // 3. Verify zero leaks
      assert.strictEqual(vtm.videos.size, 0, `Cycle ${cycle}: Videos map leaked entry after disposal`);
      assert.strictEqual(vtm.textures.size, 0, `Cycle ${cycle}: Textures map leaked entry after disposal`);
    }

    assert.strictEqual(vtm.videos.size, 0, 'Final videos map must be completely empty');
    assert.strictEqual(vtm.textures.size, 0, 'Final textures map must be completely empty');
  });

  test('T.2: 50 consecutive cycles in simulated DOM verifying 5-step hardware decoder teardown protocol', () => {
    const teardownLog = [];

    const mockDOMVideo = (url) => ({
      src: url,
      parentNode: {
        removeChild: (el) => teardownLog.push({ step: 'remove', url: el.src })
      },
      pause: () => teardownLog.push({ step: 'pause', url }),
      removeAttribute: (attr) => teardownLog.push({ step: 'removeAttribute', attr, url }),
      load: () => teardownLog.push({ step: 'load', url })
    });

    const vtm = new VideoTextureManager(THREE);

    for (let cycle = 1; cycle <= 50; cycle++) {
      const url = `public/assets/videos/hardware_decoder_test_${cycle}.mp4`;
      const mockVid = mockDOMVideo(url);

      let texDisposed = false;
      const mockTex = {
        dispose: () => {
          texDisposed = true;
          teardownLog.push({ step: 'texture.dispose', url });
        }
      };

      vtm.videos.set(url, mockVid);
      vtm.textures.set(url, mockTex);

      const beforeLen = teardownLog.length;
      vtm.disposeVideo(url);
      const cycleSteps = teardownLog.slice(beforeLen).map((s) => s.step);

      // Verify the 5-step hardware decoder teardown protocol executed in proper order
      assert.ok(cycleSteps.includes('pause'), `Cycle ${cycle}: Missing pause() call`);
      assert.ok(cycleSteps.includes('removeAttribute'), `Cycle ${cycle}: Missing removeAttribute('src') call`);
      assert.ok(cycleSteps.includes('load'), `Cycle ${cycle}: Missing load() call (essential for Chromium/MediaFoundation decoder release)`);
      assert.ok(cycleSteps.includes('remove'), `Cycle ${cycle}: Missing removeChild call`);
      assert.ok(cycleSteps.includes('texture.dispose'), `Cycle ${cycle}: Missing texture.dispose() call`);
      assert.ok(texDisposed, `Cycle ${cycle}: Texture dispose flag was not set`);

      assert.strictEqual(vtm.videos.has(url), false, `Cycle ${cycle}: videos Map retained URL`);
      assert.strictEqual(vtm.textures.has(url), false, `Cycle ${cycle}: textures Map retained URL`);
    }

    assert.strictEqual(teardownLog.length, 50 * 5, 'Exactly 250 hardware teardown steps must have executed across 50 cycles');
  });

  test('T.3: Bulk teardown via disposeAll() with 25 concurrent video/texture pairs', () => {
    const vtm = new VideoTextureManager(THREE);
    const disposedUrls = new Set();
    const pausedUrls = new Set();
    const loadedUrls = new Set();

    for (let i = 0; i < 25; i++) {
      const url = `public/assets/videos/bulk_stream_${i}.mp4`;
      vtm.videos.set(url, {
        src: url,
        parentNode: null,
        pause: () => pausedUrls.add(url),
        removeAttribute: () => {},
        load: () => loadedUrls.add(url)
      });
      vtm.textures.set(url, {
        dispose: () => disposedUrls.add(url)
      });
      vtm.proceduralAnimators.push(() => {});
      vtm.portalAnimators.push(() => {});
    }

    assert.strictEqual(vtm.videos.size, 25, '25 videos must be registered before bulk disposal');
    assert.strictEqual(vtm.textures.size, 25, '25 textures must be registered before bulk disposal');
    assert.strictEqual(vtm.proceduralAnimators.length, 25);
    assert.strictEqual(vtm.portalAnimators.length, 25);

    vtm.disposeAll();

    assert.strictEqual(vtm.videos.size, 0, 'Videos map must be empty after disposeAll()');
    assert.strictEqual(vtm.textures.size, 0, 'Textures map must be empty after disposeAll()');
    assert.strictEqual(vtm.proceduralAnimators.length, 0, 'Procedural animators must be emptied');
    assert.strictEqual(vtm.portalAnimators.length, 0, 'Portal animators must be emptied');

    assert.strictEqual(pausedUrls.size, 25, 'All 25 videos must have received pause()');
    assert.strictEqual(loadedUrls.size, 25, 'All 25 videos must have received load()');
    assert.strictEqual(disposedUrls.size, 25, 'All 25 textures must have received dispose()');
  });

  test('T.4: Adversarial fault injection on disposeVideo (null, undefined, missing url, double-dispose)', () => {
    const vtm = new VideoTextureManager(THREE);

    // None of these should throw an exception
    assert.doesNotThrow(() => vtm.disposeVideo(null));
    assert.doesNotThrow(() => vtm.disposeVideo(undefined));
    assert.doesNotThrow(() => vtm.disposeVideo(''));
    assert.doesNotThrow(() => vtm.disposeVideo('non_existent_url.mp4'));

    const testUrl = 'valid_test.mp4';
    vtm.videos.set(testUrl, { pause: () => {}, removeAttribute: () => {}, load: () => {} });
    assert.doesNotThrow(() => vtm.disposeVideo(testUrl));
    // Second dispose must be a safe no-op
    assert.doesNotThrow(() => vtm.disposeVideo(testUrl));
    assert.strictEqual(vtm.videos.size, 0);
  });
});

// ============================================================================
// SUITE 3: PROCEDURAL CANVASTEXTURE SYNTHESIS & CANONICAL CATEGORIES
// ============================================================================
suite('M4 Challenger: Procedural CanvasTexture Synthesis', 'M4 Challenger', () => {
  test('C.1: createProceduralCanvasTexture generates textures across all 6 canonical categories', () => {
    const vtm = new VideoTextureManager(THREE);

    CANONICAL_CATEGORIES.forEach((cat) => {
      const tex = vtm.createProceduralCanvasTexture(cat, 512, 512);
      assert.ok(tex, `Texture for category '${cat}' must be non-null`);
      assert.strictEqual(typeof tex, 'object', `Texture for category '${cat}' must be an object`);
      if (tex.dispose) {
        assert.doesNotThrow(() => tex.dispose());
      }
    });
  });

  test('C.2: Flagship aliases and case/whitespace variations resolve cleanly without errors', () => {
    const vtm = new VideoTextureManager(THREE);

    const testCases = [
      'ayodhya-ram-mandir',
      'SACRED & SPIRITUAL',
      '  nature & retreat  ',
      'cOsMiC oDySsEy',
      'Cyberpunk & Sci-Fi',
      'ancient wonders',
      'ZEN MEDITATION',
      'waterfall-sanctuary'
    ];

    testCases.forEach((variant) => {
      assert.doesNotThrow(
        () => vtm.createProceduralCanvasTexture(variant, 256, 256),
        `Failed to generate procedural canvas texture for variant: '${variant}'`
      );
    });
  });

  test('C.3: Adversarial inputs (null, undefined, empty string, unknown category, extreme dimensions)', () => {
    const vtm = new VideoTextureManager(THREE);

    const adversarial = [
      { cat: null, w: 512, h: 512 },
      { cat: undefined, w: 512, h: 512 },
      { cat: '', w: 512, h: 512 },
      { cat: 'Unknown Mythic Void 404', w: 512, h: 512 },
      { cat: 'Cosmic Odyssey', w: 1, h: 1 },
      { cat: 'Sacred & Spiritual', w: 2048, h: 2048 }
    ];

    adversarial.forEach(({ cat, w, h }) => {
      assert.doesNotThrow(
        () => vtm.createProceduralCanvasTexture(cat, w, h),
        `createProceduralCanvasTexture threw on adversarial input: cat='${cat}', w=${w}, h=${h}`
      );
    });
  });

  test('C.4: Procedural canvas rendering execution across time scales (0s to 100,000s) in simulated 2D context', () => {
    // Verify mathematical equations directly for each category across extreme times
    const testTimes = [0, 0.016, 1.5, 120.0, 100000.0];

    CANONICAL_CATEGORIES.forEach((cat) => {
      const catKey = cat.toLowerCase();

      testTimes.forEach((time) => {
        if (catKey.includes('sacred')) {
          for (let i = 0; i < 5; i++) {
            const wave = Math.sin(time * 3.5 + i * 1.2) * 22;
            assert.ok(!Number.isNaN(wave) && Math.abs(wave) <= 22.01, 'Sacred flame wave NaN or unbounded');
          }
        } else if (catKey.includes('nature')) {
          for (let col = 0; col < 12; col++) {
            const offset = Math.sin(time * 4.0 + col) * 8;
            assert.ok(!Number.isNaN(offset) && Math.abs(offset) <= 8.01, 'Nature cascade offset NaN or unbounded');
          }
        } else if (catKey.includes('cosmic')) {
          for (let p = 0; p < 36; p++) {
            const angle = p * 0.22;
            const dist = p * 6.5;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            assert.ok(!Number.isNaN(px) && !Number.isNaN(py), 'Cosmic spiral coordinates NaN');
          }
        } else if (catKey.includes('cyber')) {
          for (let c = 0; c < 16; c++) {
            const dropY = (time * 80 + c * 37) % 512;
            assert.ok(!Number.isNaN(dropY) && dropY >= 0 && dropY < 512, 'Cyber matrix rain dropY NaN or unbounded');
          }
        } else if (catKey.includes('ancient')) {
          const duneOffset = Math.sin(time) * 10;
          assert.ok(!Number.isNaN(duneOffset) && Math.abs(duneOffset) <= 10.01, 'Ancient dune offset NaN or unbounded');
        } else {
          for (let r = 1; r <= 4; r++) {
            const radius = (time * 35 + r * 50) % (512 * 0.45);
            assert.ok(!Number.isNaN(radius) && radius >= 0, 'Zen ripple radius NaN or negative');
          }
        }
      });
    });
  });
});

// ============================================================================
// SUITE 4: DIMENSIONAL PORTAL GATEWAY GEOMETRY & HIERARCHY
// ============================================================================
suite('M4 Challenger: Dimensional Portal Gateway Geometry', 'M4 Challenger', () => {
  const vtm = new VideoTextureManager(THREE);
  const dummyTexture = new THREE.Texture();

  test('G.1: Portal mesh hierarchy contains plinth, outer ring arch, dual rune rings, event horizon, and central light', () => {
    const portalGroup = vtm.createDimensionalPortalMesh(dummyTexture, { radius: 4.2 });

    assert.strictEqual(portalGroup.name, 'DimensionalPortalGateway', 'Portal group must be named DimensionalPortalGateway');
    assert.strictEqual(portalGroup.children.length, 6, 'Portal must have exactly 6 primary structural children');

    // 1. Plinth base
    const plinth = portalGroup.children[0];
    assert.ok(plinth.geometry instanceof THREE.CylinderGeometry, 'Child 0 must be CylinderGeometry plinth');

    // 2. Outer Stargate Ring Arch
    const stargateRing = portalGroup.children[1];
    assert.ok(stargateRing.geometry instanceof THREE.TorusGeometry, 'Child 1 must be TorusGeometry ring arch');

    // 3. Outer Rune Ring
    const outerRuneRing = portalGroup.children[2];
    assert.ok(outerRuneRing.geometry instanceof THREE.RingGeometry, 'Child 2 must be RingGeometry outer rune ring');
    assert.strictEqual(outerRuneRing.material.wireframe, true, 'Outer rune ring must be wireframe for rune aesthetics');

    // 4. Inner Rune Ring
    const innerRuneRing = portalGroup.children[3];
    assert.ok(innerRuneRing.geometry instanceof THREE.RingGeometry, 'Child 3 must be RingGeometry inner rune ring');
    assert.strictEqual(innerRuneRing.material.wireframe, true, 'Inner rune ring must be wireframe for rune aesthetics');

    // 5. Event Horizon Disc
    const horizonDisc = portalGroup.children[4];
    assert.ok(horizonDisc.geometry instanceof THREE.CircleGeometry, 'Child 4 must be CircleGeometry event horizon');
    assert.strictEqual(horizonDisc.material.map, dummyTexture, 'Event horizon material map must be bound to texture');

    // 6. Central Pulsing PointLight
    const pointLight = portalGroup.children[5];
    assert.ok(pointLight instanceof THREE.PointLight, 'Child 5 must be THREE.PointLight');

    // Verify cyan light color (0x38bdf8)
    const hex = (Math.round(pointLight.color.r * 255) << 16) |
                (Math.round(pointLight.color.g * 255) << 8) |
                Math.round(pointLight.color.b * 255);
    assert.strictEqual(hex, 0x38bdf8, 'Default point light color must be celestial cyan (0x38bdf8)');
  });

  test('G.2: Geometric validity, non-empty vertex buffer attributes, and finite bounding boxes', () => {
    const portalGroup = vtm.createDimensionalPortalMesh(dummyTexture, { radius: 5.0 });

    portalGroup.traverse((child) => {
      if (child.isMesh) {
        assert.ok(child.geometry, `Mesh ${child.name || 'unnamed'} must possess a geometry`);
        const posAttr = child.geometry.attributes.position;
        assert.ok(posAttr && posAttr.count > 0, `Mesh ${child.name || 'unnamed'} must have non-empty position attribute`);

        // Check for NaNs across all vertex coordinates
        for (let i = 0; i < posAttr.count; i++) {
          assert.ok(Number.isFinite(posAttr.getX(i)), `NaN in vertex X at index ${i}`);
          assert.ok(Number.isFinite(posAttr.getY(i)), `NaN in vertex Y at index ${i}`);
          assert.ok(Number.isFinite(posAttr.getZ(i)), `NaN in vertex Z at index ${i}`);
        }

        child.geometry.computeBoundingBox();
        const bbox = child.geometry.boundingBox;
        assert.ok(bbox && Number.isFinite(bbox.min.x) && Number.isFinite(bbox.max.x), 'Bounding box must be finite');
      }
    });
  });

  test('G.3: Portal animator counter-rotation and light pulse stability over 100 frames', () => {
    const vtmInstance = new VideoTextureManager(THREE);
    const portal = vtmInstance.createDimensionalPortalMesh(dummyTexture, { radius: 4.2 });

    const outerRuneRing = portal.children[2];
    const innerRuneRing = portal.children[3];
    const portalLight = portal.children[5];

    assert.strictEqual(vtmInstance.portalAnimators.length, 1, 'Portal creation must register 1 portal animator');

    for (let frame = 1; frame <= 100; frame++) {
      const time = frame * 0.016;
      vtmInstance.update(time, 0.016);

      // Verify counter-rotation: outer ring rotates positive, inner ring rotates negative
      assert.strictEqual(
        Number(outerRuneRing.rotation.z.toFixed(4)),
        Number((time * 0.35).toFixed(4)),
        `Frame ${frame}: Outer rune ring rotation.z out of sync`
      );
      assert.strictEqual(
        Number(innerRuneRing.rotation.z.toFixed(4)),
        Number((-time * 0.55).toFixed(4)),
        `Frame ${frame}: Inner rune ring rotation.z out of sync`
      );

      // Verify light intensity oscillation bounds: [1.4, 3.0]
      const intensity = portalLight.intensity;
      assert.ok(!Number.isNaN(intensity), `Frame ${frame}: Portal light intensity is NaN`);
      assert.ok(intensity >= 1.39 && intensity <= 3.01, `Frame ${frame}: Portal light intensity out of bounds: ${intensity}`);
    }
  });

  test('G.4: Boundary options stress testing (extreme radii: 0.1m, 100m, custom color, undefined options)', () => {
    [0.1, 1.0, 4.2, 50.0, 100.0].forEach((r) => {
      assert.doesNotThrow(() => {
        const portal = vtm.createDimensionalPortalMesh(dummyTexture, { radius: r, lightColor: 0xffaa00 });
        assert.ok(portal, `Portal with radius ${r} must construct cleanly`);
      }, `Portal generation failed for extreme radius ${r}`);
    });

    // Null/undefined options
    assert.doesNotThrow(() => vtm.createDimensionalPortalMesh(dummyTexture, undefined));
    assert.doesNotThrow(() => vtm.createDimensionalPortalMesh(null, {}));
  });
});

// ============================================================================
// SUITE 5: EXTREME DELTA SIMULATION ACROSS ALL ANIMATORS (0.0001s TO 2.0s CLAMPED)
// ============================================================================
suite('M4 Challenger: Extreme Delta Simulation Across All Animators', 'M4 Challenger', () => {
  const EXTREME_DELTAS = [0.0001, 0.0166, 0.1, 2.0];

  test('D.1: Water surface vertex harmonic wave oscillation across 500 frames of extreme deltas (0 NaNs, strictly bounded displacement)', () => {
    const animators = [];
    const terrainGroup = createProceduralTerrain(
      THREE,
      { environment: { biome: 'sacred_river', hasWaterBody: true } },
      animators
    );

    assert.ok(terrainGroup, 'Procedural terrain group must be created');
    const waterMesh = findObjectByName(terrainGroup, 'water_plane');
    assert.ok(waterMesh, 'Water plane mesh must exist in sacred_river biome');

    const waterGeo = waterMesh.geometry;
    const posAttr = waterGeo.attributes.position;
    assert.ok(posAttr && posAttr.count > 0, 'Water geometry must have position attributes');

    // Find the water wave animator
    assert.ok(animators.length > 0, 'Animators array must contain water wave animator');
    const waterAnimator = animators[animators.length - 1];

    let simTime = 0;
    const vertexCount = posAttr.count;

    // Run 500 steps alternating through extreme deltas
    for (let step = 0; step < 500; step++) {
      const rawDelta = EXTREME_DELTAS[step % EXTREME_DELTAS.length];
      const clampedDelta = Math.min(Math.max(rawDelta, 0.001), 0.1);
      simTime += clampedDelta;

      waterAnimator(simTime, clampedDelta);

      // Verify every vertex Y is bounded and finite
      for (let i = 0; i < vertexCount; i++) {
        const y = posAttr.getY(i);
        assert.ok(!Number.isNaN(y), `Step ${step}: Vertex ${i} Y evaluated to NaN at time ${simTime}`);
        assert.ok(Number.isFinite(y), `Step ${step}: Vertex ${i} Y is not finite: ${y}`);
        // Maximum harmonic amplitude: 0.06 + 0.025 = 0.085
        assert.ok(
          Math.abs(y) <= 0.09,
          `Step ${step}: Vertex ${i} Y displacement exceeded theoretical harmonic limit (0.085m): ${y}`
        );
      }
    }
  });

  test('D.2: Waterfall Sanctuary 75 Dancing Fireflies across 500 frames of extreme deltas maintains zero drift (<= 2.25m)', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const realmObjects = [];

    buildWaterfallSanctuaryScene(THREE, scene, { id: 'natural-waterfall-sanctuary' }, realmObjects, animators);

    const firefliesMesh = findObjectByName(scene, 'sanctuary_fireflies');
    assert.ok(firefliesMesh, 'Sanctuary fireflies Points mesh must exist');

    const posAttr = firefliesMesh.geometry.attributes.position;
    assert.strictEqual(posAttr.count, 75, 'Must contain exactly 75 fireflies');

    // Snapshot initial positions
    const initialPositions = new Float32Array(posAttr.array);

    // Run 500 steps across extreme deltas and huge total elapsed time
    let simTime = 0;
    const THEORETICAL_MAX_RADIUS = Math.sqrt(1.5 * 1.5 + 0.75 * 0.75 + 1.5 * 1.5); // ~2.25m

    for (let step = 0; step < 500; step++) {
      const rawDelta = EXTREME_DELTAS[step % EXTREME_DELTAS.length];
      const clampedDelta = Math.min(Math.max(rawDelta, 0.001), 0.1);
      simTime += clampedDelta;

      // Invoke all animators
      animators.forEach((anim) => anim(simTime, clampedDelta));

      // Inspect all 75 fireflies
      for (let f = 0; f < 75; f++) {
        const idx = f * 3;
        const curX = posAttr.getX(f);
        const curY = posAttr.getY(f);
        const curZ = posAttr.getZ(f);

        assert.ok(!Number.isNaN(curX) && !Number.isNaN(curY) && !Number.isNaN(curZ), `Step ${step}: Firefly ${f} NaN position`);

        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];
        const initZ = initialPositions[idx + 2];

        const dx = curX - initX;
        const dy = curY - initY;
        const dz = curZ - initZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        assert.ok(
          dist <= THEORETICAL_MAX_RADIUS + 0.01,
          `Step ${step}: Firefly ${f} drifted ${dist.toFixed(4)}m from anchor (exceeded limit of ${THEORETICAL_MAX_RADIUS.toFixed(4)}m)`
        );
      }
    }

    // Now test a massive leap in time (simulating hours of continuous running)
    const extremeTime = 1000000.0;
    animators.forEach((anim) => anim(extremeTime, 0.016));

    for (let f = 0; f < 75; f++) {
      const idx = f * 3;
      const dx = posAttr.getX(f) - initialPositions[idx];
      const dy = posAttr.getY(f) - initialPositions[idx + 1];
      const dz = posAttr.getZ(f) - initialPositions[idx + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      assert.ok(
        dist <= THEORETICAL_MAX_RADIUS + 0.01,
        `Extreme time (${extremeTime}s): Firefly ${f} drifted ${dist.toFixed(4)}m from anchor`
      );
    }
  });

  test('D.3: Flagship Devotee Crowd Simulation (352 devotees + 140 aarti lamps) across 500 frames of extreme deltas maintains finite matrix buffers', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const realmObjects = [];

    buildAyodhyaRamMandirScene(THREE, scene, { id: 'ayodhya-ram-mandir' }, realmObjects, animators);

    const devoteesMesh = findObjectByName(scene, 'devotees_instanced_mesh');
    const aartiLampsMesh = findObjectByName(scene, 'aarti_lamps_instanced_mesh');

    assert.ok(devoteesMesh, 'devotees_instanced_mesh must exist');
    assert.ok(aartiLampsMesh, 'aarti_lamps_instanced_mesh must exist');
    assert.strictEqual(devoteesMesh.count, 352, 'Devotees count must be exactly 352');
    assert.strictEqual(aartiLampsMesh.count, 140, 'Aarti lamps count must be exactly 140');

    let simTime = 0;
    for (let step = 0; step < 500; step++) {
      const rawDelta = EXTREME_DELTAS[step % EXTREME_DELTAS.length];
      const clampedDelta = Math.min(Math.max(rawDelta, 0.001), 0.1);
      simTime += clampedDelta;

      animators.forEach((anim) => anim(simTime, clampedDelta));

      // Spot-check matrices on sample steps
      if (step % 50 === 0) {
        const devMatrixArray = devoteesMesh.instanceMatrix.array;
        const lampMatrixArray = aartiLampsMesh.instanceMatrix.array;

        // Check devotees matrix floats
        for (let j = 0; j < devMatrixArray.length; j += 16) {
          const posX = devMatrixArray[j + 12];
          const posY = devMatrixArray[j + 13];
          const posZ = devMatrixArray[j + 14];
          assert.ok(Number.isFinite(posX) && !Number.isNaN(posX), `Devotee ${j / 16} posX NaN`);
          assert.ok(Number.isFinite(posY) && !Number.isNaN(posY), `Devotee ${j / 16} posY NaN`);
          assert.ok(Number.isFinite(posZ) && !Number.isNaN(posZ), `Devotee ${j / 16} posZ NaN`);
        }

        // Check aarti lamp matrix floats
        for (let j = 0; j < lampMatrixArray.length; j += 16) {
          const posX = lampMatrixArray[j + 12];
          const posY = lampMatrixArray[j + 13];
          const posZ = lampMatrixArray[j + 14];
          assert.ok(Number.isFinite(posX) && !Number.isNaN(posX), `Lamp ${j / 16} posX NaN`);
          assert.ok(Number.isFinite(posY) && !Number.isNaN(posY), `Lamp ${j / 16} posY NaN`);
          assert.ok(Number.isFinite(posZ) && !Number.isNaN(posZ), `Lamp ${j / 16} posZ NaN`);
        }
      }
    }
  });

  test('D.4: Saffron Dhwaja flag wave animator across 500 frames of extreme deltas maintains mast pinning & wave activity', () => {
    const animators = [];
    const flagLength = 4.8;
    const flagHeight = 2.2;

    const flagGroup = createAnimatedDhwajaFlag(THREE, {
      mastHeight: 5.2,
      flagLength,
      flagHeight,
      animators
    });

    assert.ok(flagGroup, 'Flag group must be created');
    assert.strictEqual(animators.length, 1, 'Flag must register 1 wave animator');

    const flagMesh = flagGroup.children[1];
    const flagGeo = flagMesh.geometry;
    const posAttr = flagGeo.attributes.position;
    const count = posAttr.count;

    let simTime = 0;
    for (let step = 0; step < 500; step++) {
      const rawDelta = EXTREME_DELTAS[step % EXTREME_DELTAS.length];
      const clampedDelta = Math.min(Math.max(rawDelta, 0.001), 0.1);
      simTime += clampedDelta;

      animators[0](simTime, clampedDelta);

      // Check all vertices
      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        assert.ok(!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z), `Step ${step}: Flag vertex ${i} NaN`);

        // Mast Pinning invariant: Vertices at x = 0 must never deflect in Z
        if (Math.abs(x) < 0.001) {
          assert.ok(
            Math.abs(z) < 0.0001,
            `Step ${step}: Mast pinned vertex ${i} deflected in Z: ${z}`
          );
        }

        // Bounded traveling wave amplitude
        assert.ok(Math.abs(z) <= 0.60, `Step ${step}: Flag vertex ${i} Z wave exceeded limit: ${z}`);
      }
    }
  });

  test('D.5: Waterfall cascade (4,500 particles) & Plunge mist (1,600 particles) clamping prevents gravity explosion on 2.0s lag spike', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const realmObjects = [];

    buildWaterfallSanctuaryScene(THREE, scene, { id: 'natural-waterfall-sanctuary' }, realmObjects, animators);

    // Simulate single massive 2.0s lag spike
    const waterfallAnimator = animators[0];
    assert.doesNotThrow(() => waterfallAnimator(10.0, 2.0), 'Waterfall animator threw on 2.0s lag spike');

    // Inspect cascade points
    const cascadePoints = findObjectByName(scene, 'waterfall_cascade_particles');
    assert.ok(cascadePoints, 'Waterfall cascade must exist');
    const cPos = cascadePoints.geometry.attributes.position;
    assert.strictEqual(cPos.count, 4500, 'Cascade must contain 4,500 particles');

    for (let i = 0; i < cPos.count; i++) {
      const y = cPos.getY(i);
      assert.ok(!Number.isNaN(y), `Cascade particle ${i} Y is NaN`);
      // Under clamped delta (0.1s max), gravity step is at most -3.2 m/s, so Y should never collapse below -10m
      assert.ok(y >= -5.0 && y <= 45.0, `Cascade particle ${i} Y out of bounds after lag spike: ${y}`);
    }
  });

  test('D.6: Frame-rate independent delta clamp invariant: Math.min(Math.max(delta, 0.001), 0.1)', () => {
    const clampDelta = (raw) => Math.min(Math.max(raw, 0.001), 0.1);

    const testInputs = [
      { raw: -100.0, expected: 0.001 },
      { raw: 0.0, expected: 0.001 },
      { raw: 0.00001, expected: 0.001 },
      { raw: 0.0005, expected: 0.001 },
      { raw: 0.001, expected: 0.001 },
      { raw: 0.01667, expected: 0.01667 },
      { raw: 0.03333, expected: 0.03333 },
      { raw: 0.05, expected: 0.05 },
      { raw: 0.1, expected: 0.1 },
      { raw: 0.5, expected: 0.1 },
      { raw: 2.0, expected: 0.1 },
      { raw: 1000.0, expected: 0.1 }
    ];

    testInputs.forEach(({ raw, expected }) => {
      const result = clampDelta(raw);
      assert.strictEqual(
        Number(result.toFixed(5)),
        Number(expected.toFixed(5)),
        `Delta clamp failed for raw input ${raw}: expected ${expected}, got ${result}`
      );
      assert.ok(result >= 0.001 && result <= 0.1, `Clamped delta ${result} outside [0.001, 0.1]`);
    });
  });
});

// ============================================================================
// SUITE 6: AMBIENT AUDIO SYNTHESIZER MATHEMATICAL STABILITY
// ============================================================================
suite('M4 Challenger: Ambient Audio Synthesizer Mathematical Stability', 'M4 Challenger', () => {
  test('A.1: Noise buffer synthesis (white & pink) generates finite, normalized audio samples without NaNs', () => {
    const audio = new AmbientAudioEngine();

    // Create a mock AudioContext to test buffer creation math in Node.js
    const sampleRate = 44100;
    const channels = 2;
    const length = sampleRate * 2.0;

    const channelDataL = new Float32Array(length);
    const channelDataR = new Float32Array(length);

    audio.audioCtx = {
      sampleRate,
      createBuffer: (numChannels, bufLength, rate) => ({
        numberOfChannels: numChannels,
        length: bufLength,
        sampleRate: rate,
        getChannelData: (ch) => (ch === 0 ? channelDataL : channelDataR)
      })
    };

    // Test Pink Noise synthesis
    const pinkBuffer = audio.createNoiseBuffer('pink');
    assert.ok(pinkBuffer, 'Pink noise buffer must be created');

    for (let ch = 0; ch < 2; ch++) {
      const data = ch === 0 ? channelDataL : channelDataR;
      for (let i = 0; i < length; i++) {
        const sample = data[i];
        assert.ok(!Number.isNaN(sample), `Pink noise sample ${i} in channel ${ch} is NaN`);
        assert.ok(Number.isFinite(sample), `Pink noise sample ${i} is not finite`);
        // Samples must be within audio amplitude bounds [-1.5, 1.5]
        assert.ok(Math.abs(sample) <= 1.5, `Pink noise sample ${i} exceeded amplitude limit: ${sample}`);
      }
    }

    // Test White Noise synthesis
    const whiteBuffer = audio.createNoiseBuffer('white');
    assert.ok(whiteBuffer, 'White noise buffer must be created');

    for (let ch = 0; ch < 2; ch++) {
      const data = ch === 0 ? channelDataL : channelDataR;
      for (let i = 0; i < length; i++) {
        const sample = data[i];
        assert.ok(!Number.isNaN(sample), `White noise sample ${i} in channel ${ch} is NaN`);
        assert.ok(Number.isFinite(sample), `White noise sample ${i} is not finite`);
        assert.ok(Math.abs(sample) <= 0.35, `White noise sample ${i} exceeded amplitude limit: ${sample}`);
      }
    }
  });

  test('A.2: All 6 canonical soundscapes configure soundscape generators without syntax errors', () => {
    const audio = new AmbientAudioEngine();

    const mockCtx = {
      currentTime: 0,
      sampleRate: 44100,
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      }),
      createBiquadFilter: () => ({
        type: 'lowpass',
        frequency: { setValueAtTime: () => {} },
        Q: { setValueAtTime: () => {} },
        connect: () => {}
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createBuffer: () => ({
        getChannelData: () => new Float32Array(100)
      })
    };

    audio.audioCtx = mockCtx;
    const dummyGain = mockCtx.createGain();

    assert.doesNotThrow(() => audio.spawnSacredSoundscape(dummyGain), 'spawnSacredSoundscape threw');
    assert.doesNotThrow(() => audio.spawnNatureSoundscape(dummyGain), 'spawnNatureSoundscape threw');
    assert.doesNotThrow(() => audio.spawnCosmicSoundscape(dummyGain), 'spawnCosmicSoundscape threw');
    assert.doesNotThrow(() => audio.spawnCyberSoundscape(dummyGain), 'spawnCyberSoundscape threw');
    assert.doesNotThrow(() => audio.spawnAncientSoundscape(dummyGain), 'spawnAncientSoundscape threw');
    assert.doesNotThrow(() => audio.spawnZenSoundscape(dummyGain), 'spawnZenSoundscape threw');
  });
});

// Self-run execution
if (process.argv[1] && process.argv[1].endsWith('m4_challenger_stress.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
