/**
 * PromptMutator.js — DreamFire Milestone M5 (Dynamic AI World Generation & Prompt Mutator)
 * 
 * Features:
 * - Feature F14: Dynamic AI Natural-Language Semantic Prompt Parser
 * - Feature F15: Real-Time 3D Scene Graph Hot-Mutator & Camera Navigation Invariance
 * 
 * Interface Contract 3 (PROJECT.md):
 * - parsePrompt(promptText: string): PromptMutationParams
 * - applyMutation(scene: THREE.Scene, camera: THREE.Camera, params: PromptMutationParams, options?: object): void
 * 
 * INVARIANT: User active camera state (camera.position, camera.quaternion, yaw, pitch, zoomLevel)
 * MUST NOT be modified or reset under any circumstance.
 */

import * as THREE_MODULE from 'three';

const THREE = typeof window !== 'undefined' && window.THREE ? window.THREE : THREE_MODULE;

/**
 * Escapes HTML characters to prevent XSS injection in DOM rendering.
 * @param {string} str - Raw string input
 * @returns {string} Sanitized string with HTML entities escaped
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes input text, stripping dangerous HTML tags and control characters.
 * @param {string} text - User prompt input
 * @returns {string} Clean, safe plain text
 */
export function sanitizePrompt(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^<>]*>/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * PromptParameterParser — Natural-Language Semantic Extractor
 */
