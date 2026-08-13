export type ProceduralSampleId = "foundry-kick" | "foundry-snare" | "foundry-hat" | "foundry-clap" | "foundry-tone";

export interface ProceduralSample {
  id: ProceduralSampleId;
  name: string;
  sampleRate: number;
  channels: readonly [Float32Array];
  license: "Poietek original";
}

function seededNoise(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff) * 2 - 1;
  };
}

function renderOneShot(id: ProceduralSampleId, sampleRate: number): Float32Array {
  const duration = id === "foundry-kick" ? 0.7 : id === "foundry-tone" ? 0.9 : 0.35;
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  const noise = seededNoise(0x504f4945 + id.length);
  let noiseState = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    if (id === "foundry-kick") {
      const frequency = 42 + 120 * Math.exp(-time * 28);
      samples[index] = Math.sin(2 * Math.PI * frequency * time) * Math.exp(-time * 7.5) * 0.92;
    } else if (id === "foundry-snare") {
      noiseState = noiseState * 0.35 + noise() * 0.65;
      const body = Math.sin(2 * Math.PI * 178 * time) * Math.exp(-time * 14);
      samples[index] = (noiseState * 0.68 * Math.exp(-time * 17) + body * 0.32) * 0.82;
    } else if (id === "foundry-hat") {
      const bright = noise() - noiseState;
      noiseState = noiseState * 0.1 + bright * 0.9;
      samples[index] = noiseState * Math.exp(-time * 38) * 0.55;
    } else if (id === "foundry-clap") {
      const burst = [0, 0.026, 0.052].reduce((sum, start) => {
        const local = time - start;
        return local >= 0 ? sum + Math.exp(-local * 55) : sum;
      }, 0);
      samples[index] = noise() * Math.min(1, burst) * Math.exp(-time * 7) * 0.58;
    } else {
      const envelope = Math.min(1, time * 80) * Math.exp(-time * 3.5);
      samples[index] = (Math.sin(2 * Math.PI * 220 * time) * 0.7 + Math.sin(2 * Math.PI * 440 * time) * 0.2) * envelope * 0.65;
    }
  }
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  if (peak > 0.98) {
    const gain = 0.98 / peak;
    for (let index = 0; index < samples.length; index += 1) samples[index] *= gain;
  }
  return samples;
}

export function renderProceduralSample(id: ProceduralSampleId, sampleRate = 48000): ProceduralSample {
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 384000) {
    throw new Error("Procedural sample rate must be an integer from 8,000 to 384,000 Hz.");
  }
  const names: Record<ProceduralSampleId, string> = {
    "foundry-kick": "Foundry Kick",
    "foundry-snare": "Foundry Snare",
    "foundry-hat": "Foundry Hat",
    "foundry-clap": "Foundry Clap",
    "foundry-tone": "Foundry Tone",
  };
  return { id, name: names[id], sampleRate, channels: [renderOneShot(id, sampleRate)], license: "Poietek original" };
}

export function renderFoundryOneShotKit(sampleRate = 48000): ProceduralSample[] {
  return ["foundry-kick", "foundry-snare", "foundry-hat", "foundry-clap", "foundry-tone"].map((id) =>
    renderProceduralSample(id as ProceduralSampleId, sampleRate),
  );
}
