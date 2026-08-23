import {CREATIVE_TOOLKIT_SCHEMA_VERSION, type ChopMap, type ChopPoint} from './contracts';

const MAX_CHOPS = 128;
const PADS_PER_BANK = 16;

export function createChopMap(input: {
  id: string;
  assetId: string;
  sourceDurationSeconds: number;
  projectBpm: number;
  sourceBpm?: number | null;
  sourceSeconds: readonly number[];
  gate?: boolean;
  chopOffsetMilliseconds?: number;
}): ChopMap {
  if (!input.id || !input.assetId) throw new Error('Chop map and asset ids are required.');
  if (!Number.isFinite(input.sourceDurationSeconds) || input.sourceDurationSeconds <= 0) throw new RangeError('Source duration must be positive.');
  if (!Number.isFinite(input.projectBpm) || input.projectBpm < 20 || input.projectBpm > 400) throw new RangeError('Project BPM must be between 20 and 400.');
  if (input.sourceSeconds.length > MAX_CHOPS) throw new RangeError(`A chop map supports at most ${MAX_CHOPS} points.`);

  const offsetSeconds = (input.chopOffsetMilliseconds ?? 0) / 1000;
  const starts = [...new Set(input.sourceSeconds.map((value) => Math.max(0, Math.min(input.sourceDurationSeconds, value + offsetSeconds))))]
    .sort((left, right) => left - right);
  const points: ChopPoint[] = starts.map((sourceSeconds, index) => ({
    id: `${input.id}:chop:${index + 1}`,
    sourceSeconds,
    endSeconds: starts[index + 1] ?? input.sourceDurationSeconds,
    bank: Math.floor(index / PADS_PER_BANK),
    pad: index % PADS_PER_BANK,
    midiNote: 36 + index,
    gate: input.gate ?? true,
  }));

  return {
    schemaVersion: CREATIVE_TOOLKIT_SCHEMA_VERSION,
    id: input.id,
    assetId: input.assetId,
    sourceDurationSeconds: input.sourceDurationSeconds,
    sourceBpm: input.sourceBpm ?? null,
    projectBpm: input.projectBpm,
    playbackMode: input.sourceBpm && input.sourceBpm !== input.projectBpm ? 'time_preserving_stretch_required' : 'original_speed',
    chopOffsetMilliseconds: input.chopOffsetMilliseconds ?? 0,
    points,
  };
}

export function validateChopMap(map: ChopMap): readonly string[] {
  const errors: string[] = [];
  if (map.schemaVersion !== CREATIVE_TOOLKIT_SCHEMA_VERSION) errors.push('Unsupported chop-map schema version.');
  if (map.points.length > MAX_CHOPS) errors.push(`Chop map exceeds ${MAX_CHOPS} points.`);
  let previous = -1;
  for (const point of map.points) {
    if (point.sourceSeconds < 0 || point.sourceSeconds < previous || point.endSeconds <= point.sourceSeconds || point.endSeconds > map.sourceDurationSeconds) {
      errors.push(`Chop ${point.id} has an invalid non-destructive source range.`);
    }
    if (point.bank < 0 || point.bank > 7 || point.pad < 0 || point.pad >= PADS_PER_BANK) errors.push(`Chop ${point.id} has an invalid pad assignment.`);
    previous = point.sourceSeconds;
  }
  return errors;
}
