/**
 * FlagshipScenes.js — DreamFire Milestone M3: Flagship Showcase 3D Geometry
 * 
 * Features:
 * - F8: Ayodhya Shri Ram Janmabhoomi Mandir 3D Nagara Spire Geometry:
 *   - Grand Jagati Plinth (Adhishthana) with Sopan steps
 *   - 5 Nagara Shikharas: Mula-Shikhara (42m, 10 tiers, Pancharatha), Gudha Mandapa (26m),
 *     Rang Mandapa (22m), and 2 Transept spires (18m)
 *   - Fluted Amalaka cogged discs & gleaming golden Amrit Kalasha pinnacles
 *   - 3 Animated swaying saffron Dhwaja flags with physics-free traveling wave deformation
 *   - 24 Carved hypostyle mandapa pillars framing central nave with lotus capitals & brackets
 *   - Garbhagriha sanctum sanctorum with Lord Ram murti, golden inner glow PointLight, & volumetric aura
 *   - 4 Aarti brass Deepastambhas with flame flicker
 * 
 * - F9: Flagship Devotee Crowd Simulation:
 *   - 352 robed devotees using THREE.InstancedMesh across 3 concentric tiers & prayer rows
 *   - 140 brass aarti plates with flickering flames using THREE.InstancedMesh (2 total draw calls)
 *   - Zero-allocation procedural render loop: harmonic prayer bowing, circular aarti waving, phase offsets
 *   - Authentic Vedic attire: pure white for priests, saffron, marigold amber, kumkum vermilion, royal silks
 * 
 * - F10: Flagship Waterfall Sanctuary:
 *   - 3D Riverbank terrain with carved meandering stream (z in [-55, 10]), rear vertical cliff (y = 44m),
 *     mossy green slopes, and 12 granite boulders
 *   - Vertical waterfall particle cascade (4,500 particles, gravity g = -32 m/s², continuous recycling)
 *   - Plunge impact spray foam (1,600 mist particles) + churning froth disc + 6 concentric ripple rings
 *   - Transparent crystal relaxation float-bed (transmission: 0.93, ior: 1.54, clearcoat: 1.0,
 *     ivory mattress, silk blanket, brass lantern with pointlight, 75 fireflies, sinkable buoyancy)
 * 
 * - Universal Dispatcher:
 *   - attachFlagshipScene & buildFlagshipScene with strict contextual gating
 */

import * as THREE_MODULE from 'three';

const THREE_GLOBAL = typeof window !== 'undefined' && window.THREE ? window.THREE : THREE_MODULE;

/**
 * Robust Three.js class resolver to support both browser Three.js and Node.js mock runtime.
 */
function getThreeHelpers(T) {
  if (T && T.Object3D) {
    if (!T.Object3D.prototype.traverse) {
      T.Object3D.prototype.traverse = function(callback) {
        callback(this);
        const children = this.children;
        if (children && children.length) {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child) {
              if (typeof child.traverse === 'function') {
                child.traverse(callback);
              } else {
                callback(child);
              }
            }
          }
        }
      };
    }
    if (!T.Object3D.prototype.updateMatrix) {
      T.Object3D.prototype.updateMatrix = function() {};
    }
  }

  const BufferGeometry = T.BufferGeometry;
  const BufferAttribute = T.BufferAttribute;
  const Mesh = T.Mesh;
  const Material = T.Material;

  const Vector2 = T.Vector2 || class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) { this.x = x; this.y = y; return this; }
  };

  const TorusGeometry = T.TorusGeometry || class TorusGeometry extends BufferGeometry {
    constructor(radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6, arc = Math.PI * 2) {
      super();
      this.parameters = { radius, tube, radialSegments, tubularSegments, arc };
    }
  };

  const LatheGeometry = T.LatheGeometry || class LatheGeometry extends BufferGeometry {
    constructor(points = [], segments = 10, phiStart = 0, phiLength = Math.PI * 2) {
      super();
      this.parameters = { points, segments, phiStart, phiLength };
      const vertexCount = (points.length || 8) * (segments + 1);
      const positions = new Float32Array(vertexCount * 3);
      this.setAttribute('position', new BufferAttribute(positions, 3));
      this.computeVertexNormals();
    }
  };

  const RingGeometry = T.RingGeometry || class RingGeometry extends BufferGeometry {
    constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 8, phiSegments = 1, thetaStart = 0, thetaLength = Math.PI * 2) {
      super();
      this.parameters = { innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength };
      const positions = new Float32Array((thetaSegments + 1) * 2 * 3);
      this.setAttribute('position', new BufferAttribute(positions, 3));
    }
  };

  const DodecahedronGeometry = T.DodecahedronGeometry || class DodecahedronGeometry extends BufferGeometry {
    constructor(radius = 1, detail = 0) {
      super();
      this.parameters = { radius, detail };
      const positions = new Float32Array(36 * 3);
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * radius * 2;
        positions[i + 1] = (Math.random() - 0.5) * radius * 2;
        positions[i + 2] = (Math.random() - 0.5) * radius * 2;
      }
      this.setAttribute('position', new BufferAttribute(positions, 3));
      this.computeVertexNormals();
    }
  };

  const InstancedMesh = T.InstancedMesh || class InstancedMesh extends Mesh {
    constructor(geometry, material, count = 1) {
      super(geometry, material);
      this.count = count;
      this.instanceMatrix = { array: new Float32Array(count * 16), needsUpdate: false };
      this.instanceColor = { array: new Float32Array(count * 3), needsUpdate: false };
    }
    setMatrixAt(index, matrix) {
      if (matrix && matrix.elements) {
        for (let j = 0; j < 16; j++) {
          this.instanceMatrix.array[index * 16 + j] = matrix.elements[j];
        }
      }
    }
    setColorAt(index, color) {
      if (color) {
        this.instanceColor.array[index * 3] = color.r !== undefined ? color.r : 1;
        this.instanceColor.array[index * 3 + 1] = color.g !== undefined ? color.g : 1;
        this.instanceColor.array[index * 3 + 2] = color.b !== undefined ? color.b : 1;
      }
    }
  };

  const MeshPhysicalMaterial = T.MeshPhysicalMaterial || class MeshPhysicalMaterial extends (T.MeshStandardMaterial || Material) {
    constructor(parameters = {}) {
      super(parameters);
      this.transmission = parameters.transmission !== undefined ? parameters.transmission : 0;
      this.ior = parameters.ior !== undefined ? parameters.ior : 1.5;
      this.thickness = parameters.thickness !== undefined ? parameters.thickness : 0;
      this.clearcoat = parameters.clearcoat !== undefined ? parameters.clearcoat : 0;
      this.clearcoatRoughness = parameters.clearcoatRoughness !== undefined ? parameters.clearcoatRoughness : 0;
    }
  };

  return {
    Vector2,
    TorusGeometry,
    LatheGeometry,
    RingGeometry,
    DodecahedronGeometry,
    InstancedMesh,
    MeshPhysicalMaterial
  };
}

if (THREE_GLOBAL) {
  getThreeHelpers(THREE_GLOBAL);
}

/**
 * Procedural Bansi Paharpur Pink Sandstone Texture Generator
 */
