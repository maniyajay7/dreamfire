/**
 * SceneManager.js - Core 3D WebGL Scene & Spatial Engine
 * Milestone M2 / Features F4, F6, F7:
 * - F4: 3D Spatial Spherical Skydome System
 * - F6: Procedural Environmental Terrains (8 Biomes)
 * - F7: Dynamic Real-Time Lighting, Soft Shadows & Atmospheric Fog
 */

import * as THREE_MODULE from 'three';
import { attachFlagshipScene } from './FlagshipScenes.js';
import { VideoTextureManager } from './VideoTextureManager.js';

// Support both ES module and window global environments
const THREE = typeof window !== 'undefined' && window.THREE ? window.THREE : THREE_MODULE;

/**
 * Creates procedural 3D terrain meshes for any of the 8 canonical biomes:
 * 'desert' | 'glacial' | 'cyber' | 'cosmic' | 'sacred_river' | 'sanctuary' | 'jungle' | 'temple'
 * 
 * @param {object} ThreeInstance - Three.js library instance
 * @param {object} realmData - Catalog entry including environment configuration
 * @param {Array} animators - Animation loop callbacks array
 * @returns {object} THREE.Group containing procedural terrain meshes and systems
 */
export function createProceduralTerrain(ThreeInstance, realmData, animators = []) {
  const T = ThreeInstance || THREE;
  const env = (realmData && realmData.environment) || {};
  const biome = env.biome || 'sanctuary';
  const group = new T.Group();
  group.name = 'terrain_biome_' + biome;

  // 1. COSMIC VOID: Volumetric Particle Nebulae (Deep Space Void - Ground Plane Omitted)
  if (biome === 'cosmic') {
    // Volumetric 3-Layer Stardust Nebula (15,000+ particles) + Gas Giant & Celestial Rings
    const pCount = 15000;
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const palette = [
      new T.Color(0xa855f7), // violet emission core
      new T.Color(0xec4899), // magenta stardust
      new T.Color(0x06b6d4), // ionized cyan filaments
      new T.Color(0x38bdf8), // radiant ultraviolet
      new T.Color(0xf59e0b), // stellar amber
      new T.Color(0xffffff)  // brilliant O-class star
    ];

    for (let i = 0; i < pCount; i++) {
      let radius, theta, phi, col;
      if (i < 6000) {
        // Layer 1: Core Emission Nebula (Trapezium M42 cluster)
        radius = 15 + Math.random() * 65;
        theta = Math.random() * Math.PI * 2;
        phi = (Math.random() - 0.5) * Math.PI * 0.45;
        col = palette[Math.random() > 0.4 ? 0 : 1];
      } else if (i < 11000) {
        // Layer 2: Ionized Hydrogen Filaments & Gas Streams
        radius = 40 + Math.random() * 110;
        theta = Math.random() * Math.PI * 2;
        phi = Math.sin(theta * 3.0) * 0.28 + (Math.random() - 0.5) * 0.15;
        col = palette[Math.random() > 0.5 ? 2 : 3];
      } else {
        // Layer 3: Galactic Disc & Deep Cosmic Stardust
        radius = 20 + Math.random() * 150;
        theta = Math.random() * Math.PI * 2;
        phi = (Math.random() - 0.5) * Math.PI * 0.85;
        col = palette[Math.floor(Math.random() * palette.length)];
      }

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi) * 0.55;
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const nebulaGeo = new T.BufferGeometry();
    nebulaGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
    nebulaGeo.setAttribute('color', new T.BufferAttribute(colors, 3));

    const nebulaMat = new T.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: T.AdditiveBlending,
      depthWrite: false
    });

    const nebulaPoints = new T.Points(nebulaGeo, nebulaMat);
    nebulaPoints.name = 'volumetric_nebula_stardust';
    group.add(nebulaPoints);

    // High-Subdivision Gas Giant with Real Planetary Rings
    if (T.SphereGeometry && T.RingGeometry) {
      const planetGroup = new T.Group();
      planetGroup.position.set(-45, 12, -90);

      const planetMat = new T.MeshStandardMaterial({
        color: 0x4f46e5,
        roughness: 0.65,
        metalness: 0.15
      });
      const planetMesh = new T.Mesh(new T.SphereGeometry(28, 48, 36), planetMat);
      planetGroup.add(planetMesh);

      const ringMat = new T.MeshStandardMaterial({
        color: 0xc4b5fd,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.75,
        roughness: 0.5
      });
      const ringMesh = new T.Mesh(new T.RingGeometry(35, 68, 96), ringMat);
      ringMesh.rotation.x = Math.PI * 0.42;
      planetGroup.add(ringMesh);

      group.add(planetGroup);
    }

    if (animators) {
      animators.push((time) => {
        nebulaPoints.rotation.y = time * 0.02;
        nebulaPoints.rotation.z = time * 0.008;
      });
    }

    return group;
  }

  // 2. CYBERPUNK: Reflective Wet Asphalt Base Plane + Realistic Skyscraper Facades (Zero Raw Wireframes)
  if (biome === 'cyber') {
    const baseGeo = new T.PlaneGeometry(260, 260, 32, 32);
    baseGeo.rotateX(-Math.PI / 2);
    const baseMat = new T.MeshStandardMaterial({
      color: 0x050711,
      roughness: 0.12,
      metalness: 0.92
    });
    const baseMesh = new T.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.0;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Wet Pavement Tile Seams (Reflective, Non-Wireframe)
    const gridGeo = new T.PlaneGeometry(260, 260, 52, 52);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new T.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.22,
      metalness: 0.85,
      transparent: true,
      opacity: 0.65
    });
    const gridMesh = new T.Mesh(gridGeo, gridMat);
    gridMesh.position.y = -0.92;
    group.add(gridMesh);

    // 18 Realistic Cyber Skyscraper Architectural Spires
    const spireMat = new T.MeshStandardMaterial({
      color: 0x090e1a,
      emissive: 0x001525,
      roughness: 0.18,
      metalness: 0.88
    });

    for (let s = 0; s < 18; s++) {
      const w = 4 + Math.random() * 5;
      const h = 15 + Math.random() * 35;
      const d = 4 + Math.random() * 5;
      const spireGeo = new T.BoxGeometry(w, h, d);
      const spireMesh = new T.Mesh(spireGeo, spireMat);

      const angle = (s / 18) * Math.PI * 2;
      const dist = 55 + Math.random() * 45;
      spireMesh.position.set(Math.cos(angle) * dist, h / 2 - 1, Math.sin(angle) * dist);
      spireMesh.castShadow = true;
      spireMesh.receiveShadow = true;
      group.add(spireMesh);
    }

    if (animators) {
      animators.push((time) => {
        gridMat.opacity = 0.55 + Math.sin(time * 2.5) * 0.12;
      });
    }

    return group;
  }

  // 3. PROCEDURAL HEIGHTFIELD DISPLACEMENT TERRAINS (desert, glacial, jungle, temple, sacred_river, sanctuary)
  const segs = (biome === 'glacial' || biome === 'desert' || biome === 'jungle') ? 64 : 48;
  const terrainGeo = new T.PlaneGeometry(260, 260, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  let terrainMat;

  if (biome === 'desert') {
    // Rolling sand dunes displacement using harmonic sine/cosine waves
    const isSaltFlat = (env.terrainPreset || '').includes('salt');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = 0;
      if (isSaltFlat) {
        y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.4 - 0.5;
      } else {
        const d1 = Math.sin(x * 0.035 + z * 0.015) * 4.5;
        const d2 = Math.cos(x * 0.018 - z * 0.032) * 3.8;
        const d3 = Math.sin((x + z) * 0.075) * 0.9;
        y = d1 + d2 + d3 - 1.8;
      }
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: isSaltFlat ? 0xf3f4f6 : 0xd4a373,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });

  } else if (biome === 'glacial') {
    // Jagged mountain peaks with sharp angular displacement and icy specular sheen
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const valleyTaper = Math.min(1.0, Math.pow(distFromCenter / 75, 1.8));

      const p1 = Math.abs(Math.sin(x * 0.026) * Math.cos(z * 0.026)) * 24;
      const p2 = Math.sin(x * 0.062 + 1.2) * Math.cos(z * 0.062 - 0.8) * 7.5;
      const p3 = Math.abs(Math.sin((x - z) * 0.045)) * 9;
      const y = (p1 + p2 + p3) * valleyTaper - 3.2;
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.28,
      metalness: 0.55,
      flatShading: true
    });

  } else if (biome === 'jungle') {
    // Dense canopy undulations, deep valleys and steep forested ridges
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r1 = Math.sin(x * 0.038) * Math.cos(z * 0.038) * 8.0;
      const r2 = Math.sin(x * 0.072 + 0.5) * 3.4;
      const r3 = Math.cos(z * 0.065 - 0.3) * 2.6;
      const y = r1 + r2 + r3 - 2.8;
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: 0x143d24,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true
    });

  } else if (biome === 'temple') {
    // Sacred stone courtyard with stepped plinth
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.max(Math.abs(x), Math.abs(z));
      let y = -0.6;
      if (dist < 40) y = 0.4;
      else if (dist < 75) y = 0.0;
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: 0x9a8c73,
      roughness: 0.65,
      metalness: 0.12,
      flatShading: true
    });

  } else if (biome === 'sacred_river') {
    // Depressed riverbed channel with stone slopes and stepped ghats
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = 0;
      if (z > -15 && z < 45) {
        y = -2.2;
      } else {
        const distFromBank = z <= -15 ? (-15 - z) : (z - 45);
        y = Math.min(6.5, distFromBank * 0.15) + Math.sin(x * 0.04) * 0.6;
      }
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: 0x786c5e,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

  } else {
    // Sanctuary & Default: Lush rolling hills with gentle undulating elevation
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h1 = Math.sin(x * 0.026) * 4.2;
      const h2 = Math.cos(z * 0.024) * 3.6;
      const h3 = Math.sin((x + z) * 0.055) * 1.5;
      const y = h1 + h2 + h3 - 2.0;
      pos.setY(i, y);
    }
    terrainMat = new T.MeshStandardMaterial({
      color: 0x2d4a22,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true
    });
  }

  terrainGeo.computeVertexNormals();
  const terrainMesh = new T.Mesh(terrainGeo, terrainMat);
  terrainMesh.name = 'biome_terrain_' + biome;
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // If water body exists or sacred river: add reflective water plane
  if (biome === 'sacred_river' || env.hasWaterBody) {
    const waterGeo = new T.PlaneGeometry(240, 160, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const origWaterY = new Float32Array(waterGeo.attributes.position.array);
    const waterMat = new T.MeshStandardMaterial({
      color: 0x050c18,
      roughness: 0.08,
      metalness: 0.92,
      transparent: true,
      opacity: 0.72
    });
    const waterMesh = new T.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.4, 15);
    waterMesh.name = 'water_plane';
    waterMesh.receiveShadow = true;
    group.add(waterMesh);

    if (animators) {
      animators.push((time, delta) => {
        const wPos = waterGeo.attributes ? waterGeo.attributes.position : null;
        if (!wPos || !wPos.array) return;
        for (let i = 0; i < wPos.count; i++) {
          const idx = i * 3;
          const x = origWaterY[idx];
          const z = origWaterY[idx + 2];
          const wave = Math.sin(x * 0.12 + time * 2.2) * Math.cos(z * 0.08 + time * 1.6) * 0.06
                     + Math.sin((x - z) * 0.15 + time * 2.8) * 0.025;
          wPos.setY(i, origWaterY[idx + 1] + wave);
        }
        wPos.needsUpdate = true;
      });
    }
  }

  return group;
}

