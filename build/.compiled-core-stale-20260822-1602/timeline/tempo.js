"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticksToSeconds = ticksToSeconds;
exports.secondsToTicks = secondsToTicks;
function ticksToSeconds(ticks, tempoMap, ppq) {
    assertTempoInput(tempoMap, ppq);
    const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
    const targetTicks = Math.max(0, ticks);
    let seconds = 0;
    let previousTick = 0;
    let bpm = events[0].bpm;
    for (let i = 1; i < events.length && events[i].tick < targetTicks; i += 1) {
        const event = events[i];
        const deltaTicks = event.tick - previousTick;
        seconds += (deltaTicks / ppq) * (60 / bpm);
        previousTick = event.tick;
        bpm = event.bpm;
    }
    const remaining = Math.max(0, targetTicks - previousTick);
    seconds += (remaining / ppq) * (60 / bpm);
    return seconds;
}
function secondsToTicks(seconds, tempoMap, ppq) {
    assertTempoInput(tempoMap, ppq);
    const events = [...tempoMap].sort((a, b) => a.tick - b.tick);
    const targetSeconds = Math.max(0, seconds);
    let elapsed = 0;
    let previousTick = 0;
    let bpm = events[0].bpm;
    for (let i = 1; i < events.length; i += 1) {
        const event = events[i];
        const segmentSeconds = ((event.tick - previousTick) / ppq) * (60 / bpm);
        if (elapsed + segmentSeconds >= targetSeconds)
            break;
        elapsed += segmentSeconds;
        previousTick = event.tick;
        bpm = event.bpm;
    }
    return Math.round(previousTick + ((targetSeconds - elapsed) / (60 / bpm)) * ppq);
}
function assertTempoInput(tempoMap, ppq) {
    if (!Number.isFinite(ppq) || ppq <= 0) {
        throw new Error("PPQ must be a positive finite number.");
    }
    if (!tempoMap.length || tempoMap[0].tick !== 0) {
        throw new Error("Tempo map must start at tick 0.");
    }
    for (const event of tempoMap) {
        if (!Number.isFinite(event.tick) || event.tick < 0) {
            throw new Error("Tempo-event ticks must be non-negative finite numbers.");
        }
        if (!Number.isFinite(event.bpm) || event.bpm <= 0) {
            throw new Error("Tempo-event BPM values must be positive finite numbers.");
        }
    }
}
