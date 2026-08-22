import './ProductionEngineConsole.css';

export type ProductionEngineLaneState =
  | 'ready'
  | 'degraded'
  | 'configuration_required'
  | 'unavailable'
  | 'blocked';

export interface ProductionEngineLane {
  id: 'audio' | 'edit' | 'midi' | 'plugins' | 'video' | 'vfx' | 'delivery';
  title: string;
  state: ProductionEngineLaneState;
  summary: string;
  exitCriterion: string;
  evidence?: readonly string[];
}

export interface ProductionEngineConsoleProps {
  lanes?: readonly ProductionEngineLane[];
  compact?: boolean;
}

/**
 * The web build must never infer native capability from UI availability. These
 * defaults deliberately remain unavailable until an adapter supplies evidence.
 */
export const DEFAULT_PRODUCTION_ENGINE_LANES: readonly ProductionEngineLane[] = [
  {
    id: 'audio',
    title: 'Native audio',
    state: 'unavailable',
    summary: 'The browser timeline is available; a native callback and device adapter are not connected.',
    exitCriterion: 'Probe a real backend, open selected ports, run the callback and record xrun evidence.',
  },
  {
    id: 'edit',
    title: 'Professional editing',
    state: 'degraded',
    summary: 'Deterministic move, slip, ripple trim, crossfade and MIDI transformations are implemented.',
    exitCriterion: 'Complete comping, automation, grouping, freeze/commit and interchange acceptance tests.',
  },
  {
    id: 'midi',
    title: 'MIDI and scoring',
    state: 'configuration_required',
    summary: 'Web MIDI capability detection is honest; complete clips, MPE, output clock and notation need adapters.',
    exitCriterion: 'Validate timestamped input/output, transport clock, articulation maps and MusicXML round trips.',
  },
  {
    id: 'plugins',
    title: 'Plug-in host',
    state: 'unavailable',
    summary: 'The host contract is present, but no native scan, sandbox or format bridge is connected.',
    exitCriterion: 'Ship scan, quarantine, sandbox, state recall, delay compensation and recovery evidence.',
  },
  {
    id: 'video',
    title: 'Video and proxy',
    state: 'unavailable',
    summary: 'The project model can describe media work; no validated native codec/proxy adapter is connected.',
    exitCriterion: 'Demonstrate frame-accurate decode, proxies, captions, multicam and cancellable render jobs.',
  },
  {
    id: 'vfx',
    title: 'VFX, colour and animation',
    state: 'unavailable',
    summary: 'Node, keyframe, tracking, colour and render contracts exist without a GPU execution backend.',
    exitCriterion: 'Validate graph execution, colour transforms, cache invalidation and deterministic render output.',
  },
  {
    id: 'delivery',
    title: 'Delivery and QC',
    state: 'blocked',
    summary: 'LUFS, dBTP, caption, codec and package checks remain not measured without validated analyzers.',
    exitCriterion: 'Attach BS.1770, oversampled true-peak and programme-QC evidence to each delivery profile.',
  },
] as const;

const STATE_LABELS: Readonly<Record<ProductionEngineLaneState, string>> = {
  ready: 'Ready',
  degraded: 'Partial',
  configuration_required: 'Setup needed',
  unavailable: 'Unavailable',
  blocked: 'Blocked',
};

export function ProductionEngineConsole({
  lanes = DEFAULT_PRODUCTION_ENGINE_LANES,
  compact = false,
}: ProductionEngineConsoleProps) {
  const verifiedCount = lanes.filter((lane) => lane.state === 'ready').length;
  const verifiedPercent = lanes.length === 0 ? 0 : Math.round((verifiedCount / lanes.length) * 100);

  return (
    <section
      className={`production-engine-console${compact ? ' production-engine-console--compact' : ''}`}
      aria-labelledby="production-engine-console-title"
    >
      <header className="production-engine-console__header">
        <div>
          <p className="production-engine-console__eyebrow">Runtime evidence</p>
          <h2 id="production-engine-console-title">Production engines</h2>
        </div>
        <p>
          <strong>{verifiedCount}/{lanes.length} validated ({verifiedPercent}%)</strong>
          <span> · Capability is shown only after its real adapter supplies evidence.</span>
        </p>
      </header>

      <div className="production-engine-console__grid">
        {lanes.map((lane) => (
          <article className="production-engine-console__lane" key={lane.id}>
            <div className="production-engine-console__lane-heading">
              <h3>{lane.title}</h3>
              <span className={`production-engine-console__state production-engine-console__state--${lane.state}`}>
                {STATE_LABELS[lane.state]}
              </span>
            </div>
            <p>{lane.summary}</p>
            {!compact && (
              <details>
                <summary>Acceptance evidence required</summary>
                <p>{lane.exitCriterion}</p>
                {lane.evidence && lane.evidence.length > 0 && (
                  <ul>
                    {lane.evidence.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </details>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
