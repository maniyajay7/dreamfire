/**
 * tests/m7_adversarial_stress.test.js
 * 
 * Milestone M7: Free-Roam Navigation Engine Adversarial Stress & Verification Harness
 * Challenger: challenger_m7_1 (Teamwork Empirical Challenger)
 * 
 * Test Dimensions:
 * 1. High-speed movement & boundary clamping at r >= 260m
 * 2. Extreme pitch angles & rotational stability under extreme deltaY (-10,000 to +10,000)
 * 3. Terrain step collision (>1.2m step halts horizontal velocity; <=1.2m step climbs)
 * 4. Jump & gravity kinematic integration with ground landing and cliff descents
 * 5. Performance benchmark and state invariance
 */

import { suite, test, assert, run } from './harness.js';
import {
  TerrainHeightRegistry,
  FreeRoamNavigationEngine
} from '../src/engine/NavigationEngine.js';

// Mock Camera factory with full 3D vector and Euler/Quaternion properties
function createMockCamera(initX = 0, initY = 1.75, initZ = 0) {
  return {
    position: {
      x: initX,
      y: initY,
      z: initZ,
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    },
    rotation: { x: 0, y: 0, z: 0 },
    quaternion: {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
      set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
      }
    },
    lookAt(x, y, z) {
      this._lastLookAt = { x, y, z };
    }
  };
}

// Mock DOM Element for event registration
function createMockDomElement() {
  const listeners = new Map();
  return {
    addEventListener(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    removeEventListener(evt, fn) {
      if (!listeners.has(evt)) return;
      const arr = listeners.get(evt).filter((f) => f !== fn);
      listeners.set(evt, arr);
    },
    requestPointerLock() {
      return Promise.resolve();
    }
  };
}

suite('M7 Adversarial Stress: High-Speed Movement & Boundary Clamping', 'Tier 5', () => {
  const BOUNDARY_RADIUS = 260.0;
  const EPSILON = 1e-4;

  test('ADV-1.1: Static Boundary Clamping at arbitrary radial distances outside cylinder', () => {
    const testPositions = [
      { x: 260.01, z: 0 },
      { x: 300, z: 400 }, // r = 500
      { x: -500, z: -500 }, // r = ~707
      { x: 0, z: 1000 },
      { x: 10000, z: 10000 },
      { x: -260.0001, z: 0 }
    ];

    for (const pos of testPositions) {
      const p = { x: pos.x, y: 5, z: pos.z };
      TerrainHeightRegistry.clampBoundary(p, BOUNDARY_RADIUS);
      const r = Math.hypot(p.x, p.z);
      assert.ok(
        r <= BOUNDARY_RADIUS + EPSILON,
        `Point (${pos.x}, ${pos.z}) clamped to r=${r}, must be <= ${BOUNDARY_RADIUS}`
      );
      assert.ok(
        Math.abs(r - BOUNDARY_RADIUS) < 1e-3,
        `Point (${pos.x}, ${pos.z}) must lie exactly on boundary cylinder surface`
      );
    }
  });

  test('ADV-1.2: Boundary Origin Singularity (0, y, 0) does not produce NaN or division by zero', () => {
    const pos = { x: 0, y: 10, z: 0 };
    TerrainHeightRegistry.clampBoundary(pos, BOUNDARY_RADIUS);
    assert.strictEqual(pos.x, 0, 'x must remain 0');
    assert.strictEqual(pos.z, 0, 'z must remain 0');
    assert.ok(Number.isFinite(pos.x) && !Number.isNaN(pos.x), 'x must be finite and not NaN');
    assert.ok(Number.isFinite(pos.z) && !Number.isNaN(pos.z), 'z must be finite and not NaN');
  });

  test('ADV-1.3: Hypersonic continuous sprint against boundary across 16 radial directions', () => {
    const cam = createMockCamera(0, 5, 0);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      walkSpeed: 8.0,
      sprintSpeed: 120.0, // 5x normal sprint speed stress
      boundaryRadius: BOUNDARY_RADIUS
    });

    const angles = 16;
    for (let i = 0; i < angles; i++) {
      const angle = (i * 2 * Math.PI) / angles;
      // Position camera right at the inner edge (r = 259m)
      const startX = Math.sin(angle) * 259.0;
      const startZ = Math.cos(angle) * 259.0;
      engine.teleport(startX, 5, startZ, -angle, 0);

      // Hold forward + sprint
      engine.keys.add('KeyW');
      engine.keys.add('ShiftLeft');

      // Run 60 frames pushing directly against the boundary
      for (let f = 0; f < 60; f++) {
        engine.update(0.016);
        const curR = Math.hypot(cam.position.x, cam.position.z);
        assert.ok(
          curR <= BOUNDARY_RADIUS + EPSILON,
          `Angle ${(angle * 180 / Math.PI).toFixed(1)}° Frame ${f}: escaped boundary with r=${curR.toFixed(4)}`
        );
      }

      engine.keys.clear();
    }
  });

  test('ADV-1.4: Free-Fly mode extreme boundary escape attempt at 300 m/s', () => {
    const cam = createMockCamera(200, 50, 200);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      flySpeed: 300.0,
      initialMode: 'free_fly',
      boundaryRadius: BOUNDARY_RADIUS
    });

    engine.keys.add('KeyW');
    engine.keys.add('ShiftLeft'); // speed * 2.5 = 750 m/s!

    for (let f = 0; f < 120; f++) {
      engine.update(0.016);
      const curR = Math.hypot(cam.position.x, cam.position.z);
      assert.ok(
        curR <= BOUNDARY_RADIUS + EPSILON,
        `Free-Fly Frame ${f}: escaped boundary at r=${curR.toFixed(4)} (limit: ${BOUNDARY_RADIUS})`
      );
    }
  });
});

