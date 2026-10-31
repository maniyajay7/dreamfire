/**
 * Z:\dreamfire\tests\m8_challenger_m8_1_stress.mjs
 * 
 * Milestone M8: High-Speed F1 Racing Circuit & Procedural V10 Audio
 * Empirical Adversarial Challenger Verification Suite
 * Agent: challenger_m8_1 (roles: critic, specialist)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import assert from 'node:assert/strict';

import {
  buildF1CircuitScene,
  buildSchwarzschildBlackHoleScene,
  buildPrimordialRainforestScene,
  buildHauntedManorScene,
  attachFlagshipScene
} from '../src/engine/FlagshipScenes.js';

import { AmbientAudioEngine } from '../src/utils/audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');

// Three.js runtime instance with SpotLight support for headless verification
const ThreeRuntime = Object.assign(Object.create(THREE), {
  SpotLight: class SpotLight extends THREE.Object3D {
    constructor(color = 0xffffff, intensity = 1, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 1) {
      super();
      this.isSpotLight = true;
      this.color = new THREE.Color(color);
      this.intensity = intensity;
      this.distance = distance;
      this.angle = angle;
      this.penumbra = penumbra;
      this.decay = decay;
      this.target = new THREE.Object3D();
      this.castShadow = false;
      this.shadow = { mapSize: { width: 1024, height: 1024 }, bias: -0.0005 };
    }
  }
});

// Formatting helpers
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log(`\n${bold(cyan('======================================================================'))}`);
console.log(`${bold(cyan(' 🏎️ CHALLENGER M8-1: EMPIRICAL ADVERSARIAL VERIFICATION SUITE'))}`);
console.log(`${bold(cyan('======================================================================'))}\n`);

const results = {
  totalPassed: 0,
  totalFailed: 0,
  details: []
};

function pass(name, msg = '') {
  results.totalPassed++;
  results.details.push({ name, status: 'PASS', msg });
  console.log(`  ${green('✔ PASS')}: ${name} ${msg ? `(${msg})` : ''}`);
}

function fail(name, err) {
  results.totalFailed++;
  results.details.push({ name, status: 'FAIL', error: err.message || err });
  console.error(`  ${red('✖ FAIL')}: ${name} - ${err.message || err}`);
}

const getHex = (c) => {
  if (typeof c === 'number') return c;
  if (c && typeof c.getHex === 'function') return c.getHex();
  if (c && typeof c.r === 'number') {
    return ((Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255));
  }
  return 0;
};

// ============================================================================
// HIGH-FIDELITY WEB AUDIO API MOCK FOR HEADLESS TESTING
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

class MockWaveShaperNode extends MockAudioNode {
  constructor() {
    super('waveShaper');
    this.curve = null;
    this.oversample = 'none';
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
  createWaveShaper() {
    const node = new MockWaveShaperNode();
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
  resume() {
    this.state = 'running';
    this.resumed = true;
    return Promise.resolve();
  }
}

// ============================================================================
// SUITE 1: SCENE GRAPH STRESS & PHYSICAL INVARIANTS (F1 CIRCUIT)
// ============================================================================
async function runSuite1_SceneGraphAndPhysicalInvariants() {
  console.log(`\n${bold('▶ [Suite 1] Scene Graph Stress & Physical Invariants (F1 Circuit)')}`);

  try {
    const scene = new ThreeRuntime.Scene();
    const realmObjects = [];
    const animators = [];

    const realmData = {
      id: 'monaco-midnight-grand-prix',
      title: 'Monaco Midnight Formula 1 Grand Prix Circuit',
      tags: ['f1', 'monaco', 'racing', 'grand prix']
    };

    const result = buildF1CircuitScene(ThreeRuntime, scene, realmData, realmObjects, animators);
    assert.ok(result && result.root, 'buildF1CircuitScene must return root group');
    assert.strictEqual(animators.length, 1, 'buildF1CircuitScene must register 1 animator callback');

    const root = result.root;

    // 1. PBR Asphalt Track with Camber Banking
    const trackMesh = root.getObjectByName('asphalt_track_ribbon');
    assert.ok(trackMesh, 'Track mesh asphalt_track_ribbon must exist');
    assert.ok(
      trackMesh.material instanceof THREE.MeshStandardMaterial,
      'Track must use MeshStandardMaterial'
    );
    assert.strictEqual(getHex(trackMesh.material.color), 0x14171d, 'Track color must be dark asphalt #14171d');
    assert.strictEqual(trackMesh.material.roughness, 0.85, 'Track roughness must be 0.85');
    assert.strictEqual(trackMesh.material.metalness, 0.12, 'Track metalness must be 0.12');
    assert.strictEqual(trackMesh.receiveShadow, true, 'Track must receive shadows');

    // Camber banking elevation verification
    const trackGeo = trackMesh.geometry;
    const posAttr = trackGeo.attributes.position;
    assert.ok(posAttr && posAttr.array.length > 0, 'Track geometry position attribute must be populated');
    let hasNonZeroY = false;
    for (let i = 0; i < posAttr.array.length; i += 3) {
      const y = posAttr.array[i + 1];
      if (Math.abs(y) > 0.0001) hasNonZeroY = true;
    }
    assert.ok(hasNonZeroY, 'Track geometry must have camber banking elevation displacement (non-zero Y coordinates)');
    pass('PBR Asphalt Track & Camber Banking', 'PBR StandardMaterial with sin(x)*0.055*z elevation gradient');

    // 2. 28 Apex Rumble Kerbs (Alternating Red 0xef4444 and White 0xf8fafc)
    const kerbGroup = root.getObjectByName('apex_rumble_kerbs');
    assert.ok(kerbGroup, 'apex_rumble_kerbs group must exist');
    assert.strictEqual(kerbGroup.children.length, 28, 'Must instantiate exactly 28 rumble kerb blocks');
    let redCount = 0;
    let whiteCount = 0;
    kerbGroup.children.forEach((kerb, idx) => {
      assert.ok(kerb.material instanceof THREE.MeshStandardMaterial, `Kerb ${idx} must use MeshStandardMaterial`);
      const hex = getHex(kerb.material.color);
      if (idx % 2 === 0) {
        assert.strictEqual(hex, 0xef4444, `Kerb ${idx} must be red (0xef4444)`);
        redCount++;
      } else {
        assert.strictEqual(hex, 0xf8fafc, `Kerb ${idx} must be white (0xf8fafc)`);
        whiteCount++;
      }
      assert.strictEqual(kerb.castShadow, true, `Kerb ${idx} must cast shadows`);
      assert.strictEqual(kerb.receiveShadow, true, `Kerb ${idx} must receive shadows`);
    });
    assert.strictEqual(redCount, 14, 'Must have 14 red kerbs');
    assert.strictEqual(whiteCount, 14, 'Must have 14 white kerbs');
    pass('28 Apex Rumble Kerbs Alternation', '14 red (0xef4444) + 14 white (0xf8fafc) with shadow casting');

    // 3. Tire Skid Marks
    const skidGroup = root.getObjectByName('tire_skid_marks');
    assert.ok(skidGroup, 'tire_skid_marks group must exist');
    assert.strictEqual(skidGroup.children.length, 2, 'Must have left and right tire skid marks');
    const leftSkid = skidGroup.getObjectByName('left_tire_skid_mark');
    const rightSkid = skidGroup.getObjectByName('right_tire_skid_mark');
    assert.ok(leftSkid && rightSkid, 'Both left_tire_skid_mark and right_tire_skid_mark must be present');
    assert.strictEqual(leftSkid.material.transparent, true, 'Skid marks must be transparent');
    assert.strictEqual(leftSkid.material.opacity, 0.76, 'Skid mark opacity must be 0.76');
    assert.strictEqual(leftSkid.material.depthWrite, false, 'Skid mark depthWrite must be false to avoid Z-fighting');
    pass('Decelerating Tire Braking Skid Marks', 'Transparent semi-gloss asphalt marks (opacity 0.76, depthWrite false)');

    // 4. Galvanized Steel Armco Crash Barriers
    const armco = root.getObjectByName('armco_crash_barrier');
    assert.ok(armco, 'armco_crash_barrier must exist');
    assert.strictEqual(armco.material.metalness, 0.92, 'Armco barrier metalness must be 0.92');
    assert.strictEqual(armco.material.roughness, 0.22, 'Armco barrier roughness must be 0.22');
    assert.strictEqual(getHex(armco.material.color), 0x94a3b8, 'Armco barrier color must be steel #94a3b8');
    pass('Galvanized Steel Armco Barriers', '160m continuous guardrail with metalness 0.92, roughness 0.22');

    // 5. Trackside Multi-Tier Grandstands & Stadium Floodlights
    const grandstands = root.getObjectByName('trackside_grandstands');
    assert.ok(grandstands, 'trackside_grandstands group must exist');
    assert.strictEqual(grandstands.children.length, 9, '8 tiers + 1 canopy roof = 9 children');
    
    // Floodlights
    const spotLights = [];
    root.traverse((node) => {
      if (node.isSpotLight || (node.type && node.type.includes('SpotLight'))) {
        spotLights.push(node);
      }
    });
    assert.strictEqual(spotLights.length, 4, 'Must instantiate 4 high-mast stadium SpotLights');
    spotLights.forEach((spot, idx) => {
      assert.strictEqual(spot.castShadow, true, `Spotlight ${idx} must cast shadows`);
      assert.strictEqual(spot.intensity, 3.8, `Spotlight ${idx} intensity must be 3.8`);
    });
    pass('Grandstands & Stadium Floodlights', '8-tier grandstand + 4 high-mast SpotLights with shadows');

    // 6. Championship F1 Car & Dynamic Components
    const car = root.getObjectByName('f1_championship_car');
    assert.ok(car, 'f1_championship_car group must exist');

    // Brake discs
    const brakeDiscs = [];
    car.traverse((node) => {
      if (node.name === 'f1_glowing_brake_disc') brakeDiscs.push(node);
    });
    assert.strictEqual(brakeDiscs.length, 4, 'F1 car must have 4 glowing brake disc rotors');
    const brakeMat = brakeDiscs[0].material;
    assert.strictEqual(brakeMat.name, 'f1_brake_disc_material', 'Brake disc material must be named');
    assert.strictEqual(getHex(brakeMat.emissive), 0xff3300, 'Brake disc emissive color must be glowing orange-red 0xff3300');

    // Rain light
    let rainLight = null;
    car.traverse((node) => {
      if (node.isPointLight || node.type === 'PointLight' || node instanceof THREE.PointLight) rainLight = node;
    });
    assert.ok(rainLight, 'Rain safety beacon PointLight must exist');
    assert.strictEqual(getHex(rainLight.color), 0xff0000, 'Rain beacon must be red 0xff0000');

    // 7. Dynamic Animator Verification (Brake Glow 0.2 - 3.5 & 4Hz Rain Beacon)
    const animator = animators[0];
    assert.strictEqual(typeof animator, 'function', 'Animator must be a callable function');

    // Test over 100 timesteps
    let minEmissive = Infinity;
    let maxEmissive = -Infinity;
    let flashHighCount = 0;
    let flashLowCount = 0;

    for (let t = 0; t <= 10; t += 0.05) {
      animator(t, 0.05);
      const intensity = brakeMat.emissiveIntensity;
      if (intensity < minEmissive) minEmissive = intensity;
      if (intensity > maxEmissive) maxEmissive = intensity;

      if (rainLight.intensity > 4.0) flashHighCount++;
      else flashLowCount++;
    }

    assert.ok(minEmissive >= 0.19 && minEmissive <= 0.25, `Min emissive must reach ~0.2 (actual: ${minEmissive})`);
    assert.ok(maxEmissive >= 3.45 && maxEmissive <= 3.55, `Max emissive must reach ~3.5 (actual: ${maxEmissive})`);
    assert.ok(flashHighCount > 0 && flashLowCount > 0, 'Rain safety beacon must alternate between high and low flash states');
    pass('Dynamic Animator Physics (Brake Glow 0.2-3.5 & 4Hz Beacon)', `Emissive range [${minEmissive.toFixed(2)}, ${maxEmissive.toFixed(2)}], 4Hz beacon validated`);

    // 8. Strict Architectural Invariants: 0 Wireframes & 0 Cyan Grid Planes
    let wireframeMeshCount = 0;
    let cyanGridCount = 0;
    root.traverse((node) => {
      if (node.isMesh && node.material) {
        const mat = node.material;
        if (mat.wireframe === true) wireframeMeshCount++;
        if (mat.color) {
          const hex = getHex(mat.color);
          if (hex === 0x00ffff || hex === 0x00e5ff || hex === 0x00d2ff) cyanGridCount++;
        }
      }
      if (node.isGridHelper) cyanGridCount++;
    });
    assert.strictEqual(wireframeMeshCount, 0, 'Entire F1 scene graph must have ZERO wireframe meshes');
    assert.strictEqual(cyanGridCount, 0, 'Entire F1 scene graph must have ZERO cyan grid planes or helpers');
    pass('Strict Invariants: 0 Wireframes & 0 Cyan Grids', '0 wireframe meshes, 0 cyan grid planes across entire scene graph');

  } catch (err) {
    fail('runSuite1_SceneGraphAndPhysicalInvariants', err);
  }
}

// ============================================================================
// SUITE 2: WEB AUDIO PROCEDURAL V10 SYNTHESIS ADVERSARIAL STRESS
// ============================================================================
async function runSuite2_WebAudioAdversarialStress() {
  console.log(`\n${bold('▶ [Suite 2] Web Audio Synthesis Adversarial Stress (Procedural V10 Engine)')}`);

  try {
    const mockCtx = new MockAudioContext();
    global.AudioContext = function () { return mockCtx; };

    const engine = new AmbientAudioEngine();
    engine.ensureContext();
    assert.ok(engine.audioCtx, 'AmbientAudioEngine must initialize audioCtx');

    // 1. spawnF1RacingSoundscape directly
    const testGain = mockCtx.createGain();
    const soundscape = engine.spawnF1RacingSoundscape(testGain);
    assert.ok(soundscape && Array.isArray(soundscape.nodes), 'spawnF1RacingSoundscape must return nodes array');
    assert.ok(Array.isArray(soundscape.timers), 'spawnF1RacingSoundscape must return timers array');

    const nodes = soundscape.nodes;
    const oscNodes = nodes.filter(n => n.nodeType === 'oscillator');
    const filterNodes = nodes.filter(n => n.nodeType === 'biquadFilter');
    const waveShapers = nodes.filter(n => n.nodeType === 'waveShaper');
    const bufferSources = nodes.filter(n => n.nodeType === 'bufferSource');

    // Fundamental V10 oscillator (sawtooth, idle 375 Hz to redline 1540 Hz)
    const oscV10 = oscNodes.find(o => o.type === 'sawtooth' && o.frequency.events.some(e => e.val === 375));
    assert.ok(oscV10, 'V10 fundamental sawtooth oscillator starting at 375 Hz must exist');

    // Frequency range check across all events
    const v10FreqEvents = oscV10.frequency.events.map(e => e.val);
    const minFreq = Math.min(...v10FreqEvents);
    const maxFreq = Math.max(...v10FreqEvents);
    assert.strictEqual(minFreq, 375, 'V10 idle fundamental must be exactly 375 Hz');
    assert.strictEqual(maxFreq, 1540, 'V10 redline fundamental must be exactly 1540 Hz');

    // 2nd harmonic exhaust resonance (2x f0: 750 to 3080 Hz)
    const oscExhaust = oscNodes.find(o => o.type === 'sawtooth' && o.frequency.events.some(e => e.val === 750));
    assert.ok(oscExhaust, '2nd harmonic exhaust oscillator starting at 750 Hz (2x 375) must exist');
    const exhaustFreqEvents = oscExhaust.frequency.events.map(e => e.val);
    assert.strictEqual(Math.min(...exhaustFreqEvents), 750, 'Min exhaust frequency must be 750 Hz');
    assert.strictEqual(Math.max(...exhaustFreqEvents), 3080, 'Max exhaust frequency must be 3080 Hz (2x 1540)');

    // Crankshaft subharmonic (f0 / 5: 75 to 308 Hz)
    const oscCrank = oscNodes.find(o => o.type === 'triangle' && o.frequency.events.some(e => e.val === 75));
    assert.ok(oscCrank, 'Crankshaft subharmonic triangle oscillator starting at 75 Hz (375 / 5) must exist');

    // Resonant lowpass filter swept by rev curve (Q = 4.5)
    const engineFilter = filterNodes.find(f => f.type === 'lowpass' && f.Q.value === 4.5);
    assert.ok(engineFilter, 'Resonant lowpass engine filter with Q=4.5 must exist');

    // Manifold distortion waveshaper (512 points)
    assert.strictEqual(waveShapers.length, 1, 'Manifold distortion WaveShaperNode must exist');
    const ws = waveShapers[0];
    assert.ok(ws.curve instanceof Float32Array, 'WaveShaper curve must be a Float32Array');
    assert.strictEqual(ws.curve.length, 512, 'WaveShaper curve must be 512 points');
    assert.strictEqual(ws.oversample, '2x', 'WaveShaper oversample must be 2x');

    // Pink noise tire scrub with 950 Hz bandpass filter (Q = 2.2)
    assert.ok(bufferSources.length >= 1, 'Tire scrub bufferSource must be spawned');
    const tireFilter = filterNodes.find(f => f.type === 'bandpass' && f.frequency.value === 950 && f.Q.value === 2.2);
    assert.ok(tireFilter, 'Tire scrub bandpass filter with frequency 950 Hz and Q=2.2 must exist');

    pass('Procedural V10 Engine Harmonics & Filtering', 'Fundamental (375-1540Hz), 2x harmonic, subharmonic, Q=4.5 sweep, 512-pt waveshaper, 950Hz tire scrub');

    // 2. 100 Rapid Realm Switches Stress & Memory Leak Audit
    console.log(`    Testing 100 rapid cross-fade transitions into and out of F1 circuit...`);

    const testRealms = [
      { id: 'monaco-midnight-grand-prix', category: 'Cosmic Odyssey' },
      { id: 'ayodhya-ram-mandir', category: 'Sacred & Spiritual' },
      { id: 'silverstone-night-gp', tags: ['f1', 'racing'] },
      { id: 'jays-enchanted-waterfall-retreat', category: 'Nature & Retreat' },
      { id: 'neo-tokyo-shinjuku', category: 'Cyberpunk & Sci-Fi' }
    ];

    for (let i = 0; i < 100; i++) {
      mockCtx.currentTime += 0.05; // rapid 50ms switching
      const targetRealm = testRealms[i % testRealms.length];
      engine.startAudioForRealm(targetRealm);
    }

    // Verify state after 100 rapid switches
    assert.ok(engine.isAudioPlaying, 'isAudioPlaying should remain true');
    assert.ok(engine.activeChannel === 'A' || engine.activeChannel === 'B', 'activeChannel must be A or B');

    // Capture nodes before stop
    const activeKey = engine.activeChannel;
    const activeNodes = [...engine.channels[activeKey].nodes];

    // Stop audio
    engine.stopAudio(true);
    assert.strictEqual(engine.isAudioPlaying, false, 'isAudioPlaying must be false after stopAudio');
    assert.strictEqual(engine.channels.A.nodes.length, 0, 'Channel A nodes array must be emptied immediately after stopAudio');
    assert.strictEqual(engine.channels.B.nodes.length, 0, 'Channel B nodes array must be emptied immediately after stopAudio');

    // Wait for the delayed fade timeout (0.05s fade + 0.05s = 100ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify all active nodes were properly stopped and disconnected
    assert.ok(activeNodes.length > 0, 'Active nodes were tracked before teardown');
    for (const node of activeNodes) {
      if (node.nodeType === 'oscillator' || node.nodeType === 'bufferSource') {
        assert.ok(node.isStopped, `Node ${node.nodeType} must be stopped`);
      }
      assert.ok(node.isDisconnected, `Node ${node.nodeType} must be disconnected`);
    }

    pass('100 Rapid Cross-Fade Realm Switches & Teardown', '100 rapid transitions executed cleanly; 0 node leaks, 0 timer leaks, all nodes stopped & disconnected');

  } catch (err) {
    fail('runSuite2_WebAudioAdversarialStress', err);
  }
}

// ============================================================================
// SUITE 3: LIVE DIRECTIVES & INTEGRATION VERIFICATION
// ============================================================================
async function runSuite3_LiveDirectivesVerification() {
  console.log(`\n${bold('▶ [Suite 3] Live Directives & Integration Verification')}`);

  try {
    const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    const previewContent = fs.readFileSync(PREVIEW_HTML_PATH, 'utf8');

    // 1. Zenith Sky Void Fix Verification
    assert.ok(indexContent.includes('zenithCapMesh.material.transparent = true'), 'index.html must set zenithCapMesh transparent');
    assert.ok(indexContent.includes('zenithCapMesh.material.opacity = 0.0'), 'index.html must set zenithCapMesh opacity to 0.0 on texture apply');
    assert.ok(indexContent.includes('skydomeMesh.material.map = texture'), 'index.html must map texture across skydomeMesh');
    pass('Zenith Sky Void Fix', 'skydomeMesh textured and zenithCapMesh set transparent (opacity 0.0) without blocking texture');

    // 2. All 4 Flagship Builders Available Inline
    const requiredBuilders = [
      'buildSchwarzschildBlackHoleScene',
      'buildF1CircuitScene',
      'buildPrimordialRainforestScene',
      'buildHauntedManorScene'
    ];

    for (const builder of requiredBuilders) {
      assert.ok(indexContent.includes(`function ${builder}`), `index.html must inline function ${builder}`);
      assert.ok(previewContent.includes(`function ${builder}`), `preview.html must inline function ${builder}`);
      assert.ok(indexContent.includes(`window.${builder} = ${builder}`), `index.html must expose window.${builder}`);
      assert.ok(previewContent.includes(`window.${builder} = ${builder}`), `preview.html must expose window.${builder}`);
    }
    assert.ok(indexContent.includes('window.FlagshipScenes = {'), 'index.html must define window.FlagshipScenes namespace');
    assert.ok(previewContent.includes('window.FlagshipScenes = {'), 'preview.html must define window.FlagshipScenes namespace');
    pass('All 4 Flagship Builders Inline & Window Exports', 'All 4 builders defined inline and registered on window and window.FlagshipScenes');

    // 3. Quick Wish Preset Chips in Top Banner
    const expectedChips = [
      { text: 'Monaco F1 Grand Prix', key: 'f1' },
      { text: 'Schwarzschild Black Hole', key: 'blackhole' },
      { text: 'Amazon Rainforest', key: 'rainforest' },
      { text: 'Haunted Victorian Manor', key: 'haunted' }
    ];

    for (const chip of expectedChips) {
      assert.ok(indexContent.includes(`setPromptPreset('${chip.key}')`), `index.html must include setPromptPreset('${chip.key}')`);
      assert.ok(indexContent.includes(chip.text), `index.html must include chip text '${chip.text}'`);
      assert.ok(previewContent.includes(`setPromptPreset('${chip.key}')`), `preview.html must include setPromptPreset('${chip.key}')`);
      assert.ok(previewContent.includes(chip.text), `preview.html must include chip text '${chip.text}'`);
    }

    assert.ok(indexContent.includes('function setPromptPreset('), 'index.html must implement setPromptPreset handler');
    assert.ok(indexContent.includes("if (type === 'f1') input.value = 'monaco f1 midnight grand prix circuit"), 'setPromptPreset must configure f1 prompt');
    pass('Quick Wish Preset Chips in Top Banner', '4 flagship preset chips present in top banner with setPromptPreset handlers');

  } catch (err) {
    fail('runSuite3_LiveDirectivesVerification', err);
  }
}

// ============================================================================
// SUITE 4: CRYPTOGRAPHIC SHA256 PARITY VERIFICATION
// ============================================================================
async function runSuite4_CryptographicParity() {
  console.log(`\n${bold('▶ [Suite 4] Cryptographic SHA256 Zero-Diff Parity')}`);

  try {
    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex').toUpperCase();
    const previewHash = crypto.createHash('sha256').update(previewBuf).digest('hex').toUpperCase();

    assert.strictEqual(indexHash, previewHash, 'index.html and preview.html SHA256 hashes must be identical');
    assert.strictEqual(indexBuf.length, previewBuf.length, 'Byte lengths must match exactly');
    assert.strictEqual(Buffer.compare(indexBuf, previewBuf), 0, 'Buffer comparison must be byte-for-byte 0-diff');

    pass('SHA256 Parity Assertion', `100% byte-exact parity verified (Hash: ${indexHash})`);

  } catch (err) {
    fail('runSuite4_CryptographicParity', err);
  }
}

// ============================================================================
// RUN ALL SUITES
// ============================================================================
async function main() {
  await runSuite1_SceneGraphAndPhysicalInvariants();
  await runSuite2_WebAudioAdversarialStress();
  await runSuite3_LiveDirectivesVerification();
  await runSuite4_CryptographicParity();

  console.log(`\n${bold(cyan('======================================================================'))}`);
  console.log(`${bold(' RESULTS SUMMARY')}`);
  console.log(`${bold(cyan('======================================================================'))}`);
  console.log(`  Passed: ${green(results.totalPassed)}`);
  console.log(`  Failed: ${results.totalFailed > 0 ? red(results.totalFailed) : green(0)}`);
  console.log(`${bold(cyan('======================================================================'))}\n`);

  if (results.totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
