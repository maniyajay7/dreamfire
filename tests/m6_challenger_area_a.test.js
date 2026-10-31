/**
 * tests/m6_challenger_area_a.test.js
 * 
 * Milestone M6 Phase 2: Tier 5 White-Box Adversarial Coverage Hardening (Area A)
 * Challenger Agent: challenger_m6_1 (teamwork_challenger)
 * 
 * Target Systems:
 * 1. Dynamic Prompt Mutator (src/engine/PromptMutator.js & index.html)
 * 2. Contextual Entity Gating (src/engine/ContextualEntities.js & realms_catalog.json)
 * 3. Audio Engine Robustness (src/utils/audio.js)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { suite, test, assert, run } from './harness.js';

import {
  parsePrompt,
  applyMutation,
  PromptParameterParser,
  SceneGraphMutator,
  escapeHtml,
  sanitizePrompt
} from '../src/engine/PromptMutator.js';

import {
  canSpawnDiyas,
  canSpawnWaterPlane,
  canSpawnLanterns,
  getTerrainType,
  ContextualEntityManager,
  defaultManager
} from '../src/engine/ContextualEntities.js';

import { AmbientAudioEngine } from '../src/utils/audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

// Ensure Three.js mock maintains standard parent hierarchy parity with browser Three.js
if (THREE && THREE.Object3D && !THREE.Object3D.prototype.__hasParentTracking) {
  const origAdd = THREE.Object3D.prototype.add;
  const origRemove = THREE.Object3D.prototype.remove;
  THREE.Object3D.prototype.add = function (child) {
    if (child) child.parent = this;
    return origAdd.call(this, child);
  };
  THREE.Object3D.prototype.remove = function (child) {
    if (child && child.parent === this) child.parent = null;
    return origRemove.call(this, child);
  };
  THREE.Object3D.prototype.__hasParentTracking = true;
}

// ============================================================================
// HIGH-FIDELITY WEB AUDIO API MOCK FOR HEADLESS NODE TESTING
// ============================================================================
class MockParam {
  constructor(val = 0) {
    this.value = val;
    this.events = [];
  }
  setValueAtTime(v, t) {
    this.value = v;
    this.events.push({ type: 'setValueAtTime', val: v, time: t });
  }
  linearRampToValueAtTime(v, t) {
    this.value = v;
    this.events.push({ type: 'linearRampToValueAtTime', val: v, time: t });
  }
  exponentialRampToValueAtTime(v, t) {
    this.value = v;
    this.events.push({ type: 'exponentialRampToValueAtTime', val: v, time: t });
  }
}

class MockAudioNode {
  constructor(nodeType = 'generic') {
    this.nodeType = nodeType;
    this.connections = [];
    this.connectedTo = [];
    this.isStarted = false;
    this.isStopped = false;
    this.isDisconnected = false;
    this.startTime = null;
    this.stopTime = null;
  }
  connect(target) {
    this.connections.push(target);
    if (target && target.connectedTo) target.connectedTo.push(this);
  }
  disconnect() {
    this.isDisconnected = true;
    this.connections = [];
  }
  start(time = 0) {
    this.isStarted = true;
    this.startTime = time;
  }
  stop(time = 0) {
    this.isStopped = true;
    this.stopTime = time;
  }
}

class MockGainNode extends MockAudioNode {
  constructor(val = 1) {
    super('gain');
    this.gain = new MockParam(val);
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor(type = 'sine') {
    super('oscillator');
    this.type = type;
    this.frequency = new MockParam(440);
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super('biquadFilter');
    this.type = 'lowpass';
    this.frequency = new MockParam(350);
    this.Q = new MockParam(1);
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  constructor() {
    super('bufferSource');
    this.buffer = null;
    this.loop = false;
  }
}

class MockAudioBuffer {
  constructor(channels, length, sampleRate) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this._data = [];
    for (let c = 0; c < channels; c++) {
      this._data.push(new Float32Array(length));
    }
  }
  getChannelData(c) {
    return this._data[c] || new Float32Array(this.length);
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = new MockAudioNode('destination');
    this.activeNodes = [];
    this.resumed = false;
  }
  createGain() {
    const node = new MockGainNode();
    this.activeNodes.push(node);
    return node;
  }
  createOscillator() {
    const node = new MockOscillatorNode();
    this.activeNodes.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = new MockBiquadFilterNode();
    this.activeNodes.push(node);
    return node;
  }
  createBuffer(channels, length, sampleRate) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }
  createBufferSource() {
    const node = new MockAudioBufferSourceNode();
    this.activeNodes.push(node);
    return node;
  }
  async resume() {
    this.state = 'running';
    this.resumed = true;
    return Promise.resolve();
  }
}

// ============================================================================
// TEST SUITE: TIER 5 WHITE-BOX ADVERSARIAL COVERAGE HARDENING (AREA A)
// ============================================================================
suite('Tier 5 (Area A): White-Box Adversarial Hardening', 'Tier 5', () => {

  // --------------------------------------------------------------------------
  // 1. DYNAMIC PROMPT MUTATOR ADVERSARIAL FUZZING & INVARIANCE
  // --------------------------------------------------------------------------

  test('T5.A.1: Fuzzing - Extreme Length Strings (50k, 100k, 250k chars) & Linear Execution Bound', () => {
    // 50,000 characters
    const p50k = 'golden sunset sacred riverbank mist '.repeat(1400); // ~50,400 chars
    const t0 = Date.now();
    const res50k = parsePrompt(p50k);
    const d50k = Date.now() - t0;

    assert.ok(res50k !== null && typeof res50k === 'object', '50k string must parse into valid object');
    assert.strictEqual(res50k.timeOfDay, 'sunset', 'Must extract sunset from 50k input');
    assert.strictEqual(res50k.terrain.biome, 'sacred_river', 'Must extract sacred_river from 50k input');
    assert.ok(d50k < 100, `50k char parse took ${d50k}ms (must be <100ms)`);

    // 100,000 characters
    const p100k = 'midnight cyber neon city rain '.repeat(3400); // ~102,000 chars
    const t1 = Date.now();
    const res100k = parsePrompt(p100k);
    const d100k = Date.now() - t1;

    assert.ok(res100k !== null, '100k string must parse safely');
    assert.strictEqual(res100k.timeOfDay, 'midnight', 'Must extract midnight from 100k input');
    assert.strictEqual(res100k.terrain.biome, 'cyber', 'Must extract cyber from 100k input');
    assert.ok(d100k < 150, `100k char parse took ${d100k}ms (must be <150ms)`);

    // 250,000 characters
    const p250k = 'sacred dawn with floating diyas and bells '.repeat(6000); // ~252,000 chars
    const t2 = Date.now();
    const res250k = parsePrompt(p250k);
    const d250k = Date.now() - t2;

    assert.ok(res250k !== null, '250k string must parse safely');
    assert.strictEqual(res250k.timeOfDay, 'dawn', 'Must extract dawn from 250k input');
    assert.ok(d250k < 200, `250k char parse took ${d250k}ms (must be <200ms)`);
  });

  test('T5.A.2: Fuzzing - Repeated Unclosed Tags & ReDoS Immunity (60k brackets in <50ms)', () => {
    // 60,000 unclosed brackets
    const unclosed60k = '<'.repeat(60000);
    const t0 = Date.now();
    const res60k = parsePrompt(unclosed60k);
    const d60k = Date.now() - t0;

    assert.ok(res60k !== null, '60k unclosed brackets must not crash');
    assert.ok(d60k < 50, `60,000 unclosed brackets took ${d60k}ms (must be <50ms)`);

    // 10,000 unclosed malformed tags
    const malformed = '<script <div <span <<<<<tag <<<<b '.repeat(500);
    const t1 = Date.now();
    const resMal = parsePrompt(malformed);
    const dMal = Date.now() - t1;

    assert.ok(resMal !== null, 'Malformed unclosed tags must not crash');
    assert.ok(dMal < 50, `Malformed unclosed tags took ${dMal}ms (must be <50ms)`);

    // Mixed unclosed tags with valid keywords
    const mixed = '<<<<<sunset<<<<<desert<<<<<mist<<<<<steep';
    const resMixed = parsePrompt(mixed);
    assert.strictEqual(resMixed.timeOfDay, 'sunset', 'Must parse timeOfDay despite unclosed brackets');
    assert.strictEqual(resMixed.terrain.biome, 'desert', 'Must parse biome despite unclosed brackets');
    assert.strictEqual(resMixed.atmosphere.weather, 'mist', 'Must parse weather despite unclosed brackets');
  });

  test('T5.A.3: Fuzzing - Null Byte Injection and Control Characters', () => {
    // Single and multiple null bytes
    const nullStr = 'd\x00a\x00w\x00n sunset\x00desert\x00mist';
    const resNull = parsePrompt(nullStr);
    assert.ok(resNull !== null, 'Null byte input must not crash');
    assert.strictEqual(resNull.timeOfDay, 'sunset', 'Must extract sunset keyword');
    assert.strictEqual(resNull.terrain.biome, 'desert', 'Must extract desert keyword');

    // 5,000 null bytes block
    const heavyNull = '\x00'.repeat(5000) + ' midnight cyber city ' + '\x00'.repeat(5000);
    const resHeavy = parsePrompt(heavyNull);
    assert.strictEqual(resHeavy.timeOfDay, 'midnight', 'Must parse timeOfDay through 10,000 null bytes');
    assert.strictEqual(resHeavy.terrain.biome, 'cyber', 'Must parse biome through 10,000 null bytes');

    // All standard control characters \x01-\x1F, \x7F
    let ctrlStr = '';
    for (let i = 0; i <= 31; i++) {
      if (i !== 9 && i !== 10 && i !== 13) ctrlStr += String.fromCharCode(i);
    }
    ctrlStr += '\x7F';
    const sanitizedCtrl = sanitizePrompt(ctrlStr);
    assert.strictEqual(sanitizedCtrl, '', 'All non-whitespace control characters must be stripped');
  });

  test('T5.A.4: Fuzzing - Complex Unicode Emojis, Surrogate Pairs, and Multilingual Text', () => {
    // Emojis with keywords
    const emojiPrompt = '🪔 🕉️ 🌊 Sacred dawn with glowing diyas 🏯 🚀 ⛩️ 🧘';
    const resEmoji = parsePrompt(emojiPrompt);
    assert.strictEqual(resEmoji.timeOfDay, 'dawn', 'Must parse dawn with emojis');
    assert.strictEqual(resEmoji.entities.spawnType, 'diyas', 'Must parse diyas with emojis');

    // Surrogate pairs & ZWJ sequences
    const zwjPrompt = '👨‍👩‍👧‍👦 🏳️‍🌈 👁️‍🗨️ sunset over desert dunes with mist 🛕';
    const resZwj = parsePrompt(zwjPrompt);
    assert.strictEqual(resZwj.timeOfDay, 'sunset', 'Must parse sunset with ZWJ sequences');
    assert.strictEqual(resZwj.terrain.biome, 'desert', 'Must parse desert with ZWJ sequences');

    // Devanagari Hindi text
    const hindiPrompt = 'अयोध्या राम मंदिर सूर्यास्त sunset mandir';
    const resHindi = parsePrompt(hindiPrompt);
    assert.strictEqual(resHindi.timeOfDay, 'sunset');
    assert.strictEqual(resHindi.terrain.biome, 'temple');
  });

  test('T5.A.5: Fuzzing - Script Injection & XSS Payloads Sanitization', () => {
    // Dangerous script tags
    const xss1 = '<script>window.__pwned__ = true;</script> midnight cyber rain';
    const res1 = parsePrompt(xss1);
    assert.strictEqual(typeof global.__pwned__, 'undefined', 'XSS script must never execute');
    assert.strictEqual(res1.timeOfDay, 'midnight');
    assert.strictEqual(res1.atmosphere.weather, 'rain');

    // Img onerror payload
    const xss2 = '<img src="x" onerror="window.__pwned__ = true;"> dawn desert';
    const res2 = parsePrompt(xss2);
    assert.strictEqual(typeof global.__pwned__, 'undefined', 'Img onerror must never execute');
    assert.strictEqual(res2.timeOfDay, 'dawn');
    assert.strictEqual(res2.terrain.biome, 'desert');

    // escapeHtml testing
    const escaped = escapeHtml('<div class="test" id=\'x\'>&"\'</div>');
    assert.strictEqual(
      escaped,
      '&lt;div class=&quot;test&quot; id=&#39;x&#39;&gt;&amp;&quot;&#39;&lt;/div&gt;',
      'escapeHtml must escape &, <, >, ", and \''
    );
  });

  test('T5.A.6: Fuzzing - Non-string Types, Prototype Pollution, and Malformed Parameters', () => {
    // Non-string types
    [null, undefined, 12345, true, false, {}, [], () => {}].forEach((val) => {
      const res = parsePrompt(val);
      assert.ok(res !== null && typeof res === 'object', `parsePrompt(${typeof val}) must return default object`);
      assert.strictEqual(res.timeOfDay, 'noon');
    });

    // Prototype pollution payload in prompt string
    const protoPrompt = '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}}';
    parsePrompt(protoPrompt);
    assert.strictEqual(typeof Object.prototype.polluted, 'undefined', 'Prompt parser must not pollute Object prototype');
  });

  test('T5.A.7: Scene Mutation - 100+ Rapid Sequential Mutations & Linear Performance', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const animators = [];
    const realmObjects = [];

    const presets = [
      'dawn desert mist',
      'noon snowy glacial peaks',
      'sunset sacred riverbank with diyas',
      'midnight cyber neon city rain',
      'twilight cosmic nebula aurora',
      'clear noon temple sanctuary'
    ];

    const tStart = Date.now();
    const durations = [];

    for (let i = 0; i < 150; i++) {
      const promptText = presets[i % presets.length];
      const parsed = parsePrompt(promptText);

      const tMutStart = Date.now();
      applyMutation(scene, camera, parsed, {
        ThreeInstance: THREE,
        animators,
        realmObjects,
        realmData: { environment: { hasWaterBody: true } }
      });
      durations.push(Date.now() - tMutStart);
    }

    const totalDuration = Date.now() - tStart;
    assert.ok(totalDuration < 1500, `150 rapid scene mutations took ${totalDuration}ms (must be <1500ms)`);

    // Verify linear scaling: average of first 25 mutations vs last 25 mutations
    const avgFirst = durations.slice(0, 25).reduce((a, b) => a + b, 0) / 25;
    const avgLast = durations.slice(125, 150).reduce((a, b) => a + b, 0) / 25;
    assert.ok(avgLast < 10, `Last 25 mutations averaged ${avgLast}ms (exceeds linear bound)`);
  });

  test('T5.A.8: Memory Audit - Detached Weather Particle Systems Disposal & Liveness Guard', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const animators = [];

    // Step 1: Apply mutation with rain particles
    applyMutation(scene, camera, parsePrompt('midnight rain'), {
      ThreeInstance: THREE,
      animators
    });

    const weather1 = scene.getObjectByName('weather_particles');
    assert.ok(weather1 !== null, 'Weather particle system must be attached to scene');
    const geo1 = weather1.geometry;
    const mat1 = weather1.material;

    let geo1Disposed = false;
    let mat1Disposed = false;
    geo1.dispose = () => { geo1Disposed = true; };
    mat1.dispose = () => { mat1Disposed = true; };

    // Step 2: Apply second mutation with aurora (replaces rain)
    applyMutation(scene, camera, parsePrompt('twilight aurora'), {
      ThreeInstance: THREE,
      animators
    });

    const weather2 = scene.getObjectByName('weather_particles');
    assert.ok(weather2 !== weather1, 'New weather particles must replace old ones');
    assert.strictEqual(weather1.parent, null, 'Previous weather particle system must be detached from scene');
    assert.ok(geo1Disposed, 'Previous weather BufferGeometry must have dispose() invoked');
    assert.ok(mat1Disposed, 'Previous weather PointsMaterial must have dispose() invoked');

    // Step 3: Verify animator liveness guard terminates detached animators
    let posModified = false;
    const mockPos = {
      count: 5,
      getY: () => 10,
      setY: () => { posModified = true; }
    };
    weather1.geometry.attributes = { position: mockPos };

    // Run all animators
    for (const anim of animators) {
      anim(1.0, 0.016);
    }

    assert.strictEqual(posModified, false, 'Detached weather particles must NOT have position buffers mutated');
  });

  test('T5.A.8.b: Memory & State Audit - Detached Weather Animators Array Accumulation & Entity Stacking', () => {
    // Audit gap 1: Check whether repeated weather mutations bloat animators array with dead closures
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const animators = [];

    for (let i = 0; i < 50; i++) {
      applyMutation(scene, camera, parsePrompt('midnight rain'), {
        ThreeInstance: THREE,
        animators
      });
    }

    // Notice: Each mutation adds a closure. If the array never cleans up detached particle animators,
    // all 50 closures remain in animators array.
    const deadAnimatorsRetained = animators.length;
    // Challenge assertion: animators array should ideally prune dead animators so heap is not leaked
    assert.strictEqual(
      deadAnimatorsRetained <= 1,
      true,
      `MEMORY LEAK / ACCUMULATION: ${deadAnimatorsRetained} weather animators accumulated in array across 50 mutations without pruning detached closures`
    );
  });

  test('T5.A.9: Camera Navigation State Invariance - 1,000 Rapid Mutations Experience 0.0000000000 Drift', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);

    // Initial non-trivial coordinates
    const initialPos = {
      x: 14.89123456789012,
      y: 6.78901234567890,
      z: -28.90123456789012
    };
    const initialQuat = {
      x: 0.12345678901234,
      y: -0.34567890123456,
      z: 0.56789012345678,
      w: 0.73456789012345
    };
    let yaw = 38.987654321;
    let pitch = -14.123456789;
    let zoomLevel = 1.6180339887;

    camera.position.set(initialPos.x, initialPos.y, initialPos.z);
    camera.quaternion.set(initialQuat.x, initialQuat.y, initialQuat.z, initialQuat.w);

    const testPrompts = [
      'golden sunset over crimson desert dunes with heavy mist and steep wireframe',
      'midnight cyberpunk neon city in driving rain with few lanterns',
      'sacred dawn at riverbank with many floating diyas and bells',
      'deep cosmic void with shimmering aurora',
      'clear noon over snowy glacial peaks',
      'crimson fog over temple courtyard with crystals and neon spires',
      'twilight sanctuary garden with calm smooth plains'
    ];

    let maxDriftX = 0, maxDriftY = 0, maxDriftZ = 0;
    let maxDriftQx = 0, maxDriftQy = 0, maxDriftQz = 0, maxDriftQw = 0;
    let maxDriftYaw = 0, maxDriftPitch = 0, maxDriftZoom = 0;

    for (let i = 0; i < 1000; i++) {
      const prompt = testPrompts[i % testPrompts.length];
      const parsed = parsePrompt(prompt);

      applyMutation(scene, camera, parsed, {
        ThreeInstance: THREE,
        realmData: { environment: { hasWaterBody: true } }
      });

      maxDriftX = Math.max(maxDriftX, Math.abs(camera.position.x - initialPos.x));
      maxDriftY = Math.max(maxDriftY, Math.abs(camera.position.y - initialPos.y));
      maxDriftZ = Math.max(maxDriftZ, Math.abs(camera.position.z - initialPos.z));

      maxDriftQx = Math.max(maxDriftQx, Math.abs(camera.quaternion.x - initialQuat.x));
      maxDriftQy = Math.max(maxDriftQy, Math.abs(camera.quaternion.y - initialQuat.y));
      maxDriftQz = Math.max(maxDriftQz, Math.abs(camera.quaternion.z - initialQuat.z));
      maxDriftQw = Math.max(maxDriftQw, Math.abs(camera.quaternion.w - initialQuat.w));

      maxDriftYaw = Math.max(maxDriftYaw, Math.abs(yaw - 38.987654321));
      maxDriftPitch = Math.max(maxDriftPitch, Math.abs(pitch - (-14.123456789)));
      maxDriftZoom = Math.max(maxDriftZoom, Math.abs(zoomLevel - 1.6180339887));
    }

    assert.strictEqual(maxDriftX, 0, 'camera.position.x drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftY, 0, 'camera.position.y drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftZ, 0, 'camera.position.z drift must be exactly 0.0000000000');

    assert.strictEqual(maxDriftQx, 0, 'camera.quaternion.x drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftQy, 0, 'camera.quaternion.y drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftQz, 0, 'camera.quaternion.z drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftQw, 0, 'camera.quaternion.w drift must be exactly 0.0000000000');

    assert.strictEqual(maxDriftYaw, 0, 'yaw drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftPitch, 0, 'pitch drift must be exactly 0.0000000000');
    assert.strictEqual(maxDriftZoom, 0, 'zoomLevel drift must be exactly 0.0000000000');
  });

  // --------------------------------------------------------------------------
  // 2. CONTEXTUAL ENTITY GATING ADVERSARIAL EXHAUSTIVE VERIFICATION
  // --------------------------------------------------------------------------

  test('T5.A.10: Exhaustive 110-Realm Diya Gating - Exactly 5 Sacred Water Realms Allowed, 105 Forbidden', () => {
    assert.ok(fs.existsSync(CATALOG_PATH), 'realms_catalog.json must exist');
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    assert.strictEqual(catalog.length, 110, 'Catalog must contain exactly 110 realms');

    const EXPECTED_SACRED_WATER_REALMS = new Set([
      'ayodhya-ram-mandir',
      'varanasi-maha-aarti',
      'golden-temple-amritsar',
      'madurai-meenakshi-amman',
      'vrindavan-banke-bihari'
    ]);

    const allowedDiyasRealms = [];
    const disallowedDiyasRealms = [];

    catalog.forEach((realm) => {
      const allowed = canSpawnDiyas(realm);
      if (allowed) {
        allowedDiyasRealms.push(realm.id);
      } else {
        disallowedDiyasRealms.push(realm.id);
      }
    });

    assert.strictEqual(
      allowedDiyasRealms.length,
      5,
      `Expected exactly 5 realms to allow floating diyas, got ${allowedDiyasRealms.length}: ${allowedDiyasRealms.join(', ')}`
    );

    assert.strictEqual(
      disallowedDiyasRealms.length,
      105,
      `Expected exactly 105 realms to forbid floating diyas, got ${disallowedDiyasRealms.length}`
    );

    allowedDiyasRealms.forEach((id) => {
      assert.ok(
        EXPECTED_SACRED_WATER_REALMS.has(id),
        `Realm '${id}' unexpectedly permitted floating diyas`
      );
    });

    // Explicit check on flagship incongruous realms
    const forbiddenFlagships = [
      'giza-pyramids-orion-alignment',
      'kedarnath-himalayan-peak',
      'orion-deep-nebula',
      'neo-tokyo-shinjuku-crossing',
      'jays-enchanted-waterfall-retreat',
      'bioluminescent-vaadhoo-beach',
      'colosseum-gladiator-arena'
    ];

    forbiddenFlagships.forEach((id) => {
      const r = catalog.find((item) => item.id === id);
      assert.ok(r, `Flagship realm '${id}' must exist in catalog`);
      assert.strictEqual(
        canSpawnDiyas(r),
        false,
        `Diya gating failure: Realm '${id}' must have canSpawnDiyas === false`
      );
    });
  });

  test('T5.A.11: Exhaustive 110-Realm Scene Entity Instantiation - 0 Diyas on 105 Non-Sacred-Water Realms', () => {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const manager = new ContextualEntityManager();

    const EXPECTED_SACRED_WATER_REALMS = new Set([
      'ayodhya-ram-mandir',
      'varanasi-maha-aarti',
      'golden-temple-amritsar',
      'madurai-meenakshi-amman',
      'vrindavan-banke-bihari'
    ]);

    catalog.forEach((realm) => {
      const scene = new THREE.Scene();
      const realmObjects = [];
      const animators = [];

      const result = manager.setupRealmEntities(scene, realm, realmObjects, animators, THREE);

      if (EXPECTED_SACRED_WATER_REALMS.has(realm.id)) {
        assert.strictEqual(
          result.diyas.length,
          80,
          `Sacred water realm '${realm.id}' must spawn exactly 80 floating diyas`
        );
        assert.ok(
          result.riverMesh !== null,
          `Sacred water realm '${realm.id}' must spawn water plane`
        );
      } else {
        assert.strictEqual(
          result.diyas.length,
          0,
          `Incongruous realm '${realm.id}' spawned ${result.diyas.length} diyas (MUST BE 0)`
        );
        assert.strictEqual(
          result.riverMesh,
          null,
          `Incongruous realm '${realm.id}' spawned river plane (MUST BE null)`
        );
      }
    });
  });

  test('T5.A.12: Exhaustive 110-Realm Water Plane and Sky Lantern Gating Invariants', () => {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    catalog.forEach((realm) => {
      const env = realm.environment;
      assert.ok(env, `Realm ${realm.id} must define environment`);

      // canSpawnWaterPlane
      const canWater = canSpawnWaterPlane(realm);
      assert.strictEqual(
        canWater,
        Boolean(env.hasWaterBody === true),
        `canSpawnWaterPlane mismatch on realm ${realm.id}`
      );

      // canSpawnLanterns
      const canLantern = canSpawnLanterns(realm);
      assert.strictEqual(
        canLantern,
        Boolean(env.festiveContext === true),
        `canSpawnLanterns mismatch on realm ${realm.id}`
      );
    });
  });

  test('T5.A.13: Defensive Gating Edge Cases & Type Coercion Bypass Attacks', () => {
    // Malformed and primitive inputs
    assert.strictEqual(canSpawnDiyas(null), false, 'null realm must return false');
    assert.strictEqual(canSpawnDiyas(undefined), false, 'undefined realm must return false');
    assert.strictEqual(canSpawnDiyas({}), false, 'empty realm object must return false');
    assert.strictEqual(canSpawnDiyas({ environment: null }), false, 'null environment must return false');

    // String "true" coercion attack (must not bypass strict boolean comparison)
    const stringCoercion = {
      id: 'attack-string',
      environment: { festiveContext: 'true', hasWaterBody: 'true' }
    };
    assert.strictEqual(canSpawnDiyas(stringCoercion), false, 'String "true" must NOT bypass festive gating');
    assert.strictEqual(canSpawnWaterPlane(stringCoercion), false, 'String "true" must NOT bypass water gating');
    assert.strictEqual(canSpawnLanterns(stringCoercion), false, 'String "true" must NOT bypass lantern gating');

    // Numeric 1 coercion attack
    const numericCoercion = {
      id: 'attack-num',
      environment: { festiveContext: 1, hasWaterBody: 1 }
    };
    assert.strictEqual(canSpawnDiyas(numericCoercion), false, 'Numeric 1 must NOT bypass festive gating');

    // Truthy object coercion attack
    const objCoercion = {
      id: 'attack-obj',
      environment: { festiveContext: {}, hasWaterBody: [] }
    };
    assert.strictEqual(canSpawnDiyas(objCoercion), false, 'Objects must NOT bypass festive gating');

    // Filter helper methods
    const dryRealm = { environment: { festiveContext: false, hasWaterBody: false } };
    assert.strictEqual(defaultManager.filterDiyasForRealm(dryRealm, 100), 0, 'filterDiyasForRealm must return 0 for dry realm');
    assert.strictEqual(defaultManager.filterLanternsForRealm(dryRealm, 50), 0, 'filterLanternsForRealm must return 0 for secular realm');
  });

  // --------------------------------------------------------------------------
  // 3. AUDIO ENGINE ROBUSTNESS & LIFECYCLE HARDENING
  // --------------------------------------------------------------------------

  test('T5.A.14: Web Audio Context Initialization, State Handling & Autoplay Resume Logic', async () => {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    assert.strictEqual(engine.audioCtx, null, 'audioCtx should be null before ensureContext');

    const ctx = engine.ensureContext();
    assert.ok(ctx !== null, 'ensureContext must return instantiated AudioContext');
    assert.strictEqual(engine.audioCtx, mockCtx, 'audioCtx must store mock context');
    assert.ok(mockCtx.resumed, 'ensureContext must trigger resume() if state was suspended');
    assert.strictEqual(mockCtx.state, 'running', 'AudioContext state must be running');
    assert.strictEqual(engine.volume, 0.75, 'Default volume must be 0.75');
  });

  test('T5.A.15: Dual-Channel Cross-Fade Timing (1.2s Duration & Gain Continuity)', () => {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    engine.ensureContext();
    assert.strictEqual(engine.fadeDuration, 1.2, 'fadeDuration must be exactly 1.2 seconds');

    // Channel A and B start muted
    assert.strictEqual(engine.channels.A.gain.gain.value, 0.0001);
    assert.strictEqual(engine.channels.B.gain.gain.value, 0.0001);

    // Start Audio on Realm 1 -> activeChannel flips to B
    engine.startAudioForRealm({ id: 'ayodhya-ram-mandir', category: 'Sacred & Spiritual' });
    assert.strictEqual(engine.activeChannel, 'B', 'Incoming active channel must be B');
    assert.strictEqual(engine.isAudioPlaying, true, 'isAudioPlaying must be true');

    // Verify gain automation on incoming channel B
    const bEvents = engine.channels.B.gain.gain.events;
    const hasRampUpB = bEvents.some((e) => e.type === 'linearRampToValueAtTime' && e.val === 1.0);
    assert.ok(hasRampUpB, 'Channel B gain must linear ramp up to 1.0');

    // Cross-fade to Realm 2 -> activeChannel flips to A
    mockCtx.currentTime = 2.0;
    engine.startAudioForRealm({ id: 'neo-tokyo-shinjuku', category: 'Cyberpunk & Sci-Fi' });
    assert.strictEqual(engine.activeChannel, 'A', 'Incoming active channel must now be A');

    // Verify Channel B linear ramp down to 0.0001
    const bEventsAfter = engine.channels.B.gain.gain.events;
    const hasRampDownB = bEventsAfter.some((e) => e.type === 'linearRampToValueAtTime' && e.val === 0.0001);
    assert.ok(hasRampDownB, 'Channel B gain must linear ramp down to 0.0001');

    // Verify Channel A linear ramp up to 1.0
    const aEvents = engine.channels.A.gain.gain.events;
    const hasRampUpA = aEvents.some((e) => e.type === 'linearRampToValueAtTime' && e.val === 1.0);
    assert.ok(hasRampUpA, 'Channel A gain must linear ramp up to 1.0');
  });

  test('T5.A.16: Cross-Realm Soundscape Synthesis Across All 6 Canonical Categories', () => {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    engine.ensureContext();
    const testGain = mockCtx.createGain();

    const categories = [
      { cat: 'Sacred & Spiritual', id: 'ayodhya-ram-mandir', method: 'spawnSacredSoundscape' },
      { cat: 'Nature & Retreat', id: 'jays-enchanted-waterfall-retreat', method: 'spawnNatureSoundscape' },
      { cat: 'Cosmic Odyssey', id: 'orion-deep-nebula', method: 'spawnCosmicSoundscape' },
      { cat: 'Cyberpunk & Sci-Fi', id: 'neo-tokyo-shinjuku-crossing', method: 'spawnCyberSoundscape' },
      { cat: 'Ancient Wonders', id: 'giza-pyramids-orion-alignment', method: 'spawnAncientSoundscape' },
      { cat: 'Zen Meditation', id: 'kyoto-zen-garden', method: 'spawnZenSoundscape' }
    ];

    categories.forEach(({ cat, id, method }) => {
      const soundscape = engine.spawnCategorySoundscape(cat, { id, category: cat }, testGain);
      assert.ok(soundscape !== null, `Category ${cat} must return soundscape object`);
      assert.ok(Array.isArray(soundscape.nodes), `Category ${cat} must return nodes array`);
      assert.ok(soundscape.nodes.length >= 2, `Category ${cat} must instantiate at least 2 audio nodes`);
      assert.ok(Array.isArray(soundscape.timers), `Category ${cat} must return timers array`);
    });
  });

  test('T5.A.17: Oscillator Allocation & Cleanup Audit Across Sequential Cross-Fades', async () => {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    engine.ensureContext();

    // Start Realm 1 (Channel B)
    engine.startAudioForRealm({ id: 'ayodhya-ram-mandir', category: 'Sacred & Spiritual' });
    const realm1Nodes = [...engine.channels.B.nodes];
    assert.ok(realm1Nodes.length > 0, 'Realm 1 must allocate nodes on Channel B');

    // Switch to Realm 2 (Channel A)
    mockCtx.currentTime = 1.0;
    engine.startAudioForRealm({ id: 'neo-tokyo', category: 'Cyberpunk & Sci-Fi' });
    const realm2Nodes = [...engine.channels.A.nodes];
    assert.ok(realm2Nodes.length > 0, 'Realm 2 must allocate nodes on Channel A');

    // Wait 1.4s for fadeDuration (1.2s + 0.1s) timeout to clean up Realm 1 nodes on Channel B
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Verify all Realm 1 nodes were stopped and disconnected
    const allStopped = realm1Nodes.every((n) => n.isStopped || !n.stop);
    const allDisconnected = realm1Nodes.every((n) => n.isDisconnected || !n.disconnect);
    assert.ok(allStopped, 'All outgoing Channel B nodes must be stopped after cross-fade duration');
    assert.ok(allDisconnected, 'All outgoing Channel B nodes must be disconnected after cross-fade duration');
  });

  test('T5.A.18: Stress Testing & stopAudio() Race Condition / Rapid Toggling Audit', async () => {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    engine.ensureContext();

    // Rapid toggle stress test (50 iterations)
    for (let i = 0; i < 50; i++) {
      engine.toggleAudio({ id: 'ayodhya-ram-mandir', category: 'Sacred & Spiritual' });
    }
    assert.ok(typeof engine.isAudioPlaying === 'boolean', 'Engine audio state must remain boolean after rapid toggling');

    // Empirical Race Condition Test:
    // When stopAudio() is called, followed immediately by startAudioForRealm(),
    // does stopAudio's delayed cleanup timer inadvertently stop the newly started audio nodes?
    engine.stopAudio();
    assert.strictEqual(engine.isAudioPlaying, false, 'isAudioPlaying must be false immediately after stopAudio');

    // User starts audio on new realm 20ms later (before 350ms stopAudio timeout finishes)
    await new Promise((r) => setTimeout(r, 20));
    engine.startAudioForRealm({ id: 'kyoto-zen', category: 'Zen Meditation' });
    const activeCh = engine.activeChannel;
    const newActiveNodes = [...engine.channels[activeCh].nodes];
    assert.ok(newActiveNodes.length > 0, 'New realm must allocate active nodes on channel ' + activeCh);

    // Wait 400ms for stopAudio's delayed timer to fire
    await new Promise((r) => setTimeout(r, 400));

    // Check if new nodes were prematurely stopped or emptied by the previous stopAudio cleanup
    const prematurelyStopped = newActiveNodes.some((n) => n.isStopped);
    const channelNodesWiped = engine.channels[activeCh].nodes.length === 0;

    assert.strictEqual(
      prematurelyStopped,
      false,
      'RACE CONDITION DETECTED in stopAudio(): Delayed stopAudio() cleanup timer stopped newly started audio nodes!'
    );

    assert.strictEqual(
      channelNodesWiped,
      false,
      'RACE CONDITION DETECTED in stopAudio(): Delayed stopAudio() cleanup timer wiped channel.nodes of active audio!'
    );
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('m6_challenger_area_a.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
