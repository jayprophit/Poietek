import type { TempoEvent } from "../domain/types";

export function ticksToSeconds(
  ticks: number,
  tempoMap: TempoEvent[],
  ppq: number,
): number {
  const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
  if (!events.length || events[0].tick !== 0) {
    throw new Error("Tempo map must start at tick 0.");
  }

  let seconds = 0;
  let previousTick = 0;
  let bpm = events[0].bpm;

  for (let i = 1; i < events.length && events[i].tick < ticks; i += 1) {
    const event = events[i];
    const deltaTicks = event.tick - previousTick;
    seconds += (deltaTicks / ppq) * (60 / bpm);
    previousTick = event.tick;
    bpm = event.bpm;
  }

  const remaining = Math.max(0, ticks - previousTick);
  seconds += (remaining / ppq) * (60 / bpm);
  return seconds;
}

export function secondsToTicks(
  seconds: number,
  tempoMap: TempoEvent[],
  ppq: number,
): number {
  const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
  if (!events.length || events[0].tick !== 0) {
    throw new Error("Tempo map must start at tick 0.");
  }

  let elapsed = 0;
  let previousTick = 0;
  let bpm = events[0].bpm;

  for (let i = 1; i < events.length; i += 1) {
    const event = events[i];
    const segmentSeconds = ((event.tick - previousTick) / ppq) * (60 / bpm);
    if (elapsed + segmentSeconds >= seconds) break;
    elapsed += segmentSeconds;
    previousTick = event.tick;
    bpm = event.bpm;
  }

  return Math.round(previousTick + ((seconds - elapsed) / (60 / bpm)) * ppq);
}
