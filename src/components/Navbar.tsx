import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Compass, Flame } from 'lucide-react';
import { cosmicAudio } from '../utils/audio';
import { GateId } from '../types';

interface NavbarProps {
  currentGate?: GateId;
  onSelectGate: (gate: GateId) => void;
  onResetToOracle: () => void;
  activeView: 'oracle' | 'gate' | 'diya';
  onSwitchView: (view: 'oracle' | 'gate' | 'diya') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onResetToOracle,
  activeView,
  onSwitchView
}) => {
  const [isAudioActive, setIsAudioActive] = useState(false);

  const toggleSound = () => {
    const active = cosmicAudio.toggle();
    setIsAudioActive(active);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-amber-500/10 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={onResetToOracle}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-cinzel font-bold text-lg md:text-xl tracking-wider text-amber-100 group-hover:text-amber-300 transition-colors">
                DREAM<span className="text-amber-500">FIRE</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                Diwali 2026 Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">The Universal Gate of Wonders</p>
          </div>
        </div>

        {/* Global Live Counter & Controls */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Live Souls Pulse */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Global Souls:</span>
            <span className="font-mono font-semibold text-amber-400">3,892,410</span>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSwitchView('oracle')}
              className={px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oracle</span>
            </button>

            <button
              onClick={() => onSwitchView('diya')}
              className={px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 }
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Light Diya</span>
            </button>

            <button
              onClick={() => onSwitchView('gate')}
              className={px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 }
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Gates</span>
            </button>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Cosmic Audio"
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-amber-400 border-slate-700/60 hover:border-amber-500/40 transition-all flex items-center justify-center"
            title={isAudioActive ? "Mute 432Hz Ambient Resonance" : "Enable 432Hz Cosmic Drone"}
          >
            {isAudioActive ? (
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
