import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const PREVIEW_PATH = path.join(ROOT_DIR, 'preview.html');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
let html = fs.readFileSync(INDEX_PATH, 'utf8');

function assertReplace(target, replacement, description) {
  if (!html.includes(target)) {
    throw new Error(`Target not found for: ${description}`);
  }
  const count = html.split(target).length - 1;
  if (count > 1) {
    throw new Error(`Target matched ${count} times (expected 1) for: ${description}`);
  }
  html = html.replace(target, replacement);
  console.log(`✔ Applied: ${description}`);
}

// -------------------------------------------------------------
// 1. Initial HUD Audio Button Desync Fix
// -------------------------------------------------------------
const hudAudioTarget = `<svg id="hud-audio-svg-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <span id="hud-audio-text">Audio: ON</span>`;

const hudAudioReplacement = `<svg id="hud-audio-svg-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
          <span id="hud-audio-text">Sound: OFF</span>`;

assertReplace(hudAudioTarget, hudAudioReplacement, 'HUD Audio initial icon and text sync');

// -------------------------------------------------------------
// 2. Synchronize ALL_REALMS with realms_catalog.json
// -------------------------------------------------------------
const allRealmsMatch = html.match(/const\s+ALL_REALMS\s*=\s*\[[\s\S]*?\];\n/);
if (!allRealmsMatch) {
  throw new Error('Could not find const ALL_REALMS in index.html');
}
const allRealmsTarget = allRealmsMatch[0];
const allRealmsReplacement = `const ALL_REALMS = ${JSON.stringify(catalog)};\n`;
assertReplace(allRealmsTarget, allRealmsReplacement, 'Synchronize inline ALL_REALMS database');

// -------------------------------------------------------------
// 3. Audio Engine & VideoTextureManager Integration
// -------------------------------------------------------------
const oldAudioTarget = `    // Web Audio State
    let audioCtx = null;
    let isAudioPlaying = false;
    let activeAudioNodes = [];


    // --- PROCEDURAL WEB AUDIO SYNTHESIZER ---
    function initAudio() {
      if (audioCtx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio not supported', e);
      }
    }

    function toggleAudio() {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (isAudioPlaying) stopAudio();
      else startAudioForRealm(currentRealm);
      updateAudioUI();
    }

    function startAudioForRealm(realm) {
      if (!audioCtx) return;
      stopAudio();
      isAudioPlaying = true;

      const r = (realm || '').toLowerCase();
      if (r.includes('ram') || r.includes('ayodhya') || r.includes('aarti') || r.includes('golden') || r.includes('sacred')) {
        // Meditative 108Hz drone
        const drone = audioCtx.createOscillator();
        const droneGain = audioCtx.createGain();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(108, audioCtx.currentTime);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, audioCtx.currentTime);

        droneGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        drone.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(audioCtx.destination);
        drone.start();
        activeAudioNodes.push(drone, droneGain);

        // Authentic temple bell strikes every 3.2 seconds
        const bellInterval = setInterval(() => {
          if (!isAudioPlaying || !audioCtx) return;
          playTempleBell();
        }, 3200);
        activeAudioNodes.push({ stop: () => clearInterval(bellInterval) });
        playTempleBell();

      } else if (r.includes('waterfall') || r.includes('river') || r.includes('nature') || r.includes('bed')) {
        // Natural rushing water white/pink noise
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        whiteNoise.start();
        activeAudioNodes.push(whiteNoise, gain);

      } else {
        // 432Hz ambient cosmic sine tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        activeAudioNodes.push(osc, gain);
      }
    }

    function playTempleBell() {
      if (!audioCtx) return;
      const freqs = [432, 540, 648, 864];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      const bell = audioCtx.createOscillator();
      const bellGain = audioCtx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(f, audioCtx.currentTime);
      bellGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);
      bell.connect(bellGain);
      bellGain.connect(audioCtx.destination);
      bell.start();
      bell.stop(audioCtx.currentTime + 3.0);
    }

    function stopAudio() {
      activeAudioNodes.forEach(node => { if (node.stop) node.stop(); });
      activeAudioNodes = [];
      isAudioPlaying = false;
    }

    function updateAudioUI() {
      const label = isAudioPlaying ? 'Sound: ON' : 'Sound: OFF';
      const el1 = document.getElementById('audio-label');
      const el2 = document.getElementById('hud-audio-text');
      if (el1) el1.innerText = label;
      if (el2) el2.innerText = isAudioPlaying ? 'Mute' : 'Sound';
    }`;

