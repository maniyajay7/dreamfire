# DreamFire Test Infrastructure Architecture & Philosophy

## 1. Core Testing Philosophy

DreamFire is designed as a high-fidelity universal dimensional reality platform spanning 110 realms. The automated test infrastructure enforces **opaque-box verification**, **behavior-based testing**, and **strict specification compliance**:

- **No Facade Tests**: Every test exercises real logic, examines physical files, parses live DOM and code structures, and validates interface invariants against `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- **Zero-Dependency Architecture**: The testing suite and runner require zero external npm packages, running natively on modern Node.js (`node >= 18`) using Node's standard modules (`node:assert/strict`, `node:fs`, `node:path`, `node:url`).
- **Dual Execution Modes**: Each test file can be executed individually (`node tests/<tier>.test.js`) or holistically via the unified test runner (`node tests/run_all_tests.cjs`).
- **Defect Pinpointing**: Test failures are diagnostic, detailing the exact DOM elements, code patterns, or catalog records causing violations.

---

## 2. Four-Tier Testing Methodology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DREAMFIRE TEST HIERARCHY                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Tier 1: Realm Catalog & Routing│ 110 Realms, Schema, Assets, Search    │
├────────────────────────────────┼───────────────────────────────────────┤
│ Tier 2: Visual Scene Contracts │ 3D Geometry, No 2D Hacks, Diya Gating │
├────────────────────────────────┼───────────────────────────────────────┤
│ Tier 3: Multimedia & Audio     │ Textures, Video Loops, Audio Synthesis │
├────────────────────────────────┼───────────────────────────────────────┤
│ Tier 4: AI Prompt & Mutation   │ NLP Parser, Scene State, Camera Lock  │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Tier 1: Realm Catalog Indexing & Routing (`tests/realm_routing.test.js`)
- **Realm Count & Uniqueness**: Asserts that exactly 110 realms are indexed with unique kebab-case IDs (`/^[a-z0-9]+(-[a-z0-9]+)*$/`).
- **Schema Completeness**: Validates mandatory fields (`title`, `category`, `tagline`, `description`, `soundscape`, `tags`, `soulsVisiting`, `resonance`).
- **Asset Physical Existence**: Asserts that every referenced image (`bgImage`) and video (`videoLoop`) exists on disk in `Z:\dreamfire\` and has non-zero size.
- **Category Coverage**: Validates balanced distribution across all 6 canonical categories with clean partitioning.
- **Search Query Matching**: Simulates multi-field query parsing across title, category, description, and tags with case insensitivity and whitespace trimming.
- **Inline Synchronization**: Ensures `ALL_REALMS` inline in `index.html` matches `realms_catalog.json` 1:1.

### Tier 2: Visual Scene Inspection & 3D Spatial Contracts (`tests/visual_scene_inspection.test.js`)
- **Absence of Flat 2D Backdrops**: Enforces R2/F4 by confirming total absence of `#panorama-layer`, `#foreground-layer`, and `updatePanoramaTransform()` CSS transform fallbacks.
- **Context-Gated Festive Entities**: Confirms that floating diyas and Sarayu river planes are strictly context-gated (`festiveContext === true && hasWaterBody === true`). Asserts 0 floating diyas on dry, secular, or cosmic realms (Giza pyramids, Kedarnath peak, Orion nebula, Tokyo cyberpunk).
- **3D Spatial Geometry Presence**: Asserts presence of `THREE.SphereGeometry` (radius >= 100) for panoramic skydomes, `THREE.PlaneGeometry` for procedural terrain, and active WebGLRenderer.

### Tier 3: Multimedia, VideoTexture & Audio Synthesis (`tests/multimedia.test.js`)
- **Curated Asset Verification**: Asserts all 14 curated high-resolution photographic textures exist on disk in `public/assets/images` and exceed 50KB.
- **Video Reference & Rendering Loops**: Validates video loop paths and ensures dynamic animation loops (`requestAnimationFrame`) prevent frozen renders.
- **Streaming Server Capabilities**: Asserts `serve.cjs` supports `.mp4`, `.webm`, `.jpg`, `.png`, and CORS headers (`Access-Control-Allow-Origin: *`).
- **Multi-Channel Audio Engine**: Asserts multi-channel sound parameters across all 6 realm categories (bells/drone for Sacred, rushing water for Nature, 432Hz sine for Cosmic) and safe user-gesture auto-resume.

### Tier 4: Dynamic AI Prompt Parsing & Scene Graph Mutation (`tests/prompt_mutation.test.js`)
- **NLP Semantic Extraction**: Tests extraction of environmental parameters from natural language prompts:
  - Lighting / timeOfDay: `sunset`, `dawn`, `midnight`, `noon`
  - Atmosphere / Fog / Weather: `mist`, `rain`, `aurora`
  - Biome / Terrain: `desert`, `glacial`, `cyber`, `sacred_river`, `cosmic`
  - Entities: `diyas`, `devotees`, `lanterns`
- **Adversarial Input Hardening**: Tests empty prompts, whitespace, 10,000-character inputs, and XSS script injection payloads.
- **Camera Navigation Invariant**: Asserts that dynamic prompt-driven scene mutations do NOT reset active camera navigation state (`camera.position`, `camera.quaternion`, or `yaw`/`pitch`/`zoom`).

---

## 3. Test Runner Invocation

The test runner is located at `tests/run_all_tests.cjs`.

### Standard Invocation (All Tiers)
```bash
node tests/run_all_tests.cjs
```

### Run Specific Tier
```bash
node tests/run_all_tests.cjs --tier=1
node tests/run_all_tests.cjs --tier=2
node tests/run_all_tests.cjs --tier=3
node tests/run_all_tests.cjs --tier=4
```

### Stop On First Failure (Bail Mode)
```bash
node tests/run_all_tests.cjs --bail
```

### Standalone Suite Execution
```bash
node tests/realm_routing.test.js
node tests/visual_scene_inspection.test.js
node tests/multimedia.test.js
node tests/prompt_mutation.test.js
```

---

## 4. Coverage Thresholds & Quality Gates

| Metric | Target Threshold | Baseline Status | Required Action |
|--------|------------------|-----------------|-----------------|
| Total Realms Indexed | 110 unique IDs | 110 / 110 (100%) | Maintained |
| Referenced Media Existence | 100% on disk | 100% on disk | Maintained |
| Curated Texture Assets | 14 / 14 (>50KB) | 14 / 14 (>50KB) | Maintained |
| Flat 2D Backdrop Fallbacks | 0 elements | 3 detected | Milestone M2 Migration |
| Secular Realm Floating Diyas | 0 diyas | Unconditional (80) | Milestone M2 Context Gating |
| 3D Skydome Sphere Geometry | Present in scene | Absent in baseline | Milestone M2 Skydome |
| Prompt Camera State Reset | 0 resets | Reset detected | Milestone M5 Hot-Mutator |

---

## 5. Exit Code Standards
- `0`: All executed test cases passed cleanly.
- `1`: One or more test cases failed or encountered an uncaught exception.
