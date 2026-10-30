class CosmicAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playHarmonicDrone(frequency = 432, type: OscillatorType = 'sine') {
    this.init();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stop();
    }

    const now = this.ctx.currentTime;
    this.osc = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();

    this.osc.type = type;
    this.osc.frequency.setValueAtTime(frequency, now);

    // Warm harmonic filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    this.gainNode.gain.setValueAtTime(0.001, now);
    this.gainNode.gain.exponentialRampToValueAtTime(0.08, now + 2);

    this.osc.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc.start();
    this.isPlaying = true;
  }

  public playChime(freq = 880) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 1.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        if (this.osc) {
          try { this.osc.stop(); this.osc.disconnect(); } catch {}
        }
        this.isPlaying = false;
      }, 500);
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.playHarmonicDrone(432);
      return true;
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

export const cosmicAudio = new CosmicAudioSynthesizer();