const newAudioAndVideoReplacement = `    // --- DREAMFIRE SYNCHRONIZED MULTI-CHANNEL AMBIENT AUDIO ENGINE (FEATURE F13) ---
    class AmbientAudioEngine {
      constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.isAudioPlaying = false;
        this.volume = 0.75;
        this.fadeDuration = 1.2;
        this.activeChannel = 'A';
        this.channels = {
          A: { gain: null, nodes: [], timers: [] },
          B: { gain: null, nodes: [], timers: [] }
        };
        this.currentRealmId = null;
        this.currentCategory = null;

        if (typeof window !== 'undefined') {
          const unlock = () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
              this.audioCtx.resume().catch(() => {});
            }
          };
          window.addEventListener('pointerdown', unlock, { once: true, passive: true });
          window.addEventListener('keydown', unlock, { once: true, passive: true });
          window.addEventListener('touchstart', unlock, { once: true, passive: true });
        }
      }

      ensureContext() {
        if (typeof window === 'undefined') return null;
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return null;
          this.audioCtx = new AudioContextClass();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
          this.masterGain.connect(this.audioCtx.destination);

          ['A', 'B'].forEach((ch) => {
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
            gain.connect(this.masterGain);
            this.channels[ch].gain = gain;
          });
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
      }

      createNoiseBuffer(type = 'white') {
        if (!this.audioCtx) return null;
        const bufferSize = this.audioCtx.sampleRate * 2.0;
        const buffer = this.audioCtx.createBuffer(2, bufferSize, this.audioCtx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'pink') {
              b0 = 0.99886 * b0 + white * 0.0555179;
              b1 = 0.99332 * b1 + white * 0.0750759;
              b2 = 0.96900 * b2 + white * 0.1538520;
              b3 = 0.86650 * b3 + white * 0.3104856;
              b4 = 0.55000 * b4 + white * 0.5329522;
              b5 = -0.7616 * b5 - white * 0.0168980;
              data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
              b6 = white * 0.115926;
            } else {
              data[i] = white * 0.25;
            }
          }
        }
        return buffer;
      }

      spawnSacredSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const rootOsc = ctx.createOscillator();
        rootOsc.type = 'sawtooth';
        rootOsc.frequency.setValueAtTime(108, now);

        const paOsc = ctx.createOscillator();
        paOsc.type = 'triangle';
        paOsc.frequency.setValueAtTime(162, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);
        filter.Q.setValueAtTime(2.2, now);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(45, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.08, now);

        rootOsc.connect(filter);
        paOsc.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(channelGain);

        rootOsc.start(now);
        paOsc.start(now);
        lfo.start(now);
        nodes.push(rootOsc, paOsc, lfo, lfoGain, filter, droneGain);

        const bellFrequencies = [216, 432, 540, 648, 864];
        const strikeBell = () => {
          if (!this.isAudioPlaying || !this.audioCtx) return;
          try {
            const t = ctx.currentTime;
            const freq = bellFrequencies[Math.floor(Math.random() * bellFrequencies.length)];
            const bellOsc = ctx.createOscillator();
            bellOsc.type = 'sine';
            bellOsc.frequency.setValueAtTime(freq, t);
            const overtoneOsc = ctx.createOscillator();
            overtoneOsc.type = 'sine';
            overtoneOsc.frequency.setValueAtTime(freq * 2.76, t);
            const bellGain = ctx.createGain();
            bellGain.gain.setValueAtTime(0.18, t);
            bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
            bellOsc.connect(bellGain);
            overtoneOsc.connect(bellGain);
            bellGain.connect(channelGain);
            bellOsc.start(t);
            overtoneOsc.start(t);
            bellOsc.stop(t + 3.6);
            overtoneOsc.stop(t + 3.6);
          } catch {}
        };
        timers.push(setTimeout(strikeBell, 1500));
        timers.push(setInterval(strikeBell, 4200));

        return { nodes, timers };
      }

      spawnNatureSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const noiseBuffer = this.createNoiseBuffer('pink');
        if (noiseBuffer) {
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          noiseSource.loop = true;

          const lpFilter = ctx.createBiquadFilter();
          lpFilter.type = 'lowpass';
          lpFilter.frequency.setValueAtTime(580, now);

          const bpFilter = ctx.createBiquadFilter();
          bpFilter.type = 'bandpass';
          bpFilter.frequency.setValueAtTime(1200, now);
          bpFilter.Q.setValueAtTime(1.6, now);

          const streamGain = ctx.createGain();
          streamGain.gain.setValueAtTime(0.18, now);

          noiseSource.connect(lpFilter);
          noiseSource.connect(bpFilter);
          lpFilter.connect(streamGain);
          bpFilter.connect(streamGain);
          streamGain.connect(channelGain);

          noiseSource.start(now);
          nodes.push(noiseSource, lpFilter, bpFilter, streamGain);

          const breezeSource = ctx.createBufferSource();
          breezeSource.buffer = noiseBuffer;
          breezeSource.loop = true;

          const breezeFilter = ctx.createBiquadFilter();
          breezeFilter.type = 'bandpass';
          breezeFilter.frequency.setValueAtTime(420, now);
          breezeFilter.Q.setValueAtTime(2.0, now);

          const breezeLfo = ctx.createOscillator();
          breezeLfo.frequency.setValueAtTime(0.12, now);
          const breezeLfoGain = ctx.createGain();
          breezeLfoGain.gain.setValueAtTime(180, now);
          breezeLfo.connect(breezeLfoGain);
          breezeLfoGain.connect(breezeFilter.frequency);

          const breezeGain = ctx.createGain();
          breezeGain.gain.setValueAtTime(0.08, now);

          breezeSource.connect(breezeFilter);
          breezeFilter.connect(breezeGain);
          breezeGain.connect(channelGain);

          breezeSource.start(now);
          breezeLfo.start(now);
          nodes.push(breezeSource, breezeFilter, breezeLfo, breezeLfoGain, breezeGain);
        }

        const spawnDroplet = () => {
          if (!this.isAudioPlaying || !this.audioCtx) return;
          try {
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const dropFreq = 1400 + Math.random() * 800;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(dropFreq, t);
            osc.frequency.exponentialRampToValueAtTime(dropFreq * 1.5, t + 0.1);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
            osc.connect(gain);
            gain.connect(channelGain);
            osc.start(t);
            osc.stop(t + 0.15);
          } catch {}
        };
        timers.push(setInterval(spawnDroplet, 1800));

        return { nodes, timers };
      }

      spawnCosmicSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, now);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.12, now);
        subOsc.connect(subGain);
        subGain.connect(channelGain);
        subOsc.start(now);
        nodes.push(subOsc, subGain);

        const bin1 = ctx.createOscillator();
        bin1.type = 'sine';
        bin1.frequency.setValueAtTime(432, now);
        const bin2 = ctx.createOscillator();
        bin2.type = 'sine';
        bin2.frequency.setValueAtTime(436, now);
        const binGain = ctx.createGain();
        binGain.gain.setValueAtTime(0.05, now);
        bin1.connect(binGain);
        bin2.connect(binGain);
        binGain.connect(channelGain);
        bin1.start(now);
        bin2.start(now);
        nodes.push(bin1, bin2, binGain);

        const plasmaOsc = ctx.createOscillator();
        plasmaOsc.type = 'triangle';
        plasmaOsc.frequency.setValueAtTime(108, now);
        const plasmaGain = ctx.createGain();
        plasmaGain.gain.setValueAtTime(0.035, now);
        plasmaOsc.connect(plasmaGain);
        plasmaGain.connect(channelGain);
        plasmaOsc.start(now);
        nodes.push(plasmaOsc, plasmaGain);

        return { nodes, timers };
      }

      spawnCyberSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const saw1 = ctx.createOscillator();
        saw1.type = 'sawtooth';
        saw1.frequency.setValueAtTime(130.81, now);
        const saw2 = ctx.createOscillator();
        saw2.type = 'sawtooth';
        saw2.frequency.setValueAtTime(131.87, now);
        const subSquare = ctx.createOscillator();
        subSquare.type = 'square';
        subSquare.frequency.setValueAtTime(65.41, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(3.8, now);

        const filterLfo = ctx.createOscillator();
        filterLfo.type = 'triangle';
        filterLfo.frequency.setValueAtTime(0.35, now);
        const filterLfoGain = ctx.createGain();
        filterLfoGain.gain.setValueAtTime(450, now);
        filterLfo.connect(filterLfoGain);
        filterLfoGain.connect(filter.frequency);

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0.065, now);

        saw1.connect(filter);
        saw2.connect(filter);
        subSquare.connect(filter);
        filter.connect(padGain);
        padGain.connect(channelGain);

        saw1.start(now);
        saw2.start(now);
        subSquare.start(now);
        filterLfo.start(now);
        nodes.push(saw1, saw2, subSquare, filter, filterLfo, filterLfoGain, padGain);

        const spawnDigitalTick = () => {
          if (!this.isAudioPlaying || !this.audioCtx) return;
          try {
            const t = ctx.currentTime;
            const tickOsc = ctx.createOscillator();
            tickOsc.type = 'square';
            tickOsc.frequency.setValueAtTime(1760, t);
            const tickGain = ctx.createGain();
            tickGain.gain.setValueAtTime(0.015, t);
            tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
            tickOsc.connect(tickGain);
            tickGain.connect(channelGain);
            tickOsc.start(t);
            tickOsc.stop(t + 0.05);
          } catch {}
        };
        timers.push(setInterval(spawnDigitalTick, 1500));

        return { nodes, timers };
      }

      spawnAncientSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const stoneOsc1 = ctx.createOscillator();
        stoneOsc1.type = 'triangle';
        stoneOsc1.frequency.setValueAtTime(144, now);
        const stoneOsc2 = ctx.createOscillator();
        stoneOsc2.type = 'sine';
        stoneOsc2.frequency.setValueAtTime(72, now);

        const stoneFilter = ctx.createBiquadFilter();
        stoneFilter.type = 'bandpass';
        stoneFilter.frequency.setValueAtTime(440, now);
        stoneFilter.Q.setValueAtTime(3.2, now);

        const stoneGain = ctx.createGain();
        stoneGain.gain.setValueAtTime(0.09, now);

        stoneOsc1.connect(stoneFilter);
        stoneOsc2.connect(stoneFilter);
        stoneFilter.connect(stoneGain);
        stoneGain.connect(channelGain);

        stoneOsc1.start(now);
        stoneOsc2.start(now);
        nodes.push(stoneOsc1, stoneOsc2, stoneFilter, stoneGain);

        const noiseBuffer = this.createNoiseBuffer('pink');
        if (noiseBuffer) {
          const windSource = ctx.createBufferSource();
          windSource.buffer = noiseBuffer;
          windSource.loop = true;
          const windFilter = ctx.createBiquadFilter();
          windFilter.type = 'bandpass';
          windFilter.frequency.setValueAtTime(820, now);
          windFilter.Q.setValueAtTime(6.5, now);
          const windLfo = ctx.createOscillator();
          windLfo.type = 'sine';
          windLfo.frequency.setValueAtTime(0.15, now);
          const windLfoGain = ctx.createGain();
          windLfoGain.gain.setValueAtTime(180, now);
          windLfo.connect(windLfoGain);
          windLfoGain.connect(windFilter.frequency);
          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(0.05, now);
          windSource.connect(windFilter);
          windFilter.connect(windGain);
          windGain.connect(channelGain);
          windSource.start(now);
          windLfo.start(now);
          nodes.push(windSource, windFilter, windLfo, windLfoGain, windGain);
        }

        const strikeGong = () => {
          if (!this.isAudioPlaying || !this.audioCtx) return;
          try {
            const t = ctx.currentTime;
            const g1 = ctx.createOscillator();
            g1.type = 'sine';
            g1.frequency.setValueAtTime(320, t);
            const g2 = ctx.createOscillator();
            g2.type = 'sine';
            g2.frequency.setValueAtTime(483, t);
            const gongGain = ctx.createGain();
            gongGain.gain.setValueAtTime(0.14, t);
            gongGain.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
            g1.connect(gongGain);
            g2.connect(gongGain);
            gongGain.connect(channelGain);
            g1.start(t);
            g2.start(t);
            g1.stop(t + 4.1);
            g2.stop(t + 4.1);
          } catch {}
        };
        timers.push(setTimeout(strikeGong, 1200));
        timers.push(setInterval(strikeGong, 7000));

        return { nodes, timers };
      }

      spawnZenSoundscape(channelGain) {
        const ctx = this.audioCtx;
        const nodes = [];
        const timers = [];
        const now = ctx.currentTime;

        const bowlFund = ctx.createOscillator();
        bowlFund.type = 'sine';
        bowlFund.frequency.setValueAtTime(528, now);
        const bowlOvertone = ctx.createOscillator();
        bowlOvertone.type = 'sine';
        bowlOvertone.frequency.setValueAtTime(1457.28, now);

        const bowlTremolo = ctx.createOscillator();
        bowlTremolo.frequency.setValueAtTime(0.4, now);
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.setValueAtTime(0.025, now);
        bowlTremolo.connect(tremoloGain);

        const bowlGain = ctx.createGain();
        bowlGain.gain.setValueAtTime(0.07, now);
        tremoloGain.connect(bowlGain.gain);

        bowlFund.connect(bowlGain);
        bowlOvertone.connect(bowlGain);
        bowlGain.connect(channelGain);

        bowlFund.start(now);
        bowlOvertone.start(now);
        bowlTremolo.start(now);
        nodes.push(bowlFund, bowlOvertone, bowlTremolo, tremoloGain, bowlGain);

        const noiseBuffer = this.createNoiseBuffer('pink');
        if (noiseBuffer) {
          const bambooSource = ctx.createBufferSource();
          bambooSource.buffer = noiseBuffer;
          bambooSource.loop = true;
          const bambooFilter = ctx.createBiquadFilter();
          bambooFilter.type = 'lowpass';
          bambooFilter.frequency.setValueAtTime(320, now);
          const bambooGain = ctx.createGain();
          bambooGain.gain.setValueAtTime(0.04, now);
          bambooSource.connect(bambooFilter);
          bambooFilter.connect(bambooGain);
          bambooGain.connect(channelGain);
          bambooSource.start(now);
          nodes.push(bambooSource, bambooFilter, bambooGain);
        }

        const chimeFrequencies = [1046.5, 1174.7, 1318.5, 1567.98, 1760.0];
        const strikeChime = () => {
          if (!this.isAudioPlaying || !this.audioCtx) return;
          try {
            const t = ctx.currentTime;
            const chimeOsc = ctx.createOscillator();
            const freq = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];
            chimeOsc.type = 'sine';
            chimeOsc.frequency.setValueAtTime(freq, t);
            const chimeGain = ctx.createGain();
            chimeGain.gain.setValueAtTime(0.06, t);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
            chimeOsc.connect(chimeGain);
            chimeGain.connect(channelGain);
            chimeOsc.start(t);
            chimeOsc.stop(t + 2.3);
          } catch {}
        };
        timers.push(setInterval(strikeChime, 2400));

        return { nodes, timers };
      }

      spawnCategorySoundscape(category, realmData, channelGain) {
        const cat = (category || (realmData && realmData.category) || '').toLowerCase();
        const id = ((realmData && realmData.id) || (typeof realmData === 'string' ? realmData : '')).toLowerCase();

        if (id.includes('waterfall') || id.includes('river') || cat.includes('nature') || cat.includes('retreat')) {
          return this.spawnNatureSoundscape(channelGain);
        } else if (cat.includes('cyber') || cat.includes('sci-fi')) {
          return this.spawnCyberSoundscape(channelGain);
        } else if (cat.includes('ancient') || cat.includes('wonder')) {
          return this.spawnAncientSoundscape(channelGain);
        } else if (cat.includes('zen') || cat.includes('meditation')) {
          return this.spawnZenSoundscape(channelGain);
        } else if (cat.includes('cosmic') || cat.includes('odyssey') || id.includes('cosmic')) {
          return this.spawnCosmicSoundscape(channelGain);
        } else {
          return this.spawnSacredSoundscape(channelGain);
        }
      }

      startAudioForRealm(realmData) {
        this.ensureContext();
        if (!this.audioCtx) return;

        const category = typeof realmData === 'object' && realmData ? realmData.category : 'Sacred & Spiritual';
        const realmId = typeof realmData === 'object' && realmData ? realmData.id : String(realmData || 'default');

        this.currentRealmId = realmId;
        this.currentCategory = category;
        this.isAudioPlaying = true;

        const outgoingKey = this.activeChannel;
        const incomingKey = outgoingKey === 'A' ? 'B' : 'A';
        this.activeChannel = incomingKey;

        const outgoing = this.channels[outgoingKey];
        const incoming = this.channels[incomingKey];
        const now = this.audioCtx.currentTime;

        if (outgoing.gain) {
          outgoing.gain.gain.setValueAtTime(outgoing.gain.gain.value, now);
          outgoing.gain.gain.linearRampToValueAtTime(0.0001, now + this.fadeDuration);

          const oldNodes = outgoing.nodes;
          const oldTimers = outgoing.timers;
          outgoing.nodes = [];
          outgoing.timers = [];

          setTimeout(() => {
            oldTimers.forEach((timer) => clearTimeout(timer) || clearInterval(timer));
            oldNodes.forEach((node) => {
              try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
              } catch {}
            });
          }, (this.fadeDuration + 0.1) * 1000);
        }

        incoming.timers.forEach((t) => clearTimeout(t) || clearInterval(t));
        incoming.timers = [];
        incoming.nodes.forEach((n) => {
          try {
            if (n.stop) n.stop();
            if (n.disconnect) n.disconnect();
          } catch {}
        });
        incoming.nodes = [];

        incoming.gain.gain.setValueAtTime(0.0001, now);
        incoming.gain.gain.linearRampToValueAtTime(1.0, now + this.fadeDuration);

        const spawned = this.spawnCategorySoundscape(category, realmData, incoming.gain);
        incoming.nodes = spawned.nodes;
        incoming.timers = spawned.timers;

        this.updateAudioUI();
      }

      stopAudio(immediate = false) {
        if (!this.audioCtx) {
          this.isAudioPlaying = false;
          this.updateAudioUI();
          return;
        }

        const fade = immediate ? 0.05 : 0.3;
        const now = this.audioCtx.currentTime;

        ['A', 'B'].forEach((ch) => {
          const channel = this.channels[ch];
          if (channel.gain) {
            channel.gain.gain.setValueAtTime(channel.gain.gain.value, now);
            channel.gain.gain.linearRampToValueAtTime(0.0001, now + fade);
          }
          channel.timers.forEach((t) => clearTimeout(t) || clearInterval(t));
          channel.timers = [];
          setTimeout(() => {
            channel.nodes.forEach((node) => {
              try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
              } catch {}
            });
            channel.nodes = [];
          }, (fade + 0.05) * 1000);
        });

        this.isAudioPlaying = false;
        this.updateAudioUI();
      }

      toggleAudio(currentRealm) {
        this.ensureContext();
        if (this.isAudioPlaying) {
          this.stopAudio();
        } else {
          this.startAudioForRealm(currentRealm || this.currentRealmId || 'sacred');
        }
      }

      updateAudioUI() {
        if (typeof document === 'undefined') return;
        const label = document.getElementById('audio-label');
        const hudText = document.getElementById('hud-audio-text');
        const headerSvg = document.getElementById('audio-svg-icon');
        const hudSvg = document.getElementById('hud-audio-svg-icon');

        const wavesIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
        const mutedIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';

        if (this.isAudioPlaying) {
          if (label) label.innerText = 'Sound: ON';
          if (hudText) hudText.innerText = 'Mute';
          if (headerSvg) headerSvg.innerHTML = wavesIcon;
          if (hudSvg) hudSvg.innerHTML = wavesIcon;
        } else {
          if (label) label.innerText = 'Sound: OFF';
          if (hudText) hudText.innerText = 'Sound';
          if (headerSvg) headerSvg.innerHTML = mutedIcon;
          if (hudSvg) hudSvg.innerHTML = mutedIcon;
        }
      }
    }

    const ambientAudio = new AmbientAudioEngine();
    let isAudioPlaying = false;
    let audioCtx = null;

    function initAudio() {
      const ctx = ambientAudio.ensureContext();
      audioCtx = ambientAudio.audioCtx;
      isAudioPlaying = ambientAudio.isAudioPlaying;
      return ctx;
    }

    function toggleAudio() {
      ambientAudio.toggleAudio(currentRealmData || currentRealm);
      audioCtx = ambientAudio.audioCtx;
      isAudioPlaying = ambientAudio.isAudioPlaying;
    }

    function startAudioForRealm(realm) {
      ambientAudio.startAudioForRealm(realm);
      audioCtx = ambientAudio.audioCtx;
      isAudioPlaying = ambientAudio.isAudioPlaying;
    }

    function stopAudio() {
      ambientAudio.stopAudio();
      isAudioPlaying = false;
    }

    function updateAudioUI() {
      ambientAudio.updateAudioUI();
    }

    // --- VIDEOTEXTURE & DIMENSIONAL PORTAL MANAGER (FEATURE F11) ---
    class VideoTextureManager {
      constructor(ThreeInstance) {
        this.T = ThreeInstance || THREE;
        this.videos = new Map();
        this.textures = new Map();
        this.proceduralAnimators = [];
        this.portalAnimators = [];
      }

      createVideoElement(srcUrl, options = {}) {
        if (this.videos.has(srcUrl)) return this.videos.get(srcUrl);
        if (typeof document === 'undefined') {
          const mock = { src: srcUrl, play: () => Promise.resolve(), pause: () => {}, removeAttribute: () => {}, load: () => {} };
          this.videos.set(srcUrl, mock);
          return mock;
        }
        const video = document.createElement('video');
        video.crossOrigin = options.crossOrigin || 'anonymous';
        video.loop = options.loop !== false;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.autoplay = options.autoplay !== false;
        video.preload = options.preload || 'auto';
        video.src = srcUrl;
        try {
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        } catch {}
        this.videos.set(srcUrl, video);
        return video;
      }

      createVideoTexture(srcUrl, category = 'Sacred & Spiritual', options = {}) {
        if (this.textures.has(srcUrl)) return this.textures.get(srcUrl);
        if (typeof document === 'undefined' || typeof HTMLVideoElement === 'undefined') {
          const fallback = this.createProceduralCanvasTexture(category, 512, 512);
          this.textures.set(srcUrl, fallback);
          return fallback;
        }
        try {
          const video = this.createVideoElement(srcUrl, options);
          const texture = new this.T.VideoTexture(video);
          texture.minFilter = this.T.LinearFilter;
          texture.magFilter = this.T.LinearFilter;
          texture.format = this.T.RGBAFormat;
          if (this.T.sRGBEncoding) texture.encoding = this.T.sRGBEncoding;

          video.addEventListener('error', () => {
            console.warn('[VideoTextureManager] Video load error, falling back to canvas:', srcUrl);
            const fallback = this.createProceduralCanvasTexture(category, 512, 512);
            if (texture.image && fallback.image) {
              texture.image = fallback.image;
              texture.needsUpdate = true;
            }
          }, { once: true });

          this.textures.set(srcUrl, texture);
          return texture;
        } catch (err) {
          const fallback = this.createProceduralCanvasTexture(category, 512, 512);
          this.textures.set(srcUrl, fallback);
          return fallback;
        }
      }

      createProceduralCanvasTexture(category = 'Sacred & Spiritual', width = 512, height = 512) {
        if (typeof document === 'undefined') {
          const mock = new this.T.Texture();
          mock.needsUpdate = true;
          return mock;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const texture = new this.T.CanvasTexture(canvas);
        texture.minFilter = this.T.LinearFilter;
        texture.magFilter = this.T.LinearFilter;

        const catKey = (category || '').toLowerCase();
        const animator = (time) => {
          ctx.clearRect(0, 0, width, height);
          if (catKey.includes('sacred') || catKey.includes('spiritual')) {
            const grad = ctx.createRadialGradient(width * 0.5, height * 0.55, 10, width * 0.5, height * 0.55, width * 0.45);
            grad.addColorStop(0, '#fffbeb');
            grad.addColorStop(0.35, '#f59e0b');
            grad.addColorStop(0.7, '#d97706');
            grad.addColorStop(1, '#451a03');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) {
              const wave = Math.sin(time * 3.5 + i * 1.2) * 22;
              ctx.beginPath();
              ctx.fillStyle = 'rgba(255, 200, 50, 0.35)';
              ctx.arc(width * 0.5 + wave, height * 0.55 - i * 28, 60 - i * 8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          } else if (catKey.includes('nature') || catKey.includes('retreat')) {
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#064e3b');
            grad.addColorStop(0.5, '#0d9488');
            grad.addColorStop(1, '#0891b2');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2.5;
            for (let col = 0; col < 10; col++) {
              const x = width * 0.2 + col * (width * 0.06);
              const offset = Math.sin(time * 4.0 + col) * 8;
              ctx.beginPath();
              ctx.moveTo(x + offset, 0);
              ctx.lineTo(x - offset, height);
              ctx.stroke();
            }
            ctx.restore();
          } else if (catKey.includes('cosmic') || catKey.includes('odyssey')) {
            ctx.fillStyle = '#050210';
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.translate(width * 0.5, height * 0.5);
            ctx.rotate(time * 0.35);
            for (let arm = 0; arm < 2; arm++) {
              ctx.rotate(Math.PI);
              for (let p = 0; p < 30; p++) {
                const angle = p * 0.22;
                const dist = p * 7;
                ctx.fillStyle = p % 2 === 0 ? 'rgba(236, 72, 153, 0.8)' : 'rgba(56, 189, 248, 0.8)';
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.restore();
          } else if (catKey.includes('cyber') || catKey.includes('sci-fi')) {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#00ff66';
            ctx.font = '14px monospace';
            for (let c = 0; c < 16; c++) {
              const colX = c * (width / 16);
              const dropY = ((time * 80 + c * 37) % height);
              ctx.fillText('01', colX, dropY);
            }
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(6, 6, width - 12, height - 12);
          } else if (catKey.includes('ancient') || catKey.includes('wonder')) {
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.4, '#f59e0b');
            grad.addColorStop(0.7, '#b45309');
            grad.addColorStop(1, '#78350f');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.moveTo(0, height * 0.65);
            ctx.quadraticCurveTo(width * 0.45, height * 0.55 + Math.sin(time) * 10, width, height * 0.75);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();
          } else {
            const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.5);
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(0.6, '#065f46');
            grad.addColorStop(1, '#064e3b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.lineWidth = 2.0;
            for (let r = 1; r <= 3; r++) {
              const radius = ((time * 35 + r * 60) % (width * 0.45));
              const op = Math.max(0, 1.0 - radius / (width * 0.45));
              ctx.strokeStyle = \`rgba(255, 255, 255, \${op * 0.45})\`;
              ctx.beginPath();
              ctx.arc(width * 0.5, height * 0.5, radius, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }
          texture.needsUpdate = true;
        };

        animator(0);
        this.proceduralAnimators.push(animator);
        return texture;
      }

      createDimensionalPortalMesh(texture, options = {}) {
        const portalGroup = new this.T.Group();
        portalGroup.name = 'DimensionalPortalGateway';
        const radius = options.radius || 4.2;

        const plinthGeo = new this.T.CylinderGeometry(radius * 1.35, radius * 1.45, 1.1, 32);
        const plinthMat = new this.T.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.15 });
        const plinth = new this.T.Mesh(plinthGeo, plinthMat);
        plinth.position.y = -radius + 0.55;
        portalGroup.add(plinth);

        const ringGeo = new this.T.TorusGeometry(radius, 0.45, 24, 64);
        const ringMat = new this.T.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
        const ringMesh = new this.T.Mesh(ringGeo, ringMat);
        portalGroup.add(ringMesh);

        const outerRuneGeo = new this.T.RingGeometry(radius * 0.88, radius * 0.98, 48);
        const outerRuneMat = new this.T.MeshBasicMaterial({ color: 0x38bdf8, side: this.T.DoubleSide, transparent: true, opacity: 0.75, wireframe: true });
        const outerRuneRing = new this.T.Mesh(outerRuneGeo, outerRuneMat);
        outerRuneRing.position.z = 0.05;
        portalGroup.add(outerRuneRing);

        const innerRuneGeo = new this.T.RingGeometry(radius * 0.76, radius * 0.86, 36);
        const innerRuneMat = new this.T.MeshBasicMaterial({ color: 0xf59e0b, side: this.T.DoubleSide, transparent: true, opacity: 0.7, wireframe: true });
        const innerRuneRing = new this.T.Mesh(innerRuneGeo, innerRuneMat);
        innerRuneRing.position.z = -0.05;
        portalGroup.add(innerRuneRing);

        const horizonGeo = new this.T.CircleGeometry(radius * 0.88, 48);
        const horizonMat = new this.T.MeshBasicMaterial({ map: texture, side: this.T.DoubleSide, transparent: true, opacity: 0.92 });
        const horizonMesh = new this.T.Mesh(horizonGeo, horizonMat);
        portalGroup.add(horizonMesh);

        const portalLight = new this.T.PointLight(options.lightColor || 0x38bdf8, 2.5, radius * 8);
        portalLight.position.set(0, 0, 1.2);
        portalGroup.add(portalLight);

        this.portalAnimators.push((time) => {
          outerRuneRing.rotation.z = time * 0.35;
          innerRuneRing.rotation.z = -time * 0.55;
          portalLight.intensity = 2.2 + Math.sin(time * 3.5) * 0.8;
        });

        portalGroup.position.set(0, 4.2, -26);
        return portalGroup;
      }

      update(time, delta) {
        for (let i = 0; i < this.proceduralAnimators.length; i++) {
          try { this.proceduralAnimators[i](time, delta); } catch {}
        }
        for (let i = 0; i < this.portalAnimators.length; i++) {
          try { this.portalAnimators[i](time, delta); } catch {}
        }
      }

      disposeAll() {
        this.videos.forEach((video) => {
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
            if (video.parentNode) video.parentNode.removeChild(video);
          } catch {}
        });
        this.videos.clear();
        this.textures.forEach((tex) => {
          try { if (tex.dispose) tex.dispose(); } catch {}
        });
        this.textures.clear();
        this.proceduralAnimators = [];
        this.portalAnimators = [];
      }
    }

    const videoTextureManager = new VideoTextureManager(THREE);`;

