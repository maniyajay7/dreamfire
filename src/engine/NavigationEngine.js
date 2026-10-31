/**
 * NavigationEngine.js — Universal Free-Roam Navigation Engine for DreamFire
 * Milestone M7: Free-Roam Navigation Engine & Tri-Modal Touring Controls
 * 
 * Features:
 * - Feature F18: Tri-Modal Exploration Engine ('first_person', 'free_fly', 'orbit')
 *   with WASD, Arrow keys, Shift sprint boost, Space jump/ascend, C/Q descend,
 *   Pointer Lock API mouse look with pitch clamped to [-85°, +85°].
 * - Feature F19: Analytic O(1) Terrain Elevation Evaluation (<25ns per frame),
 *   step-up collision (maxStepHeight = 1.2m), and soft cylinder boundary clamping (r <= 260m).
 * - State Invariance & Portal Persistence: Active user camera state remains stable and
 *   decoupled during prompt mutations, and smoothly grounds onto new terrain during realm warps.
 */

import * as THREE_MODULE from 'three';

const THREE = typeof window !== 'undefined' && window.THREE ? window.THREE : THREE_MODULE;

/**
 * TerrainHeightRegistry
 * Zero-allocation, analytic O(1) elevation evaluation across all 8 canonical biomes.
 */
export class TerrainHeightRegistry {
  /**
   * Evaluates terrain elevation analytically at any world coordinate (x, z).
   * Execution time is guaranteed O(1) in <25ns with zero allocations.
   * 
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @param {string} biome - Canonical biome identifier
   * @param {string} preset - Optional terrain preset string
   * @returns {number} Analytic terrain height in meters
   */
  static getHeight(x, z, biome = 'sanctuary', preset = '') {
    switch (biome) {
      case 'cosmic':
        return 0.0;

      case 'cyber':
        return -0.92;

      case 'temple': {
        const ax = x < 0 ? -x : x;
        const az = z < 0 ? -z : z;
        const dist = ax > az ? ax : az;
        if (dist < 40) return 0.4;
        if (dist < 75) return 0.0;
        return -0.6;
      }

      case 'desert': {
        if (preset && preset.includes('salt')) {
          return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.4 - 0.5;
        }
        const d1 = Math.sin(x * 0.035 + z * 0.015) * 4.5;
        const d2 = Math.cos(x * 0.018 - z * 0.032) * 3.8;
        const d3 = Math.sin((x + z) * 0.075) * 0.9;
        return d1 + d2 + d3 - 1.8;
      }

      case 'sacred_river': {
        if (z <= 16) {
          if (z < 0 && (x < 0 ? -x : x) < 22) return 1.0;
          return 0.5;
        }
        if (z > 16 && z <= 28) {
          const stepRatio = (z - 16) / 12;
          return 0.5 - stepRatio * 0.45;
        }
        return 0.05 + Math.sin(x * 0.04) * 0.1;
      }

      case 'jungle': {
        const r1 = Math.sin(x * 0.038) * Math.cos(z * 0.038) * 8.0;
        const r2 = Math.sin(x * 0.072 + 0.5) * 3.4;
        const r3 = Math.cos(z * 0.065 - 0.3) * 2.6;
        return r1 + r2 + r3 - 2.8;
      }

      case 'glacial': {
        const distFromCenter = Math.sqrt(x * x + z * z);
        const valleyTaper = distFromCenter < 75 ? Math.pow(distFromCenter / 75, 1.8) : 1.0;
        const s1 = Math.sin(x * 0.026) * Math.cos(z * 0.026);
        const p1 = (s1 < 0 ? -s1 : s1) * 24;
        const p2 = Math.sin(x * 0.062 + 1.2) * Math.cos(z * 0.062 - 0.8) * 7.5;
        const s3 = Math.sin((x - z) * 0.045);
        const p3 = (s3 < 0 ? -s3 : s3) * 9;
        return (p1 + p2 + p3) * valleyTaper - 3.2;
      }

      default: {
        const h1 = Math.sin(x * 0.026) * 4.2;
        const h2 = Math.cos(z * 0.024) * 3.6;
        const h3 = Math.sin((x + z) * 0.055) * 1.5;
        return h1 + h2 + h3 - 2.0;
      }
    }
  }

  /**
   * Tests if horizontal step can be climbed without exceeding maxStepHeight.
   */
  static isWalkable(x, z, currentY, targetY, maxStepHeight = 1.2) {
    return (targetY - currentY) <= maxStepHeight;
  }

  /**
   * Clamps world position to soft cylinder boundary radius.
   */
  static clampBoundary(position, maxRadius = 260) {
    if (!position) return;
    const distSq = position.x * position.x + position.z * position.z;
    if (distSq > maxRadius * maxRadius) {
      const dist = Math.sqrt(distSq);
      position.x = (position.x / dist) * maxRadius;
      position.z = (position.z / dist) * maxRadius;
    }
  }
}

/**
 * FreeRoamNavigationEngine
 * Tri-modal navigation engine implementing Interface Contract 1.
 */
export class FreeRoamNavigationEngine {
  /**
   * @param {THREE.Camera} camera - Three.js active camera
   * @param {HTMLElement} domElement - Canvas DOM element for pointer lock / events
   * @param {object} options - Configuration overrides
   */
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.T = options.THREE || THREE;

    this.mode = options.initialMode || 'first_person'; // 'first_person' | 'free_fly' | 'orbit'
    this.orbitControls = options.orbitControls || null;

    // Kinematic settings
    this.walkSpeed = typeof options.walkSpeed === 'number' ? options.walkSpeed : 8.0;       // 8 m/s
    this.sprintSpeed = typeof options.sprintSpeed === 'number' ? options.sprintSpeed : 24.0; // 24 m/s
    this.flySpeed = typeof options.flySpeed === 'number' ? options.flySpeed : 45.0;          // 45 m/s
    this.jumpForce = typeof options.jumpForce === 'number' ? options.jumpForce : 9.5;        // 9.5 m/s
    this.gravity = typeof options.gravity === 'number' ? options.gravity : -26.0;            // -26 m/s²
    this.eyeHeight = typeof options.eyeHeight === 'number' ? options.eyeHeight : 1.75;       // 1.75m
    this.maxStepHeight = typeof options.maxStepHeight === 'number' ? options.maxStepHeight : 1.2; // 1.2m
    this.boundaryRadius = typeof options.boundaryRadius === 'number' ? options.boundaryRadius : 260.0; // 260m
    this.mouseSensitivity = typeof options.mouseSensitivity === 'number' ? options.mouseSensitivity : 0.0022;

    // Pitch bounds: [-85°, +85°]
    this.maxPitch = (85 * Math.PI) / 180; // ~1.48353 rad

    // State variables
    this.velocity = { x: 0, y: 0, z: 0 };
    this.yaw = typeof options.yaw === 'number' ? options.yaw : 0;
    this.pitch = typeof options.pitch === 'number' ? options.pitch : 0;
    this.isGrounded = true;
    this.isPointerLocked = false;
    this.currentRealm = options.currentRealm || null;

    // Input state
    this.keys = new Set();
    this.touchAxes = { moveX: 0, moveZ: 0, sprint: false, jump: false };
    this.pendingLook = { dx: 0, dy: 0 };
    this.isMouseDown = false;
    this.prevClientX = 0;
    this.prevClientY = 0;

    // Initial ground adjustment if in first_person
    if (this.camera && this.mode === 'first_person') {
      const groundY = this.getGroundHeight(this.camera.position.x, this.camera.position.z);
      this.camera.position.y = groundY + this.eyeHeight;
      this.isGrounded = true;
    }

