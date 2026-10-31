/**
 * src/utils/audio.js - DreamFire Synchronized Ambient Audio Engine
 * Feature F13: Procedural Multi-Channel Web Audio Synthesizer
 *
 * Implements pure procedural Web Audio soundscapes for all 6 canonical categories:
 * 1. Sacred & Spiritual: Tanpura drone (108Hz sawtooth + 162Hz triangle) + periodic Vedic temple bells
 * 2. Nature & Retreat: Flowing water dual-filtered noise buffer + mountain breeze LFO + spring droplet blips
 * 3. Cosmic Odyssey: Sub-bass void drone (55Hz) + 432Hz/436Hz binaural theta beat + stellar plasma drift
 * 4. Cyberpunk & Sci-Fi: Dual detuned sawtooth synth pad (130.81Hz + 131.87Hz) + resonant filter sweep + digital clock ticks
 * 5. Ancient Wonders: Hypostyle stone chamber drone (144Hz + 72Hz) + desert wind whistle + bronze gong decay
 * 6. Zen Meditation: Tibetan singing bowl resonator (528Hz + 1457Hz overtone) + pentatonic wind chimes + bamboo breeze
 *
 * Features:
 * - 1.2-second dual-channel cross-fading (Channel A / B) to prevent clicks and pops
 * - Safe browser autoplay resume on user gestures and navigation warps
 * - Zero external media files / pure mathematical synthesis
 */

