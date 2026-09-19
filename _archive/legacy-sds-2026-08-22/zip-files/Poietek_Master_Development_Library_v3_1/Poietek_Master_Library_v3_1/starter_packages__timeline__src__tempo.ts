import type { TempoEvent } from "../../domain/src/types";

export function ticksToSeconds(
  tick: number,
  tempoMap: TempoEvent[],
  ppq: number,
): number {
  if (tick <= 0) return 0;
  if (ppq <= 0) throw new Error("PPQ must be positive.");
  if (tempoMap.length === 0) throw new Error("Tempo map is empty.");

  const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
  let seconds = 0;
  let previousTick = 0;
  let bpm = events[0].bpm;

  for (let i = 1; i < events.length; i += 1) {
    const event = events[i];
    if (tick <= event.tick) break;

    const segmentTicks = event.tick - previousTick;
    seconds += (segmentTicks / ppq) * (60 / bpm);
    previousTick = event.tick;
    bpm = event.bpm;
  }

  const remainingTicks = tick - previousTick;
  seconds += (remainingTicks / ppq) * (60 / bpm);
  return seconds;
}

export function secondsToTicks(
  seconds: number,
  tempoMap: TempoEvent[],
  ppq: number,
): number {
  if (seconds <= 0) return 0;
  if (ppq <= 0) throw new Error("PPQ must be positive.");
  if (tempoMap.length === 0) throw new Error("Tempo map is empty.");

  const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
  let remainingSeconds = seconds;
  let previousTick = 0;
  let bpm = events[0].bpm;

  for (let i = 1; i < events.length; i += 1) {
    const event = events[i];
    const segmentTicks = event.tick - previousTick;
    const segmentSeconds = (segmentTicks / ppq) * (60 / bpm);

    if (remainingSeconds <= segmentSeconds) {
      return Math.round(previousTick + (remainingSeconds / (60 / bpm)) * ppq);
    }

    remainingSeconds -= segmentSeconds;
    previousTick = event.tick;
    bpm = event.bpm;
  }

  return Math.round(previousTick + (remainingSeconds / (60 / bpm)) * ppq);
}
