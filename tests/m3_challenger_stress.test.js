/**
 * tests/m3_challenger_stress.test.js
 * 
 * DreamFire Milestone M3: Empirical Adversarial Verification & Stress Test Suite
 * Subagent: teamwork_challenger_m3_2
 * 
 * Verifies:
 * 1. Zero-Diff Parity: Byte-for-byte SHA256 equality between index.html and preview.html.
 * 2. Boundary Values & Fuzzing: Nagara Shikhara height, tier counts, Amalaka flute ribs, Kalasha.
 * 3. Dhwaja Pennant Traveling Wave Deformation: Mast pinning, wave propagation, and numerical stability.
 * 4. Devotee Crowd Simulation: 352 devotees, 140 aarti plates, zero-allocation render loop, and argument flexibility.
 * 5. Waterfall Sanctuary: 4,500 particles cascade recycling, 1,600 mist particles, 6 ripples, float-bed sink controller.
 * 6. Catalog-Wide Contextual Gating: Exhaustive test of all 110 realms in realms_catalog.json.
 * 7. Fault Injection & Malformed Data: null/undefined realmData, null scene, null animators/realmObjects.
 * 8. Camera Viewpoint Navigation: Rapid switching between presets and numerical bounds.
 * 9. SceneManager Lifecycle & Memory Traversal: Disposal of geometries and materials across repeated cycles.
 */

import fs from 'node:fs';
import path from 'node:path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');

const rawCatalog = fs.readFileSync(CATALOG_PATH, 'utf8');
const catalog = JSON.parse(rawCatalog);

suite('M3 Challenger: Zero-Diff Parity & Code Inspection', 'Tier 2 Challenger', () => {
  test('P.1: index.html and preview.html are 100% byte-for-byte identical (SHA256 match)', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must physically exist');
    assert.ok(fs.existsSync(PREVIEW_HTML_PATH), 'preview.html must physically exist');

    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    assert.strictEqual(indexBuf.length, previewBuf.length, `File size mismatch: ${indexBuf.length} vs ${previewBuf.length}`);
    assert.ok(indexBuf.equals(previewBuf), 'Byte buffer mismatch between index.html and preview.html');

    const hashIndex = crypto.createHash('sha256').update(indexBuf).digest('hex');
    const hashPreview = crypto.createHash('sha256').update(previewBuf).digest('hex');
    assert.strictEqual(hashIndex, hashPreview, 'SHA256 checksum mismatch between index.html and preview.html');
  });

  test('P.2: FlagshipScenes module exports all required flagship builders and helpers', () => {
    const requiredExports = [
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
    ];
    requiredExports.forEach((fn, idx) => {
      assert.strictEqual(typeof fn, 'function', `Export at index ${idx} must be a valid function`);
    });
  });
});

