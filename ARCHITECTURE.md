# 🛡️ DreamFire — Architecture & High-Scale Reliability Spec

## 1. Objective & Requirements
* **Concurrency:** Capable of handling 10M+ simultaneous visitors on Diwali night without degradation.
* **Security:** Immune to DDoS, SQL injection, script tampering, and server resource exhaustion.
* **Latency:** < 100ms globally via edge replication.
* **Privacy:** 100% client-side privacy; zero personal tracking or server-side telemetry.

---

## 2. Zero-Server Static Edge Model
Traditional dynamic servers with relational databases crash when millions of users arrive at the exact same festive moment (e.g. government portals during results).

DreamFire eliminates the backend bottleneck completely:
\\\
[ Global Users (10M+) ]
          │
          ▼
[ Anycast Edge CDN (Cloudflare / GitHub Pages) ]
          │ (Zero Cold Start / Cached Static Blobs)
          ▼
[ Client Browser Runtime ]
    ├── WebGL 3D Canvas (Three.js 60fps)
    ├── Procedural Web Audio API (Math Oscillators)
    ├── Client Oracle Scoring Algorithm
    └── LocalStorage Flame Persistence
\\\

---

## 3. Web Audio Synthesis Architecture
* Eliminates heavy MP3/WAV streaming bandwidth.
* Audio is created procedurally using:
  * OscillatorNode (Sine / Triangle)
  * BiquadFilterNode (Lowpass 550Hz harmonic warmth)
  * GainNode (Smooth exponential volume ramps)
* Result: 0 KB streaming bandwidth per user.

---

## 4. WebGL Particle Optimization
* 2,000 particle vertices stored in GPU BufferAttribute.
* Dynamic HSL color shifting via single attribute buffers.
* Level-of-Detail (LOD) degradation on low-power mobile GPUs.
* Viewport mouse tracking throttled with lerp smoothing.

---

## 5. Security & Zero-Trust Compliance
* **Content Security Policy (CSP):** Strict script-src and connect-src policies.
* **Input Sanitization:** Client-side HTML entity escaping on all user wishes to prevent XSS.
* **Rate-Limiting Immunity:** Because static assets are cached at CDN edges, DDoS attacks hit edge network caches rather than compute units.