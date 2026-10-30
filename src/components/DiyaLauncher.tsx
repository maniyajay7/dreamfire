import React, { useState } from 'react';
import { Flame, Sparkles, Send, Globe, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cosmicAudio } from '../utils/audio';

interface DiyaWish {
  id: string;
  sender: string;
  country: string;
  wish: string;
  flameColor: string;
  timestamp: string;
}

const INITIAL_WISHES: DiyaWish[] = [
  {
    id: '1',
    sender: 'Aarav & Meera',
    country: 'India ????',
    wish: 'May peace and joyful light find every home that has known sorrow this year.',
    flameColor: '#f59e0b',
    timestamp: '2 mins ago'
  },
  {
    id: '2',
    sender: 'Elena Rostova',
    country: 'Greece ????',
    wish: 'Wishing clarity and courage for every young dreamer building the future.',
    flameColor: '#06b6d4',
    timestamp: '5 mins ago'
  },
  {
    id: '3',
    sender: 'Kenji & Saki',
    country: 'Japan ????',
    wish: 'Let the universal flame heal nature and unite all nations in harmony.',
    flameColor: '#10b981',
    timestamp: '11 mins ago'
  },
  {
    id: '4',
    sender: 'Liam O’Connor',
    country: 'Ireland ????',
    wish: 'Health, laughter, and endless warm meals for all families worldwide.',
    flameColor: '#ef4444',
    timestamp: '18 mins ago'
  }
];

const FLAME_COLORS = [
  { name: 'Surya Gold', hex: '#f59e0b' },
  { name: 'Cosmic Cyan', hex: '#06b6d4' },
  { name: 'Emerald Prana', hex: '#10b981' },
  { name: 'Lotus Ruby', hex: '#f43f5e' },
  { name: 'Astral Violet', hex: '#a855f7' }
];

export const DiyaLauncher: React.FC = () => {
  const [senderName, setSenderName] = useState('');
  const [userCountry, setUserCountry] = useState('India ????');
  const [wishText, setWishText] = useState('');
  const [selectedFlame, setSelectedFlame] = useState(FLAME_COLORS[0].hex);
  const [wishes, setWishes] = useState<DiyaWish[]>(INITIAL_WISHES);
  const [isIgnited, setIsIgnited] = useState(false);

  const handleIgnite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    cosmicAudio.playChime(920);

    const newWish: DiyaWish = {
      id: Date.now().toString(),
      sender: senderName.trim() || 'Anonymous Soul',
      country: userCountry,
      wish: wishText.trim(),
      flameColor: selectedFlame,
      timestamp: 'Just now'
    };

    setWishes([newWish, ...wishes]);
    setIsIgnited(true);

    // Firework particle blast
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: [selectedFlame, '#fbbf24', '#ffffff', '#ef4444']
    });

    setWishText('');
    setTimeout(() => setIsIgnited(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 relative z-10">
      
      {/* Title Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-3">
          <Flame className="w-3.5 h-3.5 animate-bounce" />
          The Global Wall of Inextinguishable Lights
        </div>
        
        <h1 className="font-serif-cinzel text-3xl md:text-5xl font-black text-white mb-2">
          Ignite Your Sacred Diya
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
          Every earthen lamp lit here is mirrored across the global sky. Send your prayer, hope, or love to the 8 billion souls of Earth.
        </p>
      </div>

      {/* Launcher Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border-amber-500/20 mb-12 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-30 transition-colors"
          style={{ backgroundColor: selectedFlame }}
        />

        <form onSubmit={handleIgnite} className="relative z-10 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Name / Family
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Jay & Calix"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Homeland / Location
              </label>
              <input
                type="text"
                value={userCountry}
                onChange={(e) => setUserCountry(e.target.value)}
                placeholder="e.g. India, USA, Global"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Flame Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>Choose Flame Frequency</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <div className="flex flex-wrap gap-3">
              {FLAME_COLORS.map((flame) => (
                <button
                  key={flame.hex}
                  type="button"
                  onClick={() => setSelectedFlame(flame.hex)}
                  className={px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all }
                >
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: flame.hex }} 
                  />
                  <span>{flame.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wish Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Universal Wish for Earth
            </label>
            <textarea
              required
              rows={3}
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="May all hearts be filled with light, darkness be banished, and joy overflow..."
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          {/* Ignite Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Flame className="w-5 h-5 text-red-600 animate-pulse" />
            <span>{isIgnited ? "Diya Released into Global Sky! ?" : "Ignite & Send My Diya"}</span>
            <Send className="w-4 h-4 ml-1" />
          </button>

        </form>
      </div>

      {/* Public Wall of Lights Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif-cinzel text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            Live Global Prayers & Illumination
          </h3>
          <span className="text-xs text-slate-400 font-mono">Syncing 8B souls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishes.map((item) => (
            <div 
              key={item.id} 
              className="glass-panel p-4 rounded-2xl border-l-4 transition-all hover:bg-white/[0.04]"
              style={{ borderLeftColor: item.flameColor }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 shrink-0" style={{ color: item.flameColor }} />
                  <span className="text-xs font-bold text-white">{item.sender}</span>
                  <span className="text-[11px] text-slate-400">{item.country}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{item.wish}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
