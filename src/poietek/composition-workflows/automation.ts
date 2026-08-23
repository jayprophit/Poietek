import type {
  AutomationCurve,
  CompositionAutomationEnvelope,
  CompositionAutomationPoint,
  CompositionWorkflowState,
} from './contracts';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

function validatePoint(point: CompositionAutomationPoint): void {
  if (!Number.isInteger(point.tick) || point.tick < 0) {
    throw new Error('Automation point tick must be a non-negative whole number.');
  }
  if (!Number.isFinite(point.value) || point.value < 0 || point.value > 1) {
    throw new Error('Automation point value must be between 0 and 1.');
  }
  if (!Number.isFinite(point.tension) || point.tension < -1 || point.tension > 1) {
    throw new Error('Automation point tension must be between -1 and 1.');
  }
}

export function createAutomationEnvelope(
  id: string,
  targetId: string,
  parameterId: string,
  points: CompositionAutomationPoint[] = [],
): CompositionAutomationEnvelope {
  if (!id.trim() || !targetId.trim() || !parameterId.trim()) {
    throw new Error('Automation envelope id, target and parameter are required.');
  }
  const next = points.map((point) => ({...point})).sort((left, right) => left.tick - right.tick);
  next.forEach(validatePoint);
  if (new Set(next.map((point) => point.tick)).size !== next.length) {
    throw new Error('Automation envelope cannot contain two points at the same tick.');
  }
  return {id, targetId, parameterId, points: next};
}

export function addAutomationEnvelope(
  state: CompositionWorkflowState,
  envelope: CompositionAutomationEnvelope,
): CompositionWorkflowState {
  if (state.automationEnvelopes.some((candidate) => candidate.id === envelope.id)) {
    throw new Error(`Automation envelope ${envelope.id} already exists.`);
  }
  const validated = createAutomationEnvelope(
    envelope.id,
    envelope.targetId,
    envelope.parameterId,
    envelope.points,
  );
  return {
    ...state,
    revision: state.revision + 1,
    automationEnvelopes: [...state.automationEnvelopes, validated],
  };
}

export function upsertAutomationPoint(
  state: CompositionWorkflowState,
  envelopeId: string,
  point: CompositionAutomationPoint,
): CompositionWorkflowState {
  validatePoint(point);
  if (!state.automationEnvelopes.some((candidate) => candidate.id === envelopeId)) {
    throw new Error(`Automation envelope ${envelopeId} was not found.`);
  }
  return {
    ...state,
    revision: state.revision + 1,
    automationEnvelopes: state.automationEnvelopes.map((envelope) => {
      const cloned = envelope.points.map((candidate) => ({...candidate}));
      if (envelope.id !== envelopeId) return {...envelope, points: cloned};
      const retained = cloned.filter((candidate) => candidate.tick !== point.tick);
      return {...envelope, points: [...retained, {...point}].sort((left, right) => left.tick - right.tick)};
    }),
  };
}

export function deleteAutomationPoint(
  state: CompositionWorkflowState,
  envelopeId: string,
  tick: number,
): CompositionWorkflowState {
  const envelope = state.automationEnvelopes.find((candidate) => candidate.id === envelopeId);
  if (!envelope) throw new Error(`Automation envelope ${envelopeId} was not found.`);
  if (!envelope.points.some((point) => point.tick === tick)) return state;
  return {
    ...state,
    revision: state.revision + 1,
    automationEnvelopes: state.automationEnvelopes.map((candidate) => candidate.id === envelopeId
      ? {...candidate, points: candidate.points.filter((point) => point.tick !== tick).map((point) => ({...point}))}
      : {...candidate, points: candidate.points.map((point) => ({...point}))}),
  };
}

function interpolate(curve: AutomationCurve, progress: number, tension: number): number {
  if (curve === 'hold') return 0;
  if (curve === 'linear') return progress;
  const smooth = progress * progress * (3 - 2 * progress);
  if (tension >= 0) return progress + (smooth - progress) * tension;
  const stepped = progress < 0.5 ? 0 : 1;
  return progress + (stepped - progress) * -tension;
}

export function evaluateAutomationEnvelope(
  envelope: CompositionAutomationEnvelope,
  tick: number,
  fallbackValue = 0,
): number {
  if (!Number.isFinite(tick)) throw new Error('Automation evaluation tick must be finite.');
  if (!envelope.points.length) return clamp(fallbackValue, 0, 1);
  const points = [...envelope.points].sort((left, right) => left.tick - right.tick);
  if (tick <= points[0].tick) return points[0].value;
  const last = points[points.length - 1];
  if (tick >= last.tick) return last.value;
  const rightIndex = points.findIndex((point) => point.tick > tick);
  const left = points[rightIndex - 1];
  const right = points[rightIndex];
  const progress = (tick - left.tick) / (right.tick - left.tick);
  const amount = interpolate(left.curve, progress, left.tension);
  return clamp(left.value + (right.value - left.value) * amount, 0, 1);
}

