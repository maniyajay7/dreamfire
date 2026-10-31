export type GateId = 
  | 'cosmos'
  | 'heritage-diwali'
  | 'cyber-nexus'
  | 'deep-abyss'
  | 'enchanted-forest'
  | 'ancient-egypt'
  | 'zen-sanctuary'
  | 'neon-tokyo';

export interface GateWorld {
  id: GateId;
  title: string;
  tagline: string;
  category: 'Cosmic' | 'Festival & Culture' | 'Sci-Fi' | 'Nature' | 'Spiritual' | 'Ancient';
  description: string;
  ambientSoundtrack: string; // generated web audio tone frequency / ambient synth
  themeColor: string;
  accentColor: string;
  stats: {
    soulsVisiting: number;
    resonanceRate: string;
  };
  features: string[];
  interactivePrompt: string;
  diwaliWish: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  subtitle: string;
  iconName: string;
  affinity: Record<GateId, number>;
}

export interface Question {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  options: QuestionOption[];
}

export interface UserProfile {
  name: string;
  primaryGate: GateId;
  gateAffinityScores: Record<GateId, number>;
  archetypeTitle: string;
  cosmicSign: string;
  timestamp: string;
}


/**
 * DreamFire - Environmental Classification Schema
 * Contract between Realm Catalog (M1) and 3D Scene / Contextual Managers (M2, M3, M5)
 */

export type BiomeType = 
  | 'sacred_river'
  | 'temple'
  | 'desert'
  | 'glacial'
  | 'cosmic'
  | 'cyber'
  | 'jungle'
  | 'sanctuary';

export type RealmCategory = 
  | 'Sacred & Spiritual'
  | 'Nature & Retreat'
  | 'Cosmic Odyssey'
  | 'Cyberpunk & Sci-Fi'
  | 'Ancient Wonders'
  | 'Zen Meditation';

export type TerrainPreset =
  | 'riverbank'
  | 'temple_courtyard'
  | 'sand_dunes'
  | 'glacial_peaks'
  | 'cosmic_void'
  | 'cyber_grid'
  | 'waterfall_lagoon'
  | 'ocean_shore'
  | 'sanctuary_valley'
  | 'rocky_canyon'
  | 'meadow_plateau'
  | 'stone_pavement'
  | 'salt_flat'
  | 'zen_gravel';

export interface EnvironmentConfig {
  biome: BiomeType;
  hasWaterBody: boolean;
  festiveContext: boolean;
  skyColor: number;
  sunPosition: [number, number, number];
  fogDensity: number;
  terrainPreset: TerrainPreset | string;
}

export interface RealmData {
  id: string;
  title: string;
  category: RealmCategory;
  tagline: string;
  description: string;
  bgImage: string;
  videoLoop?: string;
  soundscape: string;
  tags: string[];
  soulsVisiting: number;
  resonance: string;
  environment: EnvironmentConfig;
}

export const canSpawnDiyas = (realm: RealmData): boolean => {
  return realm.environment.festiveContext === true && realm.environment.hasWaterBody === true;
};

/**
 * Interface Contract 3: Prompt Mutation Parameters (M5)
 */
export interface PromptMutationParams {
  timeOfDay?: 'dawn' | 'noon' | 'sunset' | 'twilight' | 'midnight';
  lighting?: {
    sunColor?: number;
    ambientIntensity?: number;
    sunAngle?: number;
  };
  atmosphere?: {
    fogColor?: number;
    fogDensity?: number;
    weather?: 'clear' | 'mist' | 'rain' | 'aurora' | 'cyber_dust';
  };
  terrain?: {
    biome?: string;
    elevationScale?: number;
    wireframe?: boolean;
  };
  entities?: {
    spawnType?: 'diyas' | 'lanterns' | 'devotees' | 'neon_spires' | 'crystals';
    countDelta?: number;
  };
}

