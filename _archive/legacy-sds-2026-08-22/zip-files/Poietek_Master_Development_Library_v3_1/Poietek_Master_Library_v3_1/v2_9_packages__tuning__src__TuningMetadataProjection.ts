export interface TuningMetadataProjection {
  referenceNote: string;
  referenceHz: number;
  temperament: string;
  scaleOrProfileId?: string;
  scalaSclHash?: string;
  scalaKbmHash?: string;
  tuningNotes?: string;
}

export function tuningMetadataText(
  projection: TuningMetadataProjection,
): string {
  const parts = [
    `${projection.referenceNote}=${projection.referenceHz}Hz`,
    `temperament=${projection.temperament}`,
  ];

  if (projection.scaleOrProfileId) {
    parts.push(`profile=${projection.scaleOrProfileId}`);
  }

  return parts.join("; ");
}