assertReplace(oldAudioTarget, newAudioAndVideoReplacement, 'Enhanced AmbientAudioEngine and VideoTextureManager integration');

// -------------------------------------------------------------
// 4. Water Wave Oscillation in createProceduralTerrain
// -------------------------------------------------------------
const terrainWaterTarget = `      if (biome === 'sacred_river' || env.hasWaterBody) {
        const waterGeo = new THREE.PlaneGeometry(240, 160, 32, 32);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x050c18,
          roughness: 0.08,
          metalness: 0.92,
          transparent: true,
          opacity: 0.72
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, -0.4, 15);
        waterMesh.name = 'water_plane';
        waterMesh.receiveShadow = true;
        group.add(waterMesh);
      }`;

const terrainWaterReplacement = `      if (biome === 'sacred_river' || env.hasWaterBody) {
        const waterGeo = new THREE.PlaneGeometry(240, 160, 32, 32);
        waterGeo.rotateX(-Math.PI / 2);
        const origWaterY = new Float32Array(waterGeo.attributes.position.array);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x050c18,
          roughness: 0.08,
          metalness: 0.92,
          transparent: true,
          opacity: 0.72
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, -0.4, 15);
        waterMesh.name = 'water_plane';
        waterMesh.receiveShadow = true;
        group.add(waterMesh);

        if (animators) {
          animators.push((time, delta) => {
            const wPos = waterGeo.attributes ? waterGeo.attributes.position : null;
            if (!wPos || !wPos.array) return;
            for (let i = 0; i < wPos.count; i++) {
              const idx = i * 3;
              const x = origWaterY[idx];
              const z = origWaterY[idx + 2];
              const wave = Math.sin(x * 0.12 + time * 2.2) * Math.cos(z * 0.08 + time * 1.6) * 0.06
                         + Math.sin((x - z) * 0.15 + time * 2.8) * 0.025;
              wPos.setY(i, origWaterY[idx + 1] + wave);
            }
            wPos.needsUpdate = true;
          });
        }
      }`;