export function createSandstoneTexture(ThreeInstance) {
  const T = ThreeInstance || THREE_GLOBAL;
  if (typeof document === 'undefined') {
    return new T.MeshStandardMaterial({
      color: 0xcc8465,
      roughness: 0.78,
      metalness: 0.08,
      flatShading: true
    });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cc8465';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    const striation = Math.sin(y * 0.08) * 15 + Math.cos(y * 0.22) * 8;
    ctx.fillStyle = `rgba(180, 100, 75, ${Math.abs(striation) / 60})`;
    ctx.fillRect(0, y, 512, 1);
  }

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.15;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 230, 200, ${alpha})` : `rgba(120, 60, 40, ${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = T.RepeatWrapping || 1000;
  texture.wrapT = T.RepeatWrapping || 1000;
  texture.repeat.set(4, 4);

  return new T.MeshStandardMaterial({
    map: texture,
    color: 0xdf9477,
    roughness: 0.74,
    metalness: 0.06
  });
}

/**
 * Procedural Flowing Waterfall Texture Generator
 */
export function createWaterfallFlowTexture(ThreeInstance) {
  const T = ThreeInstance || THREE_GLOBAL;
  if (typeof document === 'undefined') {
    return {
      material: new T.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.08,
        metalness: 0.15,
        transparent: true,
        opacity: 0.88
      }),
      texture: null,
      animator: () => {}
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(512, 1024);
  const data = imgData.data;

  for (let y = 0; y < 1024; y++) {
    const flowY = y * 0.04;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n1 = Math.sin(u * 18.0 + Math.cos(flowY * 0.8)) * 0.5 + 0.5;
      const n2 = Math.sin(u * 36.0 - flowY * 1.6) * 0.5 + 0.5;
      const foam = Math.pow(n1 * 0.6 + n2 * 0.4, 2.2);

      const idx = (y * 512 + x) * 4;
      data[idx] = Math.floor(8 + foam * 240);
      data[idx + 1] = Math.floor(145 + foam * 105);
      data[idx + 2] = Math.floor(178 + foam * 74);
      data[idx + 3] = Math.floor(210 + foam * 45);
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = T.RepeatWrapping || 1000;
  texture.wrapT = T.RepeatWrapping || 1000;

  const material = new T.MeshStandardMaterial({
    map: texture,
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88
  });

  const animator = (time, delta) => {
    texture.offset.y -= (delta || 0.016) * 1.8;
  };

  return { material, texture, animator };
}

// ============================================================================
// FEATURE F8: AYODHYA SHRI RAM MANDIR 3D GEOMETRY
// ============================================================================

/**
 * Creates the fluted Amalaka cogged stone disc crowning a Nagara spire
 */
export function createAmalakaDisc(T, radius = 2.4, height = 1.1, sandstoneMat) {
  const group = new T.Group();
  group.name = 'amalaka_disc';

  // Base cushion disc
  const base = new T.Mesh(new T.CylinderGeometry(radius * 0.90, radius, height * 0.30, 24), sandstoneMat);
  base.position.y = height * 0.15;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Central fluted torus-like body
  const mid = new T.Mesh(new T.CylinderGeometry(radius * 1.08, radius * 1.08, height * 0.45, 24), sandstoneMat);
  mid.position.y = height * 0.52;
  mid.castShadow = true;
  mid.receiveShadow = true;
  group.add(mid);

  // Crowning rim
  const top = new T.Mesh(new T.CylinderGeometry(radius * 0.85, radius * 1.04, height * 0.25, 24), sandstoneMat);
  top.position.y = height * 0.87;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 16 Carved vertical radial flutes (ribs)
  const ribGeo = new T.BoxGeometry(0.22, height * 0.65, radius * 0.24);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const rib = new T.Mesh(ribGeo, sandstoneMat);
    rib.position.set(
      Math.cos(angle) * radius * 1.02,
      height * 0.52,
      Math.sin(angle) * radius * 1.02
    );
    rib.rotation.y = -angle;
    rib.castShadow = true;
    group.add(rib);
  }

  return group;
}

/**
 * Creates the golden Amrit Kalasha urn, collar, and stupi finial needle
 */
export function createGoldenKalasha(T, radius = 1.2, goldMat) {
  const group = new T.Group();
  group.name = 'golden_kalasha';

  // Pedestal base ring
  const base = new T.Mesh(new T.CylinderGeometry(radius * 0.85, radius * 0.75, 0.35, 16), goldMat);
  base.position.y = 0.17;
  base.castShadow = true;
  group.add(base);

  // Bulbous pot (Kumbha)
  const pot = new T.Mesh(new T.SphereGeometry(radius * 0.72, 16, 12), goldMat);
  pot.position.y = 0.75;
  pot.castShadow = true;
  group.add(pot);

  // Neck collar (Griva)
  const collar = new T.Mesh(new T.CylinderGeometry(radius * 0.28, radius * 0.55, 0.45, 16), goldMat);
  collar.position.y = 1.35;
  collar.castShadow = true;
  group.add(collar);

  // Stupi / Finial needle spike
  const stupi = new T.Mesh(new T.ConeGeometry(radius * 0.22, 2.6, 12), goldMat);
  stupi.position.y = 2.75;
  stupi.castShadow = true;
  group.add(stupi);

  return group;
}

/**
 * Creates an animated saffron triangular Dhwaja pennant waving in the wind
 */
export function createAnimatedDhwajaFlag(T, options = {}) {
  const {
    mastHeight = 5.2,
    flagLength = 4.8,
    flagHeight = 2.2,
    flagColor = 0xff6200,
    animators = []
  } = options;

  const group = new T.Group();
  group.name = 'animated_dhwaja_flag';

  // Golden Mast
  const mastMat = new T.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.92,
    roughness: 0.18
  });
  const mast = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, mastHeight, 8), mastMat);
  mast.position.y = mastHeight / 2;
  mast.castShadow = true;
  group.add(mast);

  // Saffron Silk Triangular Pennant
  const flagMat = new T.MeshStandardMaterial({
    color: flagColor,
    emissive: 0x441600,
    roughness: 0.58,
    metalness: 0.08,
    side: T.DoubleSide || 2
  });

  const segX = 18;
  const segY = 6;
  const flagGeo = new T.PlaneGeometry(flagLength, flagHeight, segX, segY);

  const pos = flagGeo.attributes ? flagGeo.attributes.position : null;
  let origPositions = null;

  if (pos) {
    origPositions = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // Shift so mast attachment is at x = 0
      const vx = pos.getX(i) + flagLength / 2;
      const vy = pos.getY(i);
      // Taper height to a fine triangular point at fly tip
      const taper = Math.max(0.04, 1.0 - 0.85 * (vx / flagLength));
      const newVy = vy * taper;

      pos.setX(i, vx);
      pos.setY(i, newVy);

      origPositions[i * 3] = vx;
      origPositions[i * 3 + 1] = newVy;
      origPositions[i * 3 + 2] = pos.getZ(i);
    }
    if (flagGeo.computeVertexNormals) flagGeo.computeVertexNormals();
  }

  const flagMesh = new T.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0, mastHeight - flagHeight * 0.55, 0);
  flagMesh.castShadow = true;
  group.add(flagMesh);

  // Dynamic traveling wave animation loop (zero-allocation)
  if (animators && pos && origPositions) {
    const phaseOffset = Math.random() * Math.PI * 2;
    animators.push((time, delta) => {
      for (let i = 0; i < pos.count; i++) {
        const ox = origPositions[i * 3];
        const oy = origPositions[i * 3 + 1];
        const fraction = Math.max(0, ox / flagLength);
        const envelope = Math.pow(fraction, 1.35); // mast pinned at 0

        // Primary wind traveling wave + secondary harmonic ripple
        const wave1 = Math.sin(time * 4.4 - ox * 1.6 + phaseOffset) * 0.44 * envelope;
        const wave2 = Math.sin(time * 8.8 - ox * 3.4 + phaseOffset) * 0.14 * envelope;
        const vert = Math.cos(time * 3.4 - ox * 1.3 + phaseOffset) * 0.10 * envelope;

        pos.setZ(i, wave1 + wave2);
        pos.setY(i, oy + vert);
      }
      pos.needsUpdate = true;
      if (flagGeo.computeVertexNormals) flagGeo.computeVertexNormals();
    });
  }

  return group;
}

/**
 * Creates a procedural Nagara Shikhara tower (Mula-Shikhara or Mandapa Spire)
 */
export function createNagaraShikharaTower(T, options = {}) {
  const {
    baseWidth = 12.0,
    height = 38.0,
    tiers = 10,
    hasUrushringas = true,
    hasFlag = true,
    flagColor = 0xff6200,
    sandstoneMat,
    goldMat,
    animators = []
  } = options;

  const tower = new T.Group();
  tower.name = 'nagara_shikhara_tower';

  const tierHeight = height / tiers;

  for (let k = 0; k < tiers; k++) {
    const progress = tiers > 1 ? k / (tiers - 1) : 0;
    const y = k * tierHeight;
    // Graceful curvilinear power-law taper
    const w = baseWidth * (1.0 - 0.72 * Math.pow(progress, 1.75));

    // 1. Central Core Body
    const coreH = tierHeight * 0.82;
    const core = new T.Mesh(new T.BoxGeometry(w, coreH, w), sandstoneMat);
    core.position.y = y + coreH / 2;
    core.castShadow = true;
    core.receiveShadow = true;
    tower.add(core);

    // 2. Pancharatha Cardinal Projections (Bhadras)
    const projW = w * 0.54;
    const projH = coreH * 0.95;
    const projD = w * 1.08;

    const projZ = new T.Mesh(new T.BoxGeometry(projW, projH, projD), sandstoneMat);
    projZ.position.y = y + coreH / 2;
    projZ.castShadow = true;
    projZ.receiveShadow = true;
    tower.add(projZ);

    const projX = new T.Mesh(new T.BoxGeometry(projD, projH, projW), sandstoneMat);
    projX.position.y = y + coreH / 2;
    projX.castShadow = true;
    projX.receiveShadow = true;
    tower.add(projX);

    // 3. Horizontal Cornice Moulding (Kapota)
    const corniceH = tierHeight * 0.18;
    const corniceW = w * 1.12;
    const cornice = new T.Mesh(new T.BoxGeometry(corniceW, corniceH, corniceW), sandstoneMat);
    cornice.position.y = y + coreH + corniceH / 2;
    cornice.castShadow = true;
    cornice.receiveShadow = true;
    tower.add(cornice);

    // 4. Subsidiary Corner Urushringas at intermediate tiers (k = 2, 4)
    if (hasUrushringas && (k === 2 || k === 4)) {
      const subW = w * 0.28;
      const subH = tierHeight * 2.2;
      const subOffsets = [
        [-w * 0.48, -w * 0.48],
        [w * 0.48, -w * 0.48],
        [-w * 0.48, w * 0.48],
        [w * 0.48, w * 0.48]
      ];
      subOffsets.forEach(([ox, oz]) => {
        const subSpire = new T.Mesh(new T.ConeGeometry(subW, subH, 4), sandstoneMat);
        subSpire.position.set(ox, y + subH / 2, oz);
        subSpire.rotation.y = Math.PI / 4;
        subSpire.castShadow = true;
        subSpire.receiveShadow = true;
        tower.add(subSpire);
      });
    }
  }

  // Apex Neck (Griva)
  const topW = baseWidth * 0.28;
  const grivaH = 1.0;
  const griva = new T.Mesh(new T.CylinderGeometry(topW * 0.85, topW, grivaH, 16), sandstoneMat);
  griva.position.y = height + grivaH / 2;
  griva.castShadow = true;
  tower.add(griva);

  // Crown Amalaka Disc
  const amalakaR = topW * 1.35;
  const amalakaH = 1.2;
  const amalaka = createAmalakaDisc(T, amalakaR, amalakaH, sandstoneMat);
  amalaka.position.y = height + grivaH;
  tower.add(amalaka);

  // Crowning Golden Kalasha
  const kalasha = createGoldenKalasha(T, amalakaR * 0.42, goldMat);
  kalasha.position.y = height + grivaH + amalakaH;
  tower.add(kalasha);

  // Animated Swaying Saffron Dhwaja Flag
  if (hasFlag) {
    const flag = createAnimatedDhwajaFlag(T, {
      mastHeight: 5.2,
      flagLength: 4.8,
      flagHeight: 2.2,
      flagColor,
      animators
    });
    flag.position.set(0, height + grivaH + amalakaH + 3.4, 0);
    tower.add(flag);
  }

  return tower;
}

/**
 * Creates an ornate carved hypostyle mandapa pillar
 */
export function createCarvedMandapaPillar(T, options = {}) {
  const {
    height = 6.8,
    baseSize = 1.25,
    shaftRadius = 0.42,
    sandstoneMat
  } = options;

  const pillar = new T.Group();
  pillar.name = 'carved_mandapa_pillar';

  // 1. Plinth Base (Upapitha & Kumbha)
  const base1 = new T.Mesh(new T.BoxGeometry(baseSize, 0.5, baseSize), sandstoneMat);
  base1.position.y = 0.25;
  base1.castShadow = true;
  base1.receiveShadow = true;
  pillar.add(base1);

  const base2 = new T.Mesh(new T.BoxGeometry(baseSize * 0.84, 0.35, baseSize * 0.84), sandstoneMat);
  base2.position.y = 0.65;
  base2.castShadow = true;
  base2.receiveShadow = true;
  pillar.add(base2);

  // 2. Octagonal Lower Shaft
  const lowerH = height * 0.38;
  const lowerShaft = new T.Mesh(new T.CylinderGeometry(shaftRadius, shaftRadius * 1.08, lowerH, 8), sandstoneMat);
  lowerShaft.position.y = 0.825 + lowerH / 2;
  lowerShaft.castShadow = true;
  lowerShaft.receiveShadow = true;
  pillar.add(lowerShaft);

  // 3. Decorative Mid-Shaft Ring (Padma-bandha)
  const ringY = 0.825 + lowerH;
  const ring = new T.Mesh(new T.CylinderGeometry(shaftRadius * 1.24, shaftRadius * 1.24, 0.3, 16), sandstoneMat);
  ring.position.y = ringY + 0.15;
  ring.castShadow = true;
  pillar.add(ring);

  // 4. Fluted Upper Shaft (16 facets)
  const upperH = height * 0.42;
  const upperShaft = new T.Mesh(new T.CylinderGeometry(shaftRadius * 0.92, shaftRadius, upperH, 16), sandstoneMat);
  upperShaft.position.y = ringY + 0.3 + upperH / 2;
  upperShaft.castShadow = true;
  upperShaft.receiveShadow = true;
  pillar.add(upperShaft);

  // 5. Flaring Lotus Capital (Potika)
  const capY = ringY + 0.3 + upperH;
  const cap = new T.Mesh(new T.CylinderGeometry(shaftRadius * 1.5, shaftRadius * 0.92, 0.45, 12), sandstoneMat);
  cap.position.y = capY + 0.225;
  cap.castShadow = true;
  pillar.add(cap);

  // 6. 4-Way Cross-Bracket Stone Arms
  const bracketH = 0.35;
  const bracketArmX = new T.Mesh(new T.BoxGeometry(baseSize * 1.15, bracketH, baseSize * 0.38), sandstoneMat);
  bracketArmX.position.y = capY + 0.45 + bracketH / 2;
  bracketArmX.castShadow = true;
  pillar.add(bracketArmX);

  const bracketArmZ = new T.Mesh(new T.BoxGeometry(baseSize * 0.38, bracketH, baseSize * 1.15), sandstoneMat);
  bracketArmZ.position.y = capY + 0.45 + bracketH / 2;
  bracketArmZ.castShadow = true;
  pillar.add(bracketArmZ);

  return pillar;
}