    this.initEventListeners();
  }

  /**
   * Initializes DOM input event listeners for keyboard, mouse look, pointer lock, and touch.
   */
  initEventListeners() {
    if (typeof window === 'undefined') return;

    this._onKeyDown = (e) => {
      // Disregard keyboard events when user types in inputs/textareas
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        return;
      }
      this.keys.add(e.code);
      if (e.key) this.keys.add(e.key.toLowerCase());

      if (e.code === 'KeyV') {
        this.toggleMode();
      }
    };

    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
      if (e.key) this.keys.delete(e.key.toLowerCase());
    };

    this._onMouseDown = (e) => {
      if (this.domElement && e.target === this.domElement) {
        this.isMouseDown = true;
        this.prevClientX = e.clientX;
        this.prevClientY = e.clientY;
        if ((this.mode === 'first_person' || this.mode === 'free_fly') && !this.isPointerLocked) {
          this.requestPointerLock();
        }
      }
    };

    this._onMouseUp = () => {
      this.isMouseDown = false;
    };

    this._onMouseMove = (e) => {
      if (this.mode === 'orbit') return;
      if (this.isPointerLocked) {
        this.pendingLook.dx += (e.movementX || 0);
        this.pendingLook.dy += (e.movementY || 0);
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.prevClientX;
        const dy = e.clientY - this.prevClientY;
        this.pendingLook.dx += dx;
        this.pendingLook.dy += dy;
        this.prevClientX = e.clientX;
        this.prevClientY = e.clientY;
      }
    };

    this._onPointerLockChange = () => {
      const wasLocked = this.isPointerLocked;
      this.isPointerLocked = (typeof document !== 'undefined' && document.pointerLockElement === this.domElement);
      if (wasLocked !== this.isPointerLocked && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dreamfire:pointerlock-change', {
          detail: { isLocked: this.isPointerLocked }
        }));
      }
    };

    // Touch support
    let touchStartX = 0;
    let touchStartY = 0;
    this._onTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    this._onTouchMove = (e) => {
      if ((this.mode === 'first_person' || this.mode === 'free_fly') && e.touches && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        this.pendingLook.dx += dx;
        this.pendingLook.dy += dy;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);

    if (typeof document !== 'undefined') {
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
    }

    if (this.domElement && typeof this.domElement.addEventListener === 'function') {
      this.domElement.addEventListener('mousedown', this._onMouseDown);
      this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: true });
      this.domElement.addEventListener('touchmove', this._onTouchMove, { passive: true });
    }
  }

  /**
   * Requests pointer lock on the canvas element.
   */
  requestPointerLock() {
    if (this.domElement && typeof this.domElement.requestPointerLock === 'function') {
      try {
        const p = this.domElement.requestPointerLock();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {}); // Suppress user gesture security errors
        }
      } catch (err) {
        // Suppress browser gesture restrictions
      }
    }
  }

  /**
   * Releases active pointer lock.
   */
  exitPointerLock() {
    if (typeof document !== 'undefined' && typeof document.exitPointerLock === 'function') {
      try {
        document.exitPointerLock();
      } catch (err) {}
    }
    this.isPointerLocked = false;
  }

  /**
   * Sets navigation mode: 'first_person' | 'free_fly' | 'orbit'.
   */
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;

    if (this.mode === 'orbit') {
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
        if (this.camera) {
          const cosPitch = Math.cos(this.pitch);
          const fwdDist = 20;
          const targetX = this.camera.position.x - Math.sin(this.yaw) * cosPitch * fwdDist;
          const targetY = this.camera.position.y + Math.sin(this.pitch) * fwdDist;
          const targetZ = this.camera.position.z - Math.cos(this.yaw) * cosPitch * fwdDist;
          if (this.orbitControls.target && typeof this.orbitControls.target.set === 'function') {
            this.orbitControls.target.set(targetX, targetY, targetZ);
          }
          if (typeof this.orbitControls.update === 'function') {
            this.orbitControls.update();
          }
        }
      }
      this.exitPointerLock();
    } else {
      if (this.orbitControls) {
        this.orbitControls.enabled = false;
      }
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.z = 0;

      if (this.mode === 'first_person' && this.camera) {
        const groundY = this.getGroundHeight(this.camera.position.x, this.camera.position.z);
        this.camera.position.y = groundY + this.eyeHeight;
        this.isGrounded = true;
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dreamfire:navigation-mode-changed', {
        detail: { mode: this.mode }
      }));
    }
  }

  /**
   * Returns current active navigation mode.
   */
  getMode() {
    return this.mode;
  }

  /**
   * Cycles through navigation modes: first_person -> free_fly -> orbit -> first_person.
   */
  toggleMode() {
    const next = this.mode === 'first_person' ? 'free_fly' : (this.mode === 'free_fly' ? 'orbit' : 'first_person');
    this.setMode(next);
  }

  /**
   * Teleports player camera to world coordinate with optional orientation.
   */
  teleport(x, y, z, yaw, pitch) {
    if (this.camera && this.camera.position) {
      if (typeof this.camera.position.set === 'function') {
        this.camera.position.set(x, y, z);
      } else {
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
      }
    }
    if (typeof yaw === 'number') this.yaw = yaw;
    if (typeof pitch === 'number') this.pitch = pitch;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.z = 0;
  }

  /**
   * Queries terrain height for active realm at world coordinates (x, z).
   */
  getGroundHeight(x, z) {
    const env = (this.currentRealm && this.currentRealm.environment) || {};
    const biome = env.biome || 'sanctuary';
    const preset = env.terrainPreset || '';
    return TerrainHeightRegistry.getHeight(x, z, biome, preset);
  }

  /**
   * Realm change hook: preserves exploration mode & orientation, grounds smoothly onto new terrain.
   */
  onRealmChanged(realmData) {
    this.currentRealm = realmData;
    const env = (realmData && realmData.environment) || {};
    const biome = env.biome || 'sanctuary';

    if (realmData && (realmData.id === 'ayodhya-ram-mandir' || (realmData.tags && realmData.tags.includes('ram')))) {
      this.teleport(0, 2.3, 16, 0, 0.05);
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.z = 0;
      this.isGrounded = true;
      return;
    }

    if (biome === 'cosmic') {
      if (this.mode === 'first_person') {
        this.setMode('free_fly');
      }
      this.teleport(0, 5, 25, 0, 0);
      return;
    }

    const groundY = this.getGroundHeight(this.camera ? this.camera.position.x : 0, this.camera ? this.camera.position.z : 16);
    const startY = Math.max(1.8, groundY + this.eyeHeight);
    if (this.camera && this.camera.position) {
      if (this.camera.position.y < startY) {
        this.camera.position.y = startY;
      }
    }
    this.velocity.y = 0;
    this.isGrounded = true;
  }

  /**
   * Frame tick called in the requestAnimationFrame loop.
   */
  update(delta) {
    if (this.mode === 'orbit') {
      if (this.orbitControls && typeof this.orbitControls.update === 'function') {
        this.orbitControls.update();
      }
      return;
    }

    const dt = Math.min(Math.max(delta || 0.016, 0.001), 0.1);

    // 1. Process Look Rotation
    if (this.pendingLook.dx !== 0 || this.pendingLook.dy !== 0) {
      this.yaw -= this.pendingLook.dx * this.mouseSensitivity;
      this.pitch -= this.pendingLook.dy * this.mouseSensitivity;
      this.pendingLook.dx = 0;
      this.pendingLook.dy = 0;
    }

    // Clamp pitch to [-85°, +85°] to eliminate polar singularity gimbal flips
    this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));

    // Apply look rotation to camera
    const cosPitch = Math.cos(this.pitch);
    const lookDir = {
      x: -Math.sin(this.yaw) * cosPitch,
      y: Math.sin(this.pitch),
      z: -Math.cos(this.yaw) * cosPitch
    };

    if (this.camera) {
      if (typeof this.camera.lookAt === 'function') {
        this.camera.lookAt(
          this.camera.position.x + lookDir.x,
          this.camera.position.y + lookDir.y,
          this.camera.position.z + lookDir.z
        );
      }
      if (this.camera.rotation) {
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.z = 0;
      }
      if (this.camera.quaternion && typeof this.camera.quaternion.set === 'function') {
        const halfYaw = this.yaw * 0.5;
        const halfPitch = this.pitch * 0.5;
        const cy = Math.cos(halfYaw);
        const sy = Math.sin(halfYaw);
        const cp = Math.cos(halfPitch);
        const sp = Math.sin(halfPitch);
        this.camera.quaternion.set(sp * cy, cp * sy, -sp * sy, cp * cy);
      }
    }

    // 2. Poll Input & Compute Movement Vector
    let inputForward = 0;
    let inputRight = 0;
    let inputUp = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('w')) inputForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.keys.has('s')) inputForward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('d')) inputRight += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('a')) inputRight -= 1;
    if (this.keys.has('Space') || this.keys.has('KeyE') || this.keys.has('e') || this.keys.has(' ')) inputUp += 1;
    if (this.keys.has('KeyC') || this.keys.has('KeyQ') || this.keys.has('c') || this.keys.has('q') || this.keys.has('ControlLeft') || this.keys.has('ControlRight')) inputUp -= 1;

    // Merge touch axes
    if (this.touchAxes) {
      inputForward += this.touchAxes.moveZ || 0;
      inputRight += this.touchAxes.moveX || 0;
      if (this.touchAxes.jump) inputUp += 1;
    }

    const isSprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('shift') || (this.touchAxes && this.touchAxes.sprint);
    const speed = this.mode === 'free_fly'
      ? (isSprinting ? this.flySpeed * 2.5 : this.flySpeed)
      : (isSprinting ? this.sprintSpeed : this.walkSpeed);

    // Normalize horizontal heading
    const inputLen = Math.hypot(inputForward, inputRight);
    let moveDirX = 0;
    let moveDirZ = 0;
    if (inputLen > 0.001) {
      const normF = inputForward / inputLen;
      const normR = inputRight / inputLen;

      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);

      moveDirX = forwardX * normF + rightX * normR;
      moveDirZ = forwardZ * normF + rightZ * normR;
    }

    // Exponential velocity smoothing (framerate-independent damping)
    const targetVx = moveDirX * speed;
    const targetVz = moveDirZ * speed;
    const smoothFactor = 1.0 - Math.exp(-15.0 * dt);

    this.velocity.x += (targetVx - this.velocity.x) * smoothFactor;
    this.velocity.z += (targetVz - this.velocity.z) * smoothFactor;

    // 3. Mode Kinematics (Grounded vs 6-DOF Free-Fly)
    const env = (this.currentRealm && this.currentRealm.environment) || {};
    const biome = env.biome || 'sanctuary';
    const preset = env.terrainPreset || '';

    if (this.mode === 'first_person') {
      // Jump
      if (inputUp > 0 && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }

      // Gravity integration
      this.velocity.y += this.gravity * dt;

      // Tentative next position
      const curX = this.camera ? this.camera.position.x : 0;
      const curY = this.camera ? this.camera.position.y : 0;
      const curZ = this.camera ? this.camera.position.z : 0;

      const nextX = curX + this.velocity.x * dt;
      const nextZ = curZ + this.velocity.z * dt;
      const nextY = curY + this.velocity.y * dt;

      // Ground height evaluations
      const currentGroundY = TerrainHeightRegistry.getHeight(curX, curZ, biome, preset);
      const groundY = TerrainHeightRegistry.getHeight(nextX, nextZ, biome, preset);
      const targetEyeY = groundY + this.eyeHeight;

      // Step-up collision: halt horizontal movement if step exceeds maxStepHeight (1.2m)
      if (groundY - currentGroundY > this.maxStepHeight) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      } else if (this.camera) {
        this.camera.position.x = nextX;
        this.camera.position.z = nextZ;
      }

      // Ground landing & vertical integration
      if (nextY <= targetEyeY) {
        if (this.camera) this.camera.position.y = targetEyeY;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        if (this.camera) this.camera.position.y = nextY;
        this.isGrounded = false;
      }
    } else if (this.mode === 'free_fly') {
      // 6-DOF unconstrained movement
      const targetVy = inputUp * speed;
      this.velocity.y += (targetVy - this.velocity.y) * smoothFactor;

      if (this.camera) {
        this.camera.position.x += this.velocity.x * dt;
        this.camera.position.y += this.velocity.y * dt;
        this.camera.position.z += this.velocity.z * dt;
      }
      this.isGrounded = false;
    }

    // 4. Soft Cylinder Boundary Clamping at r <= 260m
    if (this.camera && this.camera.position) {
      TerrainHeightRegistry.clampBoundary(this.camera.position, this.boundaryRadius);
    }
  }

  /**
   * Serializes current navigation state for test assertions and invariance checks.
   */
  getState() {
    return {
      mode: this.mode,
      position: {
        x: this.camera ? this.camera.position.x : 0,
        y: this.camera ? this.camera.position.y : 0,
        z: this.camera ? this.camera.position.z : 0
      },
      yaw: this.yaw,
      pitch: this.pitch,
      isPointerLocked: Boolean(this.isPointerLocked),
      isGrounded: Boolean(this.isGrounded)
    };
  }

  /**
   * Restores navigation state from serialized snapshot.
   */
  restoreState(state) {
    if (!state) return;
    if (state.mode) this.setMode(state.mode);
    if (state.position && this.camera && this.camera.position) {
      if (typeof this.camera.position.set === 'function') {
        this.camera.position.set(state.position.x, state.position.y, state.position.z);
      } else {
        this.camera.position.x = state.position.x;
        this.camera.position.y = state.position.y;
        this.camera.position.z = state.position.z;
      }
    }
    if (typeof state.yaw === 'number') this.yaw = state.yaw;
    if (typeof state.pitch === 'number') this.pitch = state.pitch;
    if (typeof state.isGrounded === 'boolean') this.isGrounded = state.isGrounded;
    if (typeof state.isPointerLocked === 'boolean') this.isPointerLocked = state.isPointerLocked;
  }

  /**
   * Unbinds event listeners and cleans up resources.
   */
  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      window.removeEventListener('mouseup', this._onMouseUp);
      window.removeEventListener('mousemove', this._onMouseMove);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    }
    if (this.domElement && typeof this.domElement.removeEventListener === 'function') {
      this.domElement.removeEventListener('mousedown', this._onMouseDown);
      this.domElement.removeEventListener('touchstart', this._onTouchStart);
      this.domElement.removeEventListener('touchmove', this._onTouchMove);
    }
    this.exitPointerLock();
  }
}

if (typeof window !== 'undefined') {
  window.TerrainHeightRegistry = TerrainHeightRegistry;
  window.FreeRoamNavigationEngine = FreeRoamNavigationEngine;
}

export default {
  TerrainHeightRegistry,
  FreeRoamNavigationEngine
};