assertReplace(terrainWaterTarget, terrainWaterReplacement, 'Procedural terrain water plane harmonic wave oscillation');

// -------------------------------------------------------------
// 5. buildPhotographicWorld & clearRealm Updates
// -------------------------------------------------------------
const clearRealmTarget = `    function clearRealm() {
      realmObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.traverse) {
          obj.traverse(child => {
            if (child.geometry && child.geometry.dispose) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach(m => m.dispose && m.dispose());
              else if (child.material.dispose) child.material.dispose();
            }
          });
        } else {
          if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
            else if (obj.material.dispose) obj.material.dispose();
          }
        }
      });
      realmObjects = [];
      animators = [];
      activeFireworks = [];
      sarayuRiverMesh = null;
      currentRealmData = null;
      scene.fog = null;
    }`;

const clearRealmReplacement = `    function clearRealm() {
      realmObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.traverse) {
          obj.traverse(child => {
            if (child.geometry && child.geometry.dispose) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach(m => m.dispose && m.dispose());
              else if (child.material.dispose) child.material.dispose();
            }
          });
        } else {
          if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
            else if (obj.material.dispose) obj.material.dispose();
          }
        }
      });
      realmObjects = [];
      animators = [];
      activeFireworks = [];
      sarayuRiverMesh = null;
      currentRealmData = null;
      scene.fog = null;

      if (typeof videoTextureManager !== 'undefined' && videoTextureManager.disposeAll) {
        videoTextureManager.disposeAll();
      }
    }`;

