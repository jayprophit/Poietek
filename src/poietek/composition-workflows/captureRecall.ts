import type {
  RetrospectiveCaptureObservation,
  RetrospectiveCaptureState,
} from './contracts';

export type RetrospectiveRecallRequest =
  | {ok: true; adapterId: string; streamId: string; requestedSeconds: number}
  | {ok: false; code: 'NOT_ARMED' | 'NO_OBSERVED_STREAM' | 'INVALID_DURATION' | 'INSUFFICIENT_BUFFER'; message: string};

export function createRetrospectiveCaptureState(maximumSeconds = 60): RetrospectiveCaptureState {
  if (!Number.isFinite(maximumSeconds) || maximumSeconds <= 0 || maximumSeconds > 600) {
    throw new Error('Retrospective capture maximum must be greater than 0 and no more than 600 seconds.');
  }
  return {maximumSeconds, armedIntent: false, observation: null, lastRecallAssetId: null};
}

export function setRetrospectiveCaptureIntent(
  state: RetrospectiveCaptureState,
  armedIntent: boolean,
): RetrospectiveCaptureState {
  return {...state, armedIntent, observation: armedIntent ? state.observation : null};
}

export function observeRetrospectiveStream(
  state: RetrospectiveCaptureState,
  observation: RetrospectiveCaptureObservation,
): RetrospectiveCaptureState {
  if (!state.armedIntent) throw new Error('Capture intent must be armed before a stream can be observed.');
  if (!observation.adapterId.trim() || !observation.streamId.trim()) throw new Error('Observed capture adapter and stream ids are required.');
  if (!Number.isFinite(observation.observedAt) || observation.observedAt <= 0) throw new Error('Observed capture time must be a positive timestamp.');
  if (!Number.isFinite(observation.bufferedSeconds) || observation.bufferedSeconds < 0) throw new Error('Observed buffered duration must be non-negative.');
  if (!Number.isFinite(observation.sampleRate) || observation.sampleRate <= 0) throw new Error('Observed sample rate must be positive.');
  if (!Number.isInteger(observation.channels) || observation.channels < 1) throw new Error('Observed channel count must be positive.');
  return {
    ...state,
    observation: {...observation, bufferedSeconds: Math.min(state.maximumSeconds, observation.bufferedSeconds)},
  };
}

export function requestRetrospectiveRecall(
  state: RetrospectiveCaptureState,
  requestedSeconds: number,
): RetrospectiveRecallRequest {
  if (!state.armedIntent) return {ok: false, code: 'NOT_ARMED', message: 'Arm capture intent before requesting recall.'};
  if (!Number.isFinite(requestedSeconds) || requestedSeconds <= 0 || requestedSeconds > state.maximumSeconds) {
    return {ok: false, code: 'INVALID_DURATION', message: `Recall must be greater than 0 and no more than ${state.maximumSeconds} seconds.`};
  }
  if (!state.observation) return {ok: false, code: 'NO_OBSERVED_STREAM', message: 'No live capture stream has been observed.'};
  if (state.observation.bufferedSeconds < requestedSeconds) {
    return {ok: false, code: 'INSUFFICIENT_BUFFER', message: `Only ${state.observation.bufferedSeconds} seconds have been observed in the adapter buffer.`};
  }
  return {
    ok: true,
    adapterId: state.observation.adapterId,
    streamId: state.observation.streamId,
    requestedSeconds,
  };
}

export function completeRetrospectiveRecall(
  state: RetrospectiveCaptureState,
  assetId: string,
): RetrospectiveCaptureState {
  if (!state.observation) throw new Error('A recall cannot complete without an observed capture stream.');
  if (!assetId.trim()) throw new Error('Completed recall requires a canonical asset id.');
  return {...state, lastRecallAssetId: assetId};
}