/**
 * Configures dynamic real-time lighting with DirectionalLight, AmbientLight,
 * soft shadows, and atmospheric exponential fog.
 * 
 * @param {object} ThreeInstance - Three.js library instance
 * @param {object} scene - THREE.Scene instance
 * @param {object} realmData - Catalog entry with environment data
 * @param {Array} realmObjects - Array tracking active realm objects for cleanup
 */
export function setupDynamicLighting(ThreeInstance, scene, realmData, realmObjects = []) {
  const T = ThreeInstance || THREE;
  const env = (realmData && realmData.environment) || {};
  const biome = env.biome || 'sanctuary';

  // 1. Directional Sun/Star Light positioned at sunPosition with PCFSoftShadowMap
  const sunPos = Array.isArray(env.sunPosition) && env.sunPosition.length === 3
    ? env.sunPosition
    : [60, 75, 45];

  let sunColor = 0xfffaed;
  let sunIntensity = 1.4;
  if (biome === 'cyber') {
    sunColor = 0x00f0ff;
    sunIntensity = 1.6;
  } else if (biome === 'glacial') {
    sunColor = 0xdbeafe;
    sunIntensity = 1.5;
  } else if (biome === 'desert') {
    sunColor = 0xffeed4;
    sunIntensity = 1.65;
  } else if (biome === 'cosmic') {
    sunColor = 0xd8b4fe;
    sunIntensity = 0.85;
  }

  const dirLight = new T.DirectionalLight(sunColor, sunIntensity);
  dirLight.name = 'sun_directional_light';
  dirLight.position.set(sunPos[0], sunPos[1], sunPos[2]);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 600;
  const d = 140;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0004;
  scene.add(dirLight);
  realmObjects.push(dirLight);

  // 2. Ambient Light tinted with skyColor
  const skyColor = typeof env.skyColor === 'number' ? env.skyColor : 0x111625;
  const ambIntensity = biome === 'cosmic' ? 0.45 : (biome === 'cyber' ? 0.6 : 0.85);
  const ambLight = new T.AmbientLight(skyColor, ambIntensity);
  ambLight.name = 'sky_ambient_light';
  scene.add(ambLight);
  realmObjects.push(ambLight);

  // 3. Atmospheric Exponential Fog
  const fogDensity = typeof env.fogDensity === 'number' ? env.fogDensity : 0.002;
  scene.fog = new T.FogExp2(skyColor, fogDensity);

  // 4. Secondary Point Light Accents
  if (biome === 'sacred_river') {
    const riverGlow = new T.PointLight(0xffa028, 2.5, 50);
    riverGlow.position.set(0, 3, 10);
    scene.add(riverGlow);
    realmObjects.push(riverGlow);
  } else if (biome === 'cyber') {
    const cyberGlow = new T.PointLight(0x00ffff, 3.0, 60);
    cyberGlow.position.set(0, 5, 0);
    scene.add(cyberGlow);
    realmObjects.push(cyberGlow);
  } else if (biome === 'glacial') {
    const icyGlow = new T.PointLight(0x60a5fa, 2.0, 70);
    icyGlow.position.set(0, 10, -20);
    scene.add(icyGlow);
    realmObjects.push(icyGlow);
  }
}

