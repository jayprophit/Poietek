import React, {useState} from 'react';
import { ChevronDown, ChevronRight, Power, ExternalLink, RefreshCw } from 'lucide-react';

interface StudioRackDeviceProps {
  title: string;
  subtitle?: string;
  manufacturer?: string;
  tapeLabel?: string;
  badgeColor?: string;
  onDetach?: () => void;
  onToggleFlip?: () => void;
  children: React.ReactNode;
}

export const StudioRackDevice: React.FC<StudioRackDeviceProps> = ({
  title,
  subtitle,
  manufacturer = 'POIETEK',
  tapeLabel,
  badgeColor = '#f59e0b',
  onDetach,
  onToggleFlip,
  children,
}) => {
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [powerOn, setPowerOn] = useState<boolean>(true);

  return (
    <div className="relative my-4 overflow-hidden rounded-[10px] border border-[#3b3d3e] bg-[#0f1215] shadow-[0_18px_32px_rgba(0,0,0,0.72)] ring-1 ring-black/40 select-none">
      <div className="absolute inset-y-0 left-0 w-8 border-r border-[#2d3033] bg-[linear-gradient(90deg,#1b1d1f_0%,#121518_100%)]" />
      <div className="absolute inset-y-0 right-0 w-8 border-l border-[#2d3033] bg-[linear-gradient(270deg,#1b1d1f_0%,#121518_100%)]" />

      <div className="absolute left-0 top-0 z-20 flex h-full w-8 flex-col items-center justify-between py-3">
        <div className="h-3.5 w-3.5 rounded-full border border-[#7c8489] bg-[radial-gradient(circle,#d5d9dc_0%,#8a8f94_38%,#1e2327_100%)] shadow-[inset_0_0_4px_rgba(255,255,255,0.5)]" />
        <button
          type="button"
          onClick={() => setIsFolded((value) => !value)}
          className="rounded border border-[#4a4f53] bg-[#171b1d] p-1 text-[#dfe6ea] transition hover:border-[#f59e0b] hover:text-[#fbbf24]"
          title={isFolded ? 'Expand rack unit' : 'Collapse rack unit'}
        >
          {isFolded ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <div className="h-3.5 w-3.5 rounded-full border border-[#7c8489] bg-[radial-gradient(circle,#d5d9dc_0%,#8a8f94_38%,#1e2327_100%)] shadow-[inset_0_0_4px_rgba(255,255,255,0.5)]" />
      </div>

      <div className="absolute right-0 top-0 z-20 flex h-full w-8 flex-col items-center justify-between py-3">
        <div className="h-3.5 w-3.5 rounded-full border border-[#7c8489] bg-[radial-gradient(circle,#d5d9dc_0%,#8a8f94_38%,#1e2327_100%)] shadow-[inset_0_0_4px_rgba(255,255,255,0.5)]" />
        <button
          type="button"
          onClick={() => setPowerOn((value) => !value)}
          className={`rounded border p-1 transition ${powerOn ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300' : 'border-[#434a4f] bg-[#171b1d] text-[#7b8389]'}`}
          title="Toggle hardware power"
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-3.5 rounded-full border border-[#7c8489] bg-[radial-gradient(circle,#d5d9dc_0%,#8a8f94_38%,#1e2327_100%)] shadow-[inset_0_0_4px_rgba(255,255,255,0.5)]" />
      </div>

      <div className="relative pl-9 pr-9">
        <div className="flex items-center justify-between gap-3 border-b border-[#2a2e32] bg-[linear-gradient(90deg,#13181a_0%,#1a1e22_18%,#111619_100%)] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="inline-flex items-center justify-center rounded-[3px] border border-[#d8a55b]/80 bg-[linear-gradient(180deg,#f8d7a3_0%,#f59e0b_48%,#d97706_100%)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#20150b] shadow-[0_1px_0_rgba(255,255,255,0.7),0_4px_12px_rgba(245,158,11,0.3)]"
              style={{ transform: 'skewX(-11deg)' }}
            >
              <span style={{ transform: 'skewX(11deg)' }}>{tapeLabel || title}</span>
            </div>
            {!isFolded && (
              <div className="min-w-0">
                <div className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#a6adb3]">{manufacturer}</div>
                <div className="truncate text-[9px] uppercase tracking-[0.12em] text-[#7b8389]">{subtitle || 'Virtual rack module'}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#d5d9dc]">
            {onToggleFlip && (
              <button
                type="button"
                onClick={onToggleFlip}
                className="flex items-center gap-1 rounded border border-[#d97706]/60 bg-[#1d1a16] px-2 py-1 text-[#f59e0b] transition hover:border-[#fbbf24] hover:text-[#fce7b3]"
                title="Flip to rear patch bay"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden md:inline">Rear</span>
              </button>
            )}
            {onDetach && (
              <button
                type="button"
                onClick={onDetach}
                className="flex items-center gap-1 rounded border border-[#3a4247] bg-[#181c1e] px-2 py-1 text-[#dfe6ea] transition hover:border-[#f59e0b] hover:text-[#f9d58a]"
                title="Detach device"
              >
                <ExternalLink className="h-3 w-3 text-[#f59e0b]" />
                <span className="hidden md:inline">Detach</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded border border-[#2d3033] bg-[#111518] px-2 py-1 text-[#a6adb3]">
              <span>Power</span>
              <span className={`h-2 w-2 rounded-full ${powerOn ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-[#4b5359]'}`} />
            </div>
          </div>
        </div>

        {!isFolded && (
          <div className={`bg-[radial-gradient(circle_at_top,#1b2127_0%,#0b0d10_48%,#080a0c_100%)] px-3 pb-3 pt-4 transition-opacity ${powerOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="rounded-[6px] border border-[#2d3337] bg-[linear-gradient(180deg,#101517_0%,#0b0f12_100%)] p-2 shadow-inner shadow-black/40">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};