suite('M7 Adversarial Stress: Extreme Pitch Angles & Rotational Invariance', 'Tier 5', () => {
  const MAX_PITCH_RAD = (85 * Math.PI) / 180; // ~1.483529864 rad
  const EPSILON = 1e-5;

  test('ADV-2.1: Massive positive deltaY (+10,000) clamps pitch strictly within [-85°, +85°]', () => {
    const cam = createMockCamera();
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom);

    engine.pendingLook.dy = 10000;
    engine.update(0.016);

    assert.ok(
      engine.pitch >= -MAX_PITCH_RAD - EPSILON && engine.pitch <= MAX_PITCH_RAD + EPSILON,
      `Pitch must remain within [-85°, +85°], got: ${(engine.pitch * 180 / Math.PI).toFixed(2)}°`
    );
    assert.strictEqual(
      Math.abs(engine.pitch - (-MAX_PITCH_RAD)) < EPSILON,
      true,
      'Pitch must clamp to exactly -85° under massive downward mouse look'
    );
  });

  test('ADV-2.2: Massive negative deltaY (-10,000) clamps pitch strictly within [-85°, +85°]', () => {
    const cam = createMockCamera();
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom);

    engine.pendingLook.dy = -10000;
    engine.update(0.016);

    assert.ok(
      engine.pitch >= -MAX_PITCH_RAD - EPSILON && engine.pitch <= MAX_PITCH_RAD + EPSILON,
      `Pitch must remain within [-85°, +85°], got: ${(engine.pitch * 180 / Math.PI).toFixed(2)}°`
    );
    assert.strictEqual(
      Math.abs(engine.pitch - MAX_PITCH_RAD) < EPSILON,
      true,
      'Pitch must clamp to exactly +85° under massive upward mouse look'
    );
  });

  test('ADV-2.3: 1,000 Rapid Chaotic Mouse Look Jerks produce zero NaN and maintain bounded pitch', () => {
    const cam = createMockCamera();
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom);

    for (let i = 0; i < 1000; i++) {
      // Stochastic extreme delta spikes
      const dx = (Math.random() - 0.5) * 100000;
      const dy = (Math.random() - 0.5) * 100000;
      engine.pendingLook.dx += dx;
      engine.pendingLook.dy += dy;

      engine.update(0.016);

      assert.ok(
        Number.isFinite(engine.pitch) && !Number.isNaN(engine.pitch),
        `Frame ${i}: pitch produced non-finite or NaN`
      );
      assert.ok(
        Number.isFinite(engine.yaw) && !Number.isNaN(engine.yaw),
        `Frame ${i}: yaw produced non-finite or NaN`
      );
      assert.ok(
        engine.pitch >= -MAX_PITCH_RAD - EPSILON && engine.pitch <= MAX_PITCH_RAD + EPSILON,
        `Frame ${i}: pitch ${(engine.pitch * 180 / Math.PI).toFixed(2)}° out of bounds`
      );

      // Verify camera rotation and quaternion do not corrupt
      assert.ok(
        Number.isFinite(cam.rotation.x) && Number.isFinite(cam.rotation.y),
        `Frame ${i}: camera rotation has non-finite values`
      );
      assert.ok(
        Number.isFinite(cam.quaternion.x) && Number.isFinite(cam.quaternion.w),
        `Frame ${i}: camera quaternion has non-finite values`
      );
    }
  });

  test('ADV-2.4: Gimbal lock immunity at pitch extremes', () => {
    const cam = createMockCamera();
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom);

    // Look straight up at +85 degrees
    engine.pendingLook.dy = -50000;
    engine.update(0.016);
    assert.ok(Math.abs(engine.pitch - MAX_PITCH_RAD) < EPSILON);

    // Full 360 spin while looking at +85 degrees
    for (let step = 0; step < 72; step++) {
      engine.pendingLook.dx = 100;
      engine.update(0.016);
      const q = cam.quaternion;
      const qNorm = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
      assert.ok(
        Math.abs(qNorm - 1.0) < 1e-3,
        `Quaternion magnitude ${qNorm} drifted from unit norm during high-pitch spin`
      );
    }
  });
});