/**
 * SceneManager - Master 3D Spatial Scene Manager
 */
export class SceneManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.T = options.THREE || THREE;
    this.scene = new this.T.Scene();
    this.textureLoader = new this.T.TextureLoader();
    this.loadedTextures = new Map();
    this.videoTextureManager = new VideoTextureManager(this.T);
    this.clock = new this.T.Clock();
    this.isAnimationLoopActive = false;
    this.skydomeMesh = null;
    this.currentRealmObjects = [];
    this.animators = [];

    this.initRenderer();
    this.initCamera();
    this.initSkydome();
  }

  initRenderer() {
    this.renderer = new this.T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.T.PCFSoftShadowMap;
    if (this.T.sRGBEncoding) this.renderer.outputEncoding = this.T.sRGBEncoding;
    if (this.container) this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new this.T.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1500);
    this.camera.position.set(0, 5, 25);
  }

  initSkydome() {
    // Feature F4: Authentic 3D Spherical Skydome Geometry (radius >= 100, BackSide)
    const skydomeGeo = new this.T.SphereGeometry(300, 60, 40);
    const skydomeMat = new this.T.MeshBasicMaterial({
      color: 0x050a16,
      side: this.T.BackSide,
      depthWrite: false
    });
    this.skydomeMesh = new this.T.Mesh(skydomeGeo, skydomeMat);
    this.skydomeMesh.name = 'SkydomeSphere';
    this.skydomeMesh.renderOrder = -1000;
    this.scene.add(this.skydomeMesh);

    // Panoramic Backdrop Cylinder & Polar Caps (Eliminates Polar Pinch / Black Holes)
    if (this.T.CylinderGeometry && this.T.CircleGeometry) {
      const panoGeo = new this.T.CylinderGeometry(280, 280, 220, 64, 1, true);
      if (panoGeo.scale) panoGeo.scale(-1, 1, 1);
      const panoMat = new this.T.MeshBasicMaterial({
        side: this.T.BackSide,
        transparent: false,
        opacity: 1.0,
        depthWrite: true
      });
      this.panoramicCylinderMesh = new this.T.Mesh(panoGeo, panoMat);
      this.panoramicCylinderMesh.name = 'PanoramicBackdropCylinder';
      this.panoramicCylinderMesh.position.set(0, 15, 0);
      this.panoramicCylinderMesh.renderOrder = -950;
      this.scene.add(this.panoramicCylinderMesh);

      // Zenith Top Cap (Smooth sky dome disc covering upper pole without gaps)
      const zenithGeo = new this.T.CircleGeometry(285, 64);
      if (zenithGeo.rotateX) zenithGeo.rotateX(Math.PI / 2);
      const zenithMat = new this.T.MeshBasicMaterial({
        color: 0x050a16,
        side: this.T.DoubleSide,
        depthWrite: true
      });
      this.zenithCapMesh = new this.T.Mesh(zenithGeo, zenithMat);
      this.zenithCapMesh.position.set(0, 125, 0);
      this.zenithCapMesh.name = 'ZenithCap';
      this.zenithCapMesh.renderOrder = -900;
      this.scene.add(this.zenithCapMesh);

      // Nadir Bottom Cap (Smooth nadir disc covering lower pole without gaps)
      const nadirGeo = new this.T.CircleGeometry(285, 64);
      if (nadirGeo.rotateX) nadirGeo.rotateX(-Math.PI / 2);
      const nadirMat = new this.T.MeshBasicMaterial({
        color: 0x050a16,
        side: this.T.DoubleSide,
        depthWrite: true
      });
      this.nadirCapMesh = new this.T.Mesh(nadirGeo, nadirMat);
      this.nadirCapMesh.position.set(0, -95, 0);
      this.nadirCapMesh.name = 'NadirCap';
      this.nadirCapMesh.renderOrder = -900;
      this.scene.add(this.nadirCapMesh);
    }
  }

  loadSkydomeTexture(bgImagePath, fallbackColorHex = 0x0a1026) {
    if (!this.skydomeMesh) return;
    this.skydomeMesh.visible = true;
    const fallbackColor = new this.T.Color(fallbackColorHex);

    this.skydomeMesh.material.map = null;
    this.skydomeMesh.material.color = fallbackColor;
    this.skydomeMesh.material.needsUpdate = true;

    if (this.zenithCapMesh) {
      this.zenithCapMesh.material.color = fallbackColor;
      this.zenithCapMesh.material.needsUpdate = true;
    }
    if (this.nadirCapMesh) {
      this.nadirCapMesh.material.color = fallbackColor;
      this.nadirCapMesh.material.needsUpdate = true;
    }
    if (this.panoramicCylinderMesh) {
      this.panoramicCylinderMesh.material.map = null;
      this.panoramicCylinderMesh.material.color = fallbackColor;
      this.panoramicCylinderMesh.material.needsUpdate = true;
    }

    if (!bgImagePath) return;

    const applyTexture = (texture) => {
      if (this.skydomeMesh) {
        this.skydomeMesh.material.map = null;
        this.skydomeMesh.material.color = fallbackColor;
        this.skydomeMesh.material.needsUpdate = true;
      }
      if (this.panoramicCylinderMesh) {
        this.panoramicCylinderMesh.material.map = texture;
        this.panoramicCylinderMesh.material.color.setHex(0xffffff);
        this.panoramicCylinderMesh.material.needsUpdate = true;
      }
    };

    if (this.loadedTextures.has(bgImagePath)) {
      applyTexture(this.loadedTextures.get(bgImagePath));
      return;
    }

    this.textureLoader.load(
      bgImagePath,
      (texture) => {
        texture.mapping = this.T.EquirectangularReflectionMapping;
        if (this.T.sRGBEncoding) texture.encoding = this.T.sRGBEncoding;
        this.loadedTextures.set(bgImagePath, texture);
        applyTexture(texture);
      },
      undefined,
      (err) => {
        console.warn(`[SceneManager] Failed to load skydome texture: ${bgImagePath}`, err);
        if (this.skydomeMesh) {
          this.skydomeMesh.material.map = null;
          this.skydomeMesh.material.color = fallbackColor;
          this.skydomeMesh.material.needsUpdate = true;
        }
      }
    );
  }

  buildRealm(realmData) {
    this.clearRealm();

    // 1. Skydome
    const skyHex = (realmData && realmData.environment && realmData.environment.skyColor) || 0x0a1026;
    this.loadSkydomeTexture(realmData.bgImage, skyHex);

    // 2. Procedural Terrain
    const terrainGroup = createProceduralTerrain(this.T, realmData, this.animators);
    this.scene.add(terrainGroup);
    this.currentRealmObjects.push(terrainGroup);

    // 3. Dynamic Lighting & Fog
    setupDynamicLighting(this.T, this.scene, realmData, this.currentRealmObjects);

    // 4. Milestone M3 Flagship Showcase Scenes (F8, F9, F10)
    attachFlagshipScene(this.T, this.scene, realmData, this.currentRealmObjects, this.animators);

    // 5. Milestone M4 Multimedia & VideoTexture Gateway (F11)
    if (realmData && realmData.videoLoop && this.videoTextureManager) {
      const videoTex = this.videoTextureManager.createVideoTexture(realmData.videoLoop, realmData.category);
      const portalMesh = this.videoTextureManager.createDimensionalPortalMesh(videoTex);
      this.scene.add(portalMesh);
      this.currentRealmObjects.push(portalMesh);
      this.animators.push((time, delta) => this.videoTextureManager.update(time, delta));
    }
  }

  clearRealm() {
    this.currentRealmObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.traverse) {
        obj.traverse(child => {
          if (child.geometry && child.geometry.dispose) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose && m.dispose());
            else if (child.material.dispose) child.material.dispose();
          }
        });
      } else {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
          else if (obj.material.dispose) obj.material.dispose();
        }
      }
    });
    this.currentRealmObjects = [];
    this.animators = [];
    this.scene.fog = null;

    if (this.videoTextureManager) {
      this.videoTextureManager.disposeAll();
    }
  }

  render(delta) {
    const rawDelta = delta !== undefined ? delta : (this.clock ? this.clock.getDelta() : 0.016);
    const clampedDelta = Math.min(Math.max(rawDelta, 0.001), 0.1);
    const time = this.clock ? this.clock.getElapsedTime() : performance.now() * 0.001;

    for (let i = 0; i < this.animators.length; i++) {
      try {
        this.animators[i](time, clampedDelta);
      } catch (err) {
        console.warn('[SceneManager] Animator error suppressed:', err);
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  startAnimationLoop() {
    this.isAnimationLoopActive = true;
    const loop = () => {
      if (!this.isAnimationLoopActive) return;
      this.render();
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(loop);
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(loop);
    }
  }

  stopAnimationLoop() {
    this.isAnimationLoopActive = false;
  }
}

export default SceneManager;