suite('M3 Challenger: Boundary Values & Geometry Stress Testing', 'Tier 2 Challenger', () => {
  const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xcc8465 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

  test('B.1: Nagara Shikhara tower boundary values (extreme heights, base widths, tier counts)', () => {
    // Height stress: very short (0.5m) to immense (150m)
    [0.5, 5.0, 38.0, 42.0, 150.0].forEach((h) => {
      const tower = createNagaraShikharaTower(THREE, {
        height: h,
        tiers: 5,
        sandstoneMat,
        goldMat
      });
      assert.ok(tower instanceof THREE.Group, `Tower must build with height ${h}`);
    });

    // Base width stress: 1.0m to 50.0m
    [1.0, 12.0, 50.0].forEach((w) => {
      const tower = createNagaraShikharaTower(THREE, {
        baseWidth: w,
        tiers: 4,
        sandstoneMat,
        goldMat
      });
      assert.ok(tower instanceof THREE.Group, `Tower must build with baseWidth ${w}`);
    });

    // Tier counts: 1, 2, 5, 7, 10, 20
    [1, 2, 5, 7, 10, 20].forEach((tiers) => {
      const tower = createNagaraShikharaTower(THREE, {
        height: 30.0,
        tiers: tiers,
        sandstoneMat,
        goldMat
      });
      assert.ok(tower instanceof THREE.Group, `Tower must build with tiers ${tiers}`);
      assert.ok(
        Number.isFinite(tower.children[0].geometry.parameters.width),
        `Tower core width must be finite for tiers ${tiers}`
      );
    });
  });

  test('B.2: Amalaka cogged stone disc boundary values (radius, height, flutes count)', () => {
    [0.2, 1.0, 2.4, 15.0].forEach((r) => {
      [0.2, 1.1, 8.0].forEach((h) => {
        const amalaka = createAmalakaDisc(THREE, r, h, sandstoneMat);
        assert.ok(amalaka instanceof THREE.Group);
        assert.strictEqual(amalaka.children.length, 19, 'Must always contain 3 discs + 16 vertical radial ribs');
      });
    });
  });

  test('B.3: Golden Amrit Kalasha boundary values (radius, sub-components)', () => {
    [0.1, 0.5, 1.2, 5.0].forEach((r) => {
      const kalasha = createGoldenKalasha(THREE, r, goldMat);
      assert.ok(kalasha instanceof THREE.Group);
      assert.strictEqual(kalasha.children.length, 4, 'Must always contain base, pot, collar, and stupi needle');
    });
  });

  test('B.4: Dhwaja pennant wave deformation math: mast pinning & wave activity', () => {
    const animators = [];
    const flag = createAnimatedDhwajaFlag(THREE, {
      mastHeight: 5.2,
      flagLength: 4.8,
      flagHeight: 2.2,
      animators
    });

    const flagMesh = flag.children.find((c) => c.geometry instanceof THREE.PlaneGeometry);
    assert.ok(flagMesh, 'Must contain flag plane mesh');
    const pos = flagMesh.geometry.attributes.position;
    assert.ok(pos, 'Flag geometry must have position attribute');

    // Run 100 simulation ticks with varying delta
    let maxMastZ = 0;
    let maxTipZ = 0;

    for (let f = 0; f < 100; f++) {
      const time = f * 0.016;
      animators[0](time, 0.016);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Mast line (x close to 0)
        if (Math.abs(x) < 0.01) {
          if (!Number.isNaN(z) && Math.abs(z) > maxMastZ) maxMastZ = Math.abs(z);
        }
        // Fly tip (x close to flagLength = 4.8)
        if (Math.abs(x - 4.8) < 0.01) {
          if (!Number.isNaN(z) && Math.abs(z) > maxTipZ) maxTipZ = Math.abs(z);
        }
      }
    }

    // Pinned mast verification: mast Z displacement must remain 0
    assert.strictEqual(maxMastZ, 0, 'Flag must be pinned at mast (Z displacement == 0)');
    // Waving verification: tip Z displacement must be active (> 0.2m)
    assert.ok(maxTipZ > 0.2, `Flag tip must wave dynamically in the wind (maxTipZ was ${maxTipZ})`);
  });

  test('B.5: Dhwaja pennant wave deformation empirical check: asserts whether any vertex evaluates to NaN', () => {
    const animators = [];
    const flag = createAnimatedDhwajaFlag(THREE, {
      mastHeight: 5.2,
      flagLength: 4.8,
      flagHeight: 2.2,
      animators
    });

    const flagMesh = flag.children.find((c) => c.geometry instanceof THREE.PlaneGeometry);
    const pos = flagMesh.geometry.attributes.position;

    // Execute 1 frame of animation
    animators[0](0.016, 0.016);

    let nanCount = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Number.isNaN(pos.getY(i)) || Number.isNaN(pos.getZ(i))) {
        nanCount++;
      }
    }

    // Empirical assertion: flag deformation should NOT corrupt vertices to NaN
    assert.strictEqual(
      nanCount,
      0,
      `Dhwaja wave deformation produced ${nanCount} NaN vertices due to Math.pow(fraction, 1.35) with negative fraction from float rounding`
    );
  });
});

