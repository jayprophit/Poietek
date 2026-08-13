import React, { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';
import {
  Globe,
  CheckCircle2,
  Sparkles,
  X,
  Languages,
  Zap,
  Volume2,
  MessageSquare,
  ArrowRight,
  Bot,
  Search,
} from 'lucide-react';

interface LanguageTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageTranslatorModal: React.FC<LanguageTranslatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, setLanguage, currentLanguageObj, t, translateTextAI } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [customInputText, setCustomInputText] = useState('');
  const [translatedOutput, setTranslatedOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  if (!isOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTestAITranslate = async () => {
    if (!customInputText.trim()) return;
    setIsTranslating(true);
    const result = await translateTextAI(customInputText, language);
    setTranslatedOutput(result);
    setIsTranslating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[220] flex items-center justify-center p-3 sm:p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                UNIVERSAL STUDIO TRANSLATOR & LANGUAGE PICKER
              </h2>
              <span className="text-[10px] text-amber-400 font-bold">
                16 GLOBAL LANGUAGES • REAL-TIME INTERFACE & TRACK TITLE TRANSLATION
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Language Info */}
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentLanguageObj.flag}</span>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">
                CURRENT ACTIVE LANGUAGE
              </span>
              <h3 className="text-sm font-black text-amber-300 uppercase">
                {currentLanguageObj.name} ({currentLanguageObj.nativeName})
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ACTIVE</span>
          </span>
        </div>

        {/* Search & Language Grid */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search native language... (e.g. Spanish, 日本語, Deutsch, Français)"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-lg ring-2 ring-amber-400/40 scale-102'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{lang.flag}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-neutral-950 fill-amber-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase leading-tight">{lang.name}</h4>
                    <span
                      className={`text-[10px] font-bold block opacity-80 ${
                        isSelected ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {lang.nativeName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Track & Lyric Live Translator Playground */}
          <div className="mt-4 p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <h4 className="font-black text-white text-xs uppercase">
                AI LIVE TRACK & NOTE TRANSLATOR
              </h4>
            </div>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Type or paste any track title, sample name, or lyric in any language to test instant translation into your active language:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="e.g. 'Deep 808 Bassline' or 'Pista de Batería'"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleTestAITranslate}
                disabled={isTranslating || !customInputText.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTranslating ? 'TRANSLATING...' : 'TRANSLATE'}</span>
              </button>
            </div>
            {translatedOutput && (
              <div className="p-3 bg-neutral-950 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{translatedOutput}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 uppercase">
            SETTINGS SAVED AUTOMATICALLY • PERSISTS ACROSS ALL SESSIONS
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black transition shadow"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
