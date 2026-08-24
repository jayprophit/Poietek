export interface CalibrationProfile {
  id: string;
  outputDeviceId: string;
  outputPair: string;
  referenceSignal: "pink_noise" | "sine" | "custom";
  referenceDigitalLevel: number;
  measuredSplDb?: number;
  measurementMethod?: string;
  roomId?: string;
  createdAt: string;
  notes?: string;
}

/**
 * A digital reference signal level is NOT an SPL measurement by itself.
 * Poietek may only show calibrated acoustic SPL if an appropriate measurement
 * workflow/device has supplied it.
 */