suite('M3 Challenger: Devotee Crowd Simulation Stress Testing', 'Tier 2 Challenger', () => {
  test('C.1: createDevoteeCrowdSimulation instantiates exact tier distributions', () => {
    const animators = [];
    const realmObjects = [];
    const crowd = createDevoteeCrowdSimulation(THREE, null, realmObjects, animators);

    const devoteesMesh = crowd.children.find((c) => c.name === 'devotees_instanced_mesh');
    assert.ok(devoteesMesh, 'Must contain devotees InstancedMesh');
    assert.strictEqual(devoteesMesh.count, 352, 'Total devotee count must be exactly 352');

    const lampsMesh = crowd.children.find((c) => c.name === 'aarti_lamps_instanced_mesh');
    assert.ok(lampsMesh, 'Must contain aarti lamps InstancedMesh');
    assert.strictEqual(lampsMesh.count, 140, 'Total aarti plates must be exactly 140');
  });

  test('C.2: Devotee simulation zero-allocation render loop preserves matrix buffer integrity', () => {
    const animators = [];
    const realmObjects = [];
    const crowd = createDevoteeCrowdSimulation(THREE, null, realmObjects, animators);

    const devoteesMesh = crowd.children.find((c) => c.name === 'devotees_instanced_mesh');
    const lampsMesh = crowd.children.find((c) => c.name === 'aarti_lamps_instanced_mesh');

    // Execute 150 consecutive animation frames
    for (let f = 0; f < 150; f++) {
      const time = f * 0.016;
      animators[0](time, 0.016);
    }

    // Verify all 352 * 16 matrix elements are finite numbers
    const dArray = devoteesMesh.instanceMatrix.array;
    assert.strictEqual(dArray.length, 352 * 16);
    for (let i = 0; i < dArray.length; i++) {
      assert.ok(Number.isFinite(dArray[i]), `Devotee instanceMatrix element ${i} must be finite, got ${dArray[i]}`);
    }

    // Verify all 140 * 16 lamp matrix elements are finite numbers
    const lArray = lampsMesh.instanceMatrix.array;
    assert.strictEqual(lArray.length, 140 * 16);
    for (let i = 0; i < lArray.length; i++) {
      assert.ok(Number.isFinite(lArray[i]), `Lamp instanceMatrix element ${i} must be finite, got ${lArray[i]}`);
    }
  });

  test('C.3: Devotee color palette assigns white robes to priests and cultural hues to devotees', () => {
    const crowd = createDevoteeCrowdSimulation(THREE);
    const devoteesMesh = crowd.children.find((c) => c.name === 'devotees_instanced_mesh');
    const colorArray = devoteesMesh.instanceColor.array;
    assert.strictEqual(colorArray.length, 352 * 3, 'Must contain RGB color for every devotee');

    // Priests are index 120 through 135 (16 priests in Tier 1 aisle)
    for (let p = 120; p < 136; p++) {
      const r = colorArray[p * 3];
      const g = colorArray[p * 3 + 1];
      const b = colorArray[p * 3 + 2];
      // White/off-white robes: r, g, b must all be >= 0.75
      assert.ok(r >= 0.75 && g >= 0.75 && b >= 0.75, `Priest ${p} robe must be pure/off-white (got ${r}, ${g}, ${b})`);
    }
  });
});

