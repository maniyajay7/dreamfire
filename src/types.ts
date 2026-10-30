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
