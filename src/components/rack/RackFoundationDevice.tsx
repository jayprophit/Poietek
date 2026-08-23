import React from 'react';
import {Activity, Cable, CircleAlert, SlidersHorizontal} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import {getRackModuleDefinition} from './rackModuleCatalog';
import {
  getProductionWorkflowDefinition,
  isProductionWorkflowKind,
} from '../../poietek/production-workflows';

interface RackFoundationDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
}

interface ParameterRange {
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

const parameterRanges: Readonly<Record<string, ParameterRange>> = {
  gainDb: {min: -60, max: 24, step: 0.1, suffix: ' dB'},
  lowDb: {min: -18, max: 18, step: 0.1, suffix: ' dB'},
  lowMidDb: {min: -18, max: 18, step: 0.1, suffix: ' dB'},
  highMidDb: {min: -18, max: 18, step: 0.1, suffix: ' dB'},
  highDb: {min: -18, max: 18, step: 0.1, suffix: ' dB'},
  thresholdDb: {min: -60, max: 0, step: 0.1, suffix: ' dB'},
  ratio: {min: 1, max: 20, step: 0.1, suffix: ':1'},
  attackMs: {min: 0.1, max: 200, step: 0.1, suffix: ' ms'},
  releaseMs: {min: 10, max: 2000, step: 1, suffix: ' ms'},
  decaySeconds: {min: 0.1, max: 30, step: 0.1, suffix: ' s'},
  preDelayMs: {min: 0, max: 250, step: 1, suffix: ' ms'},
  timeBeats: {min: 0.0625, max: 4, step: 0.0625, suffix: ' beats'},
  rateHz: {min: 0.01, max: 20, step: 0.01, suffix: ' Hz'},
  octaveRange: {min: 1, max: 4, step: 1},
  pan: {min: -1, max: 1, step: 0.01},
  phase: {min: 0, max: 360, step: 1, suffix: '°'},
  width: {min: 0, max: 2, step: 0.01},
  transposeSemitones: {min: -48, max: 48, step: 1, suffix: ' st'},
  velocityScale: {min: 0, max: 2, step: 0.01},
  lowNote: {min: 0, max: 127, step: 1},
  highNote: {min: 0, max: 127, step: 1},
  outputChannel: {min: 1, max: 16, step: 1},
  playerCount: {min: 1, max: 128, step: 1},
  sensitivity: {min: 0, max: 1, step: 0.01},
  tailSeconds: {min: 0, max: 30, step: 0.1, suffix: ' s'},
  normalizeTargetDbfs: {min: -24, max: 0, step: 0.1, suffix: ' dBFS'},
  bedChannels: {min: 1, max: 128, step: 1},
  objectCount: {min: 0, max: 128, step: 1},
  loudnessTargetLufs: {min: -36, max: -5, step: 0.1, suffix: ' LUFS target'},
  truePeakLimitDbtp: {min: -12, max: 0, step: 0.1, suffix: ' dBTP limit'},
  cueBusCount: {min: 0, max: 4, step: 1},
  dimDb: {min: -60, max: 0, step: 1, suffix: ' dB'},
};

const parameterOptions: Readonly<Record<string, readonly string[]>> = {
  source: ['main', 'cue_a', 'cue_b', 'reference'],
  monitorFormat: ['mono', 'stereo', '5.1', '7.1.4', 'ambisonic_1oa'],
  scoreMode: ['setup', 'write', 'engrave', 'play', 'print'],
  operation: ['repair', 'isolate', 'layer', 'stem_separation'],
  selectionMode: ['brush', 'rectangle', 'frequency', 'harmonics'],
  processMode: ['gain', 'trim_silence', 'normalize_sample_peak', 'reverse', 'fade', 'dc_offset_repair', 'resample'],
  timecodeRate: ['23.976', '24', '25', '29.97_df', '30'],
  proxyMode: ['off', 'half', 'quarter'],
  deliveryProfile: ['music_streaming', 'broadcast', 'podcast', 'archive'],
  sessionRole: ['producer', 'performer', 'observer'],
  sessionState: ['offline', 'draft', 'waiting_for_consent'],
};

const humanize = (value: string) => value
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/^./, (character) => character.toUpperCase());

function rangeFor(name: string): ParameterRange {
  if (parameterRanges[name]) return parameterRanges[name];
  return {min: 0, max: 1, step: 0.01};
}

