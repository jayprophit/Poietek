export interface AnalogueConsoleCapability {
  consoleId: string;

  audioPath:
    | "direct_analogue"
    | "audio_interface"
    | "digitally_controlled_analogue"
    | "hybrid";

  observable: string[];
  writable: string[];
  manualOnly: string[];

  hasMotorizedAutomation: boolean;
  hasVcaAutomation: boolean;
  hasDigitalRecall: boolean;
  hasRemotePreamps: boolean;

  notes: string[];
}

export function canMirrorParameter(
  capability: AnalogueConsoleCapability,
  path: string,
): "read_write" | "read_only" | "manual_only" | "unsupported" {
  if (capability.observable.includes(path) && capability.writable.includes(path)) {
    return "read_write";
  }

  if (capability.observable.includes(path)) return "read_only";
  if (capability.manualOnly.includes(path)) return "manual_only";
  return "unsupported";
}