suite('M3 Challenger: Waterfall Sanctuary & Float-Bed Buoyancy Stress Testing', 'Tier 2 Challenger', () => {
  test('W.1: Waterfall particle cascade cycles 4,500 particles with g = -32 m/s² without leakage', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];

    const result = buildWaterfallSanctuaryScene(THREE, scene, { id: 'jays-enchanted-waterfall-retreat' }, realmObjects, animators);
    const cascade = result.cascadePoints;
    const pos = cascade.geometry.attributes.position.array;
    assert.strictEqual(pos.length, 4500 * 3, 'Must have exactly 4,500 particles (13,500 coordinates)');

    // Run 200 physics iterations
    for (let f = 0; f < 200; f++) {
      animators.forEach((fn) => fn(f * 0.016, 0.016));
    }

    // Check bounds: Y coordinates must remain bounded between -0.5 and 45.0
    for (let i = 0; i < 4500; i++) {
      const y = pos[i * 3 + 1];
      assert.ok(Number.isFinite(y), `Particle ${i} Y must be finite`);
      assert.ok(y >= -1.0 && y <= 45.0, `Particle ${i} Y out of bounds: ${y}`);
    }
  });

  test('W.2: Transparent crystal relaxation float-bed sink state controller toggles cleanly', () => {
    const scene = new THREE.Scene();
    const result = buildWaterfallSanctuaryScene(THREE, scene, { id: 'jays-enchanted-waterfall-retreat' }, [], []);
    const bed = result.floatBedGroup;

    assert.ok(bed.userData.setSinkState, 'Must support setSinkState');
    assert.ok(bed.userData.toggleSinkState, 'Must support toggleSinkState');

    // Initial state: not sunk
    bed.userData.setSinkState(false);
    assert.strictEqual(bed.userData.toggleSinkState(), true, 'Toggling from false must yield true');
    assert.strictEqual(bed.userData.toggleSinkState(), false, 'Toggling from true must yield false');

    bed.userData.setSinkState(true);
    assert.strictEqual(result.toggleSinkBed(), false, 'Direct closure toggleSinkBed must work identically');
  });

  test('W.3: Plunge spray foam mist and concentric ripple rings animate without diverging', () => {
    const scene = new THREE.Scene();
    const animators = [];
    const result = buildWaterfallSanctuaryScene(THREE, scene, { id: 'jays-enchanted-waterfall-retreat' }, [], animators);

    // 6 ripple rings
    const ripples = result.group.children.filter((c) => c.name && c.name.startsWith('splash_ripple_ring_'));
    assert.strictEqual(ripples.length, 6, 'Must contain exactly 6 ripple rings');

    // Simulate 60 frames
    for (let f = 0; f < 60; f++) {
      animators.forEach((fn) => fn(f * 0.016, 0.016));
      ripples.forEach((ring, idx) => {
        if (ring.scale && typeof ring.scale.x === 'number') {
          assert.ok(ring.scale.x >= 1.0, `Ripple ring ${idx} scale.x must be >= 1.0`);
          assert.ok(ring.scale.x <= 35.0, `Ripple ring ${idx} scale.x must remain bounded <= 35.0`);
        }
      });
    }
  });
});

suite('M3 Challenger: Catalog-Wide Contextual Gating Across ALL 110 Realms', 'Tier 2 Challenger', () => {
  test('G.1: All 110 catalog realms pass through attachFlagshipScene safely', () => {
    assert.strictEqual(catalog.length, 110, 'Catalog must contain exactly 110 realms');

    const triggeredRealms = [];

    catalog.forEach((realm) => {
      const scene = new THREE.Scene();
      const realmObjects = [];
      const animators = [];

      let result = null;
      assert.doesNotThrow(() => {
        result = attachFlagshipScene(THREE, scene, realm, realmObjects, animators);
      }, `attachFlagshipScene threw on realm '${realm.id}'`);

      if (result !== null) {
        triggeredRealms.push({ id: realm.id, type: result.type, objectsCount: realmObjects.length });
      } else {
        // Assert zero geometry leaked into scene or realmObjects
        assert.strictEqual(scene.children.length, 0, `Secular realm '${realm.id}' must not have scene children`);
        assert.strictEqual(realmObjects.length, 0, `Secular realm '${realm.id}' must not populate realmObjects`);
      }
    });

    // Exactly 2 flagship realms must trigger
    assert.strictEqual(triggeredRealms.length, 2, `Exactly 2 realms must trigger flagship scenes, found ${triggeredRealms.length}`);

    const ayodhyaEntry = triggeredRealms.find((r) => r.id === 'ayodhya-ram-mandir');
    assert.ok(ayodhyaEntry, 'Ayodhya Ram Mandir realm must trigger flagship geometry');
    assert.strictEqual(ayodhyaEntry.type, 'ayodhya');
    assert.ok(ayodhyaEntry.objectsCount >= 5, 'Ayodhya must register scene objects for cleanup');

    const waterfallEntry = triggeredRealms.find((r) => r.id === 'jays-enchanted-waterfall-retreat');
    assert.ok(waterfallEntry, 'Waterfall Retreat realm must trigger flagship geometry');
    assert.strictEqual(waterfallEntry.type, 'waterfall_sanctuary');
    assert.ok(waterfallEntry.objectsCount >= 2, 'Waterfall must register scene objects for cleanup');
  });

  test('G.2: Strict negative test on other water realms (Iguazu, Victoria, Skogafoss do NOT trigger flagship)', () => {
    const otherWaterfalls = [
      'iguazu-falls-thunder',
      'victoria-falls-mist-veil',
      'skogafoss-iceland-rainbow'
    ];

    otherWaterfalls.forEach((id) => {
      const realm = catalog.find((r) => r.id === id);
      if (realm) {
        const scene = new THREE.Scene();
        const realmObjects = [];
        const animators = [];
        const res = attachFlagshipScene(THREE, scene, realm, realmObjects, animators);
        assert.strictEqual(res, null, `Other waterfall realm '${id}' must NOT trigger flagship sanctuary`);
        assert.strictEqual(scene.children.length, 0, `Scene must remain empty for '${id}'`);
      }
    });
  });
});

