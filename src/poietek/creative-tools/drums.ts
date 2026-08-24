import {type DrumPattern, type RenderedDrumHit} from './contracts';

function seededUnit(seed: number): () => number {
  let state = seed >>> 0 || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function renderDrumPattern(pattern: DrumPattern, seed: number): readonly RenderedDrumHit[] {
  const errors = validateDrumPattern(pattern);
  if (errors.length) throw new Error(errors.join(' '));
  const random = seededUnit(seed);
  const hits: RenderedDrumHit[] = [];
  for (const lane of pattern.lanes) {
    if (lane.muted) continue;
    lane.steps.forEach((step, index) => {
      if (!step.active || random() > step.probability) return;
      const swingOffset = index % 2 === 1 ? Math.round(pattern.swing * 24) : 0;
      hits.push({laneId: lane.id, step: index, velocity: step.velocity, pan: step.pan, repeat: step.repeat, offsetTicks: step.shiftTicks + swingOffset});
    });
  }
  return hits;
}

export function validateDrumPattern(pattern: DrumPattern): readonly string[] {
  const errors: string[] = [];
  if (![16, 32, 64].includes(pattern.stepCount)) errors.push('Step count must be 16, 32 or 64.');
  if (!Number.isFinite(pattern.bpm) || pattern.bpm < 20 || pattern.bpm > 400) errors.push('BPM must be between 20 and 400.');
  if (!Number.isFinite(pattern.swing) || pattern.swing < 0 || pattern.swing > 1) errors.push('Swing must be between 0 and 1.');
  for (const lane of pattern.lanes) {
    if (lane.steps.length !== pattern.stepCount) errors.push(`Lane ${lane.id} does not match the pattern step count.`);
    for (const step of lane.steps) {
      if (step.probability < 0 || step.probability > 1) errors.push(`Lane ${lane.id} has invalid probability.`);
      if (step.velocity < 0 || step.velocity > 1 || step.pan < -1 || step.pan > 1) errors.push(`Lane ${lane.id} has invalid velocity or pan.`);
    }
  }
  return errors;
}
