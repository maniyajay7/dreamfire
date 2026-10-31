/**
 * ContextualEntities.js
 * Feature F5: Contextual Entity Manager & Diya Elimination
 * 
 * Strict contextual gating:
 * - Floating diyas and Sarayu river planes appear ONLY when:
 *   realm.environment.festiveContext === true && realm.environment.hasWaterBody === true
 * - Sky lanterns appear ONLY when:
 *   realm.environment.festiveContext === true
 * - Secular/dry/cosmic realms (Giza pyramids, Kedarnath glacial peaks, Orion space, Tokyo cyberpunk)
 *   spawn exactly 0 floating diyas, 0 water planes, and 0 rising lanterns.
 */

/**
 * Predicate: determine if floating festive diyas are allowed in this realm
 * @param {object} realm - Realm data object
 * @returns {boolean}
 */
export function canSpawnDiyas(realm) {
  if (!realm || !realm.environment) return false;
  return Boolean(realm.environment.festiveContext === true && realm.environment.hasWaterBody === true);
}

/**
 * Predicate: determine if a water plane is permitted in this realm
 * @param {object} realm - Realm data object
 * @returns {boolean}
 */
export function canSpawnWaterPlane(realm) {
  if (!realm || !realm.environment) return false;
  return Boolean(realm.environment.hasWaterBody === true);
}

/**
 * Predicate: determine if festive sky lanterns are allowed in this realm
 * @param {object} realm - Realm data object
 * @returns {boolean}
 */
export function canSpawnLanterns(realm) {
  if (!realm || !realm.environment) return false;
  return Boolean(realm.environment.festiveContext === true);
}

/**
 * Determine the 3D procedural terrain preset classification for this realm
 * @param {object} realm - Realm data object
 * @returns {'sand_dunes' | 'snow_mountain' | 'riverbank' | 'cyber_grid' | 'cosmic_void'}
 */
export function getTerrainType(realm) {
  if (!realm || !realm.environment) return 'riverbank';
  const { biome, terrainPreset } = realm.environment;
  if (terrainPreset === 'sand_dunes' || biome === 'desert') return 'sand_dunes';
  if (terrainPreset === 'glacial_peaks' || biome === 'glacial') return 'snow_mountain';
  if (terrainPreset === 'cyber_grid' || biome === 'cyber') return 'cyber_grid';
  if (terrainPreset === 'cosmic_void' || biome === 'cosmic') return 'cosmic_void';
  return 'riverbank';
}

/**
 * ContextualEntityManager class managing contextual asset lifecycle
 */
export class ContextualEntityManager {
  constructor(options = {}) {
    this.options = options;
  }

  canSpawnDiyas(realm) {
    return canSpawnDiyas(realm);
  }

  canSpawnWaterPlane(realm) {
    return canSpawnWaterPlane(realm);
  }

  canSpawnLanterns(realm) {
    return canSpawnLanterns(realm);
  }

  getTerrainType(realm) {
    return getTerrainType(realm);
  }

  canReleaseDiya(realm) {
    return canSpawnDiyas(realm);
  }

  filterDiyasForRealm(realm, count = 80) {
    return canSpawnDiyas(realm) ? count : 0;
  }

  filterLanternsForRealm(realm, count = 35) {
    return canSpawnLanterns(realm) ? count : 0;
  }

  /**
   * Sets up contextual entities in a Three.js scene according to realm classification
   * @param {THREE.Scene} scene
   * @param {object} realm
   * @param {Array} realmObjects - Array tracking active scene objects for disposal
   * @param {Array} animators - Array tracking frame animation loops
   * @param {object} THREE - Three.js namespace
   * @returns {{ riverMesh: THREE.Mesh|null, diyas: Array, lanterns: Array }}
   */
  setupRealmEntities(scene, realm, realmObjects, animators, THREE) {
    if (!THREE) {
      if (typeof window !== 'undefined' && window.THREE) {
        THREE = window.THREE;
      } else {
        return { riverMesh: null, diyas: [], lanterns: [] };
      }
    }

    let riverMesh = null;
    const diyas = [];
    const lanterns = [];

    // Gated Water Plane & Floating Diyas
    if (this.canSpawnDiyas(realm)) {
      const riverGeo = new THREE.PlaneGeometry(240, 240, 40, 40);
      riverGeo.rotateX(-Math.PI / 2);
      riverMesh = new THREE.Mesh(
        riverGeo,
        new THREE.MeshStandardMaterial({
          color: 0x050812,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.6
        })
      );
      riverMesh.position.y = -0.5;
      scene.add(riverMesh);
      if (realmObjects) realmObjects.push(riverMesh);

      // Spawn 80 floating earthen diyas
      for (let i = 0; i < 80; i++) {
        const x = (Math.random() - 0.5) * 85;
        const z = -10 + (Math.random() - 0.5) * 60;
        const diya = this.createDiyaMesh(x, z, THREE);
        scene.add(diya);
        if (realmObjects) realmObjects.push(diya);
        diyas.push({ mesh: diya, seed: Math.random() * 20 });
      }
    }

    // Gated Sky Lanterns
    if (this.canSpawnLanterns(realm)) {
      for (let i = 0; i < 35; i++) {
        const lan = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.5, 1.3, 8),
          new THREE.MeshBasicMaterial({ color: 0xffa028 })
        );
        lan.position.set(
          (Math.random() - 0.5) * 110,
          8 + Math.random() * 45,
          -25 + (Math.random() - 0.5) * 80
        );
        scene.add(lan);
        if (realmObjects) realmObjects.push(lan);
        lanterns.push({ mesh: lan, speed: 0.7 + Math.random() * 0.8 });
      }
    }

    // Register animation loop for active entities
    if (animators && (diyas.length > 0 || lanterns.length > 0)) {
      animators.push((time, delta) => {
        diyas.forEach(item => {
          item.mesh.position.y = Math.sin(time * 2 + item.seed) * 0.08;
          item.mesh.position.z += 0.6 * delta;
          if (item.mesh.position.z > 30) item.mesh.position.z = -35;
        });

        lanterns.forEach(item => {
          item.mesh.position.y += item.speed * delta;
          if (item.mesh.position.y > 65) item.mesh.position.y = 5;
        });
      });
    }

    return { riverMesh, diyas, lanterns };
  }

  createDiyaMesh(x, z, THREE) {
    if (!THREE && typeof window !== 'undefined') THREE = window.THREE;
    const diya = new THREE.Group();
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.2, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b3a0f, roughness: 0.8 })
    );
    diya.add(bowl);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.45, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    flame.position.y = 0.3;
    diya.add(flame);

    diya.position.set(x, 0, z);
    return diya;
  }
}

export const defaultManager = new ContextualEntityManager();
export default defaultManager;
