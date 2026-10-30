import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CosmicBackground } from './components/CosmicBackground';
import { OracleWizard } from './components/OracleWizard';
import { GateExplorer } from './components/GateExplorer';
import { DiyaLauncher } from './components/DiyaLauncher';
import { GateId, UserProfile } from './types';
import { GATE_WORLDS } from './data/gates';

export function App() {
  const [activeView, setActiveView] = useState<'oracle' | 'gate' | 'diya'>('oracle');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentGateId, setCurrentGateId] = useState<GateId>('heritage-diwali');

  const handleOracleComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentGateId(profile.primaryGate);
    setActiveView('gate');
  };

  const handleSelectGate = (gate: GateId) => {
    setCurrentGateId(gate);
    setActiveView('gate');
  };

  const currentThemeColor = GATE_WORLDS[currentGateId]?.themeColor || '#f59e0b';

  return (
    <div className="min-h-screen bg-[#050508] text-white relative selection:bg-amber-500 selection:text-black">
      
      {/* 3D WebGL Particle Universe */}
      <CosmicBackground themeColor={currentThemeColor} intensity={1.1} />

      {/* Persistent Global Nav */}
      <Navbar
        currentGate={currentGateId}
        onSelectGate={handleSelectGate}
        onResetToOracle={() => setActiveView('oracle')}
        activeView={activeView}
        onSwitchView={setActiveView}
      />

      {/* Main View Router */}
      <main className="relative z-10">
        {activeView === 'oracle' && (
          <OracleWizard onComplete={handleOracleComplete} />
        )}

        {activeView === 'gate' && (
          <GateExplorer
            initialGateId={currentGateId}
            userProfile={userProfile}
            onLaunchDiya={() => setActiveView('diya')}
            onExploreOther={() => setActiveView('gate')}
          />
        )}

        {activeView === 'diya' && (
          <DiyaLauncher />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DreamFire • Crafted for Diwali & The 8 Billion Souls of Earth</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Zero-Trust Architecture</span>
            <span>•</span>
            <span>Edge CDN Ready</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">Ayodhya • Orion • Tokyo</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