/**
 * Creates the Garbhagriha (Sanctum Sanctorum) with Lord Ram murti & divine inner glow
 */
export function createSanctumSanctorum(T, options = {}) {
  const {
    yPlinth = 1.0,
    sandstoneMat,
    goldMat,
    animators = [],
    realmObjects = []
  } = options;

  const { TorusGeometry } = getThreeHelpers(T);

  const sanctum = new T.Group();
  sanctum.name = 'garbhagriha_sanctum';
  sanctum.position.set(0, yPlinth, -32);

  // 1. Thick Outer Sanctuary Stone Walls (16m wide, 10m high, 14m deep)
  const wallMat = sandstoneMat;
  const wallH = 9.5;

  // Back Wall
  const backWall = new T.Mesh(new T.BoxGeometry(16, wallH, 1.6), wallMat);
  backWall.position.set(0, wallH / 2, -6.2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  sanctum.add(backWall);

  // Side Walls
  const sideWallL = new T.Mesh(new T.BoxGeometry(1.6, wallH, 13), wallMat);
  sideWallL.position.set(-7.2, wallH / 2, -0.5);
  sideWallL.castShadow = true;
  sideWallL.receiveShadow = true;
  sanctum.add(sideWallL);

  const sideWallR = new T.Mesh(new T.BoxGeometry(1.6, wallH, 13), wallMat);
  sideWallR.position.set(7.2, wallH / 2, -0.5);
  sideWallR.castShadow = true;
  sideWallR.receiveShadow = true;
  sanctum.add(sideWallR);

  // Front Wall with Ceremonial Portal (Dwarashakha Doorway)
  const frontWallL = new T.Mesh(new T.BoxGeometry(5.5, wallH, 1.6), wallMat);
  frontWallL.position.set(-5.25, wallH / 2, 5.2);
  frontWallL.castShadow = true;
  frontWallL.receiveShadow = true;
  sanctum.add(frontWallL);

  const frontWallR = new T.Mesh(new T.BoxGeometry(5.5, wallH, 1.6), wallMat);
  frontWallR.position.set(5.25, wallH / 2, 5.2);
  frontWallR.castShadow = true;
  frontWallR.receiveShadow = true;
  sanctum.add(frontWallR);

  const doorLintel = new T.Mesh(new T.BoxGeometry(5.2, 3.2, 1.8), wallMat);
  doorLintel.position.set(0, wallH - 1.6, 5.2);
  doorLintel.castShadow = true;
  doorLintel.receiveShadow = true;
  sanctum.add(doorLintel);

  // Ornate Concentric Door Jambs (Dwarashakha)
  for (let j = 0; j < 3; j++) {
    const jambW = 0.35;
    const jambH = 6.4;
    const jambOffset = 2.45 - j * 0.25;

    const jambL = new T.Mesh(new T.BoxGeometry(jambW, jambH, 0.4), goldMat);
    jambL.position.set(-jambOffset, jambH / 2, 5.4 + j * 0.15);
    sanctum.add(jambL);

    const jambR = new T.Mesh(new T.BoxGeometry(jambW, jambH, 0.4), goldMat);
    jambR.position.set(jambOffset, jambH / 2, 5.4 + j * 0.15);
    sanctum.add(jambR);
  }

  // 2. Elevated Altar (Vedi / Asana)
  const altar = new T.Mesh(new T.BoxGeometry(4.2, 1.2, 3.2), goldMat);
  altar.position.set(0, 0.6, -2.5);
  altar.castShadow = true;
  altar.receiveShadow = true;
  sanctum.add(altar);

  // 3. Bhagwan Shri Ram Idol Silhouette (Standing in Tribhanga with Kodanda Bow)
  const ramGroup = new T.Group();
  ramGroup.position.set(0, 1.2, -2.5);

  const murtiMat = new T.MeshStandardMaterial({
    color: 0x111622, // Shyamal stone with gold lustre
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x221505
  });

  // Body & Robes
  const body = new T.Mesh(new T.CylinderGeometry(0.35, 0.52, 2.4, 12), murtiMat);
  body.position.y = 1.2;
  ramGroup.add(body);

  // Crown (Kiritamukuta)
  const head = new T.Mesh(new T.SphereGeometry(0.24, 12, 10), murtiMat);
  head.position.y = 2.55;
  ramGroup.add(head);

  const crown = new T.Mesh(new T.ConeGeometry(0.22, 0.85, 8), goldMat);
  crown.position.y = 3.05;
  ramGroup.add(crown);

  // Kodanda Bow (left arm)
  const bowCurve = new T.Mesh(new TorusGeometry(1.2, 0.05, 8, 24, Math.PI * 0.85), goldMat);
  bowCurve.position.set(-0.65, 1.6, 0.1);
  bowCurve.rotation.z = Math.PI * 0.15;
  ramGroup.add(bowCurve);

  sanctum.add(ramGroup);

  // 4. Divine Golden Inner Glow PointLight
  const innerLight = new T.PointLight(0xffb020, 4.6, 42);
  innerLight.name = 'sanctum_golden_glow_light';
  innerLight.position.set(0, 3.2, -1.5);
  innerLight.castShadow = true;
  sanctum.add(innerLight);
  if (realmObjects) realmObjects.push(innerLight);

  // 5. Pulsating Golden Volumetric Aura Sphere
  const auraGeo = new T.SphereGeometry(2.6, 16, 12);
  const auraMat = new T.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.30,
    blending: T.AdditiveBlending || 2,
    depthWrite: false
  });
  const auraMesh = new T.Mesh(auraGeo, auraMat);
  auraMesh.position.set(0, 2.2, -2.5);
  sanctum.add(auraMesh);

  // Soft sine breathing pulse for divine aura
  if (animators) {
    animators.push((time) => {
      const pulse = 1.0 + 0.07 * Math.sin(time * 2.5);
      if (auraMesh.scale && auraMesh.scale.set) {
        auraMesh.scale.set(pulse, pulse, pulse);
      }
      innerLight.intensity = 4.2 + 0.6 * Math.sin(time * 2.5);
    });
  }

  return sanctum;
}

/**
 * Creates 4 ornate brass Deepastambhas with flickering flame lights
 */
export function createAartiDeepastambhas(T, options = {}) {
  const {
    positions = [
      [-6.5, 1.0, -10.0],
      [6.5, 1.0, -10.0],
      [-5.0, 1.0, 2.0],
      [5.0, 1.0, 2.0]
    ],
    goldMat,
    animators = [],
    realmObjects = []
  } = options;

  const group = new T.Group();
  group.name = 'aarti_deepastambhas';

  const flameMat = new T.MeshBasicMaterial({ color: 0xffaa00 });

  positions.forEach(([x, y, z], idx) => {
    const lamp = new T.Group();
    lamp.position.set(x, y, z);

    // Brass Pillar Stand
    const shaft = new T.Mesh(new T.CylinderGeometry(0.14, 0.22, 2.8, 12), goldMat);
    shaft.position.y = 1.4;
    shaft.castShadow = true;
    lamp.add(shaft);

    // Multi-Tier Brass Oil Trays
    for (let t = 0; t < 3; t++) {
      const trayR = 0.55 - t * 0.12;
      const tray = new T.Mesh(new T.CylinderGeometry(trayR, trayR * 0.8, 0.12, 12), goldMat);
      tray.position.y = 1.8 + t * 0.45;
      lamp.add(tray);
    }

    // Flame Mesh
    const flame = new T.Mesh(new T.ConeGeometry(0.18, 0.55, 8), flameMat);
    flame.position.y = 3.25;
    lamp.add(flame);

    // Warm Flickering PointLight
    const flameLight = new T.PointLight(0xff8800, 2.2, 18);
    flameLight.position.set(0, 3.4, 0);
    lamp.add(flameLight);
    if (realmObjects) realmObjects.push(flameLight);

    if (animators) {
      const seed = idx * 1.7;
      animators.push((time) => {
        flameLight.intensity = 2.0 + 0.35 * Math.sin(time * 15.0 + seed);
        if (flame.scale) flame.scale.y = 1.0 + 0.18 * Math.sin(time * 20.0 + seed);
      });
    }

    group.add(lamp);
  });

  return group;
}

// ============================================================================
// FEATURE F9: FLAGSHIP DEVOTEE CROWD SIMULATION
// ============================================================================

/**
 * Creates procedural 3D silhouette geometry for a robed devotee
 */
export function createDevoteeFigureGeometry(T) {
  const { Vector2, LatheGeometry } = getThreeHelpers(T);
  const points = [];
  points.push(new Vector2(0.01, 0.00));  // Base ground anchor
  points.push(new Vector2(0.38, 0.04));  // Hem of robe
  points.push(new Vector2(0.34, 0.45));  // Lower robe flare
  points.push(new Vector2(0.23, 0.95));  // Tapered waist / sash
  points.push(new Vector2(0.32, 1.38));  // Shoulders and draped shawl
  points.push(new Vector2(0.13, 1.58));  // Neck
  points.push(new Vector2(0.19, 1.74));  // Head center
  points.push(new Vector2(0.01, 1.90));  // Crown of head

  const geo = new LatheGeometry(points, 10);
  if (geo.computeVertexNormals) geo.computeVertexNormals();
  return geo;
}

/**
 * Creates geometry for Aarti brass lamp plate and flickering cone flame
 */
