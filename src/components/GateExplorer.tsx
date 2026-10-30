import React, { useState } from 'react';
import { GateWorld, GateId, UserProfile } from '../types';
import { GATE_WORLDS } from '../data/gates';
import { Sparkles, Flame, Share2, Compass, Volume2, ShieldCheck, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cosmicAudio } from '../utils/audio';

interface GateExplorerProps {
  initialGateId: GateId;
  userProfile?: UserProfile | null;
  onLaunchDiya: () => void;
  onExploreOther: () => void;
}

export const GateExplorer: React.FC<GateExplorerProps> = ({
  initialGateId,
  userProfile,
  onLaunchDiya,
  onExploreOther
}) => {
  const [selectedGate, setSelectedGate] = useState<GateWorld>(GATE_WORLDS[initialGateId] || GATE_WORLDS['heritage-diwali']);
  const [copiedLink, setCopiedLink] = useState(false);
  const [interactiveCount, setInteractiveCount] = useState(0);

  const handleGateSwitch = (id: GateId) => {
    setSelectedGate(GATE_WORLDS[id]);
    cosmicAudio.playChime(660);
  };

  const triggerCelebration = () => {
    cosmicAudio.playChime(880);
    setInteractiveCount(prev => prev + 1);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: [selectedGate.themeColor, selectedGate.accentColor, '#ffffff', '#fbbf24']
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10">
      
      {/* Traveler Header */}
      {userProfile && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border-amber-500/20 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Universal Alignment</div>
              <div className="text-sm md:text-base font-bold text-amber-200">
                {userProfile.name} • <span className="text-white">{userProfile.archetypeTitle}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Dimension Link Copied!" : "Share My Portal"}</span>
          </button>
        </div>
      )}

      {/* Main World Showcase Card */}
      <div 
        className="relative rounded-3xl p-6 md:p-10 glass-panel overflow-hidden mb-10 border-t-2"
        style={{ borderColor: selectedGate.themeColor }}
      >
        {/* Glow backdrop */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{ backgroundColor: selectedGate.themeColor }}
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black"
              style={{ backgroundColor: selectedGate.themeColor }}
            >
              {selectedGate.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {selectedGate.stats.soulsVisiting.toLocaleString()} souls connected
            </span>
          </div>

          <h1 className="font-serif-cinzel text-3xl md:text-5xl font-black text-white mb-2">
            {selectedGate.title}
          </h1>

          <p className="text-amber-400/90 text-sm md:text-lg font-medium italic mb-6">
            "{selectedGate.tagline}"
          </p>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl mb-8">
            {selectedGate.description}
          </p>

          {/* Interactive Spark Canvas Trigger */}
          <div className="p-6 rounded-2xl bg-black/40 border border-slate-800 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ backgroundColor: selectedGate.themeColor, color: '#000000' }}
              >
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">Interactive Dimension Trigger</h4>
                <p className="text-xs text-slate-400">{selectedGate.interactivePrompt}</p>
              </div>
            </div>

            <button
              onClick={triggerCelebration}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
              style={{ backgroundColor: selectedGate.themeColor, color: '#000000' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Awaken Light ({interactiveCount})</span>
            </button>
          </div>

          {/* 4 Feature Orbs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {selectedGate.features.map((feature, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-200 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Sacred Diwali Blessing Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-red-500/10 border border-amber-500/30 flex items-start gap-4">
            <Flame className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                Universal Deepavali Blessing 2026
              </h5>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed italic">
                "{selectedGate.diwaliWish}"
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Diya CTA Banner */}
      <div className="p-6 rounded-3xl glass-panel border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-gradient-to-r from-amber-950/40 to-black/60">
        <div>
          <h3 className="font-serif-cinzel text-xl md:text-2xl font-bold text-white mb-1">
            Send Your Flame to the Global Sky
          </h3>
          <p className="text-xs md:text-sm text-slate-400">
            Write your wish or gratitude and let your digital diya join 3.8 million lights floating across Earth tonight.
          </p>
        </div>
        <button
          onClick={onLaunchDiya}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide shadow-xl shadow-amber-500/30 transition-transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
        >
          <Flame className="w-4 h-4" />
          <span>Light My Diya Now</span>
        </button>
      </div>

      {/* Explore All Other Gates Carousel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif-cinzel text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            Explore All 8 Parallel Dimensions
          </h3>
          <span className="text-xs text-slate-400">Click any gate to enter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {(Object.keys(GATE_WORLDS) as GateId[]).map((id) => {
            const world = GATE_WORLDS[id];
            const isActive = selectedGate.id === id;

            return (
              <button
                key={id}
                onClick={() => handleGateSwitch(id)}
                className={p-3 rounded-xl glass-panel text-left transition-all }
              >
                <div 
                  className="w-3 h-3 rounded-full mb-2" 
                  style={{ backgroundColor: world.themeColor }}
                />
                <div className="text-[11px] font-bold text-white truncate">{world.title.split(' ')[0]}</div>
                <div className="text-[9px] text-slate-400 truncate">{world.category}</div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
