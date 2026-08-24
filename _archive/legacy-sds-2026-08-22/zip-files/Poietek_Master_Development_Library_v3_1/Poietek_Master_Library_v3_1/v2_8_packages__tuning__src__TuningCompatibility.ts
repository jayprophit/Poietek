export interface TuningTargetCapabilities {
  targetId: string;
  supportsMidiTuningStandard: boolean;
  supportsMidi2PerNotePitch: boolean;
  supportsMpe: boolean;
  supportsScalaScl: boolean;
  supportsScalaKbm: boolean;
  supportsHostTuningApi: boolean;
  supportsAudioRetune: boolean;
}

export type TuningDeliveryMethod =
  | "midi_tuning_standard"
  | "midi2_per_note_pitch"
  | "mpe_pitch_bend"
  | "scala"
  | "host_tuning_api"
  | "audio_render"
  | "unsupported";

export function chooseTuningDelivery(
  capabilities: TuningTargetCapabilities,
): TuningDeliveryMethod {
  if (capabilities.supportsMidi2PerNotePitch) return "midi2_per_note_pitch";
  if (capabilities.supportsMidiTuningStandard) return "midi_tuning_standard";
  if (capabilities.supportsHostTuningApi) return "host_tuning_api";
  if (capabilities.supportsScalaScl) return "scala";
  if (capabilities.supportsMpe) return "mpe_pitch_bend";
  if (capabilities.supportsAudioRetune) return "audio_render";
  return "unsupported";
}