export function createAartiLampGeometry(T) {
  const mergedGeo = new T.BufferGeometry();
  const plateGeo = new T.CylinderGeometry(0.22, 0.16, 0.06, 8);
  const flameGeo = new T.ConeGeometry(0.10, 0.28, 6);

  if (plateGeo.attributes && plateGeo.attributes.position && flameGeo.attributes && flameGeo.attributes.position) {
    const pos1 = plateGeo.attributes.position.array;
    const norm1 = plateGeo.attributes.normal ? plateGeo.attributes.normal.array : new Float32Array(pos1.length);
    const pos2 = flameGeo.attributes.position.array;
    const norm2 = flameGeo.attributes.normal ? flameGeo.attributes.normal.array : new Float32Array(pos2.length);

    const mergedPos = new Float32Array(pos1.length + pos2.length);
    mergedPos.set(pos1, 0);
    mergedPos.set(pos2, pos1.length);

    const mergedNorm = new Float32Array(norm1.length + norm2.length);
    mergedNorm.set(norm1, 0);
    mergedNorm.set(norm2, norm1.length);

    mergedGeo.setAttribute('position', new T.BufferAttribute(mergedPos, 3));
    mergedGeo.setAttribute('normal', new T.BufferAttribute(mergedNorm, 3));
  } else {
    const mergedPos = new Float32Array(48 * 3);
    mergedGeo.setAttribute('position', new T.BufferAttribute(mergedPos, 3));
  }

  if (plateGeo.dispose) plateGeo.dispose();
  if (flameGeo.dispose) flameGeo.dispose();
  return mergedGeo;
}

/**
 * Feature F9: Flagship Devotee Crowd Simulation
 * 
 * Instantiates exactly 352 animated 3D devotees arranged in 3 concentric tiers and prayer rows
 * around the courtyard plinth, with 140 brass aarti plates and zero-allocation procedural render loop.
 */
export function createDevoteeCrowdSimulation(ThreeInstance, arg2, arg3, arg4) {
  const T = ThreeInstance || THREE_GLOBAL;
  const { InstancedMesh } = getThreeHelpers(T);

  // Flexible argument handling:
  // (T, scene, realmObjects, animators) OR (T, realmData, animators) OR (T, scene, realmData, realmObjects, animators)
  let scene = null;
  let realmObjects = null;
  let animators = null;

  if (arg2 && typeof arg2.add === 'function') {
    scene = arg2;
    if (arg3 && (arg3.id || arg3.environment)) {
      realmObjects = Array.isArray(arg4) ? arg4 : null;
      animators = Array.isArray(arguments[4]) ? arguments[4] : null;
    } else if (Array.isArray(arg3) && Array.isArray(arg4)) {
      realmObjects = arg3;
      animators = arg4;
    } else if (Array.isArray(arg3)) {
      if (arg3.length > 0 && typeof arg3[0] === 'function') {
        animators = arg3;
      } else {
        realmObjects = arg3;
      }
    } else if (Array.isArray(arg4)) {
      animators = arg4;
    }
  } else if (arg2 && (arg2.id || arg2.environment)) {
    if (Array.isArray(arg3) && Array.isArray(arg4)) {
      realmObjects = arg3;
      animators = arg4;
    } else if (Array.isArray(arg3)) {
      if (arg3.length > 0 && typeof arg3[0] === 'function') {
        animators = arg3;
      } else {
        realmObjects = arg3;
      }
    } else if (Array.isArray(arg4)) {
      animators = arg4;
    }
  } else if (Array.isArray(arg2)) {
    if (arg2.length > 0 && typeof arg2[0] === 'function') {
      animators = arg2;
      if (Array.isArray(arg3)) realmObjects = arg3;
    } else {
      realmObjects = arg2;
      if (Array.isArray(arg3)) animators = arg3;
    }
  } else {
    if (Array.isArray(arg3) && Array.isArray(arg4)) {
      realmObjects = arg3;
      animators = arg4;
    } else if (Array.isArray(arg3)) {
      if (arg3.length > 0 && typeof arg3[0] === 'function') {
        animators = arg3;
      } else {
        realmObjects = arg3;
      }
    } else if (Array.isArray(arg4)) {
      animators = arg4;
    }
  }

  const crowdGroup = new T.Group();
  crowdGroup.name = 'devotee_crowd_simulation_f9';

  const SANCTUM_X = 0;
  const SANCTUM_Z = -30;

  // 1. Generate Devotee Specifications (352 Total)
  const devoteeSpecs = [];

  // --- TIER 1: Mandapam Courtyard Flanks & Central Priest Aisle (136 Devotees) ---
  // Left Courtyard Block (5 rows x 12 = 60 devotees)
  for (let r = 0; r < 5; r++) {
    const rowZ = -9.5 + r * 3.0; // z from -9.5 to 2.5
    for (let c = 0; c < 12; c++) {
      const x = -20.0 + c * 1.35; // x from -20.0 to -5.15
      const jitterX = Math.sin(r * 13 + c * 17) * 0.15;
      const jitterZ = Math.cos(r * 23 + c * 7) * 0.18;
      const posX = x + jitterX;
      const posZ = rowZ + jitterZ;
      const posY = 0.55;
      const angle = Math.atan2(SANCTUM_X - posX, SANCTUM_Z - posZ);
      const hasAarti = (r % 2 === 0) && (c % 2 === 0);
      devoteeSpecs.push({
        x: posX, y: posY, z: posZ,
        facingAngle: angle,
        isPriest: false,
        hasAarti: hasAarti,
        phase: r * 0.35 + c * 0.15,
        tier: 1
      });
    }
  }

  // Right Courtyard Block (5 rows x 12 = 60 devotees)
  for (let r = 0; r < 5; r++) {
    const rowZ = -9.5 + r * 3.0;
    for (let c = 0; c < 12; c++) {
      const x = 5.15 + c * 1.35; // x from 5.15 to 20.0
      const jitterX = Math.cos(r * 11 + c * 19) * 0.15;
      const jitterZ = Math.sin(r * 29 + c * 13) * 0.18;
      const posX = x + jitterX;
      const posZ = rowZ + jitterZ;
      const posY = 0.55;
      const angle = Math.atan2(SANCTUM_X - posX, SANCTUM_Z - posZ);
      const hasAarti = (r % 2 === 0) && (c % 2 === 0);
      devoteeSpecs.push({
        x: posX, y: posY, z: posZ,
        facingAngle: angle,
        isPriest: false,
        hasAarti: hasAarti,
        phase: r * 0.35 + c * 0.15 + 0.25,
        tier: 1
      });
    }
  }

  // Central Priest Aisle (2 rows x 8 = 16 priests in pure white robes)
  for (let r = 0; r < 8; r++) {
    const z = -8.5 + r * 1.45;
    [-2.2, 2.2].forEach((x, colIdx) => {
      const angle = Math.atan2(SANCTUM_X - x, SANCTUM_Z - z);
      devoteeSpecs.push({
        x: x, y: 0.58, z: z,
        facingAngle: angle,
        isPriest: true,
        hasAarti: true,
        phase: r * 0.25 + colIdx * 0.5,
        tier: 1
      });
    });
  }

  // --- TIER 2: Concentric Outer Courtyard Plinth Semi-Circles (120 Devotees) ---
  const concentricArcs = [
    { radius: 18.0, count: 32, elevation: 0.65 },
    { radius: 22.0, count: 40, elevation: 0.85 },
    { radius: 26.0, count: 48, elevation: 1.05 }
  ];

  concentricArcs.forEach((arc, arcIdx) => {
    const startAngle = -Math.PI * 0.68;
    const endAngle = -Math.PI * 0.32;
    const angleStep = (endAngle - startAngle) / (arc.count - 1);

    for (let i = 0; i < arc.count; i++) {
      const theta = startAngle + i * angleStep;
      const posX = Math.cos(theta) * arc.radius;
      const posZ = -14.0 + Math.sin(theta) * (arc.radius * 1.15);
      const posY = arc.elevation;
      const angle = Math.atan2(SANCTUM_X - posX, SANCTUM_Z - posZ);
      const hasAarti = (arcIdx < 2 && i % 2 === 0) || (arcIdx === 2 && i % 3 === 0);

      devoteeSpecs.push({
        x: posX, y: posY, z: posZ,
        facingAngle: angle,
        isPriest: false,
        hasAarti: hasAarti,
        phase: arcIdx * 0.5 + i * 0.12,
        tier: 2
      });
    }
  });

  // --- TIER 3: Sarayu Riverbank Ghat Steps (96 Devotees) ---
  const ghatSteps = [
    { z: 9.0, count: 32, elevation: 0.50 },
    { z: 11.5, count: 32, elevation: 0.30 },
    { z: 14.0, count: 32, elevation: 0.10 }
  ];

  ghatSteps.forEach((step, stepIdx) => {
    const startX = -22.0;
    const endX = 22.0;
    const xStep = (endX - startX) / (step.count - 1);

    for (let i = 0; i < step.count; i++) {
      const posX = startX + i * xStep + Math.sin(i * 19) * 0.15;
      const posZ = step.z + Math.cos(i * 23) * 0.15;
      const posY = step.elevation;
      const angle = Math.atan2(SANCTUM_X - posX, SANCTUM_Z - posZ);
      const hasAarti = (stepIdx === 0 && i % 2 === 0) || (stepIdx === 1 && i % 3 === 0) || (stepIdx === 2 && i % 3 === 0 && i < 27);

      devoteeSpecs.push({
        x: posX, y: posY, z: posZ,
        facingAngle: angle,
        isPriest: false,
        hasAarti: hasAarti,
        phase: stepIdx * 0.4 + i * 0.14,
        tier: 3
      });
    }
  });

  const totalDevotees = devoteeSpecs.length; // 352
  const aartiDevoteeIndices = [];
  devoteeSpecs.forEach((spec, idx) => {
    if (spec.hasAarti) aartiDevoteeIndices.push(idx);
  });
  const totalAartiLamps = aartiDevoteeIndices.length; // ~140

  // 2. Instanced Mesh Construction
  const devoteeGeo = createDevoteeFigureGeometry(T);
  const devoteeMat = new T.MeshStandardMaterial({
    roughness: 0.75,
    metalness: 0.12
  });
  const devoteesMesh = new InstancedMesh(devoteeGeo, devoteeMat, totalDevotees);
  devoteesMesh.name = 'devotees_instanced_mesh';
  devoteesMesh.castShadow = true;
  devoteesMesh.receiveShadow = true;

  const lampGeo = createAartiLampGeometry(T);
  const lampMat = new T.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.95
  });
  const aartiLampsMesh = new InstancedMesh(lampGeo, lampMat, totalAartiLamps);
  aartiLampsMesh.name = 'aarti_lamps_instanced_mesh';

  // 3. Cultural Color Palette Assignment via setColorAt
  const PALETTE = {
    priestWhite: [new T.Color(0xf8fafc), new T.Color(0xffedd5), new T.Color(0xfef3c7)],
    saffron: [new T.Color(0xea580c), new T.Color(0xf97316), new T.Color(0xfb923c), new T.Color(0xc2410c)],
    amberGold: [new T.Color(0xf59e0b), new T.Color(0xd97706), new T.Color(0xeab308)],
    maroonKumkum: [new T.Color(0x991b1b), new T.Color(0x881337), new T.Color(0x7f1d1d)],
    silks: [new T.Color(0x0284c7), new T.Color(0x059669), new T.Color(0xbe123c)]
  };

  const dummyDevotee = (T.Object3D ? new T.Object3D() : {});
  const dummyLamp = (T.Object3D ? new T.Object3D() : {});

  let lampCounter = 0;
  const lampToDevoteeMap = new Int16Array(totalDevotees).fill(-1);

  devoteeSpecs.forEach((spec, i) => {
    if (dummyDevotee.position && dummyDevotee.position.set) {
      dummyDevotee.position.set(spec.x, spec.y, spec.z);
      if (dummyDevotee.rotation) dummyDevotee.rotation.set ? dummyDevotee.rotation.set(0, spec.facingAngle, 0) : (dummyDevotee.rotation.y = spec.facingAngle);
      if (dummyDevotee.updateMatrix) dummyDevotee.updateMatrix();
      if (devoteesMesh.setMatrixAt) devoteesMesh.setMatrixAt(i, dummyDevotee.matrix);
    }

    let col;
    if (spec.isPriest) {
      col = PALETTE.priestWhite[i % PALETTE.priestWhite.length];
    } else {
      const rand = Math.sin(i * 77.13) * 0.5 + 0.5;
      if (rand < 0.50) {
        col = PALETTE.saffron[Math.floor(rand * 8) % PALETTE.saffron.length];
      } else if (rand < 0.75) {
        col = PALETTE.amberGold[Math.floor(rand * 12) % PALETTE.amberGold.length];
      } else if (rand < 0.90) {
        col = PALETTE.maroonKumkum[Math.floor(rand * 16) % PALETTE.maroonKumkum.length];
      } else {
        col = PALETTE.silks[Math.floor(rand * 20) % PALETTE.silks.length];
      }
    }
    if (devoteesMesh.setColorAt) devoteesMesh.setColorAt(i, col);

    if (spec.hasAarti) {
      const lampIdx = lampCounter++;
      lampToDevoteeMap[i] = lampIdx;

      const cosF = Math.cos(spec.facingAngle);
      const sinF = Math.sin(spec.facingAngle);
      const handOffsetForward = 0.38;
      const lx = spec.x + handOffsetForward * sinF;
      const ly = spec.y + 1.25;
      const lz = spec.z + handOffsetForward * cosF;

      if (dummyLamp.position && dummyLamp.position.set) {
        dummyLamp.position.set(lx, ly, lz);
        if (dummyLamp.rotation) dummyLamp.rotation.set ? dummyLamp.rotation.set(0, spec.facingAngle, 0) : (dummyLamp.rotation.y = spec.facingAngle);
        if (dummyLamp.updateMatrix) dummyLamp.updateMatrix();
        if (aartiLampsMesh.setMatrixAt) aartiLampsMesh.setMatrixAt(lampIdx, dummyLamp.matrix);
      }
    }
  });

  if (devoteesMesh.instanceColor) devoteesMesh.instanceColor.needsUpdate = true;
  if (devoteesMesh.instanceMatrix) devoteesMesh.instanceMatrix.needsUpdate = true;
  if (aartiLampsMesh.instanceMatrix) aartiLampsMesh.instanceMatrix.needsUpdate = true;

  crowdGroup.add(devoteesMesh);
  crowdGroup.add(aartiLampsMesh);

  // 4. Warm Devotional Accent Point Lights
  const aartiLightLeft = new T.PointLight(0xff9922, 2.8, 30);
  aartiLightLeft.position.set(-6, 3.5, -4);
  crowdGroup.add(aartiLightLeft);
  if (realmObjects) realmObjects.push(aartiLightLeft);

  const aartiLightRight = new T.PointLight(0xff9922, 2.8, 30);
  aartiLightRight.position.set(6, 3.5, -4);
  crowdGroup.add(aartiLightRight);
  if (realmObjects) realmObjects.push(aartiLightRight);

  // 5. Zero-Allocation Procedural Animation Loop
  const count = totalDevotees;
  const basePosX = new Float32Array(count);
  const basePosY = new Float32Array(count);
  const basePosZ = new Float32Array(count);
  const facingAngles = new Float32Array(count);
  const phaseOffsets = new Float32Array(count);
  const hasAartiFlag = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    basePosX[i] = devoteeSpecs[i].x;
    basePosY[i] = devoteeSpecs[i].y;
    basePosZ[i] = devoteeSpecs[i].z;
    facingAngles[i] = devoteeSpecs[i].facingAngle;
    phaseOffsets[i] = devoteeSpecs[i].phase;
    hasAartiFlag[i] = devoteeSpecs[i].hasAarti ? 1 : 0;
  }

  if (animators) {
    animators.push((time, delta) => {
      aartiLightLeft.intensity = 2.4 + Math.sin(time * 8.0) * 0.4;
      aartiLightRight.intensity = 2.4 + Math.cos(time * 7.5) * 0.4;

      for (let i = 0; i < count; i++) {
        const bx = basePosX[i];
        const by = basePosY[i];
        const bz = basePosZ[i];
        const facing = facingAngles[i];
        const phase = phaseOffsets[i];
        const hasAarti = hasAartiFlag[i] === 1;

        if (hasAarti) {
          const tAarti = time * 2.2 + phase;
          const swayX = Math.sin(tAarti) * 0.05;
          const bowPitch = 0.04 + Math.sin(tAarti * 0.5) * 0.04;
          const swayZ = Math.cos(tAarti * 0.5) * 0.02;

          if (dummyDevotee.position && dummyDevotee.position.set) {
            dummyDevotee.position.set(bx + swayX, by, bz + swayZ);
            if (dummyDevotee.rotation && dummyDevotee.rotation.set) dummyDevotee.rotation.set(bowPitch, facing, -swayX * 0.4);
            if (dummyDevotee.updateMatrix) dummyDevotee.updateMatrix();
            if (devoteesMesh.setMatrixAt) devoteesMesh.setMatrixAt(i, dummyDevotee.matrix);
          }

          const lampIdx = lampToDevoteeMap[i];
          if (lampIdx >= 0 && dummyLamp.position && dummyLamp.position.set) {
            const circleX = Math.cos(tAarti) * 0.15;
            const circleY = Math.sin(tAarti) * 0.10 + Math.abs(Math.sin(tAarti * 2.0)) * 0.05;

            const cosF = Math.cos(facing);
            const sinF = Math.sin(facing);
            const localOffsetZ = 0.38 + swayZ;

            const worldLx = bx + swayX + (circleX * cosF + localOffsetZ * sinF);
            const worldLy = by + 1.25 + circleY;
            const worldLz = bz + (-circleX * sinF + localOffsetZ * cosF);

            const flameFlicker = 1.0 + Math.sin(time * 16.0 + phase * 3.0) * 0.18;

            dummyLamp.position.set(worldLx, worldLy, worldLz);
            if (dummyLamp.rotation && dummyLamp.rotation.set) dummyLamp.rotation.set(bowPitch, facing, circleX * 0.4);
            if (dummyLamp.scale && dummyLamp.scale.set) dummyLamp.scale.set(1, flameFlicker, 1);
            if (dummyLamp.updateMatrix) dummyLamp.updateMatrix();
            if (aartiLampsMesh.setMatrixAt) aartiLampsMesh.setMatrixAt(lampIdx, dummyLamp.matrix);
          }
        } else {
          const tPrayer = time * 1.5 + phase;
          const bowPitch = Math.max(0, Math.sin(tPrayer)) * 0.10;
          const breathY = Math.sin(tPrayer * 1.2) * 0.02;

          if (dummyDevotee.position && dummyDevotee.position.set) {
            dummyDevotee.position.set(bx, by + breathY, bz);
            if (dummyDevotee.rotation && dummyDevotee.rotation.set) dummyDevotee.rotation.set(bowPitch, facing, 0);
            if (dummyDevotee.updateMatrix) dummyDevotee.updateMatrix();
            if (devoteesMesh.setMatrixAt) devoteesMesh.setMatrixAt(i, dummyDevotee.matrix);
          }
        }
      }

      if (devoteesMesh.instanceMatrix) devoteesMesh.instanceMatrix.needsUpdate = true;
      if (aartiLampsMesh.instanceMatrix) aartiLampsMesh.instanceMatrix.needsUpdate = true;
    });
  }

  if (scene) scene.add(crowdGroup);
  if (realmObjects) realmObjects.push(crowdGroup);

  return crowdGroup;
}

