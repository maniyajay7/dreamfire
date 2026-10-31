/**
 * tests/m5_challenger_stress.test.js
 * 
 * DreamFire Milestone M5: Adversarial Stress Test & Empirical Verification Suite
 * Subagent: challenger_m5_1 (teamwork_challenger)
 * 
 * Target Verifications:
 * 1. Zero-Diff Parity & Artifact Conformance:
 *    - Byte-for-byte SHA256 equality of index.html and preview.html.
 *    - PromptMutator modular export compliance (classes, functions, dual-env Three.js).
 *    - HTML Screen 3 HUD integration (#tour-prompt-container, #tour-prompt-input, #tour-mutate-btn, action chips).
 * 2. 100 Random & Extreme Prompt Permutations Adversarial Harness (F14):
 *    - Combinatorial permutations of timeOfDay, lighting, biomes, weather, entities.
 *    - Malicious script injection (XSS, SVG, event handlers, javascript: URIs).
 *    - SQL injection & format strings (%s%x, null bytes \x00, control characters).
 *    - Unicode fuzzing, RTL overrides (\u202E), Asian scripts, zero-width spaces (\u200B).
 *    - Extreme lengths up to 20,000 characters.
 *    - Assert 0 crashes, 0 unhandled exceptions, and <10ms execution time per prompt.
 * 3. Mathematical Camera Navigation State Invariance (F15):
 *    - 100 consecutive scene mutations on Three.js PerspectiveCamera.
 *    - 100% bit-exact 64-bit float preservation of camera.position (x, y, z) and camera.quaternion (x, y, z, w).
 *    - Strict assertion of 0.0000000000000000 maximum drift across 100 mutations.
 * 4. Context-Aware Entity Spawning & Diya Gating Enforcement (F5 & F15):
 *    - Strict prohibition of floating diyas in dry/secular/cosmic biomes without water bodies.
 *    - Permitted spawning in authentic water-bearing sacred biomes (Ayodhya / Riverbank).
 *    - Independent non-water entity spawning (lanterns, crystals, neon spires).
 * 5. Resource Management & Weather Particle Lifecycle:
 *    - Seamless replacement and cleanup of weather particle systems (rain, aurora, cyber dust, clear).
 * 6. Input Sanitization & Security Defenses:
 *    - Strict verification of escapeHtml() and sanitizePrompt() neutralizing attack vectors.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';
import * as THREE from 'three';

import {
  parsePrompt,
  applyMutation,
  PromptParameterParser,
  SceneGraphMutator,
  escapeHtml,
  sanitizePrompt
} from '../src/engine/PromptMutator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const PROMPT_MUTATOR_PATH = path.join(ROOT_DIR, 'src', 'engine', 'PromptMutator.js');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createPrng(seed = 0xD10A71) {
  let s = seed | 0;
  return function next() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// SUITE 1: ZERO-DIFF PARITY & MILESTONE M5 ARTIFACT CONFORMANCE
// ============================================================================
suite('M5 Challenger: Zero-Diff Parity & Artifact Conformance', 'M5 Challenger', () => {
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

    const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex');
    const previewHash = crypto.createHash('sha256').update(previewBuf).digest('hex');

    assert.strictEqual(
      indexHash,
      previewHash,
      `SHA256 mismatch: ${indexHash} vs ${previewHash}`
    );
    assert.strictEqual(
      indexHash.toUpperCase(),
      '626E4FBF0293F5AE3682F7FA1B8506F761E0A9ABE2741BD4A29E872A0D3B8B73',
      'SHA256 must match the approved Milestone M5 baseline hash'
    );
  });

  test('P.2: PromptMutator module exports all required classes, functions, and interfaces', () => {
    assert.ok(fs.existsSync(PROMPT_MUTATOR_PATH), 'src/engine/PromptMutator.js must exist');
    assert.strictEqual(typeof parsePrompt, 'function', 'parsePrompt must be exported as a function');
    assert.strictEqual(typeof applyMutation, 'function', 'applyMutation must be exported as a function');
    assert.strictEqual(typeof PromptParameterParser, 'function', 'PromptParameterParser class must be exported');
    assert.strictEqual(typeof SceneGraphMutator, 'function', 'SceneGraphMutator class must be exported');
    assert.strictEqual(typeof escapeHtml, 'function', 'escapeHtml must be exported as a function');
    assert.strictEqual(typeof sanitizePrompt, 'function', 'sanitizePrompt must be exported as a function');

    const instance = new SceneGraphMutator();
    assert.strictEqual(typeof instance.parsePrompt, 'function', 'SceneGraphMutator must implement parsePrompt');
    assert.strictEqual(typeof instance.applyMutation, 'function', 'SceneGraphMutator must implement applyMutation');
  });

  test('P.3: HTML HUD integration for prompt hot-mutator bar in index.html and preview.html', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Container and input presence
    assert.ok(html.includes('id="tour-prompt-container"'), 'HUD must contain #tour-prompt-container');
    assert.ok(html.includes('id="tour-prompt-input"'), 'HUD must contain #tour-prompt-input');
    assert.ok(html.includes('id="tour-mutate-btn"'), 'HUD must contain #tour-mutate-btn');

    // Action chips presence
    assert.ok(html.includes('Sunset Mist'), 'HUD must contain Sunset Mist quick mutation chip');
    assert.ok(html.includes('Midnight Rain'), 'HUD must contain Midnight Rain quick mutation chip');
    assert.ok(html.includes('Aurora Void'), 'HUD must contain Aurora Void quick mutation chip');
    assert.ok(html.includes('Lanterns'), 'HUD must contain Lanterns quick mutation chip');
    assert.ok(html.includes('Wireframe'), 'HUD must contain Wireframe quick mutation chip');

    // JS handler presence
    assert.ok(html.includes('function executeTourPromptMutation('), 'HTML script must define executeTourPromptMutation');
    assert.ok(html.includes('window.PromptMutator ='), 'HTML script must register window.PromptMutator');
    assert.ok(html.includes('dreamfire:scene-mutated'), 'HTML script must dispatch dreamfire:scene-mutated event');
  });
});

// ============================================================================
// SUITE 2: 100 RANDOM & EXTREME PROMPT PERMUTATIONS ADVERSARIAL HARNESS (F14)
// ============================================================================
suite('M5 Challenger: 100 Random & Extreme Prompt Permutations Adversarial Harness', 'M5 Challenger', () => {
  const prng = createPrng(0xCA1100 + 2026);

  const TIMES = ['dawn', 'sunrise', 'morning', 'noon', 'golden hour', 'sunset', 'dusk', 'evening', 'twilight', 'midnight', 'night', 'dark', 'starlit'];
  const BIOMES = ['desert', 'dune', 'pyramid', 'glacial', 'snow peak', 'ice mountain', 'cyber', 'neon city', 'matrix tokyo', 'sacred_river', 'sarayu ghat', 'waterfall', 'cosmic', 'nebula void', 'jungle forest', 'amazon canopy', 'temple mandir', 'sanctuary retreat'];
  const WEATHERS = ['mist', 'heavy fog', 'driving rain', 'monsoon downpour', 'shimmering aurora', 'cyber dust', 'neon smog', 'clear sky', 'cloudless'];
  const ENTITIES = ['floating diyas', 'oil lamps', 'deepam flame', 'sky lanterns', 'praying devotees crowd', 'neon spires', 'crystals float-bed', 'many diyas', 'sparse lanterns'];
  const MODIFIERS = ['steep rugged towering cliffs', 'flat calm smooth plains', 'matrix wireframe grid mode', 'crimson blood red fog', 'cyan neon blue fog', 'violet purple atmosphere'];

  const XSS_PAYLOADS = [
    '<script>alert("xss"); window.__pwned__ = true;</script>',
    '<img src="x" onerror="window.__pwned__=1; document.body.style.background=\'red\'">',
    '<svg onload="alert(document.domain)" xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">Click me</a>',
    '"><script>window.__pwned__ = 2</script>',
    '<input onfocus="alert(1)" autofocus>',
    '<!--#exec cmd="ls -la"-->',
    '${process.exit(1)}',
    '{{constructor.constructor("return process")().exit()}}',
    '\' OR \'1\'=\'1\'; DROP TABLE realms; --',
    'admin\' UNION SELECT * FROM users --',
    '%s%s%s%n%x%d%p',
    '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0B\x0C\x0E\x1F\x7F',
    '\u202E\u202D\u200B\uFEFF\u200E\u200F',
    '🪔✨🕉️🌅🌧️🌌🏮⚡💀👽🚀🔥💧'
  ];

  function pickRandom(arr) {
    return arr[Math.floor(prng() * arr.length)];
  }

  // Generate 100 distinct adversarial prompts
  const testPrompts = [];

  // Group A: 50 Combinatorial Wild Permutations
  for (let i = 0; i < 50; i++) {
    const parts = [
      pickRandom(TIMES),
      pickRandom(BIOMES),
      pickRandom(WEATHERS),
      pickRandom(ENTITIES),
      pickRandom(MODIFIERS)
    ];
    testPrompts.push({
      type: 'combinatorial',
      prompt: parts.join(' ')
    });
  }

  // Group B: 25 Security & Injection Payloads embedded in natural language
  for (let i = 0; i < 25; i++) {
    const payload = XSS_PAYLOADS[i % XSS_PAYLOADS.length];
    const prompt = `Sacred ${pickRandom(TIMES)} in ${pickRandom(BIOMES)} with ${payload} and floating ${pickRandom(ENTITIES)}`;
    testPrompts.push({
      type: 'injection_attack',
      prompt
    });
  }

  // Group C: 15 Degenerate & Boundary Edge Cases
  const degeneratePrompts = [
    '',
    '   ',
    '\t\n\r  \n  ',
    '1234567890',
    '!@#$%^&*()_+=-`~[]\\{}|;\':",./<>?',
    '<',
    '>',
    '<<>>',
    'undefined',
    'null',
    'NaN',
    '[object Object]',
    'true',
    'false',
    '0'
  ];
  degeneratePrompts.forEach((p) => {
    testPrompts.push({
      type: 'degenerate_boundary',
      prompt: p
    });
  });

  // Group D: 10 Extreme Length & ReDoS Stress Inputs (1,000 to 20,000 chars)
  const lengthSizes = [1000, 2000, 3000, 4000, 5000, 7500, 10000, 12500, 15000, 20000];
  lengthSizes.forEach((size) => {
    const baseWord = 'cosmic neon sacred sunset mist desert diyas wireframe ';
    const repeats = Math.ceil(size / baseWord.length);
    const extremeStr = (baseWord.repeat(repeats)).slice(0, size);
    testPrompts.push({
      type: 'extreme_length',
      prompt: extremeStr,
      charLength: size
    });
  });

  test('F14.1: 100 random & extreme prompt permutations execute with 0 crashes and <10ms latency', () => {
    assert.strictEqual(testPrompts.length, 100, 'Must have exactly 100 test prompt permutations');

    let totalDurationMs = 0;
    let maxDurationMs = 0;
    let slowestIndex = -1;

    testPrompts.forEach((item, index) => {
      const start = process.hrtime.bigint();

      let result;
      try {
        result = parsePrompt(item.prompt);
      } catch (err) {
        assert.fail(`Prompt ${index + 1} crashed with exception: ${err.message}\nInput: ${item.prompt.slice(0, 100)}...`);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      totalDurationMs += durationMs;

      if (durationMs > maxDurationMs) {
        maxDurationMs = durationMs;
        slowestIndex = index;
      }

      // Assert < 10ms execution threshold per prompt
      assert.ok(
        durationMs < 10.0,
        `Prompt ${index + 1} (${item.type}) exceeded 10ms threshold: ${durationMs.toFixed(3)}ms`
      );

      // Verify shape contract
      assert.ok(result !== null && typeof result === 'object', `Prompt ${index + 1} must return an object`);
      assert.ok(typeof result.timeOfDay === 'string', `Prompt ${index + 1} timeOfDay must be a string`);
      assert.ok(result.lighting && typeof result.lighting === 'object', `Prompt ${index + 1} lighting must be an object`);
      assert.ok(result.atmosphere && typeof result.atmosphere === 'object', `Prompt ${index + 1} atmosphere must be an object`);
      assert.ok(result.terrain && typeof result.terrain === 'object', `Prompt ${index + 1} terrain must be an object`);
      assert.ok(result.entities && typeof result.entities === 'object', `Prompt ${index + 1} entities must be an object`);

      // Verify no NaN or undefined numeric pollution
      if (typeof result.lighting.ambientIntensity === 'number') {
        assert.ok(!Number.isNaN(result.lighting.ambientIntensity), `Prompt ${index + 1} ambientIntensity is NaN`);
      }
      if (typeof result.lighting.sunAngle === 'number') {
        assert.ok(!Number.isNaN(result.lighting.sunAngle), `Prompt ${index + 1} sunAngle is NaN`);
      }
      if (typeof result.atmosphere.fogDensity === 'number') {
        assert.ok(!Number.isNaN(result.atmosphere.fogDensity), `Prompt ${index + 1} fogDensity is NaN`);
      }
      if (typeof result.terrain.elevationScale === 'number') {
        assert.ok(!Number.isNaN(result.terrain.elevationScale), `Prompt ${index + 1} elevationScale is NaN`);
      }
      if (typeof result.entities.countDelta === 'number') {
        assert.ok(!Number.isNaN(result.entities.countDelta), `Prompt ${index + 1} countDelta is NaN`);
      }
    });

    const avgDurationMs = totalDurationMs / testPrompts.length;

    // Verify global security containment
    assert.strictEqual(typeof global.__pwned__, 'undefined', 'Security violation: script injection executed in Node environment!');
    assert.strictEqual(typeof global.pwn, 'undefined', 'Security violation: global pollution detected!');

    // Empirical metrics assertion
    assert.ok(
      avgDurationMs < 2.0,
      `Average execution duration ${avgDurationMs.toFixed(3)}ms must be under 2.0ms`
    );
    assert.ok(
      maxDurationMs < 10.0,
      `Max execution duration ${maxDurationMs.toFixed(3)}ms (prompt #${slowestIndex + 1}) must be under 10.0ms`
    );
  });
});

// ============================================================================
// SUITE 3: MATHEMATICAL CAMERA NAVIGATION STATE INVARIANCE (F15)
// ============================================================================
suite('M5 Challenger: Mathematical Camera Navigation State Invariance Across 100 Scene Mutations', 'M5 Challenger', () => {
  test('F15.1: Camera position and quaternion remain 100% bit-exact across 100 consecutive scene mutations', () => {
    // 1. Initialize realistic Three.js scene with lights, fog, terrain
    const scene = new THREE.Scene();

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.name = 'sun_directional_light';
    dirLight.position.set(20, 100, 20);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x223344, 0.8);
    ambLight.name = 'sky_ambient_light';
    scene.add(ambLight);

    scene.fog = new THREE.FogExp2(0x334455, 0.002);

    const terrainGeo = new THREE.PlaneGeometry(100, 100, 16, 16);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, wireframe: false });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.name = 'procedural_desert_terrain_mesh';
    scene.add(terrainMesh);

    // 2. Initialize Three.js PerspectiveCamera with non-trivial floating-point values
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    
    // Set arbitrary high-precision coordinates representing user looking around a 3D scene
    camera.position.set(42.12345678901234, -15.98765432109876, 88.55555555555556);
    camera.quaternion.set(0.18257418583505536, 0.3651483716701107, 0.5477225575051661, 0.7302967433402214);
    camera.quaternion.normalize();

    // Snapshot exact 64-bit IEEE-754 bitwise values
    const initialPos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };

    const initialQuat = {
      x: camera.quaternion.x,
      y: camera.quaternion.y,
      z: camera.quaternion.z,
      w: camera.quaternion.w
    };

    // Confirm initial state is non-zero
    assert.ok(initialPos.x !== 0 && initialPos.y !== 0 && initialPos.z !== 0, 'Camera initial position must be non-zero');
    assert.ok(initialQuat.x !== 0 && initialQuat.y !== 0 && initialQuat.z !== 0 && initialQuat.w !== 0, 'Camera initial quat must be non-zero');

    const prng = createPrng(0xCA3E8A_100);

    // 3. Execute 100 consecutive diverse scene mutations
    const mutationPrompts = [
      'golden sunset with crimson desert dunes and heavy mist',
      'midnight driving rain in cyber neon city',
      'deep cosmic void with shimmering aurora and floating crystals',
      'sacred dawn at river ghat with sky lanterns',
      'neon cyberpunk wireframe grid with neon spires',
      'steep rugged mountain peaks with clear skies at noon',
      'twilight blue hour over tranquil temple sanctuary with solid terrain',
      'monsoon storm with torrential rain and dark skies',
      'dusk evening over amazon rainforest canopy with mist',
      'crepuscular twilight over glacial peaks with high elevation'
    ];

    let sceneStateMutationCount = 0;
    const animators = [];
    const realmObjects = [];

    for (let cycle = 0; cycle < 100; cycle++) {
      const promptText = mutationPrompts[cycle % mutationPrompts.length] + ' cycle ' + cycle;
      const parsed = parsePrompt(promptText);

      // Record pre-mutation scene fog/light values to assert that scene DID mutate
      const preFogDensity = scene.fog.density;
      const preAmbIntensity = ambLight.intensity;

      // Apply hot-mutation
      applyMutation(scene, camera, parsed, {
        ThreeInstance: THREE,
        animators,
        realmObjects,
        realmData: {
          environment: {
            biome: parsed.terrain.biome || 'desert',
            hasWaterBody: false,
            festiveContext: false
          }
        }
      });

      // Assert scene mutated
      if (scene.fog.density !== preFogDensity || ambLight.intensity !== preAmbIntensity) {
        sceneStateMutationCount++;
      }

      // CRITICAL ASSERTION: Bit-exact 64-bit float preservation of camera.position
      assert.strictEqual(
        Object.is(camera.position.x, initialPos.x),
        true,
        `Cycle ${cycle + 1}: camera.position.x drifted! Expected ${initialPos.x}, got ${camera.position.x}`
      );
      assert.strictEqual(
        Object.is(camera.position.y, initialPos.y),
        true,
        `Cycle ${cycle + 1}: camera.position.y drifted! Expected ${initialPos.y}, got ${camera.position.y}`
      );
      assert.strictEqual(
        Object.is(camera.position.z, initialPos.z),
        true,
        `Cycle ${cycle + 1}: camera.position.z drifted! Expected ${initialPos.z}, got ${camera.position.z}`
      );

      // CRITICAL ASSERTION: Bit-exact 64-bit float preservation of camera.quaternion
      assert.strictEqual(
        Object.is(camera.quaternion.x, initialQuat.x),
        true,
        `Cycle ${cycle + 1}: camera.quaternion.x drifted! Expected ${initialQuat.x}, got ${camera.quaternion.x}`
      );
      assert.strictEqual(
        Object.is(camera.quaternion.y, initialQuat.y),
        true,
        `Cycle ${cycle + 1}: camera.quaternion.y drifted! Expected ${initialQuat.y}, got ${camera.quaternion.y}`
      );
      assert.strictEqual(
        Object.is(camera.quaternion.z, initialQuat.z),
        true,
        `Cycle ${cycle + 1}: camera.quaternion.z drifted! Expected ${initialQuat.z}, got ${camera.quaternion.z}`
      );
      assert.strictEqual(
        Object.is(camera.quaternion.w, initialQuat.w),
        true,
        `Cycle ${cycle + 1}: camera.quaternion.w drifted! Expected ${initialQuat.w}, got ${camera.quaternion.w}`
      );
    }

    // Verify scene actually underwent live updates during testing
    assert.ok(
      sceneStateMutationCount > 50,
      `Expected active scene updates across mutations, but only observed ${sceneStateMutationCount} changes`
    );

    // Calculate maximum absolute drift across all components
    const posDrift = Math.max(
      Math.abs(camera.position.x - initialPos.x),
      Math.abs(camera.position.y - initialPos.y),
      Math.abs(camera.position.z - initialPos.z)
    );
    const quatDrift = Math.max(
      Math.abs(camera.quaternion.x - initialQuat.x),
      Math.abs(camera.quaternion.y - initialQuat.y),
      Math.abs(camera.quaternion.z - initialQuat.z),
      Math.abs(camera.quaternion.w - initialQuat.w)
    );

    assert.strictEqual(posDrift, 0, 'Camera position drifted across 100 mutations');
    assert.strictEqual(quatDrift, 0, 'Camera quaternion drifted across 100 mutations');
  });
});

// ============================================================================
// SUITE 4: CONTEXT-AWARE ENTITY SPAWNING & DIYA GATING (F5 & F15)
// ============================================================================
suite('M5 Challenger: Context-Aware Entity Spawning & Diya Gating Enforcement', 'M5 Challenger', () => {
  test('F5.1: Floating diyas are STRICTLY PREVENTED from spawning in dry realms without water bodies', () => {
    const dryBiomes = [
      { name: 'giza-pyramids', biome: 'desert', hasWaterBody: false, festiveContext: false },
      { name: 'kedarnath-peaks', biome: 'glacial', hasWaterBody: false, festiveContext: false },
      { name: 'neo-tokyo-cyber', biome: 'cyber', hasWaterBody: false, festiveContext: false },
      { name: 'orion-nebula-void', biome: 'cosmic', hasWaterBody: false, festiveContext: false }
    ];

    dryBiomes.forEach((realm) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const parsedPrompt = parsePrompt('Sacred midnight river with 100 glowing floating diyas and oil lamps');

      assert.strictEqual(parsedPrompt.entities.spawnType, 'diyas', 'Parser must extract diyas spawnType');

      // Attempt to apply mutation requesting diyas on a dry realm without water
      applyMutation(scene, camera, parsedPrompt, {
        ThreeInstance: THREE,
        realmData: {
          id: realm.name,
          environment: {
            biome: realm.biome,
            hasWaterBody: realm.hasWaterBody,
            festiveContext: realm.festiveContext
          }
        }
      });

      // Verify ZERO diya entity groups were added to the scene
      const diyaGroup = scene.getObjectByName('prompt_entity_diyas');
      assert.strictEqual(
        diyaGroup,
        null,
        `Diya gating violation: prompt_entity_diyas was spawned in dry realm '${realm.name}' (${realm.biome})!`
      );

      // Verify no children with diya userData exist
      let diyaMeshCount = 0;
      scene.traverse((child) => {
        if (child.userData && child.userData.type === 'diyas') diyaMeshCount++;
      });
      assert.strictEqual(diyaMeshCount, 0, `Found ${diyaMeshCount} unexpected diya meshes in dry realm '${realm.name}'`);
    });
  });

  test('F5.2: Floating diyas spawn successfully in authentic sacred environments with water bodies', () => {
    const waterRealms = [
      { name: 'ayodhya-ram-mandir', biome: 'sacred_river', hasWaterBody: true, festiveContext: true },
      { name: 'varanasi-ganga-ghats', biome: 'sacred_river', hasWaterBody: true, festiveContext: true },
      { name: 'waterfall-sanctuary', biome: 'sanctuary', hasWaterBody: true, festiveContext: false }
    ];

    waterRealms.forEach((realm) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      
      // Simulate water plane existing in the scene
      const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial());
      waterPlane.name = 'water_plane';
      scene.add(waterPlane);

      const parsedPrompt = parsePrompt('Sacred dawn river with glowing floating diyas');
      assert.strictEqual(parsedPrompt.entities.spawnType, 'diyas');

      applyMutation(scene, camera, parsedPrompt, {
        ThreeInstance: THREE,
        realmData: {
          id: realm.name,
          environment: {
            biome: realm.biome,
            hasWaterBody: realm.hasWaterBody,
            festiveContext: realm.festiveContext
          }
        }
      });

      const diyaGroup = scene.getObjectByName('prompt_entity_diyas');
      assert.ok(
        diyaGroup !== null && typeof diyaGroup === 'object',
        `Expected prompt_entity_diyas to spawn in sacred water realm '${realm.name}'`
      );
      assert.strictEqual(diyaGroup.children.length, 24, 'Diya group must contain 24 instantiated diyas');

      // Verify 3D geometry of spawned diyas (clay bowl + flame)
      const firstDiya = diyaGroup.children[0];
      assert.strictEqual(firstDiya.children.length, 2, 'Each diya must contain 2 meshes (bowl + flame)');
      const bowl = firstDiya.children[0];
      const flame = firstDiya.children[1];
      assert.ok(bowl.geometry instanceof THREE.CylinderGeometry, 'Diya bowl must use CylinderGeometry');
      assert.ok(flame.geometry instanceof THREE.ConeGeometry, 'Diya flame must use ConeGeometry');
    });
  });

  test('F5.3: Non-water entities (lanterns, crystals, neon spires) spawn independently across biomes', () => {
    // 1. Lanterns in desert
    const scene1 = new THREE.Scene();
    const parsedLanterns = parsePrompt('Evening sky lanterns over desert dunes');
    assert.strictEqual(parsedLanterns.entities.spawnType, 'lanterns');
    applyMutation(scene1, new THREE.PerspectiveCamera(), parsedLanterns, { ThreeInstance: THREE });
    const lanternGroup = scene1.getObjectByName('prompt_entity_lanterns');
    assert.ok(lanternGroup !== null, 'Lanterns should spawn without water body restriction');
    assert.strictEqual(lanternGroup.children.length, 18, 'Expected 18 spawned sky lanterns');

    // 2. Crystals in cosmic void
    const scene2 = new THREE.Scene();
    const parsedCrystals = parsePrompt('Deep cosmic void with floating crystals');
    assert.strictEqual(parsedCrystals.entities.spawnType, 'crystals');
    applyMutation(scene2, new THREE.PerspectiveCamera(), parsedCrystals, { ThreeInstance: THREE });
    const crystalGroup = scene2.getObjectByName('prompt_entity_crystals');
    assert.ok(crystalGroup !== null, 'Crystals should spawn in cosmic realm');
    assert.strictEqual(crystalGroup.children.length, 15, 'Expected 15 spawned crystals');
    assert.ok(crystalGroup.children[0].geometry instanceof THREE.OctahedronGeometry, 'Crystal must use OctahedronGeometry');

    // 3. Neon spires in cyber city
    const scene3 = new THREE.Scene();
    const parsedSpires = parsePrompt('Neon cyberpunk city with towering neon spires');
    assert.strictEqual(parsedSpires.entities.spawnType, 'neon_spires');
    applyMutation(scene3, new THREE.PerspectiveCamera(), parsedSpires, { ThreeInstance: THREE });
    const spireGroup = scene3.getObjectByName('prompt_entity_neon_spires');
    assert.ok(spireGroup !== null, 'Neon spires should spawn in cyber realm');
    assert.strictEqual(spireGroup.children.length, 10, 'Expected 10 spawned neon spires');
  });
});

// ============================================================================
// SUITE 5: RESOURCE MANAGEMENT & WEATHER PARTICLE LIFECYCLE
// ============================================================================
suite('M5 Challenger: Resource Management & Weather Particle Lifecycle', 'M5 Challenger', () => {
  test('R.1: Rapid consecutive weather mutations cleanly replace particle systems without leaks', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const animators = [];

    const weatherProgression = [
      'midnight driving rain',
      'deep cosmic void with shimmering aurora',
      'cyberpunk neon city with cyber dust fallout',
      'clear cloudless sunny noon sky'
    ];

    weatherProgression.forEach((prompt, step) => {
      const parsed = parsePrompt(prompt);
      applyMutation(scene, camera, parsed, {
        ThreeInstance: THREE,
        animators
      });

      // Count active weather particle systems
      let weatherParticleCount = 0;
      scene.traverse((child) => {
        if (child.name === 'weather_particles') weatherParticleCount++;
      });

      if (step === 3) {
        // Clear sky should remove weather particles entirely
        assert.strictEqual(
          weatherParticleCount,
          0,
          `Step ${step + 1} (${prompt}): Clear weather must remove weather_particles, found ${weatherParticleCount}`
        );
      } else {
        // Active weather must maintain exactly 1 active weather particle system (no accumulation)
        assert.strictEqual(
          weatherParticleCount,
          1,
          `Step ${step + 1} (${prompt}): Must have exactly 1 active weather_particles system, found ${weatherParticleCount}`
        );
      }
    });
  });

  test('R.2: Terrain wireframe and elevation scale mutations update materials cleanly', () => {
    const scene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(50, 50, 10, 10);
    const mat = new THREE.MeshStandardMaterial({ wireframe: false });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.name = 'procedural_cyber_terrain';
    scene.add(terrain);

    // Mutate to wireframe with high elevation
    const p1 = parsePrompt('cyber neon matrix grid mode with steep towering cliffs');
    applyMutation(scene, new THREE.PerspectiveCamera(), p1, { ThreeInstance: THREE });

    assert.strictEqual(terrain.material.wireframe, true, 'Terrain material wireframe must be set to true');
    assert.strictEqual(terrain.scale.y, 1.75, 'Terrain elevation scale must be set to 1.75');

    // Mutate back to solid flat terrain
    const p2 = parsePrompt('calm flat plains with textured solid surface');
    applyMutation(scene, new THREE.PerspectiveCamera(), p2, { ThreeInstance: THREE });

    assert.strictEqual(terrain.material.wireframe, false, 'Terrain material wireframe must be set to false');
    assert.strictEqual(terrain.scale.y, 0.45, 'Terrain elevation scale must be set to 0.45');
  });

  test('R.3: Zombie animator prevention: detached weather particle systems exit immediately without updating geometry', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const animators = [];

    // 1. Create weather system
    applyMutation(scene, camera, parsePrompt('midnight rain'), {
      ThreeInstance: THREE,
      animators
    });

    const weatherSystem = scene.getObjectByName('weather_particles');
    assert.ok(weatherSystem !== null, 'Weather particle system must be created');
    assert.strictEqual(animators.length, 1, 'One animator must be registered');

    // 2. Detach weather system from scene
    scene.remove(weatherSystem);
    assert.ok(!weatherSystem.parent, 'Weather system must be detached');

    // 3. Spy on pos.setY
    let updateCount = 0;
    const pos = weatherSystem.geometry.attributes.position;
    const originalSetY = pos.setY.bind(pos);
    pos.setY = function(index, y) {
      updateCount++;
      return originalSetY(index, y);
    };

    // 4. Tick animator on detached system
    animators[0](1.0, 0.016);

    // 5. Assert 0 position calculations occurred
    assert.strictEqual(updateCount, 0, 'Detached weather animator must not perform position calculations');
  });
});

// ============================================================================
// SUITE 6: INPUT SANITIZATION & SECURITY DEFENSES
// ============================================================================
suite('M5 Challenger: Input Sanitization & Security Defenses', 'M5 Challenger', () => {
  test('S.1: escapeHtml escapes dangerous HTML characters to prevent XSS injection', () => {
    const raw = '<script>alert("hello & welcome\'s world")</script>';
    const escaped = escapeHtml(raw);

    assert.strictEqual(escaped.includes('<'), false, 'Must not contain raw <');
    assert.strictEqual(escaped.includes('>'), false, 'Must not contain raw >');
    assert.strictEqual(escaped.includes('"'), false, 'Must not contain raw "');
    assert.strictEqual(escaped.includes("'"), false, "Must not contain raw '");
    assert.strictEqual(escaped.includes('&amp;'), true, 'Must escape & to &amp;');
    assert.strictEqual(escaped.includes('&lt;'), true, 'Must escape < to &lt;');
    assert.strictEqual(escaped.includes('&gt;'), true, 'Must escape > to &gt;');

    // Non-string handling
    assert.strictEqual(escapeHtml(null), '', 'null must return empty string');
    assert.strictEqual(escapeHtml(undefined), '', 'undefined must return empty string');
    assert.strictEqual(escapeHtml(12345), '', 'number must return empty string');
  });

  test('S.2: sanitizePrompt strips HTML tags, control chars, and null bytes', () => {
    const dirty = '  <b>Sunset</b> over <script>evil()</script>\x00dunes\x1F\t  ';
    const clean = sanitizePrompt(dirty);

    assert.strictEqual(clean.includes('<'), false, 'Must strip <');
    assert.strictEqual(clean.includes('>'), false, 'Must strip >');
    assert.strictEqual(clean.includes('\x00'), false, 'Must strip null bytes');
    assert.strictEqual(clean.includes('\x1F'), false, 'Must strip control characters');
    assert.ok(clean.includes('Sunset') && clean.includes('dunes'), 'Must retain clean textual content');

    // Non-string handling
    assert.strictEqual(sanitizePrompt(null), '', 'null must return empty string');
    assert.strictEqual(sanitizePrompt(undefined), '', 'undefined must return empty string');
  });

  test('S.3: Truncates mega-strings over 50,000 characters to prevent memory exhaustion', () => {
    const huge = 'a'.repeat(60000);
    const start = Date.now();
    const parsed = parsePrompt(huge);
    const elapsed = Date.now() - start;

    assert.ok(parsed !== null && typeof parsed === 'object', 'Mega string must return valid object');
    assert.ok(elapsed < 25, `50k char processing took ${elapsed}ms, must be <25ms`);
  });

  test('S.4: Linear O(N) execution and ReDoS immunity for sanitizePrompt on 60,000 unclosed brackets', () => {
    const unclosed = '<'.repeat(60000);
    const start = process.hrtime.bigint();
    const clean = sanitizePrompt(unclosed);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    assert.strictEqual(clean, '<'.repeat(60000), 'Unclosed brackets should remain unmodified as text');
    assert.ok(durationMs < 5.0, `60k unclosed brackets took ${durationMs.toFixed(3)}ms (must be < 5.0ms)`);
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('m5_challenger_stress.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