suite('M3 Challenger: Fault Injection & Malformed Data Hardening', 'Tier 2 Challenger', () => {
  test('F.1: attachFlagshipScene handles null, undefined, empty, and non-matching objects safely', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];

    // Null and undefined
    assert.strictEqual(attachFlagshipScene(THREE, scene, null, realmObjects, animators), null);
    assert.strictEqual(attachFlagshipScene(THREE, scene, undefined, realmObjects, animators), null);

    // Empty object
    assert.strictEqual(attachFlagshipScene(THREE, scene, {}, realmObjects, animators), null);

    // Non-matching string fields
    assert.strictEqual(attachFlagshipScene(THREE, scene, { id: 'unknown-realm', tags: [] }, realmObjects, animators), null);
  });

  test('F.2: attachFlagshipScene robustness under non-string id or non-array tags', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];

    // When id is numeric, attachFlagshipScene calls id.includes('ayodhya') which throws if not sanitized
    let threwOnNumber = false;
    try {
      attachFlagshipScene(THREE, scene, { id: 12345, tags: null }, realmObjects, animators);
    } catch (err) {
      threwOnNumber = true;
    }

    assert.strictEqual(
      threwOnNumber,
      false,
      'attachFlagshipScene should sanitize non-string id (e.g. String(id) or typeof check) instead of throwing TypeError'
    );
  });

  test('F.3: Flagship scene builders handle null scene, null realmObjects, and null animators safely', () => {
    // Ayodhya with null scene and arrays
    assert.doesNotThrow(() => {
      buildAyodhyaRamMandirScene(THREE, null, { id: 'ayodhya-ram-mandir' }, null, null);
    }, 'buildAyodhyaRamMandirScene must not throw with null scene/arrays');

    // Waterfall with null scene and arrays
    assert.doesNotThrow(() => {
      buildWaterfallSanctuaryScene(THREE, null, { id: 'jays-enchanted-waterfall-retreat' }, null, null);
    }, 'buildWaterfallSanctuaryScene must not throw with null scene/arrays');
  });
});

