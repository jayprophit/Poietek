import type {
  LoopSourceDescriptor,
  LoopSourceRole,
  LoopStarterDraft,
} from './contracts';

const DEFAULT_ROLES: readonly LoopSourceRole[] = ['drums', 'bass', 'harmony', 'melody'];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isEligible(source: LoopSourceDescriptor): boolean {
  return Boolean(
    source.assetId.trim()
    && source.rightsEvidenceReference.trim()
    && Number.isFinite(source.bpm)
    && source.bpm > 0
    && Number.isFinite(source.durationSeconds)
    && source.durationSeconds > 0,
  );
}

export function validateLoopSources(sources: readonly LoopSourceDescriptor[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const source of sources) {
    if (!source.assetId.trim()) issues.push('Loop source asset id is required.');
    if (ids.has(source.assetId)) issues.push(`Duplicate loop source asset id ${source.assetId}.`);
    ids.add(source.assetId);
    if (!source.rightsEvidenceReference.trim()) issues.push(`Loop source ${source.assetId} requires rights evidence.`);
    if (!Number.isFinite(source.bpm) || source.bpm <= 0) issues.push(`Loop source ${source.assetId} has an invalid BPM.`);
    if (!Number.isFinite(source.durationSeconds) || source.durationSeconds <= 0) issues.push(`Loop source ${source.assetId} has an invalid duration.`);
  }
  return issues;
}

export function createLoopStarterDraft(
  id: string,
  seed: string,
  targetBpm: number,
  targetKey: string | null,
  sources: readonly LoopSourceDescriptor[],
  requestedRoles: readonly LoopSourceRole[] = DEFAULT_ROLES,
): LoopStarterDraft {
  if (!id.trim() || !seed.trim()) throw new Error('Loop starter id and seed are required.');
  if (!Number.isFinite(targetBpm) || targetBpm < 20 || targetBpm > 400) {
    throw new Error('Loop starter target BPM must be between 20 and 400.');
  }
  const duplicateRoles = requestedRoles.filter((role, index) => requestedRoles.indexOf(role) !== index);
  if (duplicateRoles.length) throw new Error(`Loop starter requested duplicate role ${duplicateRoles[0]}.`);
  const selections = [];
  const missingRoles: LoopSourceRole[] = [];
  for (const role of requestedRoles) {
    const eligible = sources.filter((source) => source.role === role && isEligible(source))
      .sort((left, right) => left.assetId.localeCompare(right.assetId));
    if (!eligible.length) {
      missingRoles.push(role);
      continue;
    }
    const selected = eligible[hashSeed(`${seed}:${role}`) % eligible.length];
    selections.push({
      role,
      assetId: selected.assetId,
      sourceBpm: selected.bpm,
      sourceKey: selected.key,
      requiresTimeStretch: Math.abs(selected.bpm - targetBpm) > 0.01,
      requiresPitchShift: targetKey !== null && selected.key !== null && selected.key !== targetKey,
    });
  }
  return {
    id,
    seed,
    targetBpm,
    targetKey,
    selections,
    missingRoles,
    status: missingRoles.length ? 'incomplete' : 'ready_for_preview',
    renderState: 'not_requested',
  };
}