suite('M7 Adversarial Stress: Terrain Step Collision & Cliff Halting', 'Tier 5', () => {
  test('ADV-3.1: Steep cliff step (>1.2m step) halts horizontal velocity completely', () => {
    // In sacred_river, river channel (z < 45) is at y=-2.2m. Riverbank (z >= 45) rises to y=+0.075m.
    // Step from z=44.8 to z=45.5 is Delta y = 2.275m > 1.2m (steep cliff step-up)
    const curZ = 44.8;
    const groundY = TerrainHeightRegistry.getHeight(0, curZ, 'sacred_river'); // -2.2m
    const cam = createMockCamera(0, groundY + 1.75, curZ);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      currentRealm: { id: 'sacred-river-test', environment: { biome: 'sacred_river' } },
      walkSpeed: 8.0,
      maxStepHeight: 1.2
    });

    // Face +Z toward cliff bank (yaw = Math.PI)
    engine.teleport(0, groundY + 1.75, curZ, Math.PI, 0);

    // Attempt to step onto cliff bank
    engine.keys.add('KeyW');
    engine.update(0.1); // at 8 m/s, forward step attempts to reach z > 45.0

    // Assert horizontal velocity halts and position remains behind the cliff
    assert.strictEqual(engine.velocity.x, 0, 'Horizontal velocity.x must halt to 0 upon cliff collision');
    assert.strictEqual(engine.velocity.z, 0, 'Horizontal velocity.z must halt to 0 upon cliff collision');
    assert.strictEqual(cam.position.z, curZ, 'Camera Z position must NOT penetrate or step up the cliff');
  });

  test('ADV-3.2: Walkable gentle slope (<=1.2m step) allows smooth ascent without halting', () => {
    const cam = createMockCamera(50, 9.01 + 1.75, 0);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      currentRealm: { id: 'glacial-test', environment: { biome: 'glacial' } },
      walkSpeed: 8.0,
      maxStepHeight: 1.2
    });

    const hStart = TerrainHeightRegistry.getHeight(50, 0, 'glacial');
    engine.teleport(50, hStart + 1.75, 0, -Math.PI / 2, 0);

    engine.keys.add('KeyW');
    for (let f = 0; f < 10; f++) {
      engine.update(0.016);
    }

    assert.ok(cam.position.x > 50.0, 'Camera must successfully ascend walkable slope in +X direction');
    const groundAfter = TerrainHeightRegistry.getHeight(cam.position.x, cam.position.z, 'glacial');
    assert.ok(
      Math.abs(cam.position.y - (groundAfter + 1.75)) < 0.1,
      'Camera Y must remain anchored to ground + eyeHeight'
    );
  });

  test('ADV-3.3: Terrain step height testing across all 8 biomes', () => {
    const biomes = ['desert', 'glacial', 'jungle', 'temple', 'sacred_river', 'sanctuary', 'cyber', 'cosmic'];
    for (const biome of biomes) {
      const h0 = TerrainHeightRegistry.getHeight(0, 0, biome);
      assert.ok(Number.isFinite(h0), `Biome ${biome} height at (0,0) must be finite number`);

      // Verify isWalkable utility
      assert.strictEqual(TerrainHeightRegistry.isWalkable(0, 0, 0.0, 1.0, 1.2), true);
      assert.strictEqual(TerrainHeightRegistry.isWalkable(0, 0, 0.0, 1.2, 1.2), true);
      assert.strictEqual(TerrainHeightRegistry.isWalkable(0, 0, 0.0, 1.21, 1.2), false);
      assert.strictEqual(TerrainHeightRegistry.isWalkable(0, 0, 0.0, 5.0, 1.2), false);
    }
  });
});

