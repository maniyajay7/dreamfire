/**
 * scripts/generate_videos.mjs
 * Master Procedural Video Generator for DreamFire Milestone M4 (Feature F11)
 * Generates 8 high-quality, authentic, perfectly-looping H.264 MP4 videos in public/assets/videos/
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'videos');

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const WIDTH = 640;
const HEIGHT = 360;
const FPS = 30;
const DURATION_SEC = 2.5;
const TOTAL_FRAMES = Math.round(FPS * DURATION_SEC); // 75 frames

function generateVideo(filename, frameRenderer) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(VIDEOS_DIR, filename);
    console.log(`[Video Generator] Rendering ${filename}...`);

    const ffmpeg = spawn('ffmpeg', [
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-s', `${WIDTH}x${HEIGHT}`,
      '-r', `${FPS}`,
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '21',
      '-y',
      outputPath
    ]);

    ffmpeg.stderr.on('data', () => {});

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`✔ Finished ${filename}: ${(stats.size / 1024).toFixed(1)} KB`);
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code} for ${filename}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });

    const frameBuf = Buffer.alloc(WIDTH * HEIGHT * 3);

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const t = f / TOTAL_FRAMES; // 0.0 <= t < 1.0 (exact loop period)
      frameRenderer(frameBuf, WIDTH, HEIGHT, t, f);
      ffmpeg.stdin.write(frameBuf);
    }

    ffmpeg.stdin.end();
  });
}

// -------------------------------------------------------------
// 1. portal_sacred_flame.mp4 (Sacred & Spiritual)
// -------------------------------------------------------------
function renderSacredFlame(buf, w, h, t) {
  const cx = w / 2;
  const cy = h / 2 + 30;
  const twoPi = Math.PI * 2;

  // Precompute 35 rising ember particles
  const embers = [];
  for (let i = 0; i < 35; i++) {
    const seed = i * 1.618;
    const px = cx + Math.sin(seed * 7.3) * 110;
    const progress = (t + seed) % 1.0;
    const py = h - progress * 240;
    const size = 2 + (i % 3);
    embers.push({ x: px, y: py, size, alpha: Math.sin(progress * Math.PI) });
  }

  for (let y = 0; y < h; y++) {
    const dy = (y - cy) / (h * 0.5);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const dx = (x - cx) / (w * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep sacred maroon background
      let r = 24 + (1 - y / h) * 35;
      let g = 8 + (1 - y / h) * 12;
      let b = 5;

      // Central ascending flame body
      const flameX = dx + Math.sin(dy * 4.0 - t * twoPi) * 0.08 + Math.sin(dy * 8.0 + t * twoPi) * 0.04;
      const flameDist = Math.sqrt(flameX * flameX * 3.5 + dy * dy);
      if (flameDist < 1.1 && dy > -0.9) {
        const flameCore = Math.max(0, 1 - flameDist);
        const intensity = Math.pow(flameCore, 1.4);
        r += intensity * 255;
        g += intensity * (160 + Math.sin(dy * 5 - t * twoPi) * 40);
        b += intensity * 30;
      }

      // Golden pulsing mandorla aura
      const auraPulse = Math.sin(t * twoPi) * 0.08 + 0.92;
      const ringDist = Math.abs(dist - 0.45 * auraPulse);
      if (ringDist < 0.12) {
        const ringGlow = Math.pow(1 - ringDist / 0.12, 2.0);
        r += ringGlow * 180;
        g += ringGlow * 130;
        b += ringGlow * 20;
      }

      buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
      buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
  }

  // Draw ember points
  for (const e of embers) {
    const ex = Math.round(e.x);
    const ey = Math.round(e.y);
    for (let oy = -e.size; oy <= e.size; oy++) {
      for (let ox = -e.size; ox <= e.size; ox++) {
        const px = ex + ox;
        const py = ey + oy;
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const idx = (py * w + px) * 3;
          buf[idx] = Math.min(255, buf[idx] + Math.round(e.alpha * 220));
          buf[idx + 1] = Math.min(255, buf[idx + 1] + Math.round(e.alpha * 190));
          buf[idx + 2] = Math.min(255, buf[idx + 2] + Math.round(e.alpha * 80));
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 2. portal_waterfall_cascade.mp4 (Nature & Retreat)
// -------------------------------------------------------------
function renderWaterfallCascade(buf, w, h, t) {
  const twoPi = Math.PI * 2;
  const basinY = h * 0.76;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const nx = x / w;
      const ny = y / h;

      if (y < basinY) {
        // Vertical waterfall torrent
        const streamFlow1 = Math.sin(x * 0.22 + Math.sin(y * 0.08 - t * twoPi * 3) * 4);
        const streamFlow2 = Math.cos(x * 0.45 + (y * 0.15 - t * twoPi * 4));
        const stream = (streamFlow1 + streamFlow2) * 0.5;

        // Dark mossy rock cliff on sides, rushing water in center
        const centerDist = Math.abs(nx - 0.5);
        const inWaterfall = Math.max(0, 1.0 - centerDist / 0.38);

        let r = 8 + (1 - inWaterfall) * 15;
        let g = 28 + inWaterfall * (160 + stream * 60);
        let b = 45 + inWaterfall * (200 + stream * 50);

        // Whitewater foam streaks
        if (inWaterfall > 0.5 && stream > 0.4) {
          const foam = (stream - 0.4) * 2.0;
          r += foam * 180;
          g += foam * 210;
          b += foam * 230;
        }

        buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
        buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
        buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      } else {
        // Plunge pool with concentric splash ripples
        const dy = (y - basinY) / (h - basinY);
        const dx = (x - w * 0.5) / (w * 0.4);
        const rDist = Math.sqrt(dx * dx + dy * dy * 4.0);

        const ripple = Math.sin(rDist * 22.0 - t * twoPi * 3.0) * Math.exp(-rDist * 1.8);
        const plungeFoam = Math.exp(-rDist * 4.0) * (0.8 + Math.sin(t * twoPi * 6) * 0.2);

        let r = 10 + plungeFoam * 180 + ripple * 20;
        let g = 65 + plungeFoam * 210 + ripple * 45;
        let b = 90 + plungeFoam * 230 + ripple * 60;

        buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
        buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
        buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }
  }
}

// -------------------------------------------------------------
// 3. portal_cosmic_vortex.mp4 (Cosmic Odyssey)
// -------------------------------------------------------------
function renderCosmicVortex(buf, w, h, t) {
  const cx = w / 2;
  const cy = h / 2;
  const twoPi = Math.PI * 2;

  // 50 rotating star particles
  const stars = [];
  for (let i = 0; i < 50; i++) {
    const sSeed = i * 2.399;
    const baseRadius = 30 + (i * 5.5);
    const speed = (60 - baseRadius * 0.12) * 0.03;
    const angle = sSeed + t * twoPi * (i % 2 === 0 ? 1 : -1) * 0.2;
    const sx = cx + Math.cos(angle) * baseRadius * 1.5;
    const sy = cy + Math.sin(angle) * baseRadius * 0.85;
    stars.push({ x: sx, y: sy, brightness: 0.6 + Math.sin(t * twoPi + sSeed) * 0.4 });
  }

  for (let y = 0; y < h; y++) {
    const dy = (y - cy) / (h * 0.5);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const dx = (x - cx) / (w * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Deep galactic void
      let r = 6 + dist * 8;
      let g = 3 + dist * 5;
      let b = 16 + dist * 14;

      // 2-arm spiral nebula vortex
      const spiral = angle + dist * 3.8 - t * twoPi;
      const armDensity = Math.pow(Math.max(0, Math.cos(spiral)), 4.0) * Math.exp(-dist * 1.4);

      // Core glow
      const core = Math.exp(-dist * 4.2);

      // Palette: Electric magenta, celestial cyan, starlight white
      r += armDensity * 190 + core * 255;
      g += armDensity * 45 + core * 240;
      b += armDensity * 220 + core * 255;

      buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
      buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
  }

  // Draw starfield
  for (const s of stars) {
    const px = Math.round(s.x);
    const py = Math.round(s.y);
    if (px >= 1 && px < w - 1 && py >= 1 && py < h - 1) {
      const idx = (py * w + px) * 3;
      const val = Math.round(s.brightness * 255);
      buf[idx] = Math.min(255, buf[idx] + val);
      buf[idx + 1] = Math.min(255, buf[idx + 1] + val);
      buf[idx + 2] = Math.min(255, buf[idx + 2] + val);
    }
  }
}

// -------------------------------------------------------------
// 4. portal_cyber_matrix.mp4 (Cyberpunk & Sci-Fi)
// -------------------------------------------------------------
function renderCyberMatrix(buf, w, h, t) {
  const horizonY = h * 0.48;
  const twoPi = Math.PI * 2;

  // Digital matrix rain columns
  const COL_COUNT = 32;
  const colWidth = w / COL_COUNT;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;

      if (y < horizonY) {
        // Digital Matrix Rain Upper Half
        const colIdx = Math.floor(x / colWidth);
        const colSeed = (colIdx * 137.5) % 1.0;
        const dropSpeed = 1.2 + colSeed * 1.5;
        const dropY = ((t * dropSpeed + colSeed) % 1.0) * horizonY;

        const distToDrop = y - dropY;
        let rainIntensity = 0;
        if (distToDrop > 0 && distToDrop < 60) {
          rainIntensity = 1.0 - (distToDrop / 60);
        }

        let r = 2;
        let g = Math.round(rainIntensity * 220);
        let b = Math.round(rainIntensity * 140);

        if (distToDrop > 0 && distToDrop < 4) {
          // Bright glyph head
          r = 180;
          g = 255;
          b = 240;
        }

        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
      } else {
        // 3D Perspective Neon Cyber Grid Lower Half
        const groundY = (y - horizonY) / (h - horizonY); // 0 at horizon, 1 at bottom
        const z = 1.0 / (groundY + 0.05); // depth perspective

        // Perspective x coordinates
        const screenX = (x - w * 0.5) / (w * 0.5);
        const worldX = screenX * z;

        // Grid lines
        const gridX = Math.abs((worldX * 3.0) % 1.0 - 0.5);
        const gridZ = Math.abs((z * 0.8 - t * 4.0) % 1.0 - 0.5);

        const isLineX = gridX < 0.06;
        const isLineZ = gridZ < 0.06;

        let r = 5;
        let g = 10;
        let b = 25;

        if (isLineX || isLineZ) {
          const pulse = 0.7 + Math.sin(worldX * 2.0 + t * twoPi) * 0.3;
          r = Math.round(10 * pulse);
          g = Math.round(230 * pulse);
          b = Math.round(255 * pulse);
        }

        // Distance fog fade towards horizon
        const fog = Math.pow(groundY, 0.7);
        buf[idx] = Math.round(r * fog);
        buf[idx + 1] = Math.round(g * fog);
        buf[idx + 2] = Math.round(b * fog);
      }
    }
  }
}

// -------------------------------------------------------------
// 5. portal_ancient_dunes.mp4 (Ancient Wonders)
// -------------------------------------------------------------
function renderAncientDunes(buf, w, h, t) {
  const twoPi = Math.PI * 2;
  const sunX = w * 0.5;
  const sunY = h * 0.35;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const nx = x / w;
      const ny = y / h;

      // Desert Sky Gradient (warm gold to amber)
      let r = 245 - ny * 80;
      let g = 160 - ny * 90;
      let b = 60 - ny * 45;

      // Radiant Egyptian Sun with corona
      const dx = (x - sunX) / 80;
      const dy = (y - sunY) / 80;
      const sunDist = Math.sqrt(dx * dx + dy * dy);
      if (sunDist < 1.0) {
        const sunGlow = Math.pow(1 - sunDist, 1.5);
        r = Math.min(255, r + sunGlow * 120);
        g = Math.min(255, g + sunGlow * 100);
        b = Math.min(255, b + sunGlow * 80);
      }

      // Dune 1 (Distant ridge)
      const dune1Y = h * 0.55 + Math.sin(nx * 4.2 + 0.5) * 22;
      // Dune 2 (Mid ridge)
      const dune2Y = h * 0.68 + Math.cos(nx * 3.5 + 1.2) * 35;
      // Dune 3 (Foreground ridge)
      const dune3Y = h * 0.82 + Math.sin(nx * 2.8 + 2.4) * 28;

      if (y >= dune3Y) {
        // Foreground dune: dark terracotta ochre
        const sandGrain = Math.sin(x * 0.6 + y * 0.4) * 8;
        r = 180 + sandGrain;
        g = 95 + sandGrain * 0.6;
        b = 25;
      } else if (y >= dune2Y) {
        // Mid dune: golden amber
        const sandGrain = Math.cos(x * 0.5 + y * 0.3) * 6;
        r = 215 + sandGrain;
        g = 130 + sandGrain * 0.6;
        b = 40;
      } else if (y >= dune1Y) {
        // Distant dune: soft haze sand
        r = 235;
        g = 165;
        b = 75;
      }

      // Heat shimmer / atmospheric dust drift
      const dustDrift = Math.sin(x * 0.08 - t * twoPi * 2.0 + y * 0.05) * 8;
      r += dustDrift;
      g += dustDrift * 0.7;

      buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
      buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
  }
}

// -------------------------------------------------------------
// 6. portal_zen_ripple.mp4 (Zen Meditation)
// -------------------------------------------------------------
function renderZenRipple(buf, w, h, t) {
  const cx = w * 0.5;
  const cy = h * 0.52;
  const twoPi = Math.PI * 2;

  for (let y = 0; y < h; y++) {
    const dy = (y - cy) / (h * 0.5);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const dx = (x - cx) / (w * 0.5);
      const rDist = Math.sqrt(dx * dx * 1.4 + dy * dy);

      // Deep emerald serene koi pond reflection
      let r = 8;
      let g = 38 + Math.round((1 - y / h) * 30);
      let b = 32 + Math.round((1 - y / h) * 20);

      // Concentric water ripple waves propagating outward smoothly
      const wave1 = Math.sin(rDist * 28.0 - t * twoPi * 2.0) * Math.exp(-rDist * 1.5);
      const wave2 = Math.cos(rDist * 16.0 - t * twoPi * 1.0) * Math.exp(-rDist * 1.2) * 0.6;
      const ripple = wave1 + wave2;

      // Soft caustic light ripples
      r += ripple * 35;
      g += ripple * 90;
      b += ripple * 75;

      // Floating Zen Lotus pad in upper left
      const lx = (x - w * 0.32) / 45;
      const ly = (y - h * 0.38) / 35;
      const lDist = Math.sqrt(lx * lx + ly * ly);
      if (lDist < 1.0) {
        // Soft jade water lily pad
        const lEdge = Math.pow(1.0 - lDist, 0.5);
        r = 15 + lEdge * 25;
        g = 95 + lEdge * 60;
        b = 55 + lEdge * 30;
      }

      buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
      buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
  }
}

// -------------------------------------------------------------
// 7. portal_ayodhya_sacred.mp4 (Ayodhya Ram Mandir Flagship)
// -------------------------------------------------------------
function renderAyodhyaSacred(buf, w, h, t) {
  const cx = w * 0.5;
  const riverY = h * 0.72;
  const twoPi = Math.PI * 2;

  // Floating diyas on Sarayu river
  const diyas = [];
  for (let d = 0; d < 24; d++) {
    const seed = d * 1.732;
    const dx = ((d * 28 + t * 40) % (w + 40)) - 20;
    const dy = riverY + 12 + (d % 5) * 12;
    diyas.push({ x: dx, y: dy, flicker: 0.7 + Math.sin(t * twoPi * 4 + seed) * 0.3 });
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;

      if (y < riverY) {
        // Divine twilight sky & radiating sunbeams
        const angle = Math.atan2(y - h * 0.45, x - cx);
        const godRays = Math.pow(Math.max(0, Math.sin(angle * 14.0 + t * twoPi)), 3.0) * 0.35;

        let r = 180 + godRays * 75;
        let g = 95 + godRays * 60;
        let b = 25;

        // Silhouette of Nagara Shikhara spires
        const distFromCenter = Math.abs(x - cx);
        // Central tower
        if (distFromCenter < 35 && y > (h * 0.22 + distFromCenter * 2.8)) {
          r = 45; g = 20; b = 8; // Deep silhouette
        }
        // Flanking spires
        else if (distFromCenter >= 35 && distFromCenter < 80 && y > (h * 0.35 + (distFromCenter - 35) * 2.0)) {
          r = 45; g = 20; b = 8;
        }
        // Outer colonnade
        else if (distFromCenter >= 80 && distFromCenter < 140 && y > h * 0.52) {
          r = 45; g = 20; b = 8;
        }

        buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
        buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
        buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      } else {
        // Sarayu River reflection
        const dy = y - riverY;
        const waterWave = Math.sin(x * 0.15 + t * twoPi * 2.0) * 0.2;
        let r = 70 + waterWave * 20;
        let g = 35 + waterWave * 10;
        let b = 15;

        buf[idx] = Math.min(255, Math.max(0, Math.round(r)));
        buf[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
        buf[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }
  }

  // Draw floating diyas
  for (const d of diyas) {
    const px = Math.round(d.x);
    const py = Math.round(d.y);
    for (let oy = -3; oy <= 3; oy++) {
      for (let ox = -3; ox <= 3; ox++) {
        const tx = px + ox;
        const ty = py + oy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const idx = (ty * w + tx) * 3;
          buf[idx] = Math.min(255, buf[idx] + Math.round(d.flicker * 240));
          buf[idx + 1] = Math.min(255, buf[idx + 1] + Math.round(d.flicker * 170));
          buf[idx + 2] = Math.min(255, buf[idx + 2] + Math.round(d.flicker * 40));
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 8. portal_waterfall_sanctuary.mp4 (Waterfall Sanctuary Flagship)
// -------------------------------------------------------------
function renderWaterfallSanctuary(buf, w, h, t) {
  const twoPi = Math.PI * 2;
  const basinY = h * 0.65;

  // 30 Dancing Fireflies orbiting in Lissajous curves
  const fireflies = [];
  for (let f = 0; f < 30; f++) {
    const seed = f * 2.15;
    const fx = w * 0.5 + Math.sin(t * twoPi * 1.5 + seed) * (w * 0.35);
    const fy = h * 0.55 + Math.cos(t * twoPi * 2.0 + seed * 1.5) * (h * 0.25);
    fireflies.push({ x: fx, y: fy, glow: 0.6 + Math.sin(t * twoPi * 3 + seed) * 0.4 });
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const nx = x / w;

      if (y < basinY) {
        // Alpine mountain canyon with twin waterfalls (left and right)
        const isLeftFall = Math.abs(nx - 0.22) < 0.08;
        const isRightFall = Math.abs(nx - 0.78) < 0.08;

        if (isLeftFall || isRightFall) {
          // Falling torrent
          const stream = Math.sin(y * 0.2 - t * twoPi * 4.0 + x * 0.3);
          buf[idx] = Math.min(255, Math.round(90 + stream * 60));
          buf[idx + 1] = Math.min(255, Math.round(210 + stream * 45));
          buf[idx + 2] = Math.min(255, Math.round(230 + stream * 25));
        } else {
          // Deep mossy rock canyon
          const rock = Math.sin(x * 0.08 + y * 0.06) * 12;
          buf[idx] = Math.min(255, Math.max(0, Math.round(14 + rock)));
          buf[idx + 1] = Math.min(255, Math.max(0, Math.round(38 + rock * 1.2)));
          buf[idx + 2] = Math.min(255, Math.max(0, Math.round(28 + rock)));
        }
      } else {
        // Crystal sanctuary lagoon
        const dy = (y - basinY) / (h - basinY);
        const wave = Math.sin(x * 0.12 + t * twoPi * 2.0) * Math.cos(dy * 10) * 18;
        buf[idx] = Math.min(255, Math.max(0, Math.round(10 + wave * 0.5)));
        buf[idx + 1] = Math.min(255, Math.max(0, Math.round(110 + wave)));
        buf[idx + 2] = Math.min(255, Math.max(0, Math.round(140 + wave * 1.2)));
      }
    }
  }

  // Draw fireflies
  for (const ff of fireflies) {
    const px = Math.round(ff.x);
    const py = Math.round(ff.y);
    for (let oy = -2; oy <= 2; oy++) {
      for (let ox = -2; ox <= 2; ox++) {
        const tx = px + ox;
        const ty = py + oy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const idx = (ty * w + tx) * 3;
          buf[idx] = Math.min(255, buf[idx] + Math.round(ff.glow * 250));
          buf[idx + 1] = Math.min(255, buf[idx + 1] + Math.round(ff.glow * 230));
          buf[idx + 2] = Math.min(255, buf[idx + 2] + Math.round(ff.glow * 60));
        }
      }
    }
  }
}

// -------------------------------------------------------------
// Master Execution
// -------------------------------------------------------------
async function runAll() {
  console.log(`Starting generation of 8 authentic video loops (${TOTAL_FRAMES} frames, ${FPS} fps)...`);
  const t0 = Date.now();

  await generateVideo('portal_sacred_flame.mp4', renderSacredFlame);
  await generateVideo('portal_waterfall_cascade.mp4', renderWaterfallCascade);
  await generateVideo('portal_cosmic_vortex.mp4', renderCosmicVortex);
  await generateVideo('portal_cyber_matrix.mp4', renderCyberMatrix);
  await generateVideo('portal_ancient_dunes.mp4', renderAncientDunes);
  await generateVideo('portal_zen_ripple.mp4', renderZenRipple);
  await generateVideo('portal_ayodhya_sacred.mp4', renderAyodhyaSacred);
  await generateVideo('portal_waterfall_sanctuary.mp4', renderWaterfallSanctuary);

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`\n🎉 All 8 authentic video loops generated successfully in ${duration}s!`);
}

runAll().catch((err) => {
  console.error('Fatal error generating videos:', err);
  process.exit(1);
});
