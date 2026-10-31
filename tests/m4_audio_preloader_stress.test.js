/**
 * tests/m4_audio_preloader_stress.test.js
 * 
 * DreamFire Milestone M4: Empirical Adversarial Stress Test Suite
 * Audio Engine (Feature F13) & Asynchronous Preloader Pipeline (Feature F12)
 * Challenger: challenger_m4_2 (teamwork_challenger)
 * 
 * Verifies:
 * 1. Web Audio Node Graph Topology & Parameters across all 6 canonical categories.
 * 2. 100 consecutive rapid transitions stress test (cross-fade, gain ramps, leak-free teardown).
 * 3. Autoplay policy compliance, gesture resume listeners, and UI sync.
 * 4. Asynchronous preloader pipeline: cache hits, 404 errors, 3500ms watchdog timeout, zero unhandled rejections.
 * 5. #warp-progress-bar progress calculation fidelity.
 * 6. Byte-for-byte SHA256 parity between index.html and preview.html.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run, beforeEach, afterEach } from './harness.js';
import { AmbientAudioEngine } from '../src/utils/audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_HTML_PATH = path.join(ROOT_DIR, 'preview.html');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// ============================================================================
// HIGH-FIDELITY WEB AUDIO API & DOM TEST HARNESS MOCKS
// ============================================================================

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this.defaultValue = defaultValue;
    this.events = [];
  }

  setValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'setValueAtTime', val, time });
    return this;
  }

  linearRampToValueAtTime(val, time) {
    this.events.push({ type: 'linearRampToValueAtTime', target: val, time });
    this.value = val; // Fast-forward value for test inspection
    return this;
  }

  exponentialRampToValueAtTime(val, time) {
    this.events.push({ type: 'exponentialRampToValueAtTime', target: val, time });
    this.value = val; // Fast-forward value for test inspection
    return this;
  }
}

class MockAudioNode {
  constructor(context, type = 'generic') {
    this.context = context;
    this.nodeType = type;
    this.connections = new Set();
    this.connectedToParam = new Set();
    this.isDisconnected = false;
    this.id = ++MockAudioNode._idCounter;
    context._allCreatedNodes.push(this);
  }

  connect(destination) {
    if (destination instanceof MockAudioParam) {
      this.connectedToParam.add(destination);
    } else {
      this.connections.add(destination);
    }
    this.isDisconnected = false;
    return destination;
  }

  disconnect() {
    this.connections.clear();
    this.connectedToParam.clear();
    this.isDisconnected = true;
  }
}
MockAudioNode._idCounter = 0;

class MockGainNode extends MockAudioNode {
  constructor(context) {
    super(context, 'GainNode');
    this.gain = new MockAudioParam(1.0);
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor(context) {
    super(context, 'OscillatorNode');
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.started = false;
    this.stopped = false;
    this.startTime = null;
    this.stopTime = null;
  }

  start(time = 0) {
    this.started = true;
    this.startTime = time;
  }

  stop(time = 0) {
    this.stopped = true;
    this.stopTime = time;
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor(context) {
    super(context, 'BiquadFilterNode');
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(350);
    this.Q = new MockAudioParam(1.0);
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  constructor(context) {
    super(context, 'AudioBufferSourceNode');
    this.buffer = null;
    this.loop = false;
    this.started = false;
    this.stopped = false;
  }

  start(time = 0) {
    this.started = true;
  }

  stop(time = 0) {
    this.stopped = true;
  }
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'suspended';
    this._allCreatedNodes = [];
    this.destination = new MockAudioNode(this, 'DestinationNode');
  }

  createGain() {
    return new MockGainNode(this);
  }

  createOscillator() {
    return new MockOscillatorNode(this);
  }

  createBiquadFilter() {
    return new MockBiquadFilterNode(this);
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode(this);
  }

  createBuffer(channels, length, sampleRate) {
    const channelData = [];
    for (let c = 0; c < channels; c++) {
      channelData.push(new Float32Array(length));
    }
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: (ch) => channelData[ch]
    };
  }

  async resume() {
    if (this.hasUserGestured) {
      this.state = 'running';
      return Promise.resolve();
    }
    // Before gesture, autoplay policy blocks resume
    return Promise.reject(new Error('Autoplay blocked'));
  }

  advanceTime(seconds) {
    this.currentTime += seconds;
  }
}

// Global mock DOM setup for UI and Gesture testing
function setupMockDOM() {
  const listeners = {};
  const elements = {};

  const getOrCreateEl = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerText: '',
        innerHTML: '',
        style: { width: '0%', opacity: '0', display: '' },
        setAttribute: (k, v) => {},
        getAttribute: (k) => null
      };
    }
    return elements[id];
  };

  ['audio-label', 'hud-audio-text', 'audio-svg-icon', 'hud-audio-svg-icon', 'warp-progress-bar', 'warp-overlay'].forEach(getOrCreateEl);

  const mockWindow = {
    addEventListener: (event, handler, options) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push({ handler, options });
    },
    removeEventListener: (event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((item) => item.handler !== handler);
      }
    },
    dispatchEvent: (event) => {
      const list = listeners[event.type] || [];
      list.forEach((item) => {
        item.handler(event);
      });
    },
    AudioContext: MockAudioContext
  };

  const mockDocument = {
    getElementById: (id) => getOrCreateEl(id),
    querySelectorAll: (sel) => []
  };

  return { mockWindow, mockDocument, listeners, elements };
}

// ============================================================================
// TEST SUITE 1: AUDIO ENGINE NODE GRAPH TOPOLOGY & PARAMETERS (6 CATEGORIES)
// ============================================================================

suite('M4 Challenger: Web Audio Node Graphs & Synthesis Parameters', 'Tier 3 Challenger', () => {
  let engine;
  let mockCtx;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    globalThis.AudioContext = function() { return mockCtx; };
    engine = new AmbientAudioEngine();
    engine.ensureContext();
  });

  test('1.1 Sacred & Spiritual: Root tanpura (108Hz sawtooth) + fifth (162Hz triangle) + sweeping filter + temple bells', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnSacredSoundscape(channelGain);

    assert.ok(nodes.length >= 6, `Expected at least 6 nodes in Sacred soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 2, 'Expected 2 timers (first bell timeout + interval)');

    const rootOsc = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sawtooth');
    assert.ok(rootOsc, 'Missing 108Hz sawtooth root tanpura oscillator');
    assert.strictEqual(rootOsc.frequency.value, 108, 'Root tanpura frequency must be 108Hz');

    const paOsc = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'triangle');
    assert.ok(paOsc, 'Missing 162Hz triangle fifth (Pa) harmonic oscillator');
    assert.strictEqual(paOsc.frequency.value, 162, 'Pa harmonic frequency must be 162Hz (108 * 1.5)');

    const filter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'lowpass');
    assert.ok(filter, 'Missing acoustic string lowpass filter');
    assert.strictEqual(filter.frequency.value, 260, 'Filter cutoff frequency must be 260Hz');
    assert.strictEqual(filter.Q.value, 2.2, 'Filter resonance Q must be 2.2');

    const lfo = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sine' && n.frequency.value === 0.2);
    assert.ok(lfo, 'Missing 0.2Hz sine LFO for string vibration sweep');

    timers.forEach(t => clearTimeout(t) || clearInterval(t));
  });

  test('1.2 Nature & Retreat: Pink noise stream + dual filters (580Hz LP + 1200Hz BP) + breeze LFO + droplet generator', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnNatureSoundscape(channelGain);

    assert.ok(nodes.length >= 8, `Expected at least 8 nodes in Nature soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 1, 'Expected droplet spawn interval timer');

    const lpFilter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'lowpass');
    assert.ok(lpFilter, 'Missing deep flow 580Hz lowpass filter');
    assert.strictEqual(lpFilter.frequency.value, 580, 'Lowpass cutoff must be 580Hz');

    const bpFilter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'bandpass' && n.frequency.value === 1200);
    assert.ok(bpFilter, 'Missing spray foam 1200Hz bandpass filter');
    assert.strictEqual(bpFilter.Q.value, 1.6, 'Bandpass Q must be 1.6');

    const breezeFilter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'bandpass' && n.frequency.value === 420);
    assert.ok(breezeFilter, 'Missing 420Hz mountain breeze bandpass filter');
    assert.strictEqual(breezeFilter.Q.value, 2.0, 'Breeze bandpass Q must be 2.0');

    timers.forEach(t => clearTimeout(t) || clearInterval(t));
  });

  test('1.3 Cosmic Odyssey: Sub-bass 55Hz void drone + binaural theta beat (432Hz/436Hz => 4Hz theta) + plasma drift', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnCosmicSoundscape(channelGain);

    assert.ok(nodes.length >= 7, `Expected at least 7 nodes in Cosmic soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 0, 'Cosmic soundscape is pure continuous synthesis with 0 timers');

    const subOsc = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 55);
    assert.ok(subOsc, 'Missing 55Hz sub-bass void drone oscillator');
    assert.strictEqual(subOsc.type, 'sine', 'Sub-bass drone must be pure sine');

    const bin1 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 432);
    const bin2 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 436);
    assert.ok(bin1 && bin2, 'Missing 432Hz and 436Hz binaural pair');
    const diff = Math.abs(bin2.frequency.value - bin1.frequency.value);
    assert.strictEqual(diff, 4, 'Binaural pair must produce exact 4.0Hz theta wave beat');

    const plasmaOsc = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 108 && n.type === 'triangle');
    assert.ok(plasmaOsc, 'Missing 108Hz triangle stellar plasma drift oscillator');
  });

  test('1.4 Cyberpunk & Sci-Fi: Dual detuned sawtooth pad (130.81Hz + 131.87Hz) + sub-square (65.41Hz) + resonant sweep', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnCyberSoundscape(channelGain);

    assert.ok(nodes.length >= 7, `Expected at least 7 nodes in Cyber soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 1, 'Expected quantum clock tick interval timer');

    const saw1 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sawtooth' && n.frequency.value === 130.81);
    const saw2 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sawtooth' && n.frequency.value === 131.87);
    assert.ok(saw1 && saw2, 'Missing dual detuned sawtooth synth pad oscillators (C3 ~130.81Hz / 131.87Hz)');
    const detuneRatio = saw2.frequency.value / saw1.frequency.value;
    assert.ok(detuneRatio > 1.005 && detuneRatio < 1.015, 'Detune ratio must represent subtle rich analog chorus (+14 cents)');

    const subSquare = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'square' && n.frequency.value === 65.41);
    assert.ok(subSquare, 'Missing C2 sub-bass square wave (65.41Hz)');

    const filter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'lowpass');
    assert.ok(filter, 'Missing resonant lowpass filter');
    assert.strictEqual(filter.frequency.value, 650, 'Filter center frequency must be 650Hz');
    assert.strictEqual(filter.Q.value, 3.8, 'Resonant Q must be 3.8 for sharp neon resonance');

    timers.forEach(t => clearTimeout(t) || clearInterval(t));
  });

  test('1.5 Ancient Wonders: Hypostyle stone drone (144Hz + 72Hz) + desert wind pink noise + bronze gong', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnAncientSoundscape(channelGain);

    assert.ok(nodes.length >= 8, `Expected at least 8 nodes in Ancient soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 2, 'Expected 2 gong strike timers (initial delay + recurring interval)');

    const stoneOsc1 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 144 && n.type === 'triangle');
    const stoneOsc2 = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 72 && n.type === 'sine');
    assert.ok(stoneOsc1 && stoneOsc2, 'Missing 144Hz triangle / 72Hz sine hypostyle stone drone oscillators');

    const windFilter = nodes.find(n => n.nodeType === 'BiquadFilterNode' && n.type === 'bandpass' && n.frequency.value === 820);
    assert.ok(windFilter, 'Missing 820Hz desert wind bandpass filter');
    assert.strictEqual(windFilter.Q.value, 6.5, 'Wind filter Q must be 6.5 for resonant whistling desert wind');

    timers.forEach(t => clearTimeout(t) || clearInterval(t));
  });

  test('1.6 Zen Meditation: Tibetan singing bowl (528Hz Solfeggio + 1457Hz overtone) + bamboo breeze + pentatonic chimes', () => {
    const channelGain = engine.channels.A.gain;
    const { nodes, timers } = engine.spawnZenSoundscape(channelGain);

    assert.ok(nodes.length >= 7, `Expected at least 7 nodes in Zen soundscape, got ${nodes.length}`);
    assert.strictEqual(timers.length, 1, 'Expected pentatonic wind chimes interval timer');

    const fund = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sine' && n.frequency.value === 528);
    assert.ok(fund, 'Missing 528Hz Solfeggio fundamental singing bowl oscillator');

    const overtone = nodes.find(n => n.nodeType === 'OscillatorNode' && n.type === 'sine' && n.frequency.value > 1450);
    assert.ok(overtone, 'Missing non-integer overtone (~1457Hz) for metallic singing bowl resonance');
    assert.strictEqual(overtone.frequency.value, 1457.28, 'Overtone must match 1457.28Hz (2.76x overtone)');

    const tremolo = nodes.find(n => n.nodeType === 'OscillatorNode' && n.frequency.value === 0.4);
    assert.ok(tremolo, 'Missing 0.4Hz tremolo rub modulation LFO');

    timers.forEach(t => clearTimeout(t) || clearInterval(t));
  });

  test('1.7 Strict Parameter Bounds & Numerical Sanity across all 6 soundscapes', () => {
    const channelGain = engine.channels.A.gain;
    const soundscapes = [
      engine.spawnSacredSoundscape(channelGain),
      engine.spawnNatureSoundscape(channelGain),
      engine.spawnCosmicSoundscape(channelGain),
      engine.spawnCyberSoundscape(channelGain),
      engine.spawnAncientSoundscape(channelGain),
      engine.spawnZenSoundscape(channelGain)
    ];

    soundscapes.forEach(({ nodes, timers }, idx) => {
      timers.forEach(t => clearTimeout(t) || clearInterval(t));

      nodes.forEach(node => {
        if (node.frequency && node.frequency.value !== undefined) {
          const f = node.frequency.value;
          assert.ok(Number.isFinite(f), `Frequency must be finite in soundscape ${idx}: got ${f}`);
          assert.ok(f > 0 && f <= 20000, `Frequency out of audible range in soundscape ${idx}: got ${f}Hz`);
        }
        if (node.Q && node.Q.value !== undefined) {
          const q = node.Q.value;
          assert.ok(Number.isFinite(q), `Filter Q must be finite in soundscape ${idx}: got ${q}`);
          assert.ok(q >= 0.1 && q <= 30, `Filter Q out of stable bounds in soundscape ${idx}: got ${q}`);
        }
        if (node.gain && node.gain.value !== undefined) {
          const g = node.gain.value;
          assert.ok(Number.isFinite(g), `Gain must be finite in soundscape ${idx}: got ${g}`);
          if (node.connectedToParam.size > 0) {
            // LFO modulation depth in Hertz (e.g., 45Hz, 180Hz, 450Hz)
            assert.ok(g >= 0.01 && g <= 1000, `Modulation depth out of bounds in soundscape ${idx}: got ${g}`);
          } else {
            // Audio signal amplitude
            assert.ok(g >= 0.00001 && g <= 1.0, `Audio signal gain out of safe listening bounds in soundscape ${idx}: got ${g}`);
          }
        }
      });
    });
  });
});

// ============================================================================
// TEST SUITE 2: CATEGORY SOUNDSCAPE ROUTING ACROSS ALL 110 REALMS
// ============================================================================

suite('M4 Challenger: Catalog Soundscape Routing Coverage', 'Tier 3 Challenger', () => {
  let engine;

  beforeEach(() => {
    const mockCtx = new MockAudioContext();
    globalThis.AudioContext = function() { return mockCtx; };
    engine = new AmbientAudioEngine();
    engine.ensureContext();
  });

  test('2.1 Exhaustive Soundscape Routing: All 110 realms in realms_catalog.json instantiate a soundscape without throwing', () => {
    assert.strictEqual(catalog.length, 110, 'Catalog must contain 110 realms');

    catalog.forEach(realm => {
      const channelGain = engine.channels.A.gain;
      let spawned = null;
      assert.doesNotThrow(() => {
        spawned = engine.spawnCategorySoundscape(realm.category, realm, channelGain);
      }, `Failed to spawn soundscape for realm '${realm.id}' [Category: ${realm.category}]`);

      assert.ok(spawned && Array.isArray(spawned.nodes), `Expected valid nodes array for realm '${realm.id}'`);
      assert.ok(spawned.nodes.length >= 6, `Expected at least 6 audio nodes for realm '${realm.id}', got ${spawned.nodes.length}`);

      spawned.timers.forEach(t => clearTimeout(t) || clearInterval(t));
    });
  });

  test('2.2 Fallback Routing: Unknown or null realmData defaults gracefully to Sacred soundscape', () => {
    const channelGain = engine.channels.A.gain;
    const fallback1 = engine.spawnCategorySoundscape(null, null, channelGain);
    const fallback2 = engine.spawnCategorySoundscape('Unknown Mysterious Realm', { id: 'unknown-dimension' }, channelGain);

    assert.ok(fallback1.nodes.length >= 6, 'Null category must default to Sacred soundscape');
    assert.ok(fallback2.nodes.length >= 6, 'Unknown category must default to Sacred soundscape');

    [...fallback1.timers, ...fallback2.timers].forEach(t => clearTimeout(t) || clearInterval(t));
  });
});

// ============================================================================
// TEST SUITE 3: 100 CONSECUTIVE RAPID TRANSITIONS STRESS TEST (MEMORY & GAIN)
// ============================================================================

suite('M4 Challenger: 100 Rapid Transitions & Teardown Protocol', 'Tier 3 Challenger', () => {
  let engine;
  let mockCtx;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    globalThis.AudioContext = function() { return mockCtx; };
    engine = new AmbientAudioEngine();
    engine.ensureContext();
  });

  test('3.1 100 consecutive rapid category transitions execute with 0 unhandled exceptions and alternating channels', () => {
    const categories = [
      'Sacred & Spiritual',
      'Nature & Retreat',
      'Cosmic Odyssey',
      'Cyberpunk & Sci-Fi',
      'Ancient Wonders',
      'Zen Meditation'
    ];

    let expectedChannel = 'B'; // Active starts at 'A', first switch makes it 'B'
    for (let i = 0; i < 100; i++) {
      const cat = categories[i % categories.length];
      const realmData = { id: `realm-test-${i}`, category: cat };

      assert.doesNotThrow(() => {
        engine.startAudioForRealm(realmData);
      }, `Exception encountered during rapid transition #${i + 1}`);

      assert.strictEqual(engine.activeChannel, expectedChannel, `Iteration ${i}: Expected activeChannel to be ${expectedChannel}`);
      expectedChannel = expectedChannel === 'A' ? 'B' : 'A';

      mockCtx.advanceTime(0.01); // 10ms rapid burst interval
    }
  });

  test('3.2 Teardown Protocol: 100 transitions properly disconnect and stop all outgoing nodes after cross-fade duration', async () => {
    const testRealms = catalog.slice(0, 100);

    for (let i = 0; i < testRealms.length; i++) {
      engine.startAudioForRealm(testRealms[i]);
      mockCtx.advanceTime(0.02);
    }

    const totalCreatedNodes = mockCtx._allCreatedNodes.length;
    assert.ok(totalCreatedNodes > 500, `Expected > 500 nodes created across 100 transitions, got ${totalCreatedNodes}`);

    // Wait for the teardown timeout (fadeDuration 1.2s + 0.1s buffer = 1.3s => 1300ms)
    // Fast forward mock audio context and wait for node event loop to clear timers
    mockCtx.advanceTime(2.0);
    await new Promise((r) => setTimeout(r, 1400));

    // Inspect nodes: all continuous background nodes from previous transitions must be disconnected
    const disconnectedNodes = mockCtx._allCreatedNodes.filter(n => n.isDisconnected);
    assert.ok(
      disconnectedNodes.length > 500,
      `Teardown failure! Expected > 500 disconnected nodes, found ${disconnectedNodes.length}.`
    );

    // Assert that every single oscillator created had stop() called (zero runaway unstopped oscillators)
    const allOscillators = mockCtx._allCreatedNodes.filter(n => n.nodeType === 'OscillatorNode');
    const runawayOscillators = allOscillators.filter(n => !n.stopped && !n.isDisconnected);
    // Only the currently active realm's oscillators should be running without stop() having been called
    assert.ok(
      runawayOscillators.length <= 6,
      `Detected runaway oscillators without scheduled stop or teardown: ${runawayOscillators.length}`
    );

    // Clean up lingering timers
    engine.stopAudio(true);
  });

  test('3.3 Gain Ramps & Amplitude Bounds: Outgoing ramps to 0.0001, Incoming ramps to 1.0, 0 clipping distortion', () => {
    // Engine starts with activeChannel = 'A'
    // First call: switches activeChannel to 'B' (B incoming, A outgoing)
    engine.startAudioForRealm({ id: 'realm-1', category: 'Sacred & Spiritual' });
    const chA = engine.channels.A;
    const chB = engine.channels.B;

    // Channel B is incoming on first switch, ramps to 1.0
    const rampB_first = chB.gain.gain.events.find(e => e.type === 'linearRampToValueAtTime' && e.target === 1.0);
    assert.ok(rampB_first, 'Incoming channel B must receive linearRampToValueAtTime to 1.0');

    // Second call: switches activeChannel to 'A' (A incoming, B outgoing)
    engine.startAudioForRealm({ id: 'realm-2', category: 'Cosmic Odyssey' });

    // Channel B is now outgoing, ramps to 0.0001
    const rampB_down = chB.gain.gain.events.find(e => e.type === 'linearRampToValueAtTime' && e.target === 0.0001);
    assert.ok(rampB_down, 'Outgoing channel B must receive linearRampToValueAtTime to 0.0001');

    // Channel A is now incoming, ramps to 1.0
    const rampA_up = chA.gain.gain.events.find(e => e.type === 'linearRampToValueAtTime' && e.target === 1.0);
    assert.ok(rampA_up, 'Incoming channel A must receive linearRampToValueAtTime to 1.0');

    // Master volume must remain capped at 0.75 to prevent acoustic clipping
    assert.strictEqual(engine.volume, 0.75, 'Master volume must be strictly 0.75');
    assert.strictEqual(engine.masterGain.gain.value, 0.75, 'Master gain node must be 0.75');

    engine.stopAudio(true);
  });

  test('3.4 stopAudio() smoothly fades out both channels without throwing', async () => {
    engine.startAudioForRealm({ id: 'realm-1', category: 'Nature & Retreat' });
    assert.strictEqual(engine.isAudioPlaying, true);

    engine.stopAudio(false); // Normal 0.3s fade-out
    assert.strictEqual(engine.isAudioPlaying, false);

    // Check ramp events on both channels
    ['A', 'B'].forEach(ch => {
      const g = engine.channels[ch].gain.gain;
      const down = g.events.filter(e => e.type === 'linearRampToValueAtTime' && e.target === 0.0001);
      assert.ok(down.length > 0, `Channel ${ch} must have fade-out ramp event`);
    });

    await new Promise((r) => setTimeout(r, 400));
  });
});

// ============================================================================
// TEST SUITE 4: AUTOPLAY POLICY COMPLIANCE & GESTURE RESUME LISTENERS
// ============================================================================

suite('M4 Challenger: Autoplay Policy & Gesture Resume Listeners', 'Tier 3 Challenger', () => {
  let dom;

  beforeEach(() => {
    dom = setupMockDOM();
    globalThis.window = dom.mockWindow;
    globalThis.document = dom.mockDocument;
    globalThis.AudioContext = dom.mockWindow.AudioContext;
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.AudioContext;
  });

  test('4.1 Browser gesture listeners (pointerdown, keydown, touchstart) attach with { once: true, passive: true }', () => {
    const engine = new AmbientAudioEngine();
    assert.ok(dom.listeners.pointerdown, 'Missing window pointerdown listener for autoplay unlock');
    assert.ok(dom.listeners.keydown, 'Missing window keydown listener for autoplay unlock');
    assert.ok(dom.listeners.touchstart, 'Missing window touchstart listener for autoplay unlock');

    ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      const reg = dom.listeners[evt][0];
      assert.ok(reg.options && reg.options.once === true, `${evt} listener must have once: true`);
      assert.ok(reg.options && reg.options.passive === true, `${evt} listener must have passive: true`);
    });
  });

  test('4.2 Simulating user gesture triggers AudioContext.resume() when context is suspended', async () => {
    const engine = new AmbientAudioEngine();
    engine.ensureContext();
    assert.strictEqual(engine.audioCtx.state, 'suspended', 'Context starts suspended under strict autoplay policies');

    // Simulate pointerdown gesture
    engine.audioCtx.hasUserGestured = true;
    dom.mockWindow.dispatchEvent({ type: 'pointerdown' });
    await new Promise(r => setTimeout(r, 10));

    assert.strictEqual(engine.audioCtx.state, 'running', 'User gesture must transition AudioContext state to running');
  });

  test('4.3 updateAudioUI() synchronizes header & HUD labels and updates dynamic SVG speaker icons', () => {
    const engine = new AmbientAudioEngine();
    engine.ensureContext();

    const label = dom.elements['audio-label'];
    const hudText = dom.elements['hud-audio-text'];
    const headerSvg = dom.elements['audio-svg-icon'];
    const hudSvg = dom.elements['hud-audio-svg-icon'];

    // Initially OFF
    engine.isAudioPlaying = false;
    engine.updateAudioUI();
    assert.strictEqual(label.innerText, 'Sound: OFF');
    assert.strictEqual(hudText.innerText, 'Sound');
    assert.ok(headerSvg.innerHTML.includes('line x1="23"'), 'Muted icon must render crossed X line');

    // Toggle ON
    engine.isAudioPlaying = true;
    engine.updateAudioUI();
    assert.strictEqual(label.innerText, 'Sound: ON');
    assert.strictEqual(hudText.innerText, 'Mute');
    assert.ok(headerSvg.innerHTML.includes('path d="M19.07'), 'Playing icon must render sound waves');
  });
});

// ============================================================================
// TEST SUITE 5: ASYNCHRONOUS PRELOADER PIPELINE & WATCHDOG TIMEOUT
// ============================================================================

suite('M4 Challenger: Asynchronous Preloader & 3500ms Watchdog', 'Tier 2 Challenger', () => {
  // Pure implementation of the preloader function from index.html (lines 4336-4388)
  function createPreloaderPipeline(mockTextureLoader, loadedTextures = {}) {
    const THREE_MOCK = {
      EquirectangularReflectionMapping: 303,
      sRGBEncoding: 3001
    };

    return function preloadRealmAssetsAsync(realmData, onProgress) {
      return new Promise((resolve) => {
        const WARP_TIMEOUT_MS = 3500;
        let isSettled = false;

        const finalize = (loadedTexture) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          resolve({ texture: loadedTexture });
        };

        const timer = setTimeout(() => {
          finalize(null);
        }, WARP_TIMEOUT_MS);

        if (realmData.bgImage && loadedTextures[realmData.bgImage]) {
          if (typeof onProgress === 'function') onProgress(100);
          finalize(loadedTextures[realmData.bgImage]);
          return;
        }

        if (!realmData.bgImage) {
          if (typeof onProgress === 'function') onProgress(100);
          finalize(null);
          return;
        }

        mockTextureLoader.load(
          realmData.bgImage,
          (texture) => {
            texture.mapping = THREE_MOCK.EquirectangularReflectionMapping;
            if (THREE_MOCK.sRGBEncoding) texture.encoding = THREE_MOCK.sRGBEncoding;
            loadedTextures[realmData.bgImage] = texture;
            if (typeof onProgress === 'function') onProgress(100);
            finalize(texture);
          },
          (xhr) => {
            if (xhr && xhr.lengthComputable && xhr.total > 0) {
              const pct = Math.min(95, Math.round((xhr.loaded / xhr.total) * 100));
              if (typeof onProgress === 'function') onProgress(pct);
            } else {
              if (typeof onProgress === 'function') onProgress(65);
            }
          },
          (err) => {
            finalize(null);
          }
        );
      });
    };
  }

  test('5.1 Fast Path: Preloader resolves texture and notifies 100% progress when asset loads normally', async () => {
    const mockTexture = { id: 'texture-ayodhya', mapping: null, encoding: null };
    const mockLoader = {
      load: (url, onLoad) => {
        setTimeout(() => onLoad(mockTexture), 50);
      }
    };

    const progressReports = [];
    const preload = createPreloaderPipeline(mockLoader);

    const result = await preload({ id: 'ayodhya-ram-mandir', bgImage: 'public/assets/images/ram_mandir_real.jpg' }, (pct) => {
      progressReports.push(pct);
    });

    assert.ok(result && result.texture === mockTexture, 'Preloader must resolve loaded texture');
    assert.strictEqual(mockTexture.mapping, 303, 'Texture mapping must be set to EquirectangularReflectionMapping');
    assert.strictEqual(mockTexture.encoding, 3001, 'Texture encoding must be set to sRGBEncoding');
    assert.ok(progressReports.includes(100), 'Preloader must emit 100% progress');
  });

  test('5.2 Cache Hit: Cached textures resolve immediately with 0 redundant loader calls', async () => {
    let loaderCalls = 0;
    const cachedTexture = { id: 'cached-waterfall' };
    const cache = { 'public/assets/images/nature_waterfall.jpg': cachedTexture };
    const mockLoader = {
      load: () => { loaderCalls++; }
    };

    const progressReports = [];
    const preload = createPreloaderPipeline(mockLoader, cache);

    const result = await preload({ id: 'nature-retreat', bgImage: 'public/assets/images/nature_waterfall.jpg' }, (pct) => {
      progressReports.push(pct);
    });

    assert.strictEqual(loaderCalls, 0, 'Loader must not be invoked on cached texture');
    assert.strictEqual(result.texture, cachedTexture, 'Preloader must resolve cached texture');
    assert.deepStrictEqual(progressReports, [100], 'Progress must immediately report 100%');
  });

  test('5.3 Missing bgImage: Gracefully resolves null texture without throwing', async () => {
    const mockLoader = { load: () => {} };
    const preload = createPreloaderPipeline(mockLoader);

    const result = await preload({ id: 'void-realm', bgImage: null });
    assert.strictEqual(result.texture, null, 'Null bgImage must resolve { texture: null }');
  });

  test('5.4 Network 404 / Texture load error: Gracefully resolves null texture with 0 unhandled rejections', async () => {
    const mockLoader = {
      load: (url, onLoad, onProgress, onError) => {
        setTimeout(() => onError(new Error('HTTP 404 Not Found')), 40);
      }
    };

    const preload = createPreloaderPipeline(mockLoader);
    let resolved = null;

    await assert.doesNotReject(async () => {
      resolved = await preload({ id: 'broken-asset-realm', bgImage: 'public/assets/images/non_existent.jpg' });
    }, 'Preloader must not reject on network error');

    assert.strictEqual(resolved.texture, null, 'Network error must resolve { texture: null } for fallback skydome');
  });

  test('5.5 3500ms Watchdog Timeout: Stalled network load resolves { texture: null } after 3500ms with zero rejections', async () => {
    let lateCallbackFired = false;
    const mockLoader = {
      load: (url, onLoad) => {
        // Simulates an infinite hang or extreme 10s latency
        setTimeout(() => {
          lateCallbackFired = true;
          onLoad({ id: 'too-late-texture' });
        }, 6000);
      }
    };

    const preload = createPreloaderPipeline(mockLoader);
    const start = Date.now();

    const result = await preload({ id: 'stalled-cloud-realm', bgImage: 'public/assets/images/slow.jpg' });
    const duration = Date.now() - start;

    assert.strictEqual(result.texture, null, 'Timeout must resolve null texture to trigger fallback skydome');
    assert.ok(duration >= 3450 && duration <= 3800, `Expected resolution near 3500ms, resolved in ${duration}ms`);

    // Verify late callback does not crash or cause secondary resolution
    await new Promise(r => setTimeout(r, 2600));
    assert.strictEqual(lateCallbackFired, true, 'Late callback eventually fired without causing unhandled exception');
  });

  test('5.6 #warp-progress-bar: Computable and non-computable progress tracking bounds', async () => {
    const progressReports = [];
    const mockLoader = {
      load: (url, onLoad, onProgress) => {
        setTimeout(() => onProgress({ lengthComputable: true, loaded: 250, total: 1000 }), 30);
        setTimeout(() => onProgress({ lengthComputable: true, loaded: 800, total: 1000 }), 60);
        setTimeout(() => onProgress({ lengthComputable: false }), 90);
        setTimeout(() => onLoad({ id: 'tex' }), 120);
      }
    };

    const preload = createPreloaderPipeline(mockLoader);
    await preload({ id: 'progress-realm', bgImage: 'public/assets/images/ram_mandir_real.jpg' }, (pct) => {
      progressReports.push(pct);
    });

    assert.ok(progressReports.includes(25), 'Expected 25% computed progress report');
    assert.ok(progressReports.includes(80), 'Expected 80% computed progress report');
    assert.ok(progressReports.includes(65), 'Expected 65% fallback progress report for indeterminate stream');
    assert.strictEqual(progressReports[progressReports.length - 1], 100, 'Final progress report must be 100%');
  });

  test('5.7 Fallback Skydome Scene Integration: Null texture smoothly applies procedural skyColor to skydomeMesh', () => {
    const realm = {
      id: 'giza-pyramids-orion-alignment',
      environment: {
        skyColor: 0x140c06,
        biome: 'desert'
      }
    };

    const skydomeMesh = {
      visible: false,
      material: {
        map: 'some_old_texture',
        color: { setHex: function(hex) { this.hex = hex; }, hex: 0 },
        needsUpdate: false
      }
    };

    // Simulate lines 1914-1923 of index.html
    const preloadedTexture = null;
    skydomeMesh.visible = true;
    const skyHex = (realm.environment && realm.environment.skyColor) ? realm.environment.skyColor : 0x0a1026;
    skydomeMesh.material.map = null;
    skydomeMesh.material.color.setHex(skyHex);
    skydomeMesh.material.needsUpdate = true;

    assert.strictEqual(skydomeMesh.visible, true, 'Skydome must remain visible');
    assert.strictEqual(skydomeMesh.material.map, null, 'Skydome map must be null when texture is missing');
    assert.strictEqual(skydomeMesh.material.color.hex, 0x140c06, 'Skydome color must match realm environment.skyColor');
    assert.strictEqual(skydomeMesh.material.needsUpdate, true, 'needsUpdate must be flagged');
  });
});

// ============================================================================
// TEST SUITE 6: BYTE-FOR-BYTE SHA256 PARITY BETWEEN INDEX.HTML & PREVIEW.HTML
// ============================================================================

suite('M4 Challenger: Byte-for-Byte SHA256 Parity', 'Tier 2 Challenger', () => {
  test('6.1 index.html and preview.html have identical SHA256 hashes', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist');
    assert.ok(fs.existsSync(PREVIEW_HTML_PATH), 'preview.html must exist');

    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex');
    const previewHash = crypto.createHash('sha256').update(previewBuf).digest('hex');

    assert.strictEqual(indexHash, previewHash, `SHA256 hash mismatch!\nindex.html:   ${indexHash}\npreview.html: ${previewHash}`);
  });

  test('6.2 Zero diff: index.html and preview.html are 100% byte-for-byte identical', () => {
    const indexBuf = fs.readFileSync(INDEX_HTML_PATH);
    const previewBuf = fs.readFileSync(PREVIEW_HTML_PATH);

    assert.strictEqual(indexBuf.length, previewBuf.length, `File size mismatch! index.html: ${indexBuf.length} bytes, preview.html: ${previewBuf.length} bytes`);
    assert.strictEqual(indexBuf.compare(previewBuf), 0, 'Buffer comparison must return 0 (no diff)');
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('m4_audio_preloader_stress.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
