/**
 * Tier 3 Test Suite: Multimedia, VideoTexture & Audio Synthesis
 * 
 * Verifies:
 * - All 14 curated high-resolution photo and texture assets exist and are non-empty
 * - Video assets or dynamic animated loop textures are properly referenced without 404s or frozen loops
 * - Static server (serve.cjs) supports video/image MIME streaming and WebGL CORS headers
 * - Multi-channel ambient audio synthesis parameters are configured per category
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite, test, assert, run } from './harness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const IMAGES_DIR = path.join(ROOT_DIR, 'public', 'assets', 'images');
const VIDEOS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'videos');
const SERVE_CJS_PATH = path.join(ROOT_DIR, 'serve.cjs');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');
const AUDIO_TS_PATH = path.join(ROOT_DIR, 'src', 'utils', 'audio.ts');
const AUDIO_JS_PATH = path.join(ROOT_DIR, 'src', 'utils', 'audio.js');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

const REQUIRED_CURATED_IMAGES = [
  'aarti_devotees_real.jpg',
  'aurora_borealis_real.jpg',
  'colosseum_ancient.jpg',
  'cyberpunk_citadel.jpg',
  'golden_temple_real.jpg',
  'himalaya_zen.jpg',
  'kyoto_zen_garden.jpg',
  'maldives_bioluminescent.jpg',
  'nature_waterfall.jpg',
  'orion_cosmos.jpg',
  'pyramids_giza_real.jpg',
  'ram_mandir_real.jpg',
  'tokyo_neon.jpg',
  'transparent_bed_sanctuary.jpg'
];

const CANONICAL_CATEGORIES = [
  'Sacred & Spiritual',
  'Nature & Retreat',
  'Cosmic Odyssey',
  'Cyberpunk & Sci-Fi',
  'Ancient Wonders',
  'Zen Meditation'
];

suite('Tier 3: Multimedia, VideoTexture & Audio Synthesis', 'Tier 3', () => {
  let catalogData = [];

  test('All 14 curated high-resolution photographic assets exist on disk with valid file sizes', () => {
    assert.ok(fs.existsSync(IMAGES_DIR), `Images directory not found at ${IMAGES_DIR}`);

    const diskFiles = fs.readdirSync(IMAGES_DIR);
    const missing = [];
    const undersized = [];

    REQUIRED_CURATED_IMAGES.forEach((filename) => {
      const filePath = path.join(IMAGES_DIR, filename);
      if (!fs.existsSync(filePath)) {
        missing.push(filename);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size < 50 * 1024) {
          undersized.push({ filename, size: stats.size });
        }
      }
    });

    assert.strictEqual(
      missing.length,
      0,
      `Missing required curated image assets:\n- ${missing.join('\n- ')}`
    );

    assert.strictEqual(
      undersized.length,
      0,
      `Undersized image assets (<50KB):\n${JSON.stringify(undersized, null, 2)}`
    );
  });

  test('Video assets or dynamic animated loop textures are properly referenced without 404s or frozen rendering loops', () => {
    assert.ok(fs.existsSync(CATALOG_PATH), 'realms_catalog.json must exist');
    catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    const brokenVideoRefs = [];
    catalogData.forEach((realm) => {
      if (realm.videoLoop) {
        const norm = realm.videoLoop.replace(/^[/\\]+/, '');
        const fullPath = path.join(ROOT_DIR, norm);
        if (!fs.existsSync(fullPath)) {
          brokenVideoRefs.push({ realm: realm.id, videoLoop: realm.videoLoop });
        } else {
          const stats = fs.statSync(fullPath);
          if (stats.size === 0) {
            brokenVideoRefs.push({ realm: realm.id, videoLoop: realm.videoLoop, reason: 'Empty file' });
          }
        }
      }
    });

    assert.strictEqual(
      brokenVideoRefs.length,
      0,
      `Broken video asset references in catalog:\n${JSON.stringify(brokenVideoRefs, null, 2)}`
    );

    // Verify dynamic animation fallback loop is present to avoid frozen rendering loops
    // In index.html or SceneManager.js, an animation loop must use requestAnimationFrame or delta-time updating
    const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    const hasAnimationLoop =
      /requestAnimationFrame\s*\(\s*animate\s*\)/.test(indexHtml) ||
      /function\s+animate\s*\(/.test(indexHtml);

    assert.ok(hasAnimationLoop, 'Scene engine must implement dynamic requestAnimationFrame loop to avoid frozen renders');
  });

  test('Static development server (serve.cjs) supports video/image MIME streaming and WebGL CORS', () => {
    assert.ok(fs.existsSync(SERVE_CJS_PATH), 'serve.cjs must exist');
    const serveCode = fs.readFileSync(SERVE_CJS_PATH, 'utf8');

    // MIME dictionary check
    assert.ok(serveCode.includes("'.mp4': 'video/mp4'"), "serve.cjs must define MIME type for '.mp4'");
    assert.ok(serveCode.includes("'.jpg': 'image/jpeg'") || serveCode.includes("'.jpeg': 'image/jpeg'"), "serve.cjs must define MIME type for JPEG");
    assert.ok(serveCode.includes("'.png': 'image/png'"), "serve.cjs must define MIME type for PNG");
    assert.ok(serveCode.includes("'.svg': 'image/svg+xml'"), "serve.cjs must define MIME type for SVG");

    // CORS headers check (critical for WebGL VideoTexture / ImageTexture cross-origin security)
    assert.ok(
      serveCode.includes('Access-Control-Allow-Origin') && serveCode.includes('*'),
      'serve.cjs must set Access-Control-Allow-Origin: * to prevent tainted WebGL textures'
    );
  });

  test('Multi-channel ambient audio synthesis parameters are configured across realm categories', () => {
    // Check either src/utils/audio.ts, src/utils/audio.js, or inline audio in index.html
    let audioCode = '';
    if (fs.existsSync(AUDIO_JS_PATH)) {
      audioCode += fs.readFileSync(AUDIO_JS_PATH, 'utf8') + '\n';
    }
    if (fs.existsSync(AUDIO_TS_PATH)) {
      audioCode += fs.readFileSync(AUDIO_TS_PATH, 'utf8') + '\n';
    }
    audioCode += fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Check AudioContext initialization
    const hasAudioContext =
      /AudioContext|webkitAudioContext/.test(audioCode);
    assert.ok(hasAudioContext, 'Audio engine must instantiate Web Audio API AudioContext');

    // Check safe auto-resume logic on user interaction
    const hasResumeCheck =
      /audioCtx\.state\s*===?\s*['"]suspended['"]|audioCtx\.resume\(\)|\.resume\(\)/.test(audioCode);
    assert.ok(hasResumeCheck, 'Audio engine must feature safe auto-resume logic to handle autoplay policy restrictions');

    // Check category sound profiles
    // Categories: Sacred (bells/drone), Nature (water/pink noise), Cosmic (432Hz sine tone), etc.
    const hasBellsOrDrone = /bell|drone|sawtooth|432|108/i.test(audioCode);
    const hasWaterOrNoise = /noise|buffer|water|stream/i.test(audioCode);
    const hasCosmicTone = /sine|oscillator|freq/i.test(audioCode);

    assert.ok(hasBellsOrDrone, 'Audio synthesizer must configure temple bells or resonant drone for sacred realms');
    assert.ok(hasWaterOrNoise, 'Audio synthesizer must configure procedural water noise / stream for nature biomes');
    assert.ok(hasCosmicTone, 'Audio synthesizer must configure cosmic ambient tone frequencies');

    // Verify all 6 categories have designated soundscape descriptions in catalog
    const unconfiguredSoundscapes = [];
    catalogData.forEach((realm) => {
      if (!realm.soundscape || realm.soundscape.trim().length === 0) {
        unconfiguredSoundscapes.push(realm.id);
      }
    });

    assert.strictEqual(
      unconfiguredSoundscapes.length,
      0,
      `Realms with unconfigured soundscape metadata:\n${unconfiguredSoundscapes.join(', ')}`
    );
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('multimedia.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