export const buildDevoteeCrowdSimulation = createDevoteeCrowdSimulation;

/**
 * Master Scene Builder for Ayodhya Shri Ram Mandir (Features F8 & F9)
 */
export function buildAyodhyaRamMandirScene(T, scene, realmData, realmObjects = [], animators = []) {
  const Three = T || THREE_GLOBAL;
  getThreeHelpers(Three);
  const rootGroup = new Three.Group();
  rootGroup.name = 'flagship_ayodhya_ram_mandir';

  // 1. Shared Materials (Rajasthan Bansi Paharpur Pink Sandstone & Temple Gold)
  const sandstoneMat = createSandstoneTexture(Three);

  const goldMat = new Three.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.18,
    metalness: 0.94,
    emissive: 0x332200
  });

  // 2. Grand Stepped Jagati Plinth (Adhishthana)
  const plinthY = 1.0;
  const plinthGroup = new Three.Group();
  plinthGroup.name = 'jagati_plinth';

  const lowerPlinth = new Three.Mesh(new Three.BoxGeometry(46, 0.8, 56), sandstoneMat);
  lowerPlinth.position.set(0, 0.4, -18);
  lowerPlinth.receiveShadow = true;
  plinthGroup.add(lowerPlinth);

  const upperPlinth = new Three.Mesh(new Three.BoxGeometry(43, 0.6, 53), sandstoneMat);
  upperPlinth.position.set(0, 1.0, -18);
  upperPlinth.receiveShadow = true;
  plinthGroup.add(upperPlinth);

  // Grand Entrance Staircase (Sopan) descending to courtyard
  for (let step = 0; step < 5; step++) {
    const stepMesh = new Three.Mesh(new Three.BoxGeometry(18 - step * 0.8, 0.24, 1.2), sandstoneMat);
    stepMesh.position.set(0, 1.0 - step * 0.20, 8.5 + step * 1.1);
    stepMesh.receiveShadow = true;
    plinthGroup.add(stepMesh);
  }
  rootGroup.add(plinthGroup);

  // 3. Central Garbhagriha (Sanctum Sanctorum) with Lord Ram Murti & Golden Inner Glow
  const sanctum = createSanctumSanctorum(Three, {
    yPlinth: plinthY,
    sandstoneMat,
    goldMat,
    animators,
    realmObjects
  });
  rootGroup.add(sanctum);

  // 4. Multi-Tiered Nagara Shikhara Towers
  // (A) Tallest Mula-Shikhara over Garbhagriha (42m, 10 Tiers, Pancharatha, Amalaka, Kalasha, Flag)
  const mulaShikhara = createNagaraShikharaTower(Three, {
    baseWidth: 13.5,
    height: 42.0,
    tiers: 10,
    hasUrushringas: true,
    hasFlag: true,
    flagColor: 0xff6200,
    sandstoneMat,
    goldMat,
    animators
  });
  mulaShikhara.position.set(0, plinthY + 9.5, -32);
  rootGroup.add(mulaShikhara);

  // (B) Gudha Mandapa Spire (Height: 26m, 7 tiers)
  const gudhaSpire = createNagaraShikharaTower(Three, {
    baseWidth: 10.5,
    height: 26.0,
    tiers: 7,
    hasUrushringas: false,
    hasFlag: true,
    flagColor: 0xff7700,
    sandstoneMat,
    goldMat,
    animators
  });
  gudhaSpire.position.set(0, plinthY + 7.5, -20);
  rootGroup.add(gudhaSpire);

  // (C) Rang Mandapa Spire (Height: 22m, 6 tiers)
  const rangSpire = createNagaraShikharaTower(Three, {
    baseWidth: 9.5,
    height: 22.0,
    tiers: 6,
    hasUrushringas: false,
    hasFlag: true,
    flagColor: 0xff6200,
    sandstoneMat,
    goldMat,
    animators
  });
  rangSpire.position.set(0, plinthY + 7.0, -8);
  rootGroup.add(rangSpire);

  // (D & E) Flanking Transept Spires (Height: 18m, 5 tiers)
  const transeptL = createNagaraShikharaTower(Three, {
    baseWidth: 7.5,
    height: 18.0,
    tiers: 5,
    hasUrushringas: false,
    hasFlag: false,
    sandstoneMat,
    goldMat,
    animators
  });
  transeptL.position.set(-15.5, plinthY + 6.5, -14);
  rootGroup.add(transeptL);

  const transeptR = createNagaraShikharaTower(Three, {
    baseWidth: 7.5,
    height: 18.0,
    tiers: 5,
    hasUrushringas: false,
    hasFlag: false,
    sandstoneMat,
    goldMat,
    animators
  });
  transeptR.position.set(15.5, plinthY + 6.5, -14);
  rootGroup.add(transeptR);

  // 5. Carved Mandapam Hypostyle Colonnade (24 Pillars framing central nave & corridors)
  const pillarGroup = new Three.Group();
  pillarGroup.name = 'hypostyle_mandapam_colonnade';

  const pillarColsX = [-14.5, -6.5, 6.5, 14.5];
  const pillarRowsZ = [-26, -20, -14, -8, -2, 4];

  pillarColsX.forEach(px => {
    pillarRowsZ.forEach(pz => {
      const p = createCarvedMandapaPillar(Three, {
        height: 6.8,
        baseSize: 1.25,
        shaftRadius: 0.42,
        sandstoneMat
      });
      p.position.set(px, plinthY, pz);
      pillarGroup.add(p);
    });
  });

  // Longitudinal Architrave Stone Beams connecting Pillar Capitals
  pillarColsX.forEach(px => {
    const beam = new Three.Mesh(new Three.BoxGeometry(0.85, 0.55, 33), sandstoneMat);
    beam.position.set(px, plinthY + 7.1, -11);
    beam.castShadow = true;
    pillarGroup.add(beam);
  });

  rootGroup.add(pillarGroup);

  // 6. Aarti Deepastambhas with Flickering Flames
  const aartiStambhas = createAartiDeepastambhas(Three, {
    positions: [
      [-6.5, plinthY, -10.0],
      [6.5, plinthY, -10.0],
      [-5.0, plinthY, 2.0],
      [5.0, plinthY, 2.0]
    ],
    goldMat,
    animators,
    realmObjects
  });
  rootGroup.add(aartiStambhas);

  // 7. Feature F9: Animated Praying Devotee Crowd Simulation
  try {
    const crowd = createDevoteeCrowdSimulation(Three, scene, realmObjects, animators);
    if (crowd) rootGroup.add(crowd);
  } catch (err) {
    console.warn('[FlagshipScenes] Devotee crowd simulation creation deferred:', err);
  }

  // Add root group to active scene and register for cleanup
  if (scene) scene.add(rootGroup);
  if (realmObjects) realmObjects.push(rootGroup);

  return rootGroup;
}

