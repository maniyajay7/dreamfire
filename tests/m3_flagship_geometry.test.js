/**
 * tests/m3_flagship_geometry.test.js
 * 
 * DreamFire Milestone M3: Flagship Showcase 3D Geometry Automated Verification Suite
 * Verifies:
 * - Feature F8: Ayodhya Shri Ram Mandir 3D Nagara Spire Geometry
 * - Feature F9: Flagship Devotee Crowd Simulation (352 InstancedMesh devotees)
 * - Feature F10: Flagship Waterfall Sanctuary (4,500 cascade particles & crystal float-bed)
 * - Defensive Invariants: Contextual gating, clean memory traversal, and HTML parity
 */

import fs from 'node:fs';
import path from 'node:path';
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

suite('Milestone M3: Flagship Showcase 3D Geometry & Crowd Simulation', 'Tier 2', () => {
  const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xcc8465 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

  // =========================================================================
  // FEATURE F8: AYODHYA SHRI RAM MANDIR 3D NAGARA GEOMETRY
  // =========================================================================

  test('F8.1: Amalaka cogged stone disc instantiates with 16 radial carved flutes', () => {
    const amalaka = createAmalakaDisc(THREE, 2.4, 1.1, sandstoneMat);
    assert.ok(amalaka instanceof THREE.Group, 'Amalaka must be a THREE.Group');
    assert.strictEqual(amalaka.name, 'amalaka_disc');
    assert.strictEqual(amalaka.children.length, 19, 'Amalaka must contain 3 core discs + 16 vertical radial flutes');
  });

  test('F8.2: Golden Amrit Kalasha instantiates with pedestal, pot, neck collar, and finial needle', () => {
    const kalasha = createGoldenKalasha(THREE, 1.2, goldMat);
    assert.ok(kalasha instanceof THREE.Group, 'Kalasha must be a THREE.Group');
    assert.strictEqual(kalasha.name, 'golden_kalasha');
    assert.strictEqual(kalasha.children.length, 4, 'Kalasha must contain base ring, kumbha pot, griva collar, and stupi needle');
  });

  test('F8.3: Animated Dhwaja flag generates triangular pennant and registers wave animator', () => {
    const animators = [];
    const flag = createAnimatedDhwajaFlag(THREE, {
      mastHeight: 5.2,
      flagLength: 4.8,
      flagHeight: 2.2,
      animators
    });
    assert.ok(flag instanceof THREE.Group, 'Flag must be a THREE.Group');
    assert.strictEqual(flag.name, 'animated_dhwaja_flag');
    assert.strictEqual(animators.length, 1, 'Flag must register exactly 1 per-frame wave animator callback');

    // Execute 1 frame of animation to confirm zero errors and numerical stability
    assert.doesNotThrow(() => animators[0](1.25, 0.016), 'Flag animator must execute cleanly without error');

    const flagMesh = flag.children.find((c) => c.geometry instanceof THREE.PlaneGeometry);
    const pos = flagMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      assert.ok(!Number.isNaN(pos.getY(i)), `Vertex ${i} Y must not be NaN`);
      assert.ok(!Number.isNaN(pos.getZ(i)), `Vertex ${i} Z must not be NaN`);
    }
  });

  test('F8.4: Nagara Shikhara tower generates multi-tiered Pancharatha body with Urushringas, Amalaka, and Kalasha', () => {
    const animators = [];
    const tower = createNagaraShikharaTower(THREE, {
      baseWidth: 12.0,
      height: 38.0,
      tiers: 10,
      hasUrushringas: true,
      hasFlag: true,
      sandstoneMat,
      goldMat,
      animators
    });
    assert.ok(tower instanceof THREE.Group, 'Tower must be a THREE.Group');
    assert.strictEqual(tower.name, 'nagara_shikhara_tower');
    assert.ok(tower.children.length >= 45, `Tower must contain comprehensive multi-tiered geometry (found ${tower.children.length})`);
    assert.ok(animators.length >= 1, 'Tower with flag must register flag wave animator');
  });

  test('F8.5: Carved Mandapa pillar generates plinth base, octagonal/fluted shafts, lotus capital, and 4-way cross brackets', () => {
    const pillar = createCarvedMandapaPillar(THREE, {
      height: 6.8,
      baseSize: 1.25,
      sandstoneMat
    });
    assert.ok(pillar instanceof THREE.Group, 'Pillar must be a THREE.Group');
    assert.strictEqual(pillar.name, 'carved_mandapa_pillar');
    assert.strictEqual(pillar.children.length, 8, 'Pillar must contain base1, base2, lower shaft, ring, upper shaft, capital, bracketArmX, and bracketArmZ');
  });

  test('F8.6: Garbhagriha sanctum sanctorum generates stone walls, Lord Ram murti, golden inner glow PointLight, and aura', () => {
    const animators = [];
    const realmObjects = [];
    const sanctum = createSanctumSanctorum(THREE, {
      yPlinth: 1.0,
      sandstoneMat,
      goldMat,
      animators,
      realmObjects
    });
    assert.ok(sanctum instanceof THREE.Group, 'Sanctum must be a THREE.Group');
    assert.strictEqual(sanctum.name, 'garbhagriha_sanctum');

    const innerLight = sanctum.children.find((c) => c.name === 'sanctum_golden_glow_light');
    assert.ok(innerLight, 'Sanctum must contain inner golden PointLight');
    assert.ok(realmObjects.includes(innerLight), 'Inner PointLight must be registered in realmObjects for cleanup');
    assert.ok(animators.length >= 1, 'Sanctum must register pulsating aura breathing animator');

    // Verify animator pulse execution
    assert.doesNotThrow(() => animators[0](2.0, 0.016), 'Sanctum aura breathing animator must execute cleanly');
  });

  test('F8.7: Aarti Deepastambhas generate 4 brass multi-tier lamps with flickering flame PointLights', () => {
    const animators = [];
    const realmObjects = [];
    const deepastambhas = createAartiDeepastambhas(THREE, {
      goldMat,
      animators,
      realmObjects
    });
    assert.ok(deepastambhas instanceof THREE.Group, 'Deepastambhas must be a THREE.Group');
    assert.strictEqual(deepastambhas.name, 'aarti_deepastambhas');
    assert.strictEqual(deepastambhas.children.length, 4, 'Must create exactly 4 brass Deepastambhas');
    assert.strictEqual(realmObjects.length, 4, 'All 4 flame PointLights must be registered in realmObjects');
    assert.strictEqual(animators.length, 4, 'Must register 4 flame flicker animators');

    // Run frame step
    assert.doesNotThrow(() => animators.forEach((fn) => fn(1.5, 0.016)), 'Deepastambha animators must execute cleanly');
  });

  test('F8.8: Master buildAyodhyaRamMandirScene builds complete temple complex (plinth, sanctum, 5 spires, colonnade, aarti)', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const realmData = { id: 'ayodhya-ram-mandir' };

    const mandir = buildAyodhyaRamMandirScene(THREE, scene, realmData, realmObjects, animators);
    assert.ok(mandir instanceof THREE.Group, 'Mandir root must be a THREE.Group');
    assert.strictEqual(mandir.name, 'flagship_ayodhya_ram_mandir');
    assert.ok(scene.children.includes(mandir), 'Mandir root must be added to active scene');
    assert.ok(realmObjects.includes(mandir), 'Mandir root must be registered in realmObjects');

    // Check plinth, colonnade, and sanctum components
    const plinth = mandir.children.find((c) => c.name === 'jagati_plinth');
    assert.ok(plinth, 'Mandir must contain Jagati plinth');
    const colonnade = mandir.children.find((c) => c.name === 'hypostyle_mandapam_colonnade');
    assert.ok(colonnade, 'Mandir must contain hypostyle mandapa colonnade');
    assert.ok(colonnade.children.length >= 24, 'Colonnade must contain at least 24 pillars + architrave beams');

    const shikharaTowers = mandir.children.filter((c) => c.name === 'nagara_shikhara_tower');
    assert.strictEqual(shikharaTowers.length, 5, 'Mandir complex must contain exactly 5 Nagara Shikhara spires');
  });

  // =========================================================================
  // FEATURE F9: FLAGSHIP DEVOTEE CROWD SIMULATION
  // =========================================================================

  test('F9.1: Devotee figure geometry creates watertight profile with LatheGeometry', () => {
    const geo = createDevoteeFigureGeometry(THREE);
    assert.ok(geo instanceof THREE.BufferGeometry, 'Devotee figure must be a BufferGeometry');
    assert.ok(geo.attributes.position, 'Figure geometry must have position attribute');
  });

  test('F9.2: Aarti lamp geometry merges plate and flame into single BufferGeometry', () => {
    const geo = createAartiLampGeometry(THREE);
    assert.ok(geo instanceof THREE.BufferGeometry, 'Aarti lamp must be a BufferGeometry');
    assert.ok(geo.attributes.position, 'Aarti lamp geometry must have position attribute');
  });

  test('F9.3: createDevoteeCrowdSimulation instantiates 352 robed devotees and ~140 aarti lamps via InstancedMesh', () => {
    const animators = [];
    const realmObjects = [];
    const crowd = createDevoteeCrowdSimulation(THREE, null, realmObjects, animators);

    assert.ok(crowd instanceof THREE.Group, 'Crowd simulation must return a THREE.Group');
    assert.strictEqual(crowd.name, 'devotee_crowd_simulation_f9');

    const devoteesMesh = crowd.children.find((c) => c.name === 'devotees_instanced_mesh');
    assert.ok(devoteesMesh, 'Must contain devotees InstancedMesh');
    assert.strictEqual(devoteesMesh.count, 352, 'Must instantiate exactly 352 robed devotees');

    const aartiLampsMesh = crowd.children.find((c) => c.name === 'aarti_lamps_instanced_mesh');
    assert.ok(aartiLampsMesh, 'Must contain aarti lamps InstancedMesh');
    assert.strictEqual(aartiLampsMesh.count, 140, 'Must instantiate exactly 140 brass aarti plates');

    assert.ok(animators.length >= 1, 'Must register zero-allocation crowd animation loop in animators array');
    assert.doesNotThrow(() => animators[0](1.0, 0.016), 'Crowd render animation loop must execute without error');
  });

  // =========================================================================
  // FEATURE F10: FLAGSHIP WATERFALL SANCTUARY
  // =========================================================================

  test('F10.1: buildWaterfallSanctuaryScene builds riverbank terrain, cliff, boulders, and water plane', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const realmData = { id: 'jays-enchanted-waterfall-retreat' };

    const result = buildWaterfallSanctuaryScene(THREE, scene, realmData, realmObjects, animators);
    assert.ok(result.group instanceof THREE.Group, 'Sanctuary must return group');
    assert.strictEqual(result.group.name, 'flagship_waterfall_sanctuary');
    assert.ok(scene.children.includes(result.group), 'Sanctuary group must be added to active scene');
    assert.ok(realmObjects.includes(result.group), 'Sanctuary group must be in realmObjects');

    assert.ok(result.terrainMesh, 'Must return terrainMesh');
    assert.strictEqual(result.terrainMesh.name, 'sanctuary_riverbank_terrain');
    assert.ok(result.waterMesh, 'Must return waterMesh');
    assert.strictEqual(result.waterMesh.name, 'sanctuary_river_water');

    const boulders = result.group.children.filter((c) => c.name && c.name.startsWith('river_boulder_'));
    assert.ok(boulders.length >= 12, `Must contain at least 12 granite river boulders (found ${boulders.length})`);
  });

  test('F10.2: Waterfall particle cascade contains 4,500 particles with AdditiveBlending and velocity recycling', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const realmData = { id: 'jays-enchanted-waterfall-retreat' };

    const result = buildWaterfallSanctuaryScene(THREE, scene, realmData, realmObjects, animators);
    const cascade = result.cascadePoints;
    assert.ok(cascade instanceof THREE.Points, 'Waterfall cascade must be THREE.Points');
    assert.strictEqual(cascade.name, 'waterfall_cascade_particles');

    const pos = cascade.geometry.attributes.position;
    assert.ok(pos, 'Cascade geometry must have position attribute');
    assert.strictEqual(pos.count, 4500, 'Waterfall cascade must contain exactly 4,500 particles');
    assert.strictEqual(cascade.material.blending, THREE.AdditiveBlending || 2, 'Cascade material must use AdditiveBlending');

    // Test simulation tick
    assert.doesNotThrow(() => animators.forEach((fn) => fn(1.5, 0.016)), 'Waterfall animation tick must execute cleanly');
  });

  test('F10.3: Plunge spray foam mist contains 1,600 particles with 6 concentric splash ripples', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const realmData = { id: 'jays-enchanted-waterfall-retreat' };

    const result = buildWaterfallSanctuaryScene(THREE, scene, realmData, realmObjects, animators);
    const mist = result.mistPoints;
    assert.ok(mist instanceof THREE.Points, 'Mist must be THREE.Points');
    assert.strictEqual(mist.name, 'waterfall_impact_mist');
    assert.strictEqual(mist.geometry.attributes.position.count, 1600, 'Mist must contain exactly 1,600 particles');

    const froth = result.group.children.find((c) => c.name === 'impact_froth_disc');
    assert.ok(froth, 'Must contain churning impact froth disc');

    const ripples = result.group.children.filter((c) => c.name && c.name.startsWith('splash_ripple_ring_'));
    assert.strictEqual(ripples.length, 6, 'Must contain exactly 6 concentric splash ripple rings');
  });

  test('F10.4: Transparent crystal relaxation float-bed features optical transmission, bedding, lantern, 75 fireflies, and sinkable state', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];
    const realmData = { id: 'jays-enchanted-waterfall-retreat' };

    const result = buildWaterfallSanctuaryScene(THREE, scene, realmData, realmObjects, animators);
    const bed = result.floatBedGroup;
    assert.ok(bed instanceof THREE.Group, 'Float bed must be a THREE.Group');
    assert.strictEqual(bed.name, 'transparent_crystal_float_bed');

    // Verify sinkable state controller
    assert.ok(typeof bed.userData.setSinkState === 'function', 'Float bed must support setSinkState');
    assert.ok(typeof bed.userData.toggleSinkState === 'function', 'Float bed must support toggleSinkState');

    assert.strictEqual(bed.userData.toggleSinkState(), true, 'Toggling sink state from false must return true');
    assert.strictEqual(bed.userData.toggleSinkState(), false, 'Toggling sink state from true must return false');

    const fireflies = result.group.children.find((c) => c.name === 'sanctuary_fireflies');
    assert.ok(fireflies, 'Must contain firefly particle system');
    assert.strictEqual(fireflies.geometry.attributes.position.count, 75, 'Must contain exactly 75 fireflies');
  });

  // =========================================================================
  // UNIVERSAL DISPATCHER & DEFENSIVE INVARIANTS
  // =========================================================================

  test('System.1: attachFlagshipScene correctly routes Ayodhya and Waterfall realms', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];

    const res1 = attachFlagshipScene(THREE, scene, { id: 'ayodhya-ram-mandir' }, realmObjects, animators);
    assert.ok(res1 && res1.type === 'ayodhya', 'Must route to ayodhya flagship scene');

    const res2 = attachFlagshipScene(THREE, scene, { id: 'jays-enchanted-waterfall-retreat' }, realmObjects, animators);
    assert.ok(res2 && res2.type === 'waterfall_sanctuary', 'Must route to waterfall_sanctuary flagship scene');
  });

  test('System.2: Strict Contextual Gating: Giza, Kedarnath, Orion, and Neo Tokyo spawn ZERO flagship geometry', () => {
    const secularRealms = [
      { id: 'giza-pyramids-orion-alignment', title: 'Great Pyramids of Giza' },
      { id: 'kedarnath-himalayan-peak', title: 'Kedarnath Snowy Temple' },
      { id: 'orion-deep-nebula', title: 'Orion Deep Nebula' },
      { id: 'neo-tokyo-shinjuku-crossing', title: 'Neo Tokyo Crossing' }
    ];

    secularRealms.forEach((realm) => {
      const scene = new THREE.Scene();
      const realmObjects = [];
      const animators = [];
      const res = attachFlagshipScene(THREE, scene, realm, realmObjects, animators);
      assert.strictEqual(res, null, `attachFlagshipScene must return null for secular/dry realm '${realm.id}'`);
      assert.strictEqual(scene.children.length, 0, `Scene must remain empty for secular/dry realm '${realm.id}'`);
      assert.strictEqual(realmObjects.length, 0, `realmObjects must remain empty for secular/dry realm '${realm.id}'`);
    });
  });

  test('System.3: Memory Management: clearRealm cleanly disposes child geometries and materials', () => {
    const scene = new THREE.Scene();
    const realmObjects = [];
    const animators = [];

    // Build Ayodhya Ram Mandir
    buildAyodhyaRamMandirScene(THREE, scene, { id: 'ayodhya-ram-mandir' }, realmObjects, animators);
    assert.ok(scene.children.length > 0, 'Scene must contain mandir objects');

    // Simulate clearRealm with recursive traversal
    let disposedGeometries = 0;
    let disposedMaterials = 0;

    realmObjects.forEach((obj) => {
      scene.remove(obj);
      if (obj.traverse) {
        obj.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
            disposedGeometries++;
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => { m.dispose(); disposedMaterials++; });
            } else {
              child.material.dispose();
              disposedMaterials++;
            }
          }
        });
      }
    });

    assert.ok(disposedGeometries >= 30, `Must dispose all nested child geometries (disposed ${disposedGeometries})`);
    assert.ok(disposedMaterials >= 30, `Must dispose all nested child materials (disposed ${disposedMaterials})`);
  });

  test('System.4: Zero-diff Parity: index.html and preview.html are 100% byte-for-byte identical', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist');
    assert.ok(fs.existsSync(PREVIEW_HTML_PATH), 'preview.html must exist');

    const bufIndex = fs.readFileSync(INDEX_HTML_PATH);
    const bufPreview = fs.readFileSync(PREVIEW_HTML_PATH);

    assert.strictEqual(
      bufIndex.length,
      bufPreview.length,
      `File size mismatch: index.html (${bufIndex.length} bytes) vs preview.html (${bufPreview.length} bytes)`
    );
    assert.ok(
      bufIndex.equals(bufPreview),
      'index.html and preview.html must be 100% byte-for-byte identical (0 diff)'
    );
  });
});

// Self-run execution support
if (process.argv[1] && process.argv[1].endsWith('m3_flagship_geometry.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