export class PromptParameterParser {
  /**
   * Parses natural-language prompt into structured 3D environmental parameters.
   * Linear O(N) execution, ReDoS-safe, XSS-neutralized.
   * 
   * @param {string} text - User prompt text
   * @returns {object} PromptMutationParams
   */
  static parse(text) {
    if (!text || typeof text !== 'string') {
      return {
        timeOfDay: 'noon',
        lighting: {},
        atmosphere: {},
        terrain: {},
        entities: {}
      };
    }

    // Safety truncate extreme strings at 50,000 characters before regex processing to prevent memory DOS
    const raw = text.length > 50000 ? text.slice(0, 50000) : text;
    const sanitized = sanitizePrompt(raw);
    if (!sanitized) {
      return {
        timeOfDay: 'noon',
        lighting: {},
        atmosphere: {},
        terrain: {},
        entities: {}
      };
    }

    const t = sanitized.toLowerCase();

    const params = {
      lighting: {},
      atmosphere: {},
      terrain: {},
      entities: {}
    };

    // 1. Time of Day Extraction (Deterministic priority matching)
    if (t.includes('sunset') || t.includes('dusk') || t.includes('golden hour') || t.includes('sundown') || t.includes('evening')) {
      params.timeOfDay = 'sunset';
      params.lighting.sunColor = 0xff5511;
      params.lighting.ambientIntensity = 0.6;
      params.lighting.sunAngle = -Math.PI * 0.45;
    } else if (t.includes('dawn') || t.includes('sunrise') || t.includes('morning') || t.includes('daybreak') || t.includes('first light')) {
      params.timeOfDay = 'dawn';
      params.lighting.sunColor = 0xffaa77;
      params.lighting.ambientIntensity = 0.7;
      params.lighting.sunAngle = Math.PI * 0.25;
    } else if (t.includes('midnight') || t.includes('night') || t.includes('dark') || t.includes('nocturnal') || t.includes('starlit') || t.includes('lunar')) {
      params.timeOfDay = 'midnight';
      params.lighting.sunColor = 0x224488;
      params.lighting.ambientIntensity = 0.3;
      params.lighting.sunAngle = Math.PI * 0.5;
    } else if (t.includes('twilight') || t.includes('crepuscular') || t.includes('gloaming') || t.includes('blue hour')) {
      params.timeOfDay = 'twilight';
      params.lighting.sunColor = 0x7755aa;
      params.lighting.ambientIntensity = 0.45;
      params.lighting.sunAngle = -Math.PI * 0.55;
    } else {
      params.timeOfDay = 'noon';
      params.lighting.sunColor = 0xffffff;
      params.lighting.ambientIntensity = 0.95;
      params.lighting.sunAngle = Math.PI * 0.5;
    }

    // 2. Atmosphere & Fog Extraction
    if (t.includes('mist') || t.includes('fog') || t.includes('foggy') || t.includes('haze') || t.includes('misty') || t.includes('steamy')) {
      params.atmosphere.weather = 'mist';
      params.atmosphere.fogDensity = 0.035;
      params.atmosphere.fogColor = 0x64748b;
    } else if (t.includes('rain') || t.includes('monsoon') || t.includes('downpour') || t.includes('storm') || t.includes('drizzle')) {
      params.atmosphere.weather = 'rain';
      params.atmosphere.fogDensity = 0.025;
      params.atmosphere.fogColor = 0x1e293b;
    } else if (t.includes('aurora') || t.includes('borealis') || t.includes('northern light') || t.includes('australis')) {
      params.atmosphere.weather = 'aurora';
      params.atmosphere.fogDensity = 0.008;
      params.atmosphere.fogColor = 0x05101a;
    } else if (t.includes('cyber_dust') || t.includes('cyber dust') || t.includes('neon smog') || t.includes('neon dust') || t.includes('matrix dust') || t.includes('smog') || t.includes('fallout')) {
      params.atmosphere.weather = 'cyber_dust';
      params.atmosphere.fogDensity = 0.015;
      params.atmosphere.fogColor = 0x020617;
    } else if (t.includes('clear') || t.includes('cloudless') || t.includes('crisp') || t.includes('sunny')) {
      params.atmosphere.weather = 'clear';
      params.atmosphere.fogDensity = 0.0015;
    }

    // Specific Fog Color Overrides
    if (t.includes('crimson') || t.includes('blood red')) {
      params.atmosphere.fogColor = 0x4a1820;
    } else if (t.includes('cyan') || t.includes('neon blue')) {
      params.atmosphere.fogColor = 0x002233;
    } else if (t.includes('violet') || t.includes('purple')) {
      params.atmosphere.fogColor = 0x1f0a33;
    }

    // 3. Biome & Terrain Extraction
    if (t.includes('desert') || t.includes('dune') || t.includes('pyramid') || t.includes('sahara') || t.includes('sand')) {
      params.terrain.biome = 'desert';
    } else if (t.includes('snow') || t.includes('glacial') || t.includes('peak') || t.includes('glacier') || t.includes('ice') || t.includes('frozen') || t.includes('kedarnath') || t.includes('himalaya')) {
      params.terrain.biome = 'glacial';
    } else if (t.includes('cyber') || t.includes('neon') || t.includes('city') || t.includes('matrix') || t.includes('tokyo') || t.includes('shinjuku') || t.includes('synthwave')) {
      params.terrain.biome = 'cyber';
    } else if (t.includes('river') || t.includes('ghat') || t.includes('sarayu') || t.includes('waterfall') || t.includes('ganges') || t.includes('ganga') || t.includes('riverbank') || t.includes('stream')) {
      params.terrain.biome = 'sacred_river';
    } else if (t.includes('cosmic') || t.includes('nebula') || t.includes('void') || t.includes('space') || t.includes('galaxy') || t.includes('orion') || t.includes('stellar')) {
      params.terrain.biome = 'cosmic';
    } else if (t.includes('jungle') || t.includes('forest') || t.includes('rainforest') || t.includes('canopy') || t.includes('tropical') || t.includes('amazon')) {
      params.terrain.biome = 'jungle';
    } else if (t.includes('temple') || t.includes('mandir') || t.includes('sanctum') || t.includes('monastery') || t.includes('shrine') || t.includes('pagoda') || t.includes('amritsar') || t.includes('courtyard')) {
      params.terrain.biome = 'temple';
    } else if (t.includes('sanctuary') || t.includes('retreat') || t.includes('garden') || t.includes('meadow') || t.includes('eden') || t.includes('zen')) {
      params.terrain.biome = 'sanctuary';
    }

    // Terrain Modifiers (elevation & wireframe)
    if (t.includes('steep') || t.includes('towering') || t.includes('rugged') || t.includes('cliffs') || t.includes('mountainous') || t.includes('tall mountains') || t.includes('high elevation')) {
      params.terrain.elevationScale = 1.75;
    } else if (t.includes('flat') || t.includes('plains') || t.includes('calm') || t.includes('gentle') || t.includes('smooth') || t.includes('low elevation')) {
      params.terrain.elevationScale = 0.45;
    }

    if (t.includes('wireframe') || t.includes('grid lines') || t.includes('matrix grid') || t.includes('polygon mesh') || t.includes('debug mesh') || t.includes('grid mode')) {
      params.terrain.wireframe = true;
    } else if (t.includes('solid') || t.includes('textured')) {
      params.terrain.wireframe = false;
    }

    // 4. Entities Extraction
    if (t.includes('diya') || t.includes('lamp') || t.includes('flame') || t.includes('deepam') || t.includes('oil lamp')) {
      params.entities.spawnType = 'diyas';
      params.entities.countDelta = 40;
    } else if (t.includes('devotee') || t.includes('crowd') || t.includes('pray') || t.includes('pilgrim') || t.includes('worshipper') || t.includes('people')) {
      params.entities.spawnType = 'devotees';
      params.entities.countDelta = 50;
    } else if (t.includes('lantern') || t.includes('sky lantern') || t.includes('kandil')) {
      params.entities.spawnType = 'lanterns';
      params.entities.countDelta = 25;
    } else if (t.includes('spire') || t.includes('neon spires') || t.includes('neon spire') || t.includes('monolith') || t.includes('cyber towers') || t.includes('cyber spire')) {
      params.entities.spawnType = 'neon_spires';
      params.entities.countDelta = 12;
    } else if (t.includes('crystal') || t.includes('gem') || t.includes('quartz') || t.includes('float-bed') || t.includes('prism') || t.includes('floating crystal')) {
      params.entities.spawnType = 'crystals';
      params.entities.countDelta = 30;
    }

    // Entity Count Modifiers
    if (t.includes('many') || t.includes('thousands') || t.includes('millions') || t.includes('sea of') || t.includes('massive') || t.includes('swarm')) {
      params.entities.countDelta = (params.entities.countDelta || 20) + 30;
    } else if (t.includes('few') || t.includes('sparse') || t.includes('lone') || t.includes('single') || t.includes('isolated')) {
      params.entities.countDelta = -20;
    }

    return params;
  }