export const RackFoundationDevice: React.FC<RackFoundationDeviceProps> = ({
  module,
  onParametersChange,
}) => {
  const definition = getRackModuleDefinition(module.type);
  const productionWorkflow = isProductionWorkflowKind(module.type)
    ? getProductionWorkflowDefinition(module.type)
    : null;
  const parameters = module.parameters ?? definition.defaultParameters ?? {};
  const stateLabel = definition.engineState === 'operational'
    ? 'Engine connected'
    : definition.engineState === 'native_required'
      ? 'Native host required'
      : definition.engineState === 'external_required'
        ? 'External adapter required'
      : 'Control model';
  const stateStyle = definition.engineState === 'operational'
    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
    : definition.engineState === 'native_required'
      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
      : definition.engineState === 'external_required'
        ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
      : 'border-amber-500/50 bg-amber-500/10 text-amber-300';

  const updateParameter = (name: string, value: number | boolean | string) => {
    onParametersChange({...parameters, [name]: value});
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/85 p-3 text-slate-200 shadow-inner">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">{definition.role} device</div>
            <div className="text-[9px] text-slate-500">{productionWorkflow?.discipline ?? 'Original Poietek rack foundation'}</div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${stateStyle}`}>
          {stateLabel}
        </span>
      </div>

      {definition.engineState !== 'operational' && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2 text-[9px] leading-relaxed text-amber-100/80">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          {productionWorkflow?.truthNote ?? 'Parameters are saved as a rack control model. They do not claim active DSP until the audio-engine adapter reports an observed route.'}
        </div>
      )}

      {productionWorkflow && (
        <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
            <div className="mb-1 text-[8px] font-black uppercase tracking-wider text-cyan-300">Available local model</div>
            <div className="flex flex-wrap gap-1">
              {productionWorkflow.localCapabilities.map((capability) => <span key={capability} className="rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[8px] text-slate-300">{capability}</span>)}
            </div>
          </div>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2">
            <div className="mb-1 text-[8px] font-black uppercase tracking-wider text-violet-300">Evidence still required</div>
            <div className="flex flex-wrap gap-1">
              {productionWorkflow.requiredCapabilities.length
                ? productionWorkflow.requiredCapabilities.map((capability) => <span key={capability} className="rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[8px] text-slate-300">{humanize(capability)}</span>)
                : <span className="text-[8px] text-slate-500">No additional processing adapter for the deterministic control logic.</span>}
            </div>
          </div>
        </div>
      )}

      {Object.keys(parameters).length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(parameters).map(([name, value]) => {
            if (typeof value === 'boolean') {
              return (
                <label key={name} className="flex min-h-16 items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-[10px] font-bold">
                  <span>{humanize(name)}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) => updateParameter(name, event.target.checked)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>
              );
            }
            if (typeof value === 'string') {
              const options = parameterOptions[name] ?? [value];
              return (
                <label key={name} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-[9px]">
                  <span className="mb-1 block font-bold text-slate-300">{humanize(name)}</span>
                  <select
                    aria-label={`${definition.label} ${humanize(name)}`}
                    value={value}
                    onChange={(event) => updateParameter(name, event.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[9px] font-bold text-cyan-200 outline-none focus:border-cyan-400"
                  >
                    {options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
                  </select>
                </label>
              );
            }
            if (typeof value !== 'number') return null;
            const range = rangeFor(name);
            return (
              <label key={name} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-[9px]">
                <span className="mb-1 flex items-center justify-between gap-2 font-bold text-slate-300">
                  <span>{humanize(name)}</span>
                  <span className="font-mono text-cyan-300">{value}{range.suffix ?? ''}</span>
                </span>
                <input
                  aria-label={`${definition.label} ${humanize(name)}`}
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={value}
                  onChange={(event) => updateParameter(name, Number(event.target.value))}
                  className="h-1.5 w-full accent-cyan-400"
                />
              </label>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-3 text-[10px] text-slate-400">
          This utility exposes routing ports rather than sound parameters.
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2 text-[9px] text-slate-400">
        <Cable className="h-3.5 w-3.5 text-cyan-300" />
        <span className="font-bold text-slate-300">IN</span>
        <span>{definition.inputs.length ? definition.inputs.join(' · ') : 'none'}</span>
        <span className="mx-1 text-slate-700">|</span>
        <span className="font-bold text-slate-300">OUT</span>
        <span>{definition.outputs.length ? definition.outputs.join(' · ') : 'none'}</span>
        <Activity className="ml-auto h-3.5 w-3.5 text-slate-600" />
      </div>
    </div>
  );
};