suite('M7 Adversarial Stress: Jump & Gravity Kinematics Integration', 'Tier 5', () => {
  test('ADV-4.1: Parabolic jump lifecycle from flat terrain returns to ground + eyeHeight', () => {
    const cam = createMockCamera(0, 0.4 + 1.75, 0); // temple center groundY = 0.4
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      currentRealm: { id: 'temple-test', environment: { biome: 'temple' } },
      jumpForce: 9.5,
      gravity: -26.0,
      eyeHeight: 1.75
    });

    const groundY = 0.4;
    const eyeY = groundY + 1.75; // 2.15m

    assert.strictEqual(engine.isGrounded, true, 'Initially grounded');
    assert.ok(Math.abs(cam.position.y - eyeY) < 1e-4, 'Initial eye height aligned');

    // Trigger jump
    engine.keys.add('Space');
    engine.update(0.016);
    engine.keys.delete('Space');

    assert.strictEqual(engine.isGrounded, false, 'Engine must become ungrounded during jump ascent');
    assert.ok(cam.position.y > eyeY, 'Camera must ascend above resting eye height');

    let peaked = false;
    let landed = false;
    let maxAltitude = cam.position.y;

    // Simulate jump frames until landing
    for (let f = 0; f < 100; f++) {
      engine.update(0.016);
      if (cam.position.y > maxAltitude) {
        maxAltitude = cam.position.y;
      }
      if (!peaked && engine.velocity.y <= 0) {
        peaked = true;
      }
      if (engine.isGrounded) {
        landed = true;
        break;
      }
    }

    assert.strictEqual(peaked, true, 'Jump must reach peak apex and reverse vertical velocity');
    assert.strictEqual(landed, true, 'Jump must land back on ground within realistic duration (<1.6s)');
    assert.ok(
      Math.abs(cam.position.y - eyeY) < 1e-4,
      `Camera must land exactly at eyeHeight (${eyeY}m), got: ${cam.position.y}`
    );
    assert.strictEqual(engine.velocity.y, 0, 'Vertical velocity must be clamped to 0 upon landing');
    assert.strictEqual(engine.isGrounded, true, 'isGrounded must reset to true upon landing');
  });

  test('ADV-4.2: Mid-air double jump denial', () => {
    const cam = createMockCamera(0, 2.15, 0);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      currentRealm: { id: 'temple-test', environment: { biome: 'temple' } },
      jumpForce: 9.5,
      gravity: -26.0,
      eyeHeight: 1.75
    });

    // Jump 1
    engine.keys.add('Space');
    engine.update(0.016);
    assert.strictEqual(engine.isGrounded, false);

    // Advance 5 frames into mid-air
    for (let f = 0; f < 5; f++) engine.update(0.016);
    const vBeforeSecondSpace = engine.velocity.y;

    // Attempt double jump while airborne
    engine.keys.add('Space');
    engine.update(0.016);
    engine.keys.delete('Space');

    // velocity.y must NOT be reset to 9.5, it must continue decreasing under gravity
    assert.ok(
      engine.velocity.y < vBeforeSecondSpace,
      'Double jump must be rejected: velocity.y must continue natural deceleration under gravity'
    );
  });

  test('ADV-4.3: Free fall off high cliff lands safely without subterranean clipping', () => {
    const cam = createMockCamera(50, 15.0, 50); // Start 15m in the air
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      currentRealm: { id: 'sanctuary-test', environment: { biome: 'sanctuary' } },
      gravity: -26.0,
      eyeHeight: 1.75
    });

    engine.isGrounded = false;
    const targetGround = engine.getGroundHeight(50, 50);
    const targetY = targetGround + 1.75;

    // Run free fall
    let landed = false;
    for (let f = 0; f < 120; f++) {
      engine.update(0.016);
      if (engine.isGrounded) {
        landed = true;
        break;
      }
    }

    assert.strictEqual(landed, true, 'Falling from high altitude must land safely');
    assert.ok(
      Math.abs(cam.position.y - targetY) < 1e-4,
      `Landing must clamp exactly at ${targetY}, got: ${cam.position.y}`
    );
    assert.strictEqual(engine.velocity.y, 0, 'Vertical velocity must be zeroed upon impact');
  });
});

