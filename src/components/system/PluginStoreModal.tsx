import React, { useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Zap,
  Check,
  X,
  Play,
  Pause,
  Download,
  ShieldCheck,
  Crown,
  Search,
  Tag,
  Disc,
  Sliders,
  Palette,
  Layers,
  Music,
  CheckCircle2,
  Lock,
  ExternalLink,
  Flame,
  Radio,
  Star,
} from 'lucide-react';

export type SubscriptionTier = 'free' | 'producer_pass' | 'all_access';

export interface ShopItem {
  id: string;
  name: string;
  category: 'synth' | 'fx' | 'samples' | 'skins' | 'templates';
  description: string;
  priceType: 'free' | 'included_pass' | 'included_ultimate' | 'paid';
  priceOneTime?: number;
  rating: number;
  downloads: string;
  badge?: string;
  iconBg: string;
  tags: string[];
  moduleTypeToAdd?: string; // Maps to rack module type if installable
  isInstalled?: boolean;
}

interface PluginStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTier: SubscriptionTier;
  setUserTier: (tier: SubscriptionTier) => void;
  onInstallModule?: (moduleType: string) => void;
}

const STORE_ITEMS: ShopItem[] = [
  {
    id: 'subtractor_synth',
    name: 'Subtractor Analog Synth',
    category: 'synth',
    description: 'Classic polyphonic subtractive synth with dual oscillators and dual state variable filters.',
    priceType: 'free',
    rating: 4.9,
    downloads: '142k',
    badge: 'STOCK DEFAULT',
    iconBg: 'from-amber-600 to-amber-800',
    tags: ['Analog', 'Poly Synth', 'Subtractive'],
    moduleTypeToAdd: 'subtractor',
  },
  {
    id: 'thor_polysonic',
    name: 'Thor Polysonic Synthesizer',
    category: 'synth',
    description: 'Flagship semi-modular synthesizer featuring wavetable, FM, phase distortion & analog modeling.',
    priceType: 'included_pass',
    rating: 5.0,
    downloads: '98k',
    badge: 'TOP PRODUCER PICK',
    iconBg: 'from-emerald-600 to-emerald-900',
    tags: ['Semi-Modular', 'Wavetable', 'FM Synthesis'],
    moduleTypeToAdd: 'thor',
  },
  {
    id: 'complex_modular',
    name: 'Voltage Modular FX Rack',
    category: 'fx',
    description: 'Euro-rack inspired CV routing matrix with multi-point LFO attenuators and dual delay lines.',
    priceType: 'included_ultimate',
    priceOneTime: 29.99,
    rating: 4.8,
    downloads: '45k',
    badge: 'ULTIMATE EXCLUSIVE',
    iconBg: 'from-purple-600 to-indigo-900',
    tags: ['CV Routing', 'Eurorack', 'Modular FX'],
    moduleTypeToAdd: 'complex_fx',
  },
  {
    id: 'scream4_distortion',
    name: 'Scream 4 Sound Destruction Unit',
    category: 'fx',
    description: 'Multi-type saturation & overdrive unit with tape warp, tube warmth, and body resonator.',
    priceType: 'included_pass',
    rating: 4.9,
    downloads: '88k',
    badge: 'REASON VINTAGE CLASSIC',
    iconBg: 'from-rose-600 to-red-900',
    tags: ['Saturation', 'Tube Distortion', 'Resonator'],
    moduleTypeToAdd: 'scream',
  },
  {
    id: 'sp404_mfx',
    name: 'SP-404 MKII Vinyl & Lo-Fi FX',
    category: 'fx',
    description: 'Authentic vinyl crackle, cassette wow/flutter, pitch drift, and 303 isolator FX suite.',
    priceType: 'included_pass',
    rating: 4.9,
    downloads: '112k',
    badge: 'HOT TRENDING',
    iconBg: 'from-sky-600 to-blue-900',
    tags: ['Lo-Fi', 'Vinyl Crackle', 'Cassette Tape'],
    moduleTypeToAdd: 'sp404',
  },
  {
    id: 'sample_pack_808',
    name: 'Golden Era 808 & Hip-Hop Drums',
    category: 'samples',
    description: 'Over 450 pristine 24-bit WAV drum shots, 808 sub basses, and vinyl break loops.',
    priceType: 'free',
    rating: 4.7,
    downloads: '210k',
    badge: 'FREE SAMPLE PACK',
    iconBg: 'from-amber-500 to-orange-700',
    tags: ['Boom Bap', '808 Bass', 'WAV Samples'],
  },
  {
    id: 'sample_pack_cyberpunk',
    name: 'Cyberpunk Synthwave & Vocal Stems',
    category: 'samples',
    description: 'Multi-track vocal chops, dark synth arps, cinematic impact risers, and analog bass loops.',
    priceType: 'included_pass',
    rating: 4.9,
    downloads: '64k',
    badge: 'NEW RELEASE',
    iconBg: 'from-fuchsia-600 to-pink-900',
    tags: ['Synthwave', 'Vocal Stems', 'Cinematic'],
  },
  {
    id: 'skin_amber_vintage',
    name: 'Reason '98 Vintage Amber Faceplate',
    category: 'skins',
    description: 'Classic brushed steel rack ears, vintage yellow tape labels, and incandescent meters.',
    priceType: 'free',
    rating: 5.0,
    downloads: '340k',
    badge: 'DEFAULT THEME',
    iconBg: 'from-amber-600 to-stone-900',
    tags: ['Amber UI', 'Brushed Metal', 'Tape Sticker'],
  },
  {
    id: 'skin_cyber_neon',
    name: 'Retrowave Cyber OLED Neon Skin',
    category: 'skins',
    description: 'High-contrast glowing cyan & magenta LED meters, dark matte black aluminum chassis.',
    priceType: 'included_ultimate',
    priceOneTime: 9.99,
    rating: 4.8,
    downloads: '52k',
    badge: 'ULTIMATE EXCLUSIVE',
    iconBg: 'from-cyan-600 to-purple-900',
    tags: ['OLED', 'Neon LED', 'High Contrast'],
  },
];