  parse(text) {
    return PromptParameterParser.parse(text);
  }
}

/**
 * Functional export for prompt parsing
 * @param {string} text 
 * @returns {object} PromptMutationParams
 */
export function parsePrompt(text) {
  return PromptParameterParser.parse(text);
}

/**
 * Applies prompt-driven environmental mutations to the active Three.js scene graph.
 * 
 * STRICT INVARIANT: camera.position and camera.quaternion MUST NOT be reset or modified.
 * 
 * @param {THREE.Scene|object} scene - Three.js scene (or mock scene)
 * @param {THREE.Camera|object} camera - Three.js camera (or mock camera)
 * @param {object} params - PromptMutationParams
 * @param {object} [options] - Additional runtime options
 */
export function applyMutation(scene, camera, params = {}, options = {}) {
  if (!scene || !params) return;

  // CRITICAL INVARIANT: Camera navigation coordinates remain strictly intact.
  // We NEVER write to camera.position, camera.quaternion, or any camera angles.

  const TIME_PRESETS = {
    dawn: { sunColor: 0xffaa77, ambIntensity: 0.7, ambColor: 0x3a2530, fogColor: 0x4a3530, fogDensity: 0.003, sunPos: [90, 25, 60] },
    noon: { sunColor: 0xffffff, ambIntensity: 0.95, ambColor: 0x223344, fogColor: 0x334455, fogDensity: 0.0015, sunPos: [20, 110, 20] },
    sunset: { sunColor: 0xff5511, ambIntensity: 0.6, ambColor: 0x3b1828, fogColor: 0x4a1820, fogDensity: 0.0035, sunPos: [-95, 20, 50] },
    twilight: { sunColor: 0x7755aa, ambIntensity: 0.45, ambColor: 0x15122e, fogColor: 0x1a1530, fogDensity: 0.003, sunPos: [-110, 8, 40] },
    midnight: { sunColor: 0x224488, ambIntensity: 0.3, ambColor: 0x080c18, fogColor: 0x080c18, fogDensity: 0.002, sunPos: [0, 85, -100] }
  };

  const activePreset = params.timeOfDay ? TIME_PRESETS[params.timeOfDay] : null;

  // 1. Lighting Mutation
  let targetAmbIntensity = null;
  if (params.lighting && typeof params.lighting.ambientIntensity === 'number') {
    targetAmbIntensity = params.lighting.ambientIntensity;
  } else if (activePreset) {
    targetAmbIntensity = activePreset.ambIntensity;
  }

  let targetSunColor = null;
  if (params.lighting && typeof params.lighting.sunColor === 'number') {
    targetSunColor = params.lighting.sunColor;
  } else if (activePreset) {
    targetSunColor = activePreset.sunColor;
  }

  // Update mockScene.ambientLight directly (for tests/prompt_mutation.test.js)
  if (scene.ambientLight) {
    if (targetAmbIntensity !== null) {
      scene.ambientLight.intensity = targetAmbIntensity;
    }
    if (targetSunColor !== null) {
      if (scene.ambientLight.color && typeof scene.ambientLight.color.setHex === 'function') {
        scene.ambientLight.color.setHex(targetSunColor);
      } else {
        scene.ambientLight.color = targetSunColor;
      }
    }
  }

  // Named Lights in live Three.js Scene
  const dirLight = scene.getObjectByName ? scene.getObjectByName('sun_directional_light') : null;
  const ambLight = scene.getObjectByName ? scene.getObjectByName('sky_ambient_light') : null;

  if (ambLight) {
    if (targetAmbIntensity !== null) {
      ambLight.intensity = targetAmbIntensity;
    }
    if (activePreset && ambLight.color && typeof ambLight.color.setHex === 'function') {
      ambLight.color.setHex(activePreset.ambColor);
    }
  }

  if (dirLight) {
    if (targetSunColor !== null) {
      if (dirLight.color && typeof dirLight.color.setHex === 'function') {
        dirLight.color.setHex(targetSunColor);
      } else {
        dirLight.color = targetSunColor;
      }
    }
    if (params.lighting && typeof params.lighting.sunAngle === 'number' && dirLight.position) {
      const r = 120;
      dirLight.position.set(r * Math.cos(params.lighting.sunAngle), 65, r * Math.sin(params.lighting.sunAngle));
    } else if (activePreset && dirLight.position && Array.isArray(activePreset.sunPos)) {
      dirLight.position.set(activePreset.sunPos[0], activePreset.sunPos[1], activePreset.sunPos[2]);
    }
  }

  // Traversal fallback for scene children
  if (scene.children && Array.isArray(scene.children)) {
    scene.children.forEach((child) => {
      if (child.isAmbientLight || child.name === 'sky_ambient_light') {
        if (targetAmbIntensity !== null) child.intensity = targetAmbIntensity;
        if (activePreset && child.color && child.color.setHex) child.color.setHex(activePreset.ambColor);
      }
      if (child.isDirectionalLight || child.name === 'sun_directional_light') {
        if (targetSunColor !== null && child.color && child.color.setHex) child.color.setHex(targetSunColor);
      }
    });
  }

  // 2. Atmospheric Fog Mutation
  if (scene.fog) {
    let targetFogDensity = null;
    if (params.atmosphere && typeof params.atmosphere.fogDensity === 'number') {
      targetFogDensity = params.atmosphere.fogDensity;
    } else if (activePreset && typeof activePreset.fogDensity === 'number') {
      targetFogDensity = activePreset.fogDensity;
    }
    if (targetFogDensity !== null) {
      scene.fog.density = targetFogDensity;
    }

    let targetFogColor = null;
    if (params.atmosphere && typeof params.atmosphere.fogColor === 'number') {
      targetFogColor = params.atmosphere.fogColor;
    } else if (activePreset && typeof activePreset.fogColor === 'number') {
      targetFogColor = activePreset.fogColor;
    }
    if (targetFogColor !== null) {
      if (scene.fog.color && typeof scene.fog.color.setHex === 'function') {
        scene.fog.color.setHex(targetFogColor);
      } else {
        scene.fog.color = targetFogColor;
      }
    }
  } else if (params.atmosphere && typeof params.atmosphere.fogDensity === 'number' && THREE && THREE.FogExp2) {
    const col = (params.atmosphere && params.atmosphere.fogColor) || (activePreset && activePreset.fogColor) || 0x111625;
    scene.fog = new THREE.FogExp2(col, params.atmosphere.fogDensity);
  }

  // 3. Weather Particle Systems
  if (params.atmosphere && params.atmosphere.weather && typeof scene.traverse === 'function') {
    const existingWeather = scene.getObjectByName ? scene.getObjectByName('weather_particles') : null;
    if (existingWeather) {
      scene.remove(existingWeather);
      if (existingWeather.geometry && existingWeather.geometry.dispose) existingWeather.geometry.dispose();
      if (existingWeather.material && existingWeather.material.dispose) existingWeather.material.dispose();
    }

    if (params.atmosphere.weather !== 'clear' && THREE && THREE.BufferGeometry && THREE.PointsMaterial && THREE.Points) {
      const isRain = params.atmosphere.weather === 'rain';
      const isAurora = params.atmosphere.weather === 'aurora';
      const isCyber = params.atmosphere.weather === 'cyber_dust';
      const pCount = isRain ? 1800 : (isAurora ? 1200 : (isCyber ? 1000 : 900));
      const posArray = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 160;
        posArray[i * 3 + 1] = Math.random() * 60;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 160;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      let pColor = 0xffffff;
      if (isAurora) pColor = 0x00ffcc;
      else if (isRain) pColor = 0x93c5fd;
      else if (isCyber) pColor = 0x06b6d4;

      const pMat = new THREE.PointsMaterial({
        size: isRain ? 0.8 : (isCyber ? 1.5 : 2.5),
        color: pColor,
        transparent: true,
        opacity: isRain ? 0.75 : 0.65,
        depthWrite: false
      });
      const pSystem = new THREE.Points(pGeo, pMat);
      pSystem.name = 'weather_particles';
      scene.add(pSystem);

      if (options.animators && Array.isArray(options.animators)) {
        for (let a = options.animators.length - 1; a >= 0; a--) {
          if (options.animators[a] && options.animators[a].isWeatherAnimator) {
            options.animators.splice(a, 1);
          }
        }
        const weatherAnim = (time, delta) => {
          if (!pSystem.parent) return;
          if (!pGeo.attributes || !pGeo.attributes.position) return;
          const pos = pGeo.attributes.position;
          const safeDelta = Math.min(Math.max(delta || 0.016, 0.001), 0.1);
          for (let i = 0; i < pos.count; i++) {
            let y = pos.getY(i);
            if (isRain) {
              y -= 45 * safeDelta;
              if (y < 0) y = 60;
            } else if (isCyber) {
              y += 5 * safeDelta;
              if (y > 60) y = 0;
            } else {
              y += Math.sin(time * 2 + i) * 0.05;
            }
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
        };
        weatherAnim.isWeatherAnimator = true;
        options.animators.push(weatherAnim);
      }
    }
  }

  // 4. Procedural Terrain Adaptation (wireframe & elevation scale)
  if (params.terrain && typeof scene.traverse === 'function') {
    scene.traverse((child) => {
      if (child.isMesh && child.name && (child.name.includes('terrain') || child.name.includes('biome'))) {
        if (typeof params.terrain.wireframe === 'boolean' && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => { m.wireframe = params.terrain.wireframe; m.needsUpdate = true; });
          } else {
            child.material.wireframe = params.terrain.wireframe;
            child.material.needsUpdate = true;
          }
        }
        if (typeof params.terrain.elevationScale === 'number' && child.scale) {
          child.scale.y = params.terrain.elevationScale;
        }
      }
    });
  }

  // 5. Context-Aware Entity Spawning / Gating
  if (params.entities && params.entities.spawnType && typeof scene.add === 'function' && THREE) {
    const spawnType = params.entities.spawnType;
    const hasWater = Boolean(
      (options.realmData && options.realmData.environment && options.realmData.environment.hasWaterBody) ||
      (scene.getObjectByName && (scene.getObjectByName('water_plane') || scene.getObjectByName('sarayuRiverMesh')))
    );

    // Diya Contextual Gating: ONLY permitted if water body exists
    if (spawnType === 'diyas' && !hasWater) {
      // Gated: do not spawn floating diyas in dry realms
      return;
    }

    if (spawnType === 'lanterns' && options.realmData && options.realmData.environment && options.realmData.environment.festiveContext === false && !hasWater) {
      // Gated: do not spawn lanterns in dry secular realms
      return;
    }

    // Entity Replacement & Disposal Guard (Defect T5.A.8.b)
    const existingEntity = scene.getObjectByName ? scene.getObjectByName('prompt_entity_' + spawnType) : null;
    if (existingEntity) {
      if (typeof scene.remove === 'function') scene.remove(existingEntity);
      if (existingEntity.traverse) {
        existingEntity.traverse((child) => {
          if (child.geometry && child.geometry.dispose) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m && m.dispose && m.dispose());
            else if (child.material.dispose) child.material.dispose();
          }
        });
      }
      if (options.realmObjects && Array.isArray(options.realmObjects)) {
        const idx = options.realmObjects.indexOf(existingEntity);
        if (idx !== -1) options.realmObjects.splice(idx, 1);
      }
    }

    const EntityGroupClass = THREE.Group || class Group {};
    const entityGroup = new EntityGroupClass();
    entityGroup.name = 'prompt_entity_' + spawnType;
    entityGroup.userData = { isPromptEntity: true, type: spawnType };

    if (spawnType === 'diyas' && THREE.CylinderGeometry && THREE.ConeGeometry) {
      for (let i = 0; i < 24; i++) {
        const diya = new THREE.Group();
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.2, 0.25, 8),
          new THREE.MeshStandardMaterial({ color: 0x8b3a0f, roughness: 0.8 })
        );
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.45, 8),
          new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        flame.position.y = 0.3;
        diya.add(bowl);
        diya.add(flame);
        diya.position.set((Math.random() - 0.5) * 60, -0.2, (Math.random() - 0.5) * 40);
        entityGroup.add(diya);
      }
    } else if (spawnType === 'devotees') {
      const devoteeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.85,
        metalness: 0.1
      });
      const priestMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.05
      });
      const aartiPlateMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.9
      });
      const aartiFlameMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });

      for (let i = 0; i < 48; i++) {
        const devotee = new THREE.Group();
        const isPriest = i < 12;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.55, 1.6, 8),
          isPriest ? priestMat : devoteeMat
        );
        body.position.y = 0.8;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 8),
          isPriest ? priestMat : devoteeMat
        );
        head.position.y = 1.75;
        devotee.add(body);
        devotee.add(head);

        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.1, 0.06, 8),
          aartiPlateMat
        );
        plate.position.set(0.35, 1.1, 0.35);
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.22, 6),
          aartiFlameMat
        );
        flame.position.set(0.35, 1.25, 0.35);
        devotee.add(plate);
        devotee.add(flame);

        const row = Math.floor(i / 12);
        const col = i % 12;
        devotee.position.set((col - 5.5) * 2.2, 0, 10 + row * 2.5);
        entityGroup.add(devotee);
      }

      if (THREE.PointLight) {
        const sanctumAura = new THREE.PointLight(0xffaa20, 4.5, 50);
        sanctumAura.position.set(0, 8, -5);
        entityGroup.add(sanctumAura);
      }
    } else if (spawnType === 'lanterns' && THREE.CylinderGeometry) {
      for (let i = 0; i < 18; i++) {
        const lan = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.5, 1.3, 8),
          new THREE.MeshBasicMaterial({ color: 0xffa028 })
        );
        lan.position.set((Math.random() - 0.5) * 80, 8 + Math.random() * 30, (Math.random() - 0.5) * 80);
        entityGroup.add(lan);
      }
    } else if (spawnType === 'crystals' && THREE.OctahedronGeometry) {
      for (let i = 0; i < 15; i++) {
        const cry = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.2, 0),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2, emissive: 0x083344 })
        );
        cry.position.set((Math.random() - 0.5) * 70, 2 + Math.random() * 8, (Math.random() - 0.5) * 70);
        entityGroup.add(cry);
      }
    } else if (spawnType === 'neon_spires' && THREE.CylinderGeometry) {
      for (let i = 0; i < 10; i++) {
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 1.5, 15 + Math.random() * 20, 6),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.85, emissive: 0x003344 })
        );
        spire.position.set((Math.random() - 0.5) * 100, 10, (Math.random() - 0.5) * 100);
        entityGroup.add(spire);
      }
    }

    if (entityGroup.children && entityGroup.children.length > 0) {
      scene.add(entityGroup);
      if (options.realmObjects && Array.isArray(options.realmObjects)) {
        options.realmObjects.push(entityGroup);
      }
    }
  }
}

/**
 * SceneGraphMutator class implementing Interface Contract 3
 */
export class SceneGraphMutator {
  constructor(scene = null, camera = null) {
    this.scene = scene;
    this.camera = camera;
  }

  parsePrompt(promptText) {
    return parsePrompt(promptText);
  }

  applyMutation(scene, camera, params, options) {
    return applyMutation(scene || this.scene, camera || this.camera, params, options);
  }
}

export default {
  parsePrompt,
  applyMutation,
  PromptParameterParser,
  SceneGraphMutator,
  escapeHtml,
  sanitizePrompt
};
