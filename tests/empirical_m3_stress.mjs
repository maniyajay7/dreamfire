import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  createAnimatedDhwajaFlag,
  createNagaraShikharaTower,
  attachFlagshipScene,
  createDevoteeCrowdSimulation,
  buildAyodhyaRamMandirScene
} from '../src/engine/FlagshipScenes.js';

console.log('=== EMPIRICAL STRESS TEST SUITE: MILESTONE M3 ITERATION 2 ===');

// ---------------------------------------------------------------------------
// TEST 1: 100+ Frames of Dhwaja Flag Wave Animation Across All Flags
// ---------------------------------------------------------------------------
console.log('\n[TEST 1] Dhwaja Flag Wave Animation (200 frames, multiple flags, 0 NaNs)');
{
  const scene = new THREE.Scene();
  const animators = [];
  const realmObjects = [];
  const temple = buildAyodhyaRamMandirScene(THREE, scene, { id: 'ayodhya-ram-mandir' }, realmObjects, animators);

  const flagMeshes = [];
  temple.traverse(obj => {
    if (obj.geometry && obj.geometry.attributes && obj.geometry.attributes.position && obj.geometry.attributes.position.count === 133) {
      flagMeshes.push(obj);
    }
  });

  // Add edge cases
  const edgeConfigs = [
    { mastHeight: 2.0, flagLength: 1.0, flagHeight: 0.5 },
    { mastHeight: 5.2, flagLength: 4.8, flagHeight: 2.2 },
    { mastHeight: 12.0, flagLength: 9.6, flagHeight: 4.4 },
    { mastHeight: 0.1, flagLength: 0.2, flagHeight: 0.1 }
  ];
  edgeConfigs.forEach(cfg => {
    const f = createAnimatedDhwajaFlag(THREE, { ...cfg, animators });
    const mesh = f.children.find(c => c.geometry && c.geometry.attributes && c.geometry.attributes.position && c.geometry.attributes.position.count === 133);
    if (mesh) flagMeshes.push(mesh);
  });

  assert.strictEqual(flagMeshes.length, 7, 'Expected 3 temple flags + 4 custom flags');

  let nanCount = 0;
  let totalChecked = 0;
  let mastDriftViolations = 0;

  for (let frame = 0; frame < 200; frame++) {
    const time = frame * 0.016;
    for (const anim of animators) {
      anim(time, 0.016);
    }

    for (const mesh of flagMeshes) {
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        totalChecked += 3;
        if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
          nanCount++;
        }
        if (Math.abs(x) < 0.0001 && Math.abs(z) > 0.00001) {
          mastDriftViolations++;
        }
      }
    }
  }

  console.log(`  Frames tested: 200`);
  console.log(`  Flags tested: ${flagMeshes.length}`);
  console.log(`  Total coordinates checked: ${totalChecked}`);
  console.log(`  NaNs found: ${nanCount}`);
  console.log(`  Mast drift violations: ${mastDriftViolations}`);

  assert.strictEqual(nanCount, 0, 'Must have zero NaNs across all frames and flags');
  assert.strictEqual(mastDriftViolations, 0, 'Mast must remain strictly pinned at z=0');
  console.log('  ✔ PASS: Dhwaja flag wave simulation produced 0 NaNs and perfect mast pinning');
}

// ---------------------------------------------------------------------------
// TEST 2: createNagaraShikharaTower with tiers: 1 and Boundary Values
// ---------------------------------------------------------------------------
console.log('\n[TEST 2] Nagara Shikhara Tower (tiers: 1 and boundary values finite dimensions)');
{
  const sandstoneMat = new THREE.MeshBasicMaterial({ color: 0xcc8465 });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

  const boundaryConfigs = [
    { tiers: 1, height: 10, baseWidth: 5 },
    { tiers: 1, height: 42, baseWidth: 13.5, hasUrushringas: true, hasFlag: true },
    { tiers: 1, height: 1.0, baseWidth: 1.0 },
    { tiers: 1, height: 100.0, baseWidth: 0.1 },
    { tiers: 2, height: 15, baseWidth: 6 },
    { tiers: 10, height: 42, baseWidth: 13.5 }
  ];

  boundaryConfigs.forEach(cfg => {
    const tower = createNagaraShikharaTower(THREE, { ...cfg, sandstoneMat, goldMat });
    assert.ok(tower instanceof THREE.Group, 'Tower must be a THREE.Group');

    // Verify all meshes have finite parameters
    tower.traverse(child => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.parameters) {
          for (const [k, v] of Object.entries(geo.parameters)) {
            if (typeof v === 'number') {
              assert.ok(Number.isFinite(v), `Geometry parameter ${k} must be finite: got ${v}`);
            }
          }
        }
        if (geo.attributes && geo.attributes.position) {
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            assert.ok(Number.isFinite(pos.getX(i)), 'Vertex X must be finite');
            assert.ok(Number.isFinite(pos.getY(i)), 'Vertex Y must be finite');
            assert.ok(Number.isFinite(pos.getZ(i)), 'Vertex Z must be finite');
          }
        }
      }
    });

    const coreMesh = tower.children[0];
    assert.ok(coreMesh, 'Tower must contain children');
    assert.ok(coreMesh.geometry, 'First child must have geometry');
    assert.ok(coreMesh.geometry.parameters, 'First child geometry must have parameters');
    assert.ok(Number.isFinite(coreMesh.geometry.parameters.width), 'Core width must be finite');
    if (cfg.tiers === 1) {
      assert.strictEqual(coreMesh.geometry.parameters.width, cfg.baseWidth, 'Tiers:1 width must equal baseWidth');
    }
    console.log(`  Config tiers=${cfg.tiers}, height=${cfg.height}, baseWidth=${cfg.baseWidth} -> core width: ${coreMesh.geometry.parameters.width}, height: ${coreMesh.geometry.parameters.height}`);
  });

  console.log('  ✔ PASS: createNagaraShikharaTower produced 100% finite dimensions for tiers: 1');
}