assertReplace(clearRealmTarget, clearRealmReplacement, 'clearRealm video decoder teardown integration');

const buildPhotoSignatureTarget = `    // --- PHOTOREALISTIC 360° WORLD TOUR BUILDER ---
    function buildPhotographicWorld(realmData) {`;

const buildPhotoSignatureReplacement = `    // --- PHOTOREALISTIC 360° WORLD TOUR BUILDER ---
    function buildPhotographicWorld(realmData, preloadedTexture = null) {`;

assertReplace(buildPhotoSignatureTarget, buildPhotoSignatureReplacement, 'buildPhotographicWorld preloaded texture signature');

const skydomeTextureLoadTarget = `        if (realmData.bgImage) {
          if (loadedTextures[realmData.bgImage]) {
            skydomeMesh.material.map = loadedTextures[realmData.bgImage];
            skydomeMesh.material.color.setHex(0xffffff);
            skydomeMesh.material.needsUpdate = true;
          } else {
            textureLoader.load(
              realmData.bgImage,
              (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
                loadedTextures[realmData.bgImage] = texture;
                if (skydomeMesh && currentRealm === realmData.id) {
                  skydomeMesh.material.map = texture;
                  skydomeMesh.material.color.setHex(0xffffff);
                  skydomeMesh.material.needsUpdate = true;
                }
              },
              undefined,
              (err) => {
                console.warn(\`[Skydome] Texture fallback active for \${realmData.id}:\`, err);
                if (skydomeMesh && currentRealm === realmData.id) {
                  skydomeMesh.material.map = null;
                  skydomeMesh.material.color = fallbackColor;
                  skydomeMesh.material.needsUpdate = true;
                }
              }
            );
          }
        }`;