suite('M7 Adversarial Stress: Performance Benchmark & State Invariance', 'Tier 5', () => {
  test('ADV-5.1: TerrainHeightRegistry.getHeight executes 1,000,000 evaluations across biomes with zero allocation', () => {
    const iterations = 1000000;
    const biomes = ['cosmic', 'cyber', 'temple', 'desert', 'sacred_river', 'jungle', 'glacial', 'sanctuary'];

    // Measure per-biome speed
    const timings = {};
    for (const b of biomes) {
      for (let i = 0; i < 20000; i++) TerrainHeightRegistry.getHeight(i * 0.1, i * 0.1, b);
      const t0 = process.hrtime.bigint();
      let sum = 0;
      for (let i = 0; i < 200000; i++) {
        sum += TerrainHeightRegistry.getHeight(i * 0.05, i * 0.03, b);
      }
      const t1 = process.hrtime.bigint();
      timings[b] = Number(t1 - t0) / 200000;
      assert.ok(Number.isFinite(sum));
    }

    // Constant/piecewise biomes (cosmic, cyber, temple) must evaluate in <25ns
    assert.ok(timings.cosmic < 25.0, `Cosmic elevation speed (${timings.cosmic.toFixed(2)}ns) must be <25ns`);
    assert.ok(timings.cyber < 25.0, `Cyber elevation speed (${timings.cyber.toFixed(2)}ns) must be <25ns`);
    assert.ok(timings.temple < 25.0, `Temple elevation speed (${timings.temple.toFixed(2)}ns) must be <25ns`);

    // Transcendental biomes (3-4 sin/cos/pow calls) must evaluate in <75ns (<0.0005% of 16.6ms frame)
    for (const b of ['desert', 'sacred_river', 'jungle', 'glacial', 'sanctuary']) {
      assert.ok(
        timings[b] < 75.0,
        `Biome ${b} speed (${timings[b].toFixed(2)}ns) exceeded 75ns frame budget threshold`
      );
    }

    // Zero-allocation verification across 1M calls
    const memBefore = process.memoryUsage().heapUsed;
    let dummySum = 0;
    for (let i = 0; i < iterations; i++) {
      dummySum += TerrainHeightRegistry.getHeight(i * 0.05, i * 0.03, biomes[i & 7]);
    }
    const memAfter = process.memoryUsage().heapUsed;
    const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);

    console.log(`\n  ⚡ Biome timings: cosmic=${timings.cosmic.toFixed(1)}ns, cyber=${timings.cyber.toFixed(1)}ns, temple=${timings.temple.toFixed(1)}ns, sanctuary=${timings.sanctuary.toFixed(1)}ns, glacial=${timings.glacial.toFixed(1)}ns`);
    console.log(`  ⚡ 1M evaluations heap delta: ${memDeltaMB.toFixed(2)} MB`);

    assert.ok(memDeltaMB < 2.0, 'Elevation evaluation must produce zero runaway memory allocations');
    assert.ok(Number.isFinite(dummySum));
  });

  test('ADV-5.2: State serialization & roundtrip invariance', () => {
    const cam = createMockCamera(12.34, 5.67, -89.01);
    const dom = createMockDomElement();
    const engine = new FreeRoamNavigationEngine(cam, dom, {
      initialMode: 'free_fly',
      yaw: 1.23,
      pitch: -0.45
    });

    const state = engine.getState();
    assert.strictEqual(state.mode, 'free_fly');
    assert.strictEqual(state.position.x, 12.34);
    assert.strictEqual(state.position.y, 5.67);
    assert.strictEqual(state.position.z, -89.01);
    assert.strictEqual(state.yaw, 1.23);
    assert.strictEqual(state.pitch, -0.45);

    // Modify engine
    engine.teleport(0, 0, 0, 0, 0);
    engine.setMode('first_person');

    // Restore
    engine.restoreState(state);
    const restored = engine.getState();
    assert.deepStrictEqual(restored, state, 'Restored state must match original snapshot');
  });

  test('ADV-5.3: Cosmic realm auto-fallback converts first_person to free_fly', () => {
    // Case A: Near zero altitude (abs(y) < 1.0) auto-elevates to (0, 5, 25)
    const camA = createMockCamera(0, 0, 0);
    const domA = createMockDomElement();
    const engineA = new FreeRoamNavigationEngine(camA, domA, {
      initialMode: 'first_person'
    });
    // Explicitly place near zero void altitude
    camA.position.y = 0.5;

    engineA.onRealmChanged({ id: 'orion-nebula', environment: { biome: 'cosmic' } });
    assert.strictEqual(engineA.getMode(), 'free_fly', 'Mode must switch to free_fly');
    assert.strictEqual(camA.position.y, 5.0, 'Low-altitude camera must elevate to y=5');
    assert.strictEqual(camA.position.z, 25.0, 'Low-altitude camera must position at z=25');

    // Case B: High altitude camera in free_fly preserves user position
    const camB = createMockCamera(10, 25, -10);
    const domB = createMockDomElement();
    const engineB = new FreeRoamNavigationEngine(camB, domB, {
      initialMode: 'free_fly'
    });

    engineB.onRealmChanged({ id: 'orion-nebula', environment: { biome: 'cosmic' } });
    assert.strictEqual(engineB.getMode(), 'free_fly', 'Mode must remain free_fly');
    assert.strictEqual(camB.position.y, 25.0, 'High-altitude camera preserves position');
  });
});

// Self-run capability
if (process.argv[1] && process.argv[1].endsWith('m7_adversarial_stress.test.js')) {
  run().then((res) => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  });
}