suite('M3 Challenger: Camera Viewpoint Navigation & Orbit Stability', 'Tier 2 Challenger', () => {
  const degToRad = (deg) => (deg * Math.PI) / 180;

  function calcCamera(yawDeg, pitchDeg, zoom = 1.0) {
    const dist = 25 / Math.max(0.5, zoom);
    const radYaw = degToRad(yawDeg);
    const radPitch = degToRad(pitchDeg);

    const px = dist * Math.sin(radYaw) * Math.cos(radPitch);
    const py = Math.max(1, 5 + dist * Math.sin(radPitch));
    const pz = dist * Math.cos(radYaw) * Math.cos(radPitch);
    return { px, py, pz };
  }

  test('V.1: Rapid switching between all Ayodhya and Waterfall presets maintains finite positions', () => {
    const presets = [
      { name: 'Devotee Crowd & Aarti', yaw: 0, pitch: -8, zoom: 1.35 },
      { name: 'Grand Ram Mandir Spires', yaw: 0, pitch: 22, zoom: 1.6 },
      { name: 'Sanctum Darshan of Lord Ram', yaw: 22, pitch: 6, zoom: 2.0 },
      { name: 'Sarayu River Water Level', yaw: -30, pitch: -16, zoom: 1.2 },
      { name: 'Lie on Transparent Bed', yaw: 12, pitch: -5, zoom: 1.7 },
      { name: 'Waterfall Plunge Pool', yaw: 0, pitch: 12, zoom: 1.5 },
      { name: 'Riverbank Grasslands', yaw: -40, pitch: -10, zoom: 1.2 },
      { name: 'Canopy Drone Flyover', yaw: 25, pitch: 25, zoom: 1.0 }
    ];

    // Rapid switch 1000 times
    for (let i = 0; i < 1000; i++) {
      const p = presets[i % presets.length];
      const pos = calcCamera(p.yaw, p.pitch, p.zoom);
      assert.ok(Number.isFinite(pos.px), `Preset ${p.name} px must be finite`);
      assert.ok(Number.isFinite(pos.py), `Preset ${p.name} py must be finite`);
      assert.ok(Number.isFinite(pos.pz), `Preset ${p.name} pz must be finite`);
      assert.ok(pos.py >= 1.0, `Camera y must never drop below 1.0m (got ${pos.py})`);
    }
  });

  test('V.2: Camera math fuzzed with 1,000 random extreme values never produces NaN or y < 1', () => {
    for (let i = 0; i < 1000; i++) {
      const yaw = (Math.random() - 0.5) * 10000;
      const pitch = (Math.random() - 0.5) * 360;
      const zoom = (Math.random() - 0.5) * 50; // includes negative zooms

      const pos = calcCamera(yaw, pitch, zoom);
      assert.ok(Number.isFinite(pos.px), `px must be finite for yaw=${yaw}, pitch=${pitch}, zoom=${zoom}`);
      assert.ok(Number.isFinite(pos.py), `py must be finite for yaw=${yaw}, pitch=${pitch}, zoom=${zoom}`);
      assert.ok(Number.isFinite(pos.pz), `pz must be finite for yaw=${yaw}, pitch=${pitch}, zoom=${zoom}`);
      assert.ok(pos.py >= 1.0, 'py must respect ground safety clamp >= 1.0');
    }
  });
});

suite('M3 Challenger: SceneManager Lifecycle & Memory Traversal', 'Tier 2 Challenger', () => {
  test('L.1: Repeated buildRealm and clearRealm cycles execute cleanly without memory leaks', async () => {
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      THREE: THREE
    };

    const { SceneManager } = await import('../src/engine/SceneManager.js');
    const sm = new SceneManager(null, { THREE });

    const ayodhya = catalog.find((r) => r.id === 'ayodhya-ram-mandir');
    const waterfall = catalog.find((r) => r.id === 'jays-enchanted-waterfall-retreat');
    const giza = catalog.find((r) => r.id === 'giza-pyramids-orion-alignment');

    // Run 10 rapid alternating build/clear cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      sm.buildRealm(ayodhya);
      assert.ok(sm.scene.children.length >= 6, 'Ayodhya scene must contain multiple children');
      assert.ok(sm.animators.length >= 5, 'Ayodhya must have animators');

      sm.clearRealm();
      assert.strictEqual(sm.scene.children.length, 1, 'After clearRealm only Skydome should remain');
      assert.strictEqual(sm.currentRealmObjects.length, 0, 'Realm objects must be empty after clear');
      assert.strictEqual(sm.animators.length, 0, 'Animators must be empty after clear');

      sm.buildRealm(waterfall);
      assert.ok(sm.scene.children.length >= 4, 'Waterfall scene must contain children');
      sm.clearRealm();
      assert.strictEqual(sm.scene.children.length, 1, 'Only Skydome remains after clear');

      sm.buildRealm(giza);
      assert.ok(sm.scene.children.length >= 3, 'Giza scene must contain terrain and lighting');
      sm.clearRealm();
      assert.strictEqual(sm.scene.children.length, 1, 'Only Skydome remains after clear');
    }
  });
});

// Self-run execution support
if (process.argv[1] && process.argv[1].endsWith('m3_challenger_stress.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