export class AmbientAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.isAudioPlaying = false;
    this.volume = 0.75;
    this.fadeDuration = 1.2; // seconds

    // Dual-channel cross-fade management
    this.activeChannel = 'A';
    this.channels = {
      A: { gain: null, nodes: [], timers: [] },
      B: { gain: null, nodes: [], timers: [] }
    };

    this.currentRealmId = null;
    this.currentCategory = null;

    // Attach autoplay unlock handlers if in browser
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

  /**
   * Initializes or resumes the Web Audio AudioContext.
   */
  ensureContext() {
    if (typeof window === 'undefined' && typeof AudioContext === 'undefined') {
      return null;
    }

    if (!this.audioCtx) {
      const AudioContextClass = typeof window !== 'undefined'
        ? (window.AudioContext || window.webkitAudioContext)
        : (typeof AudioContext !== 'undefined' ? AudioContext : null);

      if (!AudioContextClass) return null;

      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Create channel gains
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

  /**
   * Generates a 2-second looped audio buffer filled with stereo noise.
   */
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

  /**
   * 1. Sacred & Spiritual: Tanpura Harmonic Drone & Periodic Vedic Temple Bells
   */
  spawnSacredSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. Root Tanpura Drone (108Hz sawtooth)
    const rootOsc = ctx.createOscillator();
    rootOsc.type = 'sawtooth';
    rootOsc.frequency.setValueAtTime(108, now);

    // B. Fifth (Pa) Harmonic (162Hz triangle)
    const paOsc = ctx.createOscillator();
    paOsc.type = 'triangle';
    paOsc.frequency.setValueAtTime(162, now);

    // C. Sweeping Lowpass Filter for authentic acoustic string vibration
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(2.2, now);

    // D. LFO Modulator (0.2Hz sine)
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

    // E. Periodic Vedic Temple Bells
    const bellFrequencies = [216, 432, 540, 648, 864];
    const strikeBell = () => {
      if (!this.isAudioPlaying || !this.audioCtx) return;
      try {
        const t = ctx.currentTime;
        const freq = bellFrequencies[Math.floor(Math.random() * bellFrequencies.length)];

        // Fundamental
        const bellOsc = ctx.createOscillator();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(freq, t);

        // Overtone
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

    // Strike first bell after 1.5s, then every 4.2s
    timers.push(setTimeout(strikeBell, 1500));
    timers.push(setInterval(strikeBell, 4200));

    return { nodes, timers };
  }

  /**
   * 2. Nature & Retreat: Procedural Flowing Water, Mountain Breeze & Droplets
   */
  spawnNatureSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer('pink');
    if (noiseBuffer) {
      // Stream noise source
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Dual parallel filters: Lowpass (deep flow) + Bandpass (spray foam)
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

      // Mountain Breeze Gust LFO
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

    // Spring water droplet blips
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

  /**
   * 3. Cosmic Odyssey: Sub-Bass Void Drone, Binaural Theta Beat & Stellar Plasma
   */
  spawnCosmicSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. Sub-bass void drone (55Hz sine)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, now);
    subOsc.connect(subGain);
    subGain.connect(channelGain);
    subOsc.start(now);
    nodes.push(subOsc, subGain);

    // B. Binaural harmonic theta beat (432Hz + 436Hz => 4Hz theta wave)
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

    // C. Stellar Plasma Drift (108Hz triangle + subtle modulated highpass hiss)
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

  /**
   * 4. Cyberpunk & Sci-Fi: Dual Detuned Sawtooth Synth Pad & Neon Filter Sweep
   */
  spawnCyberSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. Detuned Sawtooth Synth Pad (130.81Hz + 131.87Hz)
    const saw1 = ctx.createOscillator();
    saw1.type = 'sawtooth';
    saw1.frequency.setValueAtTime(130.81, now);

    const saw2 = ctx.createOscillator();
    saw2.type = 'sawtooth';
    saw2.frequency.setValueAtTime(131.87, now); // +14 cents detune for rich analog chorus

    const subSquare = ctx.createOscillator();
    subSquare.type = 'square';
    subSquare.frequency.setValueAtTime(65.41, now); // C2 sub-bass

    // Resonant Filter Sweep (350Hz - 1350Hz)
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

    // B. Quantum Clock Digital Ticks
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

  /**
   * 5. Ancient Wonders: Stone Chamber Drone, Desert Wind & Bronze Gong
   */
  spawnAncientSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. Hypostyle Stone Chamber Drone (144Hz triangle + 72Hz sine)
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

    // B. Desert Wind Whistle
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

    // C. Bronze Gong Strike
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

  /**
   * 6. Zen Meditation: Tibetan Singing Bowl Resonator, Chimes & Bamboo Breeze
   */
  spawnZenSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. Tibetan Singing Bowl Resonator (528Hz Solfeggio + 1457Hz overtone)
    const bowlFund = ctx.createOscillator();
    bowlFund.type = 'sine';
    bowlFund.frequency.setValueAtTime(528, now);

    const bowlOvertone = ctx.createOscillator();
    bowlOvertone.type = 'sine';
    bowlOvertone.frequency.setValueAtTime(1457.28, now);

    // Tremolo mallet rub LFO (0.4Hz)
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

    // B. Bamboo Breeze
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

    // C. Pentatonic Wind Chimes (C6 - A6 pentatonic scale)
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

  /**
   * 7. Vedic Chanting & Sacred Shankhnaad: 136.1Hz Cosmic Om, F1/F2 Formant Vocal Tract, Tanpura, Conch Shell
   */
  spawnVedicChantingSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // 1. Cosmic Om Fundamental (136.10 Hz in C#3) & Tanpura 108Hz / 162Hz
    const omOsc = ctx.createOscillator();
    omOsc.type = 'sawtooth';
    omOsc.frequency.setValueAtTime(136.1, now);

    const saOsc = ctx.createOscillator();
    saOsc.type = 'triangle';
    saOsc.frequency.setValueAtTime(108.0, now);

    // 2. Formant Vocal Tract Filters for "O-M" / "R-A-M" Human Chanting
    // Formant 1: 550 Hz (Vocal tract throat resonance)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(550, now);
    f1.Q.setValueAtTime(6.0, now);

    // Formant 2: 1050 Hz (Oral cavity resonance)
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1050, now);
    f2.Q.setValueAtTime(8.0, now);

    // 3. Rhythmic Chanting Breathing Envelope (6.5s periodic mantra cycle)
    const chantGain = ctx.createGain();
    chantGain.gain.setValueAtTime(0.001, now);

    const breathLFO = ctx.createOscillator();
    breathLFO.type = 'sine';
    breathLFO.frequency.setValueAtTime(1 / 6.5, now);
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.12, now);
    breathLFO.connect(breathGain);
    breathGain.connect(chantGain.gain);

    omOsc.connect(f1);
    omOsc.connect(f2);
    f1.connect(chantGain);
    f2.connect(chantGain);
    saOsc.connect(chantGain);
    chantGain.connect(channelGain);

    omOsc.start(now);
    saOsc.start(now);
    breathLFO.start(now);
    nodes.push(omOsc, saOsc, f1, f2, chantGain, breathLFO, breathGain);

    // 4. Sacred Shankhnaad (Conch Shell) Soaring Call (every 14s)
    const blowShankhnaad = () => {
      if (!this.isAudioPlaying || !this.audioCtx) return;
      try {
        const t = ctx.currentTime;
        const conch = ctx.createOscillator();
        conch.type = 'sawtooth';
        conch.frequency.setValueAtTime(216.0, t);
        conch.frequency.linearRampToValueAtTime(228.0, t + 1.2);
        conch.frequency.linearRampToValueAtTime(216.0, t + 4.5);

        const conchFilter = ctx.createBiquadFilter();
        conchFilter.type = 'bandpass';
        conchFilter.frequency.setValueAtTime(432.0, t);
        conchFilter.Q.setValueAtTime(5.0, t);

        const conchGain = ctx.createGain();
        conchGain.gain.setValueAtTime(0.0001, t);
        conchGain.gain.linearRampToValueAtTime(0.22, t + 1.0);
        conchGain.gain.exponentialRampToValueAtTime(0.0001, t + 5.0);

        conch.connect(conchFilter);
        conchFilter.connect(conchGain);
        conchGain.connect(channelGain);

        conch.start(t);
        conch.stop(t + 5.2);
      } catch {}
    };

    timers.push(setTimeout(blowShankhnaad, 1000));
    timers.push(setInterval(blowShankhnaad, 14000));

    return { nodes, timers };
  }

  /**
   * 8. High-Speed F1 Racing Circuit: V10 Engine Harmonics, Rev Curves & Tire Scrub
   */
  spawnF1RacingSoundscape(channelGain) {
    const ctx = this.audioCtx;
    const nodes = [];
    const timers = [];
    const now = ctx.currentTime;

    // A. V10 Fundamental Firing Frequency (idle 375 Hz to redline 1540 Hz, sawtooth)
    const oscV10 = ctx.createOscillator();
    oscV10.type = 'sawtooth';
    oscV10.frequency.setValueAtTime(375, now);

    // B. 2nd Harmonic Exhaust Resonance (2x f0, sawtooth)
    const oscExhaust = ctx.createOscillator();
    oscExhaust.type = 'sawtooth';
    oscExhaust.frequency.setValueAtTime(750, now);

    // C. Crankshaft Subharmonic (f0 / 5, triangle)
    const oscCrank = ctx.createOscillator();
    oscCrank.type = 'triangle';
    oscCrank.frequency.setValueAtTime(75, now);

    // D. Resonant Lowpass Filter Swept by Rev Curve (Q = 4.5)
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(1200, now);
    engineFilter.Q.setValueAtTime(4.5, now);

    // E. Manifold Distortion Waveshaper (512-point soft clipping curve)
    let waveshaper = null;
    if (typeof ctx.createWaveShaper === 'function') {
      try {
        waveshaper = ctx.createWaveShaper();
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; ++i) {
          const x = (i * 2) / 512 - 1;
          curve[i] = ((Math.PI + 40) * x) / (Math.PI + 40 * Math.abs(x));
        }
        waveshaper.curve = curve;
        waveshaper.oversample = '2x';
      } catch {}
    }

    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0.12, now);

    // Connect Engine Node Graph
    oscV10.connect(engineFilter);
    oscExhaust.connect(engineFilter);
    oscCrank.connect(engineFilter);

    if (waveshaper) {
      engineFilter.connect(waveshaper);
      waveshaper.connect(engineGain);
      nodes.push(waveshaper);
    } else {
      engineFilter.connect(engineGain);
    }
    engineGain.connect(channelGain);

    oscV10.start(now);
    oscExhaust.start(now);
    oscCrank.start(now);
    nodes.push(oscV10, oscExhaust, oscCrank, engineFilter, engineGain);

    // F. Procedural Rev-Curve Shifting Sequence Across 4 Gears with 40ms Ignition Cut Dips
    const gearRatios = [
      { startFreq: 375, endFreq: 1350, duration: 1.6 }, // 1st gear (idle 375 Hz)
      { startFreq: 880, endFreq: 1420, duration: 1.9 }, // 2nd gear
      { startFreq: 960, endFreq: 1520, duration: 2.4 }, // 3rd gear
      { startFreq: 1050, endFreq: 1540, duration: 2.8 } // 4th gear (redline 1540 Hz)
    ];

    let nextShiftTime = now;
    for (let cycle = 0; cycle < 12; cycle++) {
      for (let g = 0; g < gearRatios.length; g++) {
        const gear = gearRatios[g];
        const startT = nextShiftTime;
        const endT = startT + gear.duration;

        try {
          // Rev acceleration ramp
          oscV10.frequency.setValueAtTime(gear.startFreq, startT);
          oscV10.frequency.exponentialRampToValueAtTime(gear.endFreq, endT);

          // 2nd harmonic exhaust resonance (2x f0)
          oscExhaust.frequency.setValueAtTime(gear.startFreq * 2, startT);
          oscExhaust.frequency.exponentialRampToValueAtTime(gear.endFreq * 2, endT);

          // Crankshaft subharmonic (f0 / 5)
          oscCrank.frequency.setValueAtTime(gear.startFreq / 5, startT);
          oscCrank.frequency.exponentialRampToValueAtTime(gear.endFreq / 5, endT);

          // Resonant lowpass filter swept by rev curve
          engineFilter.frequency.setValueAtTime(gear.startFreq * 1.8, startT);
          engineFilter.frequency.exponentialRampToValueAtTime(gear.endFreq * 2.5, endT);

          // Shift cut (40ms ignition cut dip)
          engineGain.gain.setValueAtTime(0.12, endT - 0.04);
          engineGain.gain.linearRampToValueAtTime(0.015, endT);
          engineGain.gain.linearRampToValueAtTime(0.12, endT + 0.06);
        } catch {}

        nextShiftTime = endT + 0.08;
      }
    }

    // G. Trackside Pink Noise Tire Scrub with 950 Hz Bandpass Filter
    const noiseBuf = this.createNoiseBuffer('pink');
    if (noiseBuf) {
      const tireNoise = ctx.createBufferSource();
      tireNoise.buffer = noiseBuf;
      tireNoise.loop = true;

      const tireFilter = ctx.createBiquadFilter();
      tireFilter.type = 'bandpass';
      tireFilter.frequency.setValueAtTime(950, now);
      tireFilter.Q.setValueAtTime(2.2, now);

      const tireGain = ctx.createGain();
      tireGain.gain.setValueAtTime(0.04, now);

      tireNoise.connect(tireFilter);
      tireFilter.connect(tireGain);
      tireGain.connect(channelGain);

      tireNoise.start(now);
      nodes.push(tireNoise, tireFilter, tireGain);
    }

    return { nodes, timers };
  }

  spawnF1EngineSoundscape(channelGain) {
    return this.spawnF1RacingSoundscape(channelGain);
  }

  /**
   * Spawns the appropriate soundscape generator for a given realm / category.
   */
  spawnCategorySoundscape(category, realmData, channelGain) {
    const cat = (category || (realmData && realmData.category) || '').toLowerCase();
    const id = ((realmData && realmData.id) || (typeof realmData === 'string' ? realmData : '')).toLowerCase();
    const tags = (realmData && Array.isArray(realmData.tags)) ? realmData.tags.map(t => String(t).toLowerCase()) : [];
    const title = ((realmData && realmData.title) || '').toLowerCase();

    if (
      id === 'monaco-midnight-grand-prix' ||
      id === 'silverstone-night-gp' ||
      id.includes('monaco') ||
      id.includes('silverstone') ||
      id.includes('f1') ||
      tags.includes('f1') ||
      tags.includes('racing') ||
      tags.includes('grand prix') ||
      title.includes('grand prix') ||
      title.includes('racing') ||
      (realmData && realmData.soundscape && realmData.soundscape.includes('V10'))
    ) {
      return this.spawnF1RacingSoundscape(channelGain);
    } else if (id.includes('waterfall') || id.includes('river') || cat.includes('nature') || cat.includes('retreat')) {
      return this.spawnNatureSoundscape(channelGain);
    } else if (cat.includes('cyber') || cat.includes('sci-fi')) {
      return this.spawnCyberSoundscape(channelGain);
    } else if (cat.includes('ancient') || cat.includes('wonder')) {
      return this.spawnAncientSoundscape(channelGain);
    } else if (cat.includes('zen') || cat.includes('meditation')) {
      return this.spawnZenSoundscape(channelGain);
    } else if (cat.includes('cosmic') || cat.includes('odyssey') || id.includes('cosmic')) {
      return this.spawnCosmicSoundscape(channelGain);
    } else if (id.includes('ayodhya') || id.includes('ram') || (realmData && realmData.soundscape && realmData.soundscape.includes('Vedic'))) {
      return this.spawnVedicChantingSoundscape(channelGain);
    } else {
      // Default to Sacred & Spiritual (Ayodhya, temples, sacred shrines)
      return this.spawnSacredSoundscape(channelGain);
    }
  }

  /**
   * Smoothly cross-fades between outgoing channel and incoming channel over 1.2s.
   * Eliminates acoustic pop/click artifacts and ensures zero audio interruption.
   */
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

    // 1. Ramp down outgoing channel
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

    // 2. Clear any lingering incoming nodes and ramp up
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

    // 3. Spawn category soundscape on incoming channel
    const spawned = this.spawnCategorySoundscape(category, realmData, incoming.gain);
    incoming.nodes = spawned.nodes;
    incoming.timers = spawned.timers;

    this.updateAudioUI();
  }

  /**
   * Stops all audio with a smooth 0.3s fade-out to prevent clicks.
   */
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

      const nodesToStop = [...channel.nodes];
      channel.nodes = [];

      const timerId = setTimeout(() => {
        nodesToStop.forEach((node) => {
          try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
          } catch {}
        });
      }, (fade + 0.05) * 1000);
      channel.timers.push(timerId);
    });

    this.isAudioPlaying = false;
    this.updateAudioUI();
  }

  /**
   * Toggles audio playback state.
   */
  toggleAudio(currentRealm) {
    this.ensureContext();
    if (this.isAudioPlaying) {
      this.stopAudio();
    } else {
      this.startAudioForRealm(currentRealm || this.currentRealmId || 'sacred');
    }
  }

  /**
   * Updates all UI indicators and dynamic SVG icons (Header + HUD).
   */
  updateAudioUI() {
    if (typeof document === 'undefined') return;

    const label = document.getElementById('audio-label');
    const hudText = document.getElementById('hud-audio-text');
    const headerSvg = document.getElementById('audio-svg-icon');
    const hudSvg = document.getElementById('hud-audio-svg-icon');

    // Dynamic SVG icon paths:
    // Playing: Speaker with propagating sound waves
    const wavesIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    // Muted: Speaker with crossed X
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

export const ambientAudio = new AmbientAudioEngine();

if (typeof window !== 'undefined') {
  window.AmbientAudioEngine = AmbientAudioEngine;
  window.ambientAudio = ambientAudio;
}

export default ambientAudio;
