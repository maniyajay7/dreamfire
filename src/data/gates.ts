import { GateWorld, GateId } from '../types';

export const GATE_WORLDS: Record<GateId, GateWorld> = {
  'heritage-diwali': {
    id: 'heritage-diwali',
    title: 'The Golden City of Ayodhya & Lights',
    tagline: 'Where a million floating diyas banish the dark',
    category: 'Festival & Culture',
    description: 'An ethereal realm illuminated by countless earthen lamps reflecting upon sacred holy rivers. Sitar melodies and ancient mantras resonate through marble colonnades as golden sparks drift into the velvet night.',
    ambientSoundtrack: 'Indian Classical Ambient Tanpura & Temple Bells (432Hz)',
    themeColor: '#f59e0b',
    accentColor: '#ef4444',
    stats: {
      soulsVisiting: 842190,
      resonanceRate: '99.4%'
    },
    features: [
      'Interactive 3D Floating Diya Launch',
      'Real-time Shared Global Flame Wall',
      'Lakshmi & Ganesha Sacred Blessings Generator',
      'Procedural Golden Fireworks Show'
    ],
    interactivePrompt: 'Tap anywhere in the sacred river to light a floating diya and send your personal wish into the global sky.',
    diwaliWish: 'May the eternal flame of Diwali burn away all obstacles, illuminating your path with wisdom, prosperity, and unbreakable joy.'
  },
  'cosmos': {
    id: 'cosmos',
    title: 'The Stellar Nebula of Orion',
    tagline: 'Wander through the cosmic cradle of newborn stars',
    category: 'Cosmic',
    description: 'A deep-space observatory situated inside an interstellar gas cloud. Watch gravitational waves warp spacetime around hyper-dense pulsars while solar winds paint the cosmos in ultraviolet and gold.',
    ambientSoundtrack: 'Deep Space Drone & Interstellar Frequencies (528Hz)',
    themeColor: '#8b5cf6',
    accentColor: '#38bdf8',
    stats: {
      soulsVisiting: 619420,
      resonanceRate: '98.8%'
    },
    features: [
      'Interactive Planetary Orbit Simulator',
      'Quantum Star Constellation Connect',
      'Event Horizon Gravitational Lens View',
      'Galactic Dust Particle Flow'
    ],
    interactivePrompt: 'Drag across the cosmos to distort spacetime and spark birth of a supernova star cluster.',
    diwaliWish: 'As the stars illuminate the vast darkness of space, may your spirit shine with infinite brilliance and boundless possibility.'
  },
  'cyber-nexus': {
    id: 'cyber-nexus',
    title: 'The Zero-Day Cyber Metropolis',
    tagline: 'Where quantum logic meets high-frequency neon towers',
    category: 'Sci-Fi',
    description: 'A towering cyberpunk grid powered by impenetrable cryptographic shields. Fiber-optic rivers pulse with gigabits of raw intelligence beneath a sky crisscrossed by autonomous air-cruisers.',
    ambientSoundtrack: 'Cyberpunk Dark Synth & Digital Glitch Harmonics',
    themeColor: '#06b6d4',
    accentColor: '#10b981',
    stats: {
      soulsVisiting: 742110,
      resonanceRate: '99.1%'
    },
    features: [
      'Real-time Cyber Security Shield Matrix',
      'Quantum Encryption Terminal Simulator',
      'Holographic Data Stream Controller',
      'Neon Grid Waveform Visualizer'
    ],
    interactivePrompt: 'Interact with the core terminal to deploy cryptographic shields protecting the grid.',
    diwaliWish: 'May your intellect pierce every firewall of difficulty, shielding your dreams with unbreakable resilience.'
  },
  'deep-abyss': {
    id: 'deep-abyss',
    title: 'The Bioluminescent Hadal Rift',
    tagline: 'Serenity beneath ten thousand meters of oceanic peace',
    category: 'Nature',
    description: 'An ancient oceanic valley where alien sea flora glow in shades of turquoise and violet. Silent leviathans drift past hydrothermal spires, moving in harmony with the primordial pulse of the planet.',
    ambientSoundtrack: 'Submerged Ambient Hydrophone & Whale Harmonics',
    themeColor: '#0284c7',
    accentColor: '#14b8a6',
    stats: {
      soulsVisiting: 412850,
      resonanceRate: '97.9%'
    },
    features: [
      'Bioluminescent Organism Touch-Wave',
      'Abyssal Pressure Depth Chamber',
      'Hydrothermal Glow Emitters',
      'Subsurface Sonar Map'
    ],
    interactivePrompt: 'Send acoustic ripples through the trench to awaken dormant sea lilies with brilliant light.',
    diwaliWish: 'May peace run as deep as the ocean trenches in your heart, undisturbed by whatever storms rage on the surface.'
  },
  'enchanted-forest': {
    id: 'enchanted-forest',
    title: 'The Ancient Canopy of Yggdrasil',
    tagline: 'Where nature breathes in emerald and starlight',
    category: 'Nature',
    description: 'Massive thousand-year-old trees whose leaves glow like emerald lanterns. Golden fireflies weave between crystalline waterfalls, while roots hum with the lifeblood of Earth itself.',
    ambientSoundtrack: 'Forest Whispers, Gentle Streams & Flute Melodies',
    themeColor: '#10b981',
    accentColor: '#84cc16',
    stats: {
      soulsVisiting: 589200,
      resonanceRate: '98.5%'
    },
    features: [
      'Swarm of Interactive Fireflies',
      'Living Tree of Life Growth Controller',
      'Breeze Particle Physics Simulator',
      'Petal Bloom Ripple Generator'
    ],
    interactivePrompt: 'Move your cursor through the canopy to command thousands of fireflies to illuminate hidden shrines.',
    diwaliWish: 'May your life blossom with organic prosperity, deep-rooted family strength, and wild, untamable peace.'
  },
  'ancient-egypt': {
    id: 'ancient-egypt',
    title: 'The Golden Pyramids of Giza',
    tagline: 'Aligned with Orion under the eternal desert sun',
    category: 'Ancient',
    description: 'The Nile glistening under a burning copper sunset. Giant sandstone obelisks capped with electrum shoot beams of golden reflection, guarding the ancient wisdom of pharaohs and stargazers.',
    ambientSoundtrack: 'Desert Winds, Ancient Oud & Ceremonial Drums',
    themeColor: '#d97706',
    accentColor: '#f59e0b',
    stats: {
      soulsVisiting: 395100,
      resonanceRate: '98.2%'
    },
    features: [
      'Sun-Ray Pyramid Alignment Puzzle',
      'Hieroglyph Decryption Canvas',
      'Golden Sand Dune Physics Simulation',
      'Celestial Zodiac Dial'
    ],
    interactivePrompt: 'Rotate the golden solar dial to align the pyramid capstones with the constellation of stars.',
    diwaliWish: 'May your accomplishments stand timeless as the great monuments, carved with honor and everlasting glory.'
  },
  'zen-sanctuary': {
    id: 'zen-sanctuary',
    title: 'The Cloud Mountain Monastery',
    tagline: 'Pure stillness above the sea of morning clouds',
    category: 'Spiritual',
    description: 'A traditional wooden pagoda resting on mist-covered peaks. Cherry blossom petals swirl through stone torii gates while Tibetan singing bowls wash away all earthly fatigue.',
    ambientSoundtrack: 'Tibetan Singing Bowls & Bamboo Shakuhachi Flute',
    themeColor: '#e11d48',
    accentColor: '#f43f5e',
    stats: {
      soulsVisiting: 512300,
      resonanceRate: '99.0%'
    },
    features: [
      'Interactive Zen Sand Garden Rake',
      'Cherry Blossom Petal Wind Simulator',
      'Resonance Gong Sound Generator',
      'Mindful Breath Guiding Circle'
    ],
    interactivePrompt: 'Strike the ceremonial copper bell to send calming acoustic waves through the falling blossom garden.',
    diwaliWish: 'May inner clarity and tranquil awareness be your greatest treasures throughout the year ahead.'
  },
  'neon-tokyo': {
    id: 'neon-tokyo',
    title: 'The Midnight Rain Crossing',
    tagline: 'Electric reflections, ramen steam, and future dreams',
    category: 'Sci-Fi',
    description: 'A bustling multi-level intersection bathed in magenta, amber, and cyan reflections. Holographic koi fish swim through skyscrapers while lo-fi beats float out of alleyway cafés.',
    ambientSoundtrack: 'Lo-Fi City Rain & Chillhop Tokyo Melodies',
    themeColor: '#ec4899',
    accentColor: '#8b5cf6',
    stats: {
      soulsVisiting: 673400,
      resonanceRate: '99.3%'
    },
    features: [
      'Rain On Glass Interactive Shader',
      'Holographic Billboard Customizer',
      'Street Audio Mixer (Rain / City / Lo-Fi)',
      'Neon Sign Flicker Simulator'
    ],
    interactivePrompt: 'Wipe the mist from your screen window to uncover the bustling nightlife of future Tokyo.',
    diwaliWish: 'May your path be bright, vibrant, and alive with electric excitement and unforgettable nights.'
  }
};