export const PluginStoreModal: React.FC<PluginStoreModalProps> = ({
  isOpen,
  onClose,
  userTier,
  setUserTier,
  onInstallModule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(null);
  const [installedItems, setInstalledItems] = useState<string[]>(['subtractor_synth', 'sample_pack_808']);

  if (!isOpen) return null;

  const toggleAudioPreview = (id: string) => {
    if (previewingAudioId === id) {
      setPreviewingAudioId(null);
    } else {
      setPreviewingAudioId(id);
      setTimeout(() => setPreviewingAudioId(null), 4000); // simulate 4s preview audio
    }
  };

  const handleInstallItem = (item: ShopItem) => {
    if (!installedItems.includes(item.id)) {
      setInstalledItems((prev) => [...prev, item.id]);
    }
    if (item.moduleTypeToAdd && onInstallModule) {
      onInstallModule(item.moduleTypeToAdd);
    }
  };

  const filteredItems = STORE_ITEMS.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedPriceFilter === 'free' && item.priceType !== 'free') return false;
    if (selectedPriceFilter === 'pass' && item.priceType !== 'included_pass') return false;
    if (selectedPriceFilter === 'ultimate' && item.priceType !== 'included_ultimate') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const canAccessItem = (item: ShopItem) => {
    if (item.priceType === 'free') return true;
    if (item.priceType === 'included_pass' && (userTier === 'producer_pass' || userTier === 'all_access')) return true;
    if (item.priceType === 'included_ultimate' && userTier === 'all_access') return true;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-amber-500/70 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg font-black">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                REASON RACK STORE & EXTENSION MARKETPLACE
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                  V12 STORE
                </span>
              </h2>
              <span className="text-[10px] text-neutral-400">
                PLUGINS • SAMPLES • RACK EXTENSIONS • EFFECTS • CUSTOM SKINS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subscription Tier Selection Banner */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              ACTIVE PRODUCER SUBSCRIPTION PLAN
            </span>
            <span className="text-[10px] text-neutral-400">
              UNLIMITED ACCESS • CANCEL OR UPGRADE ANYTIME
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Free Tier */}
            <div
              onClick={() => setUserTier('free')}
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                userTier === 'free'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-white">FREE CREATOR</span>
                  <span className="text-xs font-bold text-neutral-400">$0 / mo</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  Standard stock instruments, Subtractor synth, 808 drum packs & basic audio engine.
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-400">BASIC RACK ACCESS</span>
                {userTier === 'free' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
            </div>

            {/* Producer Pass Tier */}
            <div
              onClick={() => setUserTier('producer_pass')}
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between relative overflow-hidden ${
                userTier === 'producer_pass'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-neutral-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                MOST POPULAR
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-emerald-400">PRODUCER PASS</span>
                  <span className="text-xs font-bold text-emerald-400">$9.99 / mo</span>
                </div>
                <p className="text-[10px] text-neutral-300 leading-tight">
                  Unlocks Thor Synth, SP-404 MFX, Scream Distortion, Cyberpunk sample packs & HD audio oversampling.
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-bold text-emerald-400">UNLIMITED STANDARD EXTENSIONS</span>
                {userTier === 'producer_pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>

            {/* All-Access Ultimate Tier */}
            <div
              onClick={() => setUserTier('all_access')}
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between relative overflow-hidden ${
                userTier === 'all_access'
                  ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl">
                ALL-ACCESS VIP
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-purple-300">ALL-ACCESS ULTIMATE</span>
                  <span className="text-xs font-bold text-purple-300">$19.99 / mo</span>
                </div>
                <p className="text-[10px] text-neutral-300 leading-tight">
                  Unlocks EVERY plugin, Voltage Modular FX, 8K OLED skins, AI stems, cloud backup & early access.
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-bold text-purple-300">100% UNLIMITED ALL EXTENSIONS</span>
                {userTier === 'all_access' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'synth', label: 'Synthesizers' },
              { id: 'fx', label: 'Effects & MFX' },
              { id: 'samples', label: 'Sample Packs' },
              { id: 'skins', label: 'Rack Skins' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search plugins, samples, skins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-neutral-200 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Store Grid Items Container */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const hasAccess = canAccessItem(item);
              const isInstalled = installedItems.includes(item.id);
              const isAudioPlaying = previewingAudioId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center text-white shadow-md font-black text-sm shrink-0`}
                        >
                          {item.category === 'synth' && <Music className="w-6 h-6" />}
                          {item.category === 'fx' && <Sliders className="w-6 h-6" />}
                          {item.category === 'samples' && <Disc className="w-6 h-6" />}
                          {item.category === 'skins' && <Palette className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-black text-neutral-100 text-xs flex items-center gap-1.5">
                            {item.name}
                          </h3>
                          <span className="text-[10px] text-neutral-400 font-bold block">
                            {item.badge || item.category.toUpperCase()} • {item.downloads} downloads
                          </span>
                        </div>
                      </div>

                      {/* Price Badge */}
                      <div className="text-right shrink-0">
                        {item.priceType === 'free' && (
                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-black text-[10px] px-2 py-0.5 rounded-full">
                            FREE
                          </span>
                        )}
                        {item.priceType === 'included_pass' && (
                          <span className="bg-sky-950/80 text-sky-400 border border-sky-500/40 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            PRODUCER PASS
                          </span>
                        )}
                        {item.priceType === 'included_ultimate' && (
                          <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            ALL-ACCESS
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-300 font-sans leading-snug">
                      {item.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="bg-neutral-950 text-neutral-400 text-[9px] font-bold px-2 py-0.5 rounded border border-neutral-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                    {/* Audio Preview Demo Button */}
                    <button
                      onClick={() => toggleAudioPreview(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition flex items-center gap-1.5 ${
                        isAudioPlaying
                          ? 'bg-amber-500 text-neutral-950 shadow animate-pulse'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {isAudioPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-amber-400" />}
                      <span>{isAudioPlaying ? 'PLAYING DEMO...' : 'AUDIO PREVIEW'}</span>
                    </button>

                    {/* Install / Add / Upgrade Button */}
                    {hasAccess ? (
                      <button
                        onClick={() => handleInstallItem(item)}
                        className={`px-4 py-1.5 rounded-xl font-black text-[11px] transition shadow flex items-center gap-1.5 ${
                          isInstalled
                            ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                        }`}
                      >
                        {isInstalled ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        <span>{isInstalled ? 'LOAD IN RACK' : 'INSTALL FREE'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.priceType === 'included_ultimate') setUserTier('all_access');
                          else setUserTier('producer_pass');
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] rounded-xl transition shadow flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>UPGRADE TO UNLOCK</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-neutral-400">
            CURRENT PLAN: <strong className="text-amber-400 uppercase">{userTier.replace('_', ' ')}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl transition shadow"
          >
            RETURN TO DAW RACK
          </button>
        </div>
      </div>
    </div>
  );
};
