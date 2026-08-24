export interface ChannelAnalysis {
  samplePeakLinear: number;
  samplePeakDbfs: number;
  rmsLinear: number;
  rmsDbfs: number;
  dcOffset: number;
  clippedSampleCount: number;
  nearClipEventCount: number;
  crestFactorDb: number;
  silenceRatio: number;
}

export interface StereoAnalysis {
  correlation: number | null;
}

export interface BasicAudioHealthMeasurements {
  channels: ChannelAnalysis[];
  combinedSamplePeakDbfs: number;
  combinedRmsDbfs: number;
  stereo: StereoAnalysis;
}

export interface HealthFinding {
  code: string;
  severity: "info" | "advisory" | "warning" | "critical";
  title: string;
  message: string;
  evidence: Record<string, unknown>;
}

export interface HealthRecommendation {
  id: string;
  category:
    | "input_gain"
    | "clipping"
    | "noise"
    | "loudness"
    | "true_peak"
    | "phase"
    | "dc_offset"
    | "dynamics"
    | "spectral"
    | "monitoring"
    | "delivery"
    | "hardware";
  message: string;
  confidence: number;
  actionMode:
    | "advice_only"
    | "previewable_command"
    | "manual_hardware_action"
    | "requires_more_measurement";
  proposedCommands?: Record<string, unknown>[];
}