// ============================================================================
// FEATURE F10: FLAGSHIP WATERFALL SANCTUARY
// ============================================================================

/**
 * Creates rugged non-uniform river boulder meshes
 */
function createRuggedBoulder(T, radius, colorHex = 0x3d433b) {
  const { DodecahedronGeometry } = getThreeHelpers(T);
  const geo = new DodecahedronGeometry(radius, 1);
  const pos = geo.attributes ? geo.attributes.position : null;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1.0 + (Math.sin(vx * 2.8) * Math.cos(vy * 2.8) * Math.sin(vz * 2.8)) * 0.22;
      pos.setX(i, vx * noise);
      pos.setY(i, vy * noise * 0.76);
      pos.setZ(i, vz * noise);
    }
    if (geo.computeVertexNormals) geo.computeVertexNormals();
  }
  const mat = new T.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.55,
    metalness: 0.15,
    flatShading: true
  });
  return new T.Mesh(geo, mat);
}

/**
 * Feature F10: Flagship Waterfall Sanctuary
 * Builds 3D riverbank terrain, vertical waterfall particle cascade,
 * plunge spray foam, splash ripples, and transparent crystal float-bed.
 */
export function buildWaterfallSanctuaryScene(ThreeInstance, scene, realmData, realmObjects = [], animators = []) {
  const T = ThreeInstance || THREE_GLOBAL;
  const { RingGeometry, MeshPhysicalMaterial } = getThreeHelpers(T);

  const sanctuaryGroup = new T.Group();
  sanctuaryGroup.name = 'flagship_waterfall_sanctuary';

  // 1. Procedural 3D Riverbank Terrain & Vertical Cliff Escarpment
  const terrainGeo = new T.PlaneGeometry(240, 240, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes ? terrainGeo.attributes.position : null;

  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // River centerline meandering path
      const cx = Math.sin(z * 0.032) * 7.5;
      const dx = x - cx;
      const distBank = Math.abs(dx);
      const halfWidth = 14.0;

      let y = 0;

      if (z < -46.0) {
        // Rear Vertical Waterfall Cliff Face
        const cliffRamp = Math.min(1.0, (-46.0 - z) / 10.0);
        let cliffHeight = cliffRamp * 42.0;
        const rockNoise = Math.sin(x * 0.12) * 2.5 + Math.cos(z * 0.15) * 2.0;

        if (Math.abs(x) < 9.0) {
          cliffHeight = Math.max(38.0, 38.0 + Math.cos(x * 0.32) * 2.0);
        }
        y = cliffHeight + rockNoise;
      } else {
        if (distBank < halfWidth) {
          const bedDepth = (1.0 - Math.pow(distBank / halfWidth, 2)) * 3.4;
          y = -0.5 - bedDepth;
          if (z < -36.0) {
            y -= (1.0 - (z + 46.0) / 10.0) * 1.5 * Math.max(0, 1.0 - Math.abs(x) / 12.0);
          }
        } else {
          const bankDist = distBank - halfWidth;
          const slopeHeight = Math.min(16.0, Math.pow(bankDist * 0.16, 1.35));
          const hillNoise = Math.sin(x * 0.045 + z * 0.035) * 2.4 + Math.cos(x * 0.07 - z * 0.05) * 1.2;
          y = -0.4 + slopeHeight + hillNoise;
        }
      }
      pos.setY(i, y);
    }
    if (terrainGeo.computeVertexNormals) terrainGeo.computeVertexNormals();
  }

  const terrainMat = new T.MeshStandardMaterial({
    color: 0x1f4422, // lush moss & alpine green
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true
  });
  const terrainMesh = new T.Mesh(terrainGeo, terrainMat);
  terrainMesh.name = 'sanctuary_riverbank_terrain';
  terrainMesh.receiveShadow = true;
  sanctuaryGroup.add(terrainMesh);

  // High Vertical Cliff Rock Face Backdrop
  const cliffFaceGeo = new T.BoxGeometry(64, 46, 20);
  const cliffFaceMat = new T.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.82,
    metalness: 0.2,
    flatShading: true
  });
  const cliffFaceMesh = new T.Mesh(cliffFaceGeo, cliffFaceMat);
  cliffFaceMesh.position.set(0, 21, -58);
  cliffFaceMesh.receiveShadow = true;
  sanctuaryGroup.add(cliffFaceMesh);

  // Clear Alpine River Water Plane
  const waterGeo = new T.PlaneGeometry(90, 160, 32, 48);
  waterGeo.rotateX(-Math.PI / 2);
  const origSanctuaryWaterY = new Float32Array(waterGeo.attributes.position.array);
  const waterMat = new T.MeshStandardMaterial({
    color: 0x062836,
    roughness: 0.08,
    metalness: 0.92,
    transparent: true,
    opacity: 0.78
  });
  const waterMesh = new T.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, -0.45, -10);
  waterMesh.name = 'sanctuary_river_water';
  waterMesh.receiveShadow = true;
  sanctuaryGroup.add(waterMesh);

  // Procedural Granite River Boulders (12-18 granite boulders)
  const boulderConfigs = [
    { r: 3.5, x: -11, y: 0.2, z: -46, col: 0x262a28 },
    { r: 2.8, x: 12, y: 0.1, z: -45, col: 0x2e3330 },
    { r: 2.2, x: -6, y: -0.2, z: -43, col: 0x1e2220 },
    { r: 2.5, x: 7, y: -0.1, z: -44, col: 0x2a302c },
    { r: 4.2, x: -16, y: 1.0, z: -35, col: 0x3d433b },
    { r: 3.2, x: 15, y: 0.8, z: -30, col: 0x373d36 },
    { r: 2.4, x: -14, y: 0.4, z: -18, col: 0x3d433b },
    { r: 2.0, x: 14, y: 0.3, z: -8, col: 0x353a34 },
    { r: 3.0, x: -13, y: 0.5, z: 5, col: 0x3b423a },
    { r: 2.6, x: 13, y: 0.4, z: 18, col: 0x383e37 },
    { r: 1.8, x: -10, y: -0.1, z: -25, col: 0x2d322e },
    { r: 2.1, x: 11, y: 0.0, z: -20, col: 0x2f3430 }
  ];

  boulderConfigs.forEach((cfg, idx) => {
    const boulder = createRuggedBoulder(T, cfg.r, cfg.col);
    boulder.position.set(cfg.x, cfg.y, cfg.z);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    boulder.name = `river_boulder_${idx}`;
    sanctuaryGroup.add(boulder);
  });

  // Hydrodynamic Cascading Waterfall Water Sheet & Spray
  const flowData = createWaterfallFlowTexture(T);
  const waterfallMat = flowData.material;

  if (T.PlaneGeometry) {
    // 1. Curved Crest Ramp
    const crestGeo = new T.PlaneGeometry(24, 12, 24, 16);
    if (crestGeo.attributes && crestGeo.attributes.position) {
      const cPos = crestGeo.attributes.position;
      for (let i = 0; i < cPos.count; i++) {
        const zN = (cPos.getY(i) + 6) / 12;
        cPos.setZ(i, -Math.sin(zN * Math.PI * 0.5) * 6);
      }
      if (crestGeo.computeVertexNormals) crestGeo.computeVertexNormals();
    }
    const crestMesh = new T.Mesh(crestGeo, waterfallMat);
    crestMesh.position.set(0, 42, -52);
    crestMesh.rotation.x = Math.PI * 0.35;
    crestMesh.name = 'waterfall_crest_sheet';
    sanctuaryGroup.add(crestMesh);

    // 2. Vertical Freefall Fluid Curtain
    const curtainGeo = new T.PlaneGeometry(26, 40, 28, 48);
    const curtainMesh = new T.Mesh(curtainGeo, waterfallMat);
    curtainMesh.position.set(0, 20, -48);
    curtainMesh.name = 'waterfall_fluid_curtain';
    sanctuaryGroup.add(curtainMesh);

    // 3. Flanking Aerated Side Sprays
    const leftSpray = new T.Mesh(new T.PlaneGeometry(8, 38, 12, 24), waterfallMat);
    leftSpray.position.set(-14, 19, -49);
    leftSpray.rotation.y = 0.35;
    sanctuaryGroup.add(leftSpray);

    const rightSpray = new T.Mesh(new T.PlaneGeometry(8, 38, 12, 24), waterfallMat);
    rightSpray.position.set(14, 19, -49);
    rightSpray.rotation.y = -0.35;
    sanctuaryGroup.add(rightSpray);
  }

  // Broadleaf Canopy Trees along Cliff & Riverbank
  if (T.CylinderGeometry && T.DodecahedronGeometry) {
    const trunkMat = new T.MeshStandardMaterial({ color: 0x2e1e0f, roughness: 0.9 });
    const leafMat = new T.MeshStandardMaterial({ color: 0x1e5e2e, roughness: 0.75, flatShading: true });
    const treeCoords = [
      { x: -28, y: 15, z: -55, s: 2.2 },
      { x: 28, y: 15, z: -55, s: 2.0 },
      { x: -24, y: 0, z: -25, s: 1.6 },
      { x: 24, y: 0, z: -20, s: 1.8 },
      { x: -26, y: 0, z: 10, s: 1.7 },
      { x: 25, y: 0, z: 25, s: 1.5 }
    ];
    treeCoords.forEach((tc) => {
      const tree = new T.Group();
      const trunk = new T.Mesh(new T.CylinderGeometry(0.5 * tc.s, 0.9 * tc.s, 8 * tc.s, 8), trunkMat);
      trunk.position.y = 4 * tc.s;
      const crown = new T.Mesh(new T.DodecahedronGeometry(4 * tc.s, 1), leafMat);
      crown.position.y = 8 * tc.s;
      tree.add(trunk);
      tree.add(crown);
      tree.position.set(tc.x, tc.y, tc.z);
      sanctuaryGroup.add(tree);
    });
  }

  // 2. Animated Vertical Waterfall Particle Cascade (4,500 particles)
  const cascadeCount = 4500;
  const cascadeGeo = new T.BufferGeometry();
  const cascadePos = new Float32Array(cascadeCount * 3);
  const cascadeCol = new Float32Array(cascadeCount * 3);
  const cascadeVel = new Float32Array(cascadeCount * 3);

  for (let i = 0; i < cascadeCount; i++) {
    const idx = i * 3;
    const progress = Math.random();
    const y = 42.0 - progress * 42.5;
    const spreadX = (Math.random() - 0.5) * (14.0 + progress * 6.0);
    const z = -54.5 + progress * 6.5 + (Math.random() - 0.5) * 1.5;

    cascadePos[idx] = spreadX;
    cascadePos[idx + 1] = y;
    cascadePos[idx + 2] = z;

    cascadeVel[idx] = (Math.random() - 0.5) * 1.4;
    cascadeVel[idx + 1] = -(4.0 + Math.random() * 6.0);
    cascadeVel[idx + 2] = 1.4 + Math.random() * 1.6;

    if (progress < 0.1 || progress > 0.85) {
      cascadeCol[idx] = 1.0;
      cascadeCol[idx + 1] = 1.0;
      cascadeCol[idx + 2] = 1.0;
    } else {
      cascadeCol[idx] = 0.78;
      cascadeCol[idx + 1] = 0.94;
      cascadeCol[idx + 2] = 0.98;
    }
  }

  cascadeGeo.setAttribute('position', new T.BufferAttribute(cascadePos, 3));
  cascadeGeo.setAttribute('color', new T.BufferAttribute(cascadeCol, 3));

  const cascadeMat = new T.PointsMaterial({
    size: 2.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: T.AdditiveBlending || 2,
    depthWrite: false
  });

  const cascadePoints = new T.Points(cascadeGeo, cascadeMat);
  cascadePoints.name = 'waterfall_cascade_particles';
  sanctuaryGroup.add(cascadePoints);

  // 3. Spray Foam & Water Surface Splash Ripples at Impact Zone (1,600 mist particles)
  const mistCount = 1600;
  const mistGeo = new T.BufferGeometry();
  const mistPos = new Float32Array(mistCount * 3);
  const mistVel = new Float32Array(mistCount * 3);
  const mistCol = new Float32Array(mistCount * 3);
  const mistAges = new Float32Array(mistCount);
  const mistLives = new Float32Array(mistCount);

  for (let i = 0; i < mistCount; i++) {
    const idx = i * 3;
    mistPos[idx] = (Math.random() - 0.5) * 20.0;
    mistPos[idx + 1] = -0.4 + Math.random() * 1.2;
    mistPos[idx + 2] = -48.0 + (Math.random() - 0.5) * 6.0;

    mistVel[idx] = (Math.random() - 0.5) * 7.5;
    mistVel[idx + 1] = 2.0 + Math.random() * 5.5;
    mistVel[idx + 2] = (Math.random() - 0.5) * 6.5;

    mistCol[idx] = 0.85;
    mistCol[idx + 1] = 0.96;
    mistCol[idx + 2] = 1.0;

    mistLives[i] = 1.0 + Math.random() * 1.5;
    mistAges[i] = Math.random() * mistLives[i];
  }

  mistGeo.setAttribute('position', new T.BufferAttribute(mistPos, 3));
  mistGeo.setAttribute('color', new T.BufferAttribute(mistCol, 3));

  const mistMat = new T.PointsMaterial({
    size: 3.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: T.AdditiveBlending || 2,
    depthWrite: false
  });
  const mistPoints = new T.Points(mistGeo, mistMat);
  mistPoints.name = 'waterfall_impact_mist';
  sanctuaryGroup.add(mistPoints);

  // Churning Impact Froth Disc
  const frothGeo = new T.PlaneGeometry(28, 16, 16, 12);
  frothGeo.rotateX(-Math.PI / 2);
  const frothMat = new T.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x336677,
    roughness: 0.3,
    transparent: true,
    opacity: 0.82,
    blending: T.AdditiveBlending || 2,
    depthWrite: false
  });
  const frothMesh = new T.Mesh(frothGeo, frothMat);
  frothMesh.position.set(0, -0.40, -48.0);
  frothMesh.name = 'impact_froth_disc';
  sanctuaryGroup.add(frothMesh);

  // 6 Concentric Expanding Splash Ripple Rings
  const rippleRings = [];
  const rippleRingMat = new T.MeshBasicMaterial({
    color: 0xafeefb,
    transparent: true,
    opacity: 0.7,
    side: T.DoubleSide || 2,
    depthWrite: false
  });

  for (let r = 0; r < 6; r++) {
    const ringGeo = new RingGeometry(0.3, 0.7, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new T.Mesh(ringGeo, (rippleRingMat.clone ? rippleRingMat.clone() : rippleRingMat));
    ringMesh.position.set(0, -0.42, -47.0);
    ringMesh.name = `splash_ripple_ring_${r}`;
    sanctuaryGroup.add(ringMesh);
    rippleRings.push(ringMesh);
  }

  // 4. Transparent Crystal Relaxation Float-Bed Over Stream
  const floatBedGroup = new T.Group();
  floatBedGroup.name = 'transparent_crystal_float_bed';
  const baseBedPos = { x: 7.5, y: -0.32, z: -10.0 };
  floatBedGroup.position.set(baseBedPos.x, baseBedPos.y, baseBedPos.z);
  floatBedGroup.rotation.y = -0.32;

  // Optical Crystal Material (THREE.MeshPhysicalMaterial)
  const crystalGlassMat = new MeshPhysicalMaterial({
    color: 0xddf6fa,
    emissive: 0x06202c,
    roughness: 0.05,
    metalness: 0.08,
    transmission: 0.93,
    opacity: 1.0,
    transparent: true,
    ior: 1.54,
    reflectivity: 0.92,
    thickness: 2.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03
  });

  // Bed Hull Tray
  const bedHullGeo = new T.BoxGeometry(2.0, 0.35, 3.6);
  const bedHullMesh = new T.Mesh(bedHullGeo, crystalGlassMat);
  bedHullMesh.castShadow = true;
  bedHullMesh.receiveShadow = true;
  floatBedGroup.add(bedHullMesh);

  // Angled Crystal Backrest
  const backrestGeo = new T.BoxGeometry(1.9, 0.22, 1.3);
  const backrestMesh = new T.Mesh(backrestGeo, crystalGlassMat);
  backrestMesh.position.set(0, 0.42, 1.15);
  backrestMesh.rotation.x = -0.45;
  floatBedGroup.add(backrestMesh);

  // Crystal Edge Rails
  const railGeo = new T.BoxGeometry(0.12, 0.38, 3.5);
  const leftRail = new T.Mesh(railGeo, crystalGlassMat);
  leftRail.position.set(-0.95, 0.25, 0);
  const rightRail = new T.Mesh(railGeo, crystalGlassMat);
  rightRail.position.set(0.95, 0.25, 0);
  floatBedGroup.add(leftRail);
  floatBedGroup.add(rightRail);

  // Crystal Pontoons
  const pontoonGeo = new T.CylinderGeometry(0.22, 0.22, 3.4, 16);
  pontoonGeo.rotateX(Math.PI / 2);
  const leftPontoon = new T.Mesh(pontoonGeo, crystalGlassMat);
  leftPontoon.position.set(-0.85, -0.22, 0);
  const rightPontoon = new T.Mesh(pontoonGeo, crystalGlassMat);
  rightPontoon.position.set(0.85, -0.22, 0);
  floatBedGroup.add(leftPontoon);
  floatBedGroup.add(rightPontoon);

  // Plush Recessed Ivory Relaxation Mattress
  const mattressGeo = new T.BoxGeometry(1.75, 0.20, 3.3);
  const mattressMat = new T.MeshStandardMaterial({
    color: 0xfcfaf4,
    roughness: 0.94,
    metalness: 0.02
  });
  const mattressMesh = new T.Mesh(mattressGeo, mattressMat);
  mattressMesh.position.set(0, 0.16, 0);
  floatBedGroup.add(mattressMesh);

  // Plush Head Pillows
  const pillowGeo = new T.BoxGeometry(0.72, 0.15, 0.48);
  const pillowMat = new T.MeshStandardMaterial({ color: 0xf3eee2, roughness: 0.96 });
  const leftPillow = new T.Mesh(pillowGeo, pillowMat);
  leftPillow.position.set(-0.42, 0.45, 1.25);
  leftPillow.rotation.x = -0.45;
  const rightPillow = new T.Mesh(pillowGeo, pillowMat);
  rightPillow.position.set(0.42, 0.45, 1.25);
  rightPillow.rotation.x = -0.45;
  floatBedGroup.add(leftPillow);
  floatBedGroup.add(rightPillow);

  // Emerald Silk Blanket
  const blanketGeo = new T.BoxGeometry(1.78, 0.06, 1.1);
  const blanketMat = new T.MeshStandardMaterial({
    color: 0x0b6e65,
    roughness: 0.32,
    metalness: 0.12
  });
  const blanketMesh = new T.Mesh(blanketGeo, blanketMat);
  blanketMesh.position.set(0, 0.28, -1.05);
  floatBedGroup.add(blanketMesh);

  // Floating Bedside Ornate Brass Lantern
  const lanternPedestal = new T.Mesh(
    new T.CylinderGeometry(0.45, 0.5, 0.15, 16),
    crystalGlassMat
  );
  lanternPedestal.position.set(9.6, -0.35, -11.5);
  sanctuaryGroup.add(lanternPedestal);

  const lanternFrame = new T.Mesh(
    new T.CylinderGeometry(0.2, 0.25, 0.55, 6),
    new T.MeshStandardMaterial({ color: 0xd4a034, metalness: 0.85, roughness: 0.25 })
  );
  lanternFrame.position.set(9.6, 0.0, -11.5);
  sanctuaryGroup.add(lanternFrame);

  const lanternLight = new T.PointLight(0xffa236, 2.2, 16);
  lanternLight.position.set(9.6, 0.2, -11.5);
  sanctuaryGroup.add(lanternLight);
  if (realmObjects) realmObjects.push(lanternLight);

  // 75 Dancing Fireflies
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
  }

  fireflyGeo.setAttribute('position', new T.BufferAttribute(fireflyPos, 3));
  const fireflyMat = new T.PointsMaterial({
    size: 2.2,
    color: 0xa3e635,
    transparent: true,
    opacity: 0.9,
    blending: T.AdditiveBlending || 2,
    depthWrite: false
  });
  const fireflyPoints = new T.Points(fireflyGeo, fireflyMat);
  fireflyPoints.name = 'sanctuary_fireflies';
  sanctuaryGroup.add(fireflyPoints);

  // Sinkable Bed State Controller
  let isBedSunk = false;
  floatBedGroup.userData = floatBedGroup.userData || {};
  floatBedGroup.userData.setSinkState = (sunk) => {
    isBedSunk = Boolean(sunk);
  };
  floatBedGroup.userData.toggleSinkState = () => {
    isBedSunk = !isBedSunk;
    return isBedSunk;
  };

  sanctuaryGroup.add(floatBedGroup);
  if (scene) scene.add(sanctuaryGroup);
  if (realmObjects) realmObjects.push(sanctuaryGroup);

  // 5. Delta-Timed Animation Hooks
  if (animators) {
    animators.push((time, delta) => {
      const d = Math.min(delta || 0.016, 0.1);
      if (flowData.animator) flowData.animator(time, d);

      // Waterfall Cascade Physics
      const posAttr = cascadeGeo.attributes ? cascadeGeo.attributes.position : null;
      if (posAttr && posAttr.array) {
        const cPositions = posAttr.array;
        for (let i = 0; i < cascadeCount; i++) {
          const idx = i * 3;
          cascadeVel[idx + 1] += -32.0 * d;
          cPositions[idx] += cascadeVel[idx] * d;
          cPositions[idx + 1] += cascadeVel[idx + 1] * d;
          cPositions[idx + 2] += cascadeVel[idx + 2] * d;

          if (cPositions[idx + 1] <= -0.5) {
            cPositions[idx] = (Math.random() - 0.5) * 17.0;
            cPositions[idx + 1] = 41.5 + Math.random() * 1.5;
            cPositions[idx + 2] = -54.5 + (Math.random() - 0.5) * 1.8;
            cascadeVel[idx] = (Math.random() - 0.5) * 1.4;
            cascadeVel[idx + 1] = -(3.0 + Math.random() * 5.0);
            cascadeVel[idx + 2] = 1.4 + Math.random() * 1.6;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Impact Spray Mist Dynamics
      const mPosAttr = mistGeo.attributes ? mistGeo.attributes.position : null;
      if (mPosAttr && mPosAttr.array) {
        const mPositions = mPosAttr.array;
        for (let i = 0; i < mistCount; i++) {
          const idx = i * 3;
          mistAges[i] += d;
          if (mistAges[i] >= mistLives[i]) {
            mistAges[i] = 0;
            mPositions[idx] = (Math.random() - 0.5) * 18.0;
            mPositions[idx + 1] = -0.4 + Math.random() * 0.8;
            mPositions[idx + 2] = -48.0 + (Math.random() - 0.5) * 5.5;
            mistVel[idx] = (Math.random() - 0.5) * 7.5;
            mistVel[idx + 1] = 2.5 + Math.random() * 5.0;
            mistVel[idx + 2] = (Math.random() - 0.5) * 6.5;
          } else {
            mistVel[idx] *= (1.0 - 0.9 * d);
            mistVel[idx + 1] += -3.5 * d;
            mistVel[idx + 2] *= (1.0 - 0.9 * d);
            mPositions[idx] += mistVel[idx] * d;
            mPositions[idx + 1] += mistVel[idx + 1] * d;
            mPositions[idx + 2] += mistVel[idx + 2] * d;
          }
        }
        mPosAttr.needsUpdate = true;
      }

      // Froth Undulation
      if (frothMesh.scale) {
        frothMesh.scale.x = 1.0 + Math.sin(time * 5.5) * 0.08;
        frothMesh.scale.y = 1.0 + Math.cos(time * 4.8) * 0.08;
      }
      if (frothMat) frothMat.opacity = 0.75 + Math.sin(time * 7.0) * 0.12;

      // Ripple Rings
      rippleRings.forEach((ring, idx) => {
        const age = (time + idx * 0.4) % 2.4;
        const progress = age / 2.4;
        const radius = 1.0 + progress * 26.0;
        if (ring.scale && ring.scale.set) ring.scale.set(radius, radius, 1);
        if (ring.material) ring.material.opacity = Math.max(0, (1.0 - progress) * 0.72);
      });

      // Transparent Bed Buoyancy & Sink State
      const targetBaseY = isBedSunk ? -0.52 : baseBedPos.y;
      const bobY = Math.sin(time * 1.35) * 0.045 + Math.sin(time * 2.7) * 0.015;
      const rollZ = Math.sin(time * 1.05) * 0.016;
      const pitchX = Math.cos(time * 0.85) * 0.012;
      floatBedGroup.position.y = targetBaseY + bobY;
      floatBedGroup.rotation.z = rollZ;
      floatBedGroup.rotation.x = pitchX;

      // Bedside Lantern Flicker
      lanternLight.intensity = 2.0 + Math.sin(time * 12.0) * 0.18 + Math.cos(time * 7.5) * 0.12;

      // Water Surface Harmonic Wave Oscillation
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

      // Dancing Fireflies (Bounded, Zero-Drift, Frame-rate Independent)
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
      }
    });
  }

  return {
    group: sanctuaryGroup,
    terrainMesh,
    waterMesh,
    cascadePoints,
    mistPoints,
    floatBedGroup,
    toggleSinkBed: () => floatBedGroup.userData.toggleSinkState()
  };
}

// ============================================================================
// UNIVERSAL FLAGSHIP DISPATCHER (STRICT CONTEXTUAL GATING)
// ============================================================================

/**
 * Universal Flagship Showcase Dispatcher
 * Automatically binds Ayodhya Ram Mandir (F8/F9) or Waterfall Sanctuary (F10)
 * strictly to their contextually appropriate realms.
 */
export function attachFlagshipScene(ThreeInstance, scene, realmData, realmObjects = [], animators = []) {
  if (!realmData) return null;
  const T = ThreeInstance || THREE_GLOBAL;
  const id = typeof realmData.id === 'string' ? realmData.id : '';
  const title = typeof realmData.title === 'string' ? realmData.title : '';
  const tags = Array.isArray(realmData.tags) ? realmData.tags : [];
  const preset = (realmData.environment && typeof realmData.environment.terrainPreset === 'string') ? realmData.environment.terrainPreset : '';

  // Feature F8 & F9: Ayodhya Ram Mandir & Devotee Crowd Simulation
  if (id === 'ayodhya-ram-mandir' || id.includes('ayodhya') || id.includes('ram-mandir') || title.includes('Ram Mandir') || tags.includes('ram mandir')) {
    const mandir = buildAyodhyaRamMandirScene(T, scene, realmData, realmObjects, animators);
    return { type: 'ayodhya', mandir };
  }

  // Feature F10: Flagship Waterfall Sanctuary
  if (
    id === 'jays-enchanted-waterfall-retreat' ||
    (id.includes('waterfall') && !id.includes('iguazu') && !id.includes('victoria') && !id.includes('skogafoss')) ||
    tags.includes('transparent bed') ||
    tags.includes('sinkable')
  ) {
    const sanctuary = buildWaterfallSanctuaryScene(T, scene, realmData, realmObjects, animators);
    return { type: 'waterfall_sanctuary', sanctuary };
  }

  // Defensive Invariant: Giza, Kedarnath, Orion, Neo Tokyo spawn ZERO flagship geometry
  return null;
}

export const buildFlagshipScene = attachFlagshipScene;

// Browser global window export
if (typeof window !== 'undefined') {
  window.FlagshipScenes = {
    createAmalakaDisc,
    createGoldenKalasha,
    createAnimatedDhwajaFlag,
    createNagaraShikharaTower,
    createCarvedMandapaPillar,
    createSanctumSanctorum,
    createAartiDeepastambhas,
    createDevoteeFigureGeometry,
    createAartiLampGeometry,
    createDevoteeCrowdSimulation,
    buildDevoteeCrowdSimulation,
    buildAyodhyaRamMandirScene,
    buildWaterfallSanctuaryScene,
    attachFlagshipScene,
    buildFlagshipScene
  };
}

export default {
  createAmalakaDisc,
  createGoldenKalasha,
  createAnimatedDhwajaFlag,
  createNagaraShikharaTower,
  createCarvedMandapaPillar,
  createSanctumSanctorum,
  createAartiDeepastambhas,
  createDevoteeFigureGeometry,
  createAartiLampGeometry,
  createDevoteeCrowdSimulation,
  buildDevoteeCrowdSimulation,
  buildAyodhyaRamMandirScene,
  buildWaterfallSanctuaryScene,
  attachFlagshipScene,
  buildFlagshipScene
};
