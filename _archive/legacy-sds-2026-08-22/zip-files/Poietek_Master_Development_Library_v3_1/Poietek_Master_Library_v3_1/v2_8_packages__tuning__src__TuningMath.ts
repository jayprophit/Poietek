export function frequencyForMidiNote(
  midiNote: number,
  referenceMidiNote = 69,
  referenceHz = 440,
  divisionsPerOctave = 12,
): number {
  return referenceHz * Math.pow(
    2,
    (midiNote - referenceMidiNote) / divisionsPerOctave,
  );
}

export function centsBetweenFrequencies(
  measuredHz: number,
  referenceHz: number,
): number {
  if (measuredHz <= 0 || referenceHz <= 0) {
    throw new Error("Frequencies must be positive.");
  }
  return 1200 * Math.log2(measuredHz / referenceHz);
}

export function retuneRatio(
  sourceReferenceHz: number,
  targetReferenceHz: number,
): number {
  if (sourceReferenceHz <= 0 || targetReferenceHz <= 0) {
    throw new Error("Reference frequencies must be positive.");
  }
  return targetReferenceHz / sourceReferenceHz;
}

export function referenceShiftCents(
  sourceReferenceHz: number,
  targetReferenceHz: number,
): number {
  return centsBetweenFrequencies(targetReferenceHz, sourceReferenceHz);
}
