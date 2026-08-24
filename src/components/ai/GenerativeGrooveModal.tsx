import React, { useState } from 'react';
import { Wand2, X, Sparkles, Check, Music2 } from 'lucide-react';

interface GenerativeGrooveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGroove: (style: string, bpm: number) => void;
}

export const GenerativeGrooveModal: React.FC<GenerativeGrooveModalProps> = ({
  isOpen,
  onClose,
  onApplyGroove,
}) => {
  const [prompt, setPrompt] = useState<string>('90s Boom Bap Hip Hop beat with shuffle swing');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<{
    style: string;
    suggestedBpm: number;
    swing: number;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedResult(null);

    setTimeout(() => {
      let bpm = 92;
      if (prompt.toLowerCase().includes('house') || prompt.toLowerCase().includes('techno')) bpm = 126;
      if (prompt.toLowerCase().includes('trap') || prompt.toLowerCase().includes('drill')) bpm = 140;
      if (prompt.toLowerCase().includes('lofi') || prompt.toLowerCase().includes('chill')) bpm = 84;

      setGeneratedResult({
        style: prompt,
        suggestedBpm: bpm,
        swing: 58,
        description: `Generated local groove preview for Canvas Bank A and Grain Deck texture effects. Includes syncopated kick, ghost snares, and 1/16 shuffle hats.`,
      });
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Wand2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Poietek Groove Preview Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Describe the rhythm style, genre, or vibe:
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-sm text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Detroit Techno, Afrobeat 120BPM, Lofi Chillhop..."
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition active:scale-95 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Generating AI Rhythm Matrix...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>GENERATE RHYTHM PATTERN</span>
            </>
          )}
        </button>

        {generatedResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Pattern Generated
              </span>
              <span className="font-mono">{generatedResult.suggestedBpm} BPM</span>
            </div>

            <p className="text-xs text-slate-300">{generatedResult.description}</p>

            <button
              onClick={() => {
                onApplyGroove(generatedResult.style, generatedResult.suggestedBpm);
                onClose();
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
            >
              APPLY GROOVE TO ACTIVE SEQUENCER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
