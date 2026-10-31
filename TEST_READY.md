# TEST_READY: DreamFire Automated Test Suite

## 1. Test Runner Command

Execute the complete automated test suite with the zero-dependency test runner:

```bash
node tests/run_all_tests.cjs
```

### Selective Tier Execution
```bash
node tests/run_all_tests.cjs --tier=1    # Run Tier 1 only
node tests/run_all_tests.cjs --tier=2    # Run Tier 2 only
node tests/run_all_tests.cjs --tier=3    # Run Tier 3 only
node tests/run_all_tests.cjs --tier=4    # Run Tier 4 only
node tests/run_all_tests.cjs --bail      # Abort on first test failure
```

---

## 2. Test Suite Architecture & Tier Breakdown

| Tier | Test Suite File | Scope | Target Milestones |
|------|-----------------|-------|-------------------|
| **Tier 1** | `tests/realm_routing.test.js` | 110-Realm Catalog, Unique IDs, Schema Completeness, Disk Asset Existence, Category Distribution & Search Routing | M1, Survey |
| **Tier 2** | `tests/visual_scene_inspection.test.js` | Elimination of Flat 2D Backdrops, Contextual Gating of Festive Diyas (0 on Giza/Kedarnath/Orion/Tokyo), 3D Geometry Presence | M2, Survey |
| **Tier 3** | `tests/multimedia.test.js` | 14 Curated High-Res Photo Assets, Video References & Dynamic Rendering Loops, Server MIME/CORS, Multi-Channel Audio Synthesis | M4, Survey |
| **Tier 4** | `tests/prompt_mutation.test.js` | Natural-Language Semantic Prompt Parsing, Adversarial Input Hardening, Scene Graph Hot-Mutation Invariant (No Camera Reset) | M5, Survey |

---

## 3. Comprehensive Test Case Checklist

### Tier 1: Realm Catalog Indexing & Routing (`tests/realm_routing.test.js`)
- [x] **T1.1**: Catalog file exists and parses as a valid JSON array
- [x] **T1.2**: Catalog contains all 110 realms with unique kebab-case IDs
- [x] **T1.3**: Every realm satisfies mandatory schema contract (`title`, `category`, `tagline`, `description`, `soundscape`, `tags`, `soulsVisiting`, `resonance`)
- [x] **T1.4**: All referenced image and media assets physically exist on disk in `Z:\dreamfire`
- [x] **T1.5**: Category coverage ensures robust distribution across all 6 canonical categories
- [x] **T1.6**: Search querying matches realms accurately by title, tags, and keywords
- [x] **T1.7**: Inline database in `index.html` is synchronized with `realms_catalog.json`

### Tier 2: Visual Scene Inspection & 3D Spatial Contracts (`tests/visual_scene_inspection.test.js`)
- [x] **T2.1**: Load project files for visual scene inspection
- [ ] **T2.2**: Confirms ABSENCE of flat 2D image backdrop fallbacks (`#panorama-layer` and CSS transforms) *(Failing in baseline - to be resolved in M2)*
- [ ] **T2.3**: Confirms festive diya assets are strictly context-gated (0 diyas on secular/dry/cosmic realms) *(Failing in baseline - to be resolved in M2)*
- [ ] **T2.4**: Asserts 3D spatial geometry presence (Skydome sphere and procedural terrain) *(Failing in baseline - to be resolved in M2)*

### Tier 3: Multimedia, VideoTexture & Audio Synthesis (`tests/multimedia.test.js`)
- [x] **T3.1**: All 14 curated high-resolution photographic assets exist on disk with valid file sizes (>50KB)
- [x] **T3.2**: Video assets or dynamic animated loop textures are properly referenced without 404s or frozen rendering loops
- [x] **T3.3**: Static development server (`serve.cjs`) supports video/image MIME streaming and WebGL CORS
- [x] **T3.4**: Multi-channel ambient audio synthesis parameters are configured across realm categories

### Tier 4: Dynamic AI Prompt Parsing & Scene Graph Mutation (`tests/prompt_mutation.test.js`)
- [x] **T4.1**: Inspect PromptMutator engine module or inline prompt parser availability
- [x] **T4.2**: Natural-language prompt semantic parser extracts lighting, fog, biome, and entities
- [x] **T4.3**: Adversarial prompt robustness: empty input, script injection, and extreme size
- [ ] **T4.4**: Asserts active 3D scene graph state mutation without camera position/quaternion reset *(Failing in baseline - to be resolved in M5)*

---

## 4. Baseline Execution Status (Before Milestones M1-M5)

```
======================================================================
  🔥 DREAMFIRE: UNIVERSAL DIMENSIONAL REALITY TEST RUNNER (DIWALI 2026)
======================================================================
Node: v24.15.0 | Platform: win32 | Tests: 19 | Passed: 15 | Failed: 4

 Tier 1   | Realm Catalog Indexing & Routing               | PASS   (7/7 passed, 223ms)
 Tier 2   | Visual Scene Inspection & 3D Spatial Contracts | FAIL   (1/4 passed, 40ms)
 Tier 3   | Multimedia, VideoTexture & Audio Synthesis     | PASS   (4/4 passed, 82ms)
 Tier 4   | Dynamic AI Prompt Parsing & Scene Graph Mutation | FAIL   (3/4 passed, 36ms)
----------------------------------------------------------------------
 TOTALS   | Tests: 19 | Passed: 15 | Failed: 4 | Skipped: 0 | Duration: 459ms
```

---

## 5. Implementation Defects Discovered (Escalation Checklist for Milestones)

1. **Defect #1 (Milestone M2 / Feature F4)**:
   - **File**: `Z:\dreamfire\index.html` (lines 92–108, 138–145)
   - **Issue**: Flat 2D image backdrop fallback `#panorama-layer` and `#foreground-layer` with `updatePanoramaTransform()` CSS transform logic is still present in the DOM.
   - **Resolution Required**: Replace CSS transform planes with authentic Three.js 3D Equirectangular Spherical Skydomes (`THREE.SphereGeometry`, radius >= 100).

2. **Defect #2 (Milestone M2 / Feature F5)**:
   - **File**: `Z:\dreamfire\index.html` (lines 405–440)
   - **Issue**: `buildPhotographicWorld` unconditionally spawns `sarayuRiverMesh` and 80 floating diyas for every realm, including dry/secular/cosmic realms (`giza-pyramids-orion-alignment`, `kedarnath-himalayan-peak`, `orion-deep-nebula`, `neo-tokyo-shinjuku-crossing`).
   - **Resolution Required**: Implement `ContextualEntityManager` to gate floating diyas strictly to `festiveContext === true && hasWaterBody === true` (0 diyas on secular/dry realms).

3. **Defect #3 (Milestone M2 / Feature F4/F6)**:
   - **File**: `Z:\dreamfire\index.html`
   - **Issue**: 3D scene engine lacks `THREE.SphereGeometry` panoramic skydome mesh and procedural terrain meshes.
   - **Resolution Required**: Instantiate Three.js Skydome sphere and procedural terrain meshes in `src/engine/SceneManager.js` and `index.html`.

4. **Defect #4 (Milestone M5 / Feature F15)**:
   - **File**: `Z:\dreamfire\index.html` (line 373)
   - **Issue**: Scene transitions unconditionally reset navigation orientation (`yaw = 0; pitch = 0; zoomLevel = 1.0;`).
   - **Resolution Required**: Implement `SceneGraphMutator` hot-mutation pipeline to mutate scene parameters (lighting, fog, entities) while preserving active camera orientation and navigation position coordinates.