// ---------------------------------------------------------------------------
// TEST 3: attachFlagshipScene with Malformed Inputs
// ---------------------------------------------------------------------------
console.log('\n[TEST 3] attachFlagshipScene Malformed Inputs (numeric id, null tags, undefined, etc.)');
{
  const scene = new THREE.Scene();
  const malformedInputs = [
    { id: 12345 },
    { id: 0 },
    { id: true },
    { id: null, title: null, tags: null },
    { id: undefined, tags: 'not-an-array' },
    { id: {}, tags: 42, environment: null },
    { id: 'random-realm', title: 999, tags: null },
    { id: 'random-realm', environment: { terrainPreset: null } },
    { id: 'random-realm', environment: { terrainPreset: 12345 } },
    null,
    undefined,
    {},
    { id: [] },
    { id: () => {} }
  ];

  malformedInputs.forEach((input, idx) => {
    let result = null;
    assert.doesNotThrow(() => {
      result = attachFlagshipScene(THREE, scene, input, [], []);
    }, `attachFlagshipScene threw on malformed input index ${idx}`);
    assert.strictEqual(result, null, `Malformed input index ${idx} must return null`);
  });

  // Verify valid Ayodhya and Waterfall return expected dispatch structure
  const ayodhyaResult = attachFlagshipScene(THREE, scene, { id: 'ayodhya-ram-mandir', tags: ['temple'] }, [], []);
  assert.ok(ayodhyaResult && ayodhyaResult.type === 'ayodhya', 'Valid Ayodhya must return { type: "ayodhya" }');
  assert.ok(ayodhyaResult.mandir instanceof THREE.Group, 'Ayodhya mandir must be THREE.Group');

  const waterfallResult = attachFlagshipScene(THREE, scene, { id: 'waterfall-sanctuary', tags: ['sanctuary'] }, [], []);
  assert.ok(waterfallResult && waterfallResult.type === 'waterfall_sanctuary', 'Valid Waterfall must return { type: "waterfall_sanctuary" }');
  assert.ok(waterfallResult.sanctuary.group instanceof THREE.Group, 'Waterfall group must be THREE.Group');

  console.log(`  Tested ${malformedInputs.length} malformed inputs: 100% safely handled and returned null`);
  console.log('  ✔ PASS: attachFlagshipScene is fully resilient against malformed data');
}

// ---------------------------------------------------------------------------
// TEST 4: createDevoteeCrowdSimulation(T, scene, realmObjects) Signature Check
// ---------------------------------------------------------------------------
console.log('\n[TEST 4] createDevoteeCrowdSimulation(T, scene, realmObjects) Signature Check');
{
  const scene = new THREE.Scene();
  const realmObjects = [];

  // Invoke with 3 arguments: (T, scene, realmObjects) without animators
  const crowdGroup = createDevoteeCrowdSimulation(THREE, scene, realmObjects);

  assert.ok(crowdGroup instanceof THREE.Group, 'Must return a THREE.Group');
  assert.strictEqual(crowdGroup.name, 'devotee_crowd_simulation_f9');

  // Verify realmObjects received crowdGroup and PointLights
  console.log(`  realmObjects length: ${realmObjects.length}`);
  const functionCount = realmObjects.filter(item => typeof item === 'function').length;
  const objectCount = realmObjects.filter(item => item && (typeof item.isObject3D !== 'undefined' || item instanceof THREE.Object3D || item instanceof THREE.Group || item instanceof THREE.Light)).length;

  console.log(`  Functions in realmObjects: ${functionCount}`);
  console.log(`  Three.js scene objects in realmObjects: ${objectCount}`);

  assert.strictEqual(functionCount, 0, 'realmObjects MUST contain 0 functions (no animators leaked)');
  assert.ok(realmObjects.includes(crowdGroup), 'realmObjects MUST contain crowdGroup for cleanup tracking');

  const lights = realmObjects.filter(item => item instanceof THREE.PointLight);
  console.log(`  PointLights in realmObjects: ${lights.length}`);
  assert.strictEqual(lights.length, 2, 'realmObjects MUST contain both aarti flame PointLights');

  console.log('  ✔ PASS: createDevoteeCrowdSimulation correctly populates realmObjects and leaks 0 functions');
}

console.log('\n=== ALL 4 EMPIRICAL CHALLENGES PASSED CLEANLY! ===\n');