const skydomeTextureLoadReplacement = `        if (preloadedTexture) {
          skydomeMesh.material.map = preloadedTexture;
          skydomeMesh.material.color.setHex(0xffffff);
          skydomeMesh.material.needsUpdate = true;
        } else if (realmData.bgImage) {
          if (loadedTextures[realmData.bgImage]) {
            skydomeMesh.material.map = loadedTextures[realmData.bgImage];
            skydomeMesh.material.color.setHex(0xffffff);
            skydomeMesh.material.needsUpdate = true;
          } else {
            textureLoader.load(
              realmData.bgImage,
              (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
                loadedTextures[realmData.bgImage] = texture;
                if (skydomeMesh && currentRealm === realmData.id) {
                  skydomeMesh.material.map = texture;
                  skydomeMesh.material.color.setHex(0xffffff);
                  skydomeMesh.material.needsUpdate = true;
                }
              },
              undefined,
              (err) => {
                console.warn(\`[Skydome] Texture fallback active for \${realmData.id}:\`, err);
                if (skydomeMesh && currentRealm === realmData.id) {
                  skydomeMesh.material.map = null;
                  skydomeMesh.material.color = fallbackColor;
                  skydomeMesh.material.needsUpdate = true;
                }
              }
            );
          }
        }`;

assertReplace(skydomeTextureLoadTarget, skydomeTextureLoadReplacement, 'Direct preloaded texture binding on skydome');

const sarayuRiverTarget = `        // Water Plane with Floating Diyas
        const riverGeo = new THREE.PlaneGeometry(240, 240, 40, 40);
        riverGeo.rotateX(-Math.PI / 2);
        sarayuRiverMesh = new THREE.Mesh(
          riverGeo,
          new THREE.MeshStandardMaterial({ color: 0x050812, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.6 })
        );
        sarayuRiverMesh.position.y = -0.5;
        scene.add(sarayuRiverMesh);
        realmObjects.push(sarayuRiverMesh);`;

const sarayuRiverReplacement = `        // Water Plane with Floating Diyas
        const riverGeo = new THREE.PlaneGeometry(240, 240, 40, 40);
        riverGeo.rotateX(-Math.PI / 2);
        const origRiverY = new Float32Array(riverGeo.attributes.position.array);
        sarayuRiverMesh = new THREE.Mesh(
          riverGeo,
          new THREE.MeshStandardMaterial({ color: 0x050812, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.6 })
        );
        sarayuRiverMesh.position.y = -0.5;
        scene.add(sarayuRiverMesh);
        realmObjects.push(sarayuRiverMesh);`;

assertReplace(sarayuRiverTarget, sarayuRiverReplacement, 'Capture base Sarayu river vertex coordinates');

const diyaAnimTarget = `        // Fireworks & Diya Dynamics Animator
        let lastFireworkTime = 0;
        animators.push((time, delta) => {
          floatingDiyas.forEach(item => {
            item.mesh.position.y = Math.sin(time * 2 + item.seed) * 0.08;
            item.mesh.position.z += 0.6 * delta;
            if (item.mesh.position.z > 30) item.mesh.position.z = -35;
          });`;

const diyaAnimReplacement = `        // Fireworks & Diya Dynamics Animator
        let lastFireworkTime = 0;
        animators.push((time, delta) => {
          if (sarayuRiverMesh && riverGeo.attributes && riverGeo.attributes.position) {
            const rPos = riverGeo.attributes.position;
            for (let i = 0; i < rPos.count; i++) {
              const idx = i * 3;
              const x = origRiverY[idx];
              const z = origRiverY[idx + 2];
              const wave = Math.sin(x * 0.12 + time * 2.2) * Math.cos(z * 0.08 + time * 1.6) * 0.06
                         + Math.sin((x - z) * 0.15 + time * 2.8) * 0.025;
              rPos.setY(i, origRiverY[idx + 1] + wave);
            }
            rPos.needsUpdate = true;
          }

          floatingDiyas.forEach(item => {
            item.mesh.position.y = Math.sin(time * 2 + item.seed) * 0.08;
            item.mesh.position.z += 0.6 * delta;
            if (item.mesh.position.z > 30) item.mesh.position.z = -35;
          });`;

