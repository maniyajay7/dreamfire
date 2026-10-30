import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { GateId, UserProfile } from '../types';
import { cosmicAudio } from '../utils/audio';
import { 
  Flame, Sparkles, Cpu, Waves, Bell, Radio, CloudRain, Zap, 
  Sun, Orbit, Compass, Trees, Heart, ShieldAlert, Feather, 
  Sparkle, Rocket, Globe, Terminal, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface OracleWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Sparkles, Cpu, Waves, Bell, Radio, CloudRain, Zap,
  Sun, Orbit, Compass, Trees, Heart, ShieldAlert, Feather,
  Sparkle, Rocket, Globe, Terminal
};

export const OracleWizard: React.FC<OracleWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<GateId, number>>({
    'heritage-diwali': 0,
    'cosmos': 0,
    'cyber-nexus': 0,
    'deep-abyss': 0,
    'enchanted-forest': 0,
    'ancient-egypt': 0,
    'zen-sanctuary': 0,
    'neon-tokyo': 0
  });
  const [userName, setUserName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const question = QUESTIONS[currentStep];
  const progressPercent = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleSelectOption = (optionId: string, affinities: Record<GateId, number>) => {
    setSelectedOptionId(optionId);
    cosmicAudio.playChime(520 + currentStep * 100);

    // Update cumulative affinities
    const updated = { ...scores };
    (Object.keys(affinities) as GateId[]).forEach((gate) => {
      updated[gate] += affinities[gate] || 0;
    });
    setScores(updated);

    // Short tactile delay before moving
    setTimeout(() => {
      setSelectedOptionId(null);
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        triggerCosmicCalculation(updated);
      }
    }, 400);
  };

  const triggerCosmicCalculation = (finalScores: Record<GateId, number>) => {
    setIsCalculating(true);
    cosmicAudio.playHarmonicDrone(528);

    // Find highest affinity gate
    let highestGate: GateId = 'heritage-diwali';
    let highestScore = -1;

    (Object.entries(finalScores) as [GateId, number][]).forEach(([gate, score]) => {
      if (score > highestScore) {
        highestScore = score;
        highestGate = gate;
      }
    });

    const archetypes: Record<GateId, string> = {
      'heritage-diwali': 'Sacred Bearer of the Eternal Flame',
      'cosmos': 'Voyager of the Cosmic Rift',
      'cyber-nexus': 'Architect of the Quantum Grid',
      'deep-abyss': 'Guardian of the Abyssal Silence',
      'enchanted-forest': 'Shaman of the Living Canopies',
      'ancient-egypt': 'Keeper of the Sun-Ray Obelisks',
      'zen-sanctuary': 'Master of Still Waters',
      'neon-tokyo': 'Cyber-Drifter of Electric Midnight'
    };

    setTimeout(() => {
      onComplete({
        name: userName.trim() || 'Cosmic Traveler',
        primaryGate: highestGate,
        gateAffinityScores: finalScores,
        archetypeTitle: archetypes[highestGate],
        cosmicSign: 'Solar Radiance IX',
        timestamp: new Date().toISOString()
      });
    }, 2200);
  };

  if (isCalculating) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-3 rounded-full border-2 border-dotted border-cyan-400/50 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
            <Flame className="w-8 h-8 text-black" />
          </div>
        </div>

        <h2 className="font-serif-cinzel text-2xl md:text-3xl font-bold tracking-wide text-amber-200 mb-3">
          Aligning Universal Dimensions...
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Calculating your harmonic resonance across 8 billion cosmic coordinates. Unlocking your gateway...
        </p>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 animate-[pulse_1.5s_infinite]" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-16 relative z-10">
      
      {/* Intro Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          The Oracle of Worlds • Step {currentStep + 1} of {QUESTIONS.length}
        </div>
        
        <h1 className="font-serif-cinzel text-3xl md:text-5xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-amber-200/80 mb-3">
          {question.title}
        </h1>
        
        <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {question.subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-8 bg-slate-900/80 rounded-full h-1.5 p-0.5 border border-slate-800">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 transition-all duration-500"
          style={{ width: ${progressPercent}% }}
        />
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {question.options.map((opt) => {
          const IconComponent = ICON_MAP[opt.iconName] || Sparkles;
          const isSelected = selectedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelectOption(opt.id, opt.affinity)}
              className={glass-panel p-5 rounded-2xl cursor-pointer transition-all duration-300 transform group hover:-translate-y-1 }
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-black text-amber-400 transition-colors">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm md:text-base group-hover:text-amber-200 transition-colors mb-1">
                    {opt.label}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {opt.subtitle}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Traveler Name Input (Optional) */}
      <div className="max-w-md mx-auto flex items-center gap-3 p-1.5 rounded-xl glass-panel border-slate-800">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Name of traveler (optional)"
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
        />
        <span className="text-[10px] text-slate-500 pr-2 font-mono">Diwali 2026 Passport</span>
      </div>

    </div>
  );
};
