import { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "The Threshold of Unknowns",
    subtitle: "You stand before an ancient obsidian archway. What beckons your curiosity from within?",
    category: "Perception",
    options: [
      {
        id: '1a',
        label: "A golden flame that flickers without consuming wood",
        subtitle: "Warmth, light, and timeless sacred blessings",
        iconName: "Flame",
        affinity: { 'heritage-diwali': 5, 'zen-sanctuary': 3, 'cosmos': 1, 'cyber-nexus': 0, 'deep-abyss': 0, 'enchanted-forest': 2, 'ancient-egypt': 2, 'neon-tokyo': 0 }
      },
      {
        id: '1b',
        label: "A spiral of ultraviolet stars whispering mathematics",
        subtitle: "Infinite galaxies, gravitational waves, cosmic truth",
        iconName: "Sparkles",
        affinity: { 'cosmos': 5, 'cyber-nexus': 3, 'neon-tokyo': 2, 'heritage-diwali': 1, 'deep-abyss': 1, 'enchanted-forest': 0, 'ancient-egypt': 1, 'zen-sanctuary': 1 }
      },
      {
        id: '1c',
        label: "A neon pulse syncing with the heartbeat of a cybernetic metropolis",
        subtitle: "Synthesizers, glass towers, quantum networks",
        iconName: "Cpu",
        affinity: { 'cyber-nexus': 5, 'neon-tokyo': 4, 'cosmos': 2, 'heritage-diwali': 0, 'deep-abyss': 0, 'enchanted-forest': 0, 'ancient-egypt': 0, 'zen-sanctuary': 0 }
      },
      {
        id: '1d',
        label: "Bioluminescent corals humming in oceanic stillness",
        subtitle: "Abyssal depth, tranquility, ancient currents",
        iconName: "Waves",
        affinity: { 'deep-abyss': 5, 'enchanted-forest': 3, 'zen-sanctuary': 3, 'cosmos': 1, 'heritage-diwali': 0, 'cyber-nexus': 0, 'ancient-egypt': 0, 'neon-tokyo': 0 }
      }
    ]
  },
  {
    id: 2,
    title: "The Harmonic Resonance",
    subtitle: "If you could capture a single frequency to restore the world, which would you play?",
    category: "Soul Sound",
    options: [
      {
        id: '2a',
        label: "The chiming of silver temple bells through jasmine smoke",
        subtitle: "Celebration of victory of light over shadow",
        iconName: "Bell",
        affinity: { 'heritage-diwali': 5, 'ancient-egypt': 3, 'zen-sanctuary': 3, 'cosmos': 1, 'cyber-nexus': 0, 'deep-abyss': 0, 'enchanted-forest': 1, 'neon-tokyo': 0 }
      },
      {
        id: '2b',
        label: "The low bass resonance of a pulsar orbiting a dark rift",
        subtitle: "The profound hum of universal spacetime",
        iconName: "Radio",
        affinity: { 'cosmos': 5, 'cyber-nexus': 3, 'deep-abyss': 2, 'neon-tokyo': 2, 'heritage-diwali': 0, 'enchanted-forest': 0, 'ancient-egypt': 0, 'zen-sanctuary': 1 }
      },
      {
        id: '2c',
        label: "Rain falling on bamboo leaves outside a silent pavilion",
        subtitle: "Pure clarity, mindfulness, and inner equilibrium",
        iconName: "CloudRain",
        affinity: { 'zen-sanctuary': 5, 'enchanted-forest': 4, 'deep-abyss': 2, 'heritage-diwali': 1, 'cosmos': 1, 'cyber-nexus': 0, 'ancient-egypt': 1, 'neon-tokyo': 0 }
      },
      {
        id: '2d',
        label: "Synthwave basslines echoing through midnight rain in Shinjuku",
        subtitle: "Hyper-drive adrenaline and electric dreams",
        iconName: "Zap",
        affinity: { 'neon-tokyo': 5, 'cyber-nexus': 4, 'cosmos': 1, 'heritage-diwali': 0, 'deep-abyss': 0, 'enchanted-forest': 0, 'ancient-egypt': 0, 'zen-sanctuary': 0 }
      }
    ]
  },
  {
    id: 3,
    title: "The Gift of Creation",
    subtitle: "You are handed the philosopher's stylus to sculpt a landmark for humanity. What do you carve?",
    category: "Architectural Will",
    options: [
      {
        id: '3a',
        label: "A thousand golden Diyas floating into the dusk sky",
        subtitle: "Illuminating every dark corner with hope and togetherness",
        iconName: "Sun",
        affinity: { 'heritage-diwali': 5, 'zen-sanctuary': 2, 'ancient-egypt': 2, 'cosmos': 1, 'cyber-nexus': 0, 'deep-abyss': 0, 'enchanted-forest': 2, 'neon-tokyo': 1 }
      },
      {
        id: '3b',
        label: "An orbital Dyson ring harvesting the light of newborn suns",
        subtitle: "Powering human consciousness across the stars",
        iconName: "Orbit",
        affinity: { 'cosmos': 5, 'cyber-nexus': 4, 'neon-tokyo': 2, 'heritage-diwali': 0, 'deep-abyss': 0, 'enchanted-forest': 0, 'ancient-egypt': 1, 'zen-sanctuary': 0 }
      },
      {
        id: '3c',
        label: "A sandstone pyramid aligned with Orion's belt guarding lost scrolls",
        subtitle: "Eternal memory preserved for ten thousand generations",
        iconName: "Compass",
        affinity: { 'ancient-egypt': 5, 'zen-sanctuary': 2, 'cosmos': 2, 'heritage-diwali': 2, 'cyber-nexus': 1, 'deep-abyss': 1, 'enchanted-forest': 1, 'neon-tokyo': 0 }
      },
      {
        id: '3d',
        label: "An ethereal World Tree whose roots intertwine with ocean reefs",
        subtitle: "Symbiosis between forest spirits and marine tides",
        iconName: "Trees",
        affinity: { 'enchanted-forest': 5, 'deep-abyss': 4, 'zen-sanctuary': 3, 'heritage-diwali': 1, 'cosmos': 1, 'cyber-nexus': 0, 'ancient-egypt': 1, 'neon-tokyo': 0 }
      }
    ]
  },
  {
    id: 4,
    title: "The Crucible of Purpose",
    subtitle: "When the lights fade and the noise settles, what drives you forward?",
    category: "Motivation",
    options: [
      {
        id: '4a',
        label: "Sharing festive laughter and sweet delicacies with family and loved ones",
        subtitle: "Belonging, warmth, and shared joy",
        iconName: "Heart",
        affinity: { 'heritage-diwali': 5, 'zen-sanctuary': 3, 'enchanted-forest': 2, 'cosmos': 1, 'cyber-nexus': 0, 'deep-abyss': 0, 'ancient-egypt': 0, 'neon-tokyo': 1 }
      },
      {
        id: '4b',
        label: "Decoding the deepest vulnerabilities and hacking the boundary of reality",
        subtitle: "Relentless curiosity, intelligence, and zero-day mastery",
        iconName: "ShieldAlert",
        affinity: { 'cyber-nexus': 5, 'neon-tokyo': 3, 'cosmos': 2, 'heritage-diwali': 0, 'deep-abyss': 1, 'enchanted-forest': 0, 'ancient-egypt': 1, 'zen-sanctuary': 0 }
      },
      {
        id: '4c',
        label: "Diving into the unmapped silence where no human has ever breathed",
        subtitle: "Fearless discovery, mystery, and peace",
        iconName: "Compass",
        affinity: { 'deep-abyss': 5, 'cosmos': 3, 'ancient-egypt': 2, 'enchanted-forest': 2, 'heritage-diwali': 0, 'cyber-nexus': 1, 'zen-sanctuary': 2, 'neon-tokyo': 0 }
      },
      {
        id: '4d',
        label: "Mastering tranquility so storms pass without disturbing the water",
        subtitle: "Self-discipline, balance, and quiet power",
        iconName: "Feather",
        affinity: { 'zen-sanctuary': 5, 'ancient-egypt': 3, 'heritage-diwali': 2, 'enchanted-forest': 3, 'cosmos': 1, 'cyber-nexus': 0, 'deep-abyss': 2, 'neon-tokyo': 0 }
      }
    ]
  },
  {
    id: 5,
    title: "The Ultimate Wish for Earth",
    subtitle: "On this night of universal illumination, what blessing do you bestow upon the 8 billion souls?",
    category: "Cosmic Blessing",
    options: [
      {
        id: '5a',
        label: "May every dark night be conquered by a radiant, inextinguishable light",
        subtitle: "The supreme Diwali triumph of good, knowledge, and prosperity",
        iconName: "Sparkle",
        affinity: { 'heritage-diwali': 5, 'zen-sanctuary': 3, 'cosmos': 2, 'ancient-egypt': 2, 'enchanted-forest': 2, 'cyber-nexus': 1, 'deep-abyss': 1, 'neon-tokyo': 1 }
      },
      {
        id: '5b',
        label: "May humanity unite to conquer the stars and wander among distant constellations",
        subtitle: "Limitless expansion, scientific wonder, and cosmic peace",
        iconName: "Rocket",
        affinity: { 'cosmos': 5, 'cyber-nexus': 4, 'neon-tokyo': 3, 'heritage-diwali': 1, 'deep-abyss': 0, 'enchanted-forest': 0, 'ancient-egypt': 1, 'zen-sanctuary': 0 }
      },
      {
        id: '5c',
        label: "May nature heal, the ancient canopies roar, and the oceans breathe once more",
        subtitle: "Restoration, wilderness, and vibrant planetary vitality",
        iconName: "Globe",
        affinity: { 'enchanted-forest': 5, 'deep-abyss': 4, 'zen-sanctuary': 3, 'heritage-diwali': 1, 'cosmos': 1, 'cyber-nexus': 0, 'ancient-egypt': 1, 'neon-tokyo': 0 }
      },
      {
        id: '5d',
        label: "May every soul awaken their hidden digital genius and build tools of wonder",
        subtitle: "Empowerment, innovation, and global creative abundance",
        iconName: "Terminal",
        affinity: { 'cyber-nexus': 5, 'neon-tokyo': 4, 'cosmos': 2, 'heritage-diwali': 1, 'deep-abyss': 0, 'enchanted-forest': 0, 'ancient-egypt': 1, 'zen-sanctuary': 0 }
      }
    ]
  }
];