assertReplace(diyaAnimTarget, diyaAnimReplacement, 'Sarayu river surface wave oscillation animation');

const portalSpawnTarget = `      // 5. Flagship 3D Showcase Scenes (Features F8, F9, F10)
      if (typeof attachFlagshipScene === 'function') {
        attachFlagshipScene(THREE, scene, realmData, realmObjects, animators);
      }`;

const portalSpawnReplacement = `      // 5. Flagship 3D Showcase Scenes (Features F8, F9, F10)
      if (typeof attachFlagshipScene === 'function') {
        attachFlagshipScene(THREE, scene, realmData, realmObjects, animators);
      }

      // 6. Milestone M4: VideoTexture & Dimensional Portal Gateway (Feature F11)
      if (realmData.videoLoop && typeof videoTextureManager !== 'undefined') {
        const videoTex = videoTextureManager.createVideoTexture(realmData.videoLoop, realmData.category);
        const portalGateway = videoTextureManager.createDimensionalPortalMesh(videoTex);
        scene.add(portalGateway);
        realmObjects.push(portalGateway);
        animators.push((time, delta) => videoTextureManager.update(time, delta));
      }`;

assertReplace(portalSpawnTarget, portalSpawnReplacement, 'Dimensional Portal Gateway spawning in buildPhotographicWorld');

// -------------------------------------------------------------
// 6. Fix Firefly Drift and Water Oscillation in buildWaterfallSanctuaryScene
// -------------------------------------------------------------
const waterSanctuaryPlaneTarget = `      const waterGeo = new T.PlaneGeometry(90, 160, 32, 48);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new T.MeshStandardMaterial({`;

const waterSanctuaryPlaneReplacement = `      const waterGeo = new T.PlaneGeometry(90, 160, 32, 48);
      waterGeo.rotateX(-Math.PI / 2);
      const origSanctuaryWaterY = new Float32Array(waterGeo.attributes.position.array);
      const waterMat = new T.MeshStandardMaterial({`;

assertReplace(waterSanctuaryPlaneTarget, waterSanctuaryPlaneReplacement, 'Waterfall Sanctuary water plane vertex capture');

const fireflyInitTarget = `      // 75 Dancing Fireflies
      const fireflyCount = 75;
      const fireflyGeo = new T.BufferGeometry();
      const fireflyPos = new Float32Array(fireflyCount * 3);
      const fireflySeeds = new Float32Array(fireflyCount);

      for (let f = 0; f < fireflyCount; f++) {
        const idx = f * 3;
        fireflyPos[idx] = baseBedPos.x + (Math.random() - 0.5) * 14.0;
        fireflyPos[idx + 1] = 0.5 + Math.random() * 3.5;
        fireflyPos[idx + 2] = baseBedPos.z + (Math.random() - 0.5) * 14.0;
        fireflySeeds[f] = Math.random() * Math.PI * 2;
      }`;

const fireflyInitReplacement = `      // 75 Dancing Fireflies
      const fireflyCount = 75;
      const fireflyGeo = new T.BufferGeometry();
      const fireflyPos = new Float32Array(fireflyCount * 3);
      const baseFireflyPos = new Float32Array(fireflyCount * 3);
      const fireflySeeds = new Float32Array(fireflyCount);

      for (let f = 0; f < fireflyCount; f++) {
        const idx = f * 3;
        const bx = baseBedPos.x + (Math.random() - 0.5) * 14.0;
        const by = 0.5 + Math.random() * 3.5;
        const bz = baseBedPos.z + (Math.random() - 0.5) * 14.0;
        fireflyPos[idx] = bx;
        fireflyPos[idx + 1] = by;
        fireflyPos[idx + 2] = bz;
        baseFireflyPos[idx] = bx;
        baseFireflyPos[idx + 1] = by;
        baseFireflyPos[idx + 2] = bz;
        fireflySeeds[f] = Math.random() * Math.PI * 2;
      }`;

assertReplace(fireflyInitTarget, fireflyInitReplacement, 'Waterfall Sanctuary baseFireflyPos anchoring');

const fireflyDriftTarget = `          lanternLight.intensity = 2.0 + Math.sin(time * 12.0) * 0.18 + Math.cos(time * 7.5) * 0.12;

          const ffAttr = fireflyGeo.attributes ? fireflyGeo.attributes.position : null;
          if (ffAttr && ffAttr.array) {
            const ffPositions = ffAttr.array;
            for (let f = 0; f < fireflyCount; f++) {
              const idx = f * 3;
              const seed = fireflySeeds[f];
              ffPositions[idx] += Math.sin(time * 1.5 + seed) * 0.03;
              ffPositions[idx + 1] += Math.cos(time * 2.0 + seed) * 0.02;
              ffPositions[idx + 2] += Math.sin(time * 1.2 + seed * 1.5) * 0.03;
            }
            ffAttr.needsUpdate = true;
          }`;

const fireflyDriftReplacement = `          lanternLight.intensity = 2.0 + Math.sin(time * 12.0) * 0.18 + Math.cos(time * 7.5) * 0.12;

          const wPos = waterGeo.attributes ? waterGeo.attributes.position : null;
          if (wPos && wPos.array) {
            for (let i = 0; i < wPos.count; i++) {
              const idx = i * 3;
              const x = origSanctuaryWaterY[idx];
              const z = origSanctuaryWaterY[idx + 2];
              const wave = Math.sin(x * 0.12 + time * 2.2) * Math.cos(z * 0.08 + time * 1.6) * 0.06
                         + Math.sin((x - z) * 0.15 + time * 2.8) * 0.025;
              wPos.setY(i, origSanctuaryWaterY[idx + 1] + wave);
            }
            wPos.needsUpdate = true;
          }

          const ffAttr = fireflyGeo.attributes ? fireflyGeo.attributes.position : null;
          if (ffAttr && ffAttr.array) {
            const ffPositions = ffAttr.array;
            for (let f = 0; f < fireflyCount; f++) {
              const idx = f * 3;
              const seed = fireflySeeds[f];
              ffPositions[idx] = baseFireflyPos[idx] + Math.sin(time * 1.2 + seed) * 1.5;
              ffPositions[idx + 1] = baseFireflyPos[idx + 1] + Math.cos(time * 1.8 + seed) * 0.75;
              ffPositions[idx + 2] = baseFireflyPos[idx + 2] + Math.sin(time * 0.9 + seed * 1.4) * 1.5;
            }
            ffAttr.needsUpdate = true;
          }`;

assertReplace(fireflyDriftTarget, fireflyDriftReplacement, 'Waterfall Sanctuary water wave oscillation and zero-drift firefly orbit');

// -------------------------------------------------------------
// 7. Fluid Animation Loop with THREE.Clock & Clamping
// -------------------------------------------------------------
const oldAnimateTarget = `    function animate() {
      requestAnimationFrame(animate);
      const delta = 0.016;
      const time = performance.now() * 0.001;
      animators.forEach(fn => fn(time, delta));
      controls.update();
      renderer.render(scene, camera);
    }`;

const newAnimateReplacement = `    // --- FRAME-RATE INDEPENDENT FLUID ANIMATION LOOP (FEATURE F12) ---
    const clock = new THREE.Clock();
    let isRenderingActive = true;

    function animate() {
      if (!isRenderingActive) return;
      requestAnimationFrame(animate);

      const rawDelta = clock.getDelta();
      const delta = Math.min(Math.max(rawDelta, 0.001), 0.1);
      const time = clock.getElapsedTime();

      for (let i = 0; i < animators.length; i++) {
        try {
          animators[i](time, delta);
        } catch (err) {
          console.warn('[Animator Exception Suppressed]', err);
        }
      }

      if (controls && typeof controls.update === 'function') {
        controls.update();
      }

      renderer.render(scene, camera);
    }`;

assertReplace(oldAnimateTarget, newAnimateReplacement, 'Delta-clamped fault-tolerant fluid animation loop');

// -------------------------------------------------------------
// 8. Preloader Pipeline with preloadRealmAssetsAsync
// -------------------------------------------------------------
const oldWarpTarget = `    // --- WARP TRANSITION ---
    function launchWarpForRealm(realmData) {
      if (isWarping) return;
      isWarping = true;

      // Defensive guarantee: ensure full environmental contract is present
      const env = realmData.environment || {
        biome: 'sanctuary',
        hasWaterBody: false,
        festiveContext: false,
        skyColor: 0x0a0e1a,
        sunPosition: [0, 50, -50],
        fogDensity: 0.002,
        terrainPreset: 'default'
      };
      const fullRealm = { ...realmData, environment: env };

      if (window.confetti) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#ffd700', '#10b981', '#38bdf8'] });
      }

      // Hide Portal UI
      const portalEl = document.getElementById('portal-ui');
      portalEl.style.opacity = '0';
      portalEl.style.pointerEvents = 'none';

      // Show Warp Overlay
      const overlay = document.getElementById('warp-overlay');
      document.getElementById('warp-realm-title').innerText = 'Warping to ' + fullRealm.title + '...';
      document.getElementById('warp-realm-desc').innerText = fullRealm.description + ' [Biome: ' + fullRealm.environment.biome.toUpperCase() + ']';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';

      const bar = document.getElementById('warp-progress-bar');
      setTimeout(() => { bar.style.width = '100%'; }, 50);

      setTimeout(() => {
        // Handoff full RealmData to Scene Controller
        buildPhotographicWorld(fullRealm);

        // Start Audio for Realm
        if (isAudioPlaying) startAudioForRealm(fullRealm.id);

        // Hide Warp Overlay
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        bar.style.width = '0%';
        isWarping = false;

        // Update Active HUD
        document.getElementById('hud-realm-name').innerText = fullRealm.title;
        document.getElementById('hud-wish-text').innerText = '"' + (fullRealm.tagline || fullRealm.title) + '"';
        
        // Gating Diya Release Button in HUD based on festiveContext & hasWaterBody (Requirement R2)
        const releaseBtn = document.getElementById('release-diya-btn');
        if (releaseBtn) {
          if (fullRealm.environment.festiveContext && fullRealm.environment.hasWaterBody) {
            releaseBtn.style.display = 'flex';
            releaseBtn.setAttribute('title', 'Release Diya on Sacred Water');
          } else {
            releaseBtn.style.display = 'none'; // Gated: no floating diyas in dry/secular/space realms!
          }
        }

        document.getElementById('tour-hud').style.opacity = '1';

        // Dispatch decoupled event for test assertions & external modules
        window.dispatchEvent(new CustomEvent('dreamfire:realm-switched', { detail: fullRealm }));
      }, 1900);
    }`;

const newWarpReplacement = `    // --- ASYNCHRONOUS ASSET PRELOADER PIPELINE (FEATURE F12) ---
    function preloadRealmAssetsAsync(realmData, onProgress) {
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
          console.warn(\`[Preloader] Realm '\${realmData.id}' asset load reached timeout (\${WARP_TIMEOUT_MS}ms). Proceeding with fallback.\`);
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

        textureLoader.load(
          realmData.bgImage,
          (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
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
            console.warn(\`[Preloader] Texture load failed for \${realmData.bgImage}:\`, err);
            finalize(null);
          }
        );
      });
    }

    // --- WARP TRANSITION ---
    async function launchWarpForRealm(realmData) {
      if (isWarping) return;
      isWarping = true;

      // Defensive guarantee: ensure full environmental contract is present
      const env = realmData.environment || {
        biome: 'sanctuary',
        hasWaterBody: false,
        festiveContext: false,
        skyColor: 0x0a0e1a,
        sunPosition: [0, 50, -50],
        fogDensity: 0.002,
        terrainPreset: 'default'
      };
      const fullRealm = { ...realmData, environment: env };

      if (window.confetti) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#ffd700', '#10b981', '#38bdf8'] });
      }

      // Hide Portal UI
      const portalEl = document.getElementById('portal-ui');
      portalEl.style.opacity = '0';
      portalEl.style.pointerEvents = 'none';

      // Show Warp Overlay
      const overlay = document.getElementById('warp-overlay');
      const bar = document.getElementById('warp-progress-bar');
      document.getElementById('warp-realm-title').innerText = 'Warping to ' + fullRealm.title + '...';
      document.getElementById('warp-realm-desc').innerText = fullRealm.description + ' [Biome: ' + fullRealm.environment.biome.toUpperCase() + ']';
      if (bar) bar.style.width = '15%';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';

      const startTime = Date.now();
      const MIN_WARP_DURATION_MS = 650;

      // Preload assets asynchronously while warp overlay is actively displayed
      const { texture } = await preloadRealmAssetsAsync(fullRealm, (pct) => {
        if (bar) bar.style.width = \`\${Math.max(15, pct)}%\`;
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_WARP_DURATION_MS) {
        await new Promise((r) => setTimeout(r, MIN_WARP_DURATION_MS - elapsed));
      }
      if (bar) bar.style.width = '100%';

      // Construct scene graph while overlay is still 100% opaque (Zero pop-in!)
      buildPhotographicWorld(fullRealm, texture);

      // Pre-warm GPU shaders (1 render tick under opaque overlay eliminates frame hitch)
      renderer.render(scene, camera);

      // Start Audio for Realm with safe auto-resume
      if (isAudioPlaying) {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        startAudioForRealm(fullRealm);
      }

      // Hide Warp Overlay
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      if (bar) bar.style.width = '0%';
      isWarping = false;

      // Update Active HUD
      document.getElementById('hud-realm-name').innerText = fullRealm.title;
      document.getElementById('hud-wish-text').innerText = '"' + (fullRealm.tagline || fullRealm.title) + '"';
      
      // Gating Diya Release Button in HUD based on festiveContext & hasWaterBody (Requirement R2)
      const releaseBtn = document.getElementById('release-diya-btn');
      if (releaseBtn) {
        if (fullRealm.environment.festiveContext && fullRealm.environment.hasWaterBody) {
          releaseBtn.style.display = 'flex';
          releaseBtn.setAttribute('title', 'Release Diya on Sacred Water');
        } else {
          releaseBtn.style.display = 'none'; // Gated: no floating diyas in dry/secular/space realms!
        }
      }

      document.getElementById('tour-hud').style.opacity = '1';

      // Dispatch decoupled event for test assertions & external modules
      window.dispatchEvent(new CustomEvent('dreamfire:realm-switched', { detail: fullRealm }));
    }`;

assertReplace(oldWarpTarget, newWarpReplacement, 'Asynchronous preloadRealmAssetsAsync and launchWarpForRealm');

// Write out updated index.html
fs.writeFileSync(INDEX_PATH, html, 'utf8');
console.log(`Saved updated index.html (${html.length} bytes)`);

// Ensure exact byte-for-byte parity with preview.html
fs.writeFileSync(PREVIEW_PATH, html, 'utf8');
console.log(`Synchronized preview.html identically (${html.length} bytes)`);
