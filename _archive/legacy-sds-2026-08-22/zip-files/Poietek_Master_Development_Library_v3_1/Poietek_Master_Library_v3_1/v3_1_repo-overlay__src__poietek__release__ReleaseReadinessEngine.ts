import type { PoietekProject } from "../domain/types";

export type ReadinessStatus =
  | "pass"
  | "advisory"
  | "warning"
  | "fail"
  | "not_measured"
  | "not_applicable";

export interface DestinationProfile {
  id: string;
  label: string;
  tuningRequirement: {
    kind: "none" | "advisory" | "required";
    referenceHz?: number;
  };
  audio: {
    sampleRates?: number[];
    integratedLufs?: number;
    truePeakMaxDbtp?: number;
  };
}

export interface ReleaseMeasurements {
  integratedLufs?: number | null;
  truePeakDbtp?: number | null;
}

export interface ReadinessCheck {
  id: string;
  status: ReadinessStatus;
  message: string;
}

export interface ReleaseReadinessResult {
  profileId: string;
  ready: boolean;
  checks: ReadinessCheck[];
}

export function checkReleaseReadiness(input: {
  project: PoietekProject;
  profile: DestinationProfile;
  measurements: ReleaseMeasurements;
}): ReleaseReadinessResult {
  const checks: ReadinessCheck[] = [];
  const { project, profile, measurements } = input;

  if (
    profile.audio.sampleRates?.length &&
    !profile.audio.sampleRates.includes(project.settings.sampleRate)
  ) {
    checks.push({
      id: "sample-rate",
      status: "fail",
      message: `Project sample rate ${project.settings.sampleRate} Hz is outside the selected target profile.`,
    });
  } else {
    checks.push({ id: "sample-rate", status: "pass", message: "Sample rate is compatible." });
  }

  const tuning = project.settings.tuning.referenceHz;
  const targetTuning = profile.tuningRequirement.referenceHz;

  if (profile.tuningRequirement.kind === "required" && targetTuning != null && Math.abs(tuning - targetTuning) >= 0.01) {
    checks.push({
      id: "tuning",
      status: "fail",
      message: `Target explicitly requires A=${targetTuning} Hz; preserve the original and create a separate compatibility rendition.`,
    });
  } else if (profile.tuningRequirement.kind === "advisory" && targetTuning != null && Math.abs(tuning - targetTuning) >= 0.01) {
    checks.push({
      id: "tuning",
      status: "advisory",
      message: `Project uses A=${tuning} Hz. Target advisory reference is ${targetTuning} Hz; original can be preserved.`,
    });
  } else {
    checks.push({
      id: "tuning",
      status: "pass",
      message: `Project tuning A=${tuning} Hz is acceptable for the selected profile.`,
    });
  }

  if (profile.audio.integratedLufs != null) {
    if (measurements.integratedLufs == null) {
      checks.push({
        id: "integrated-loudness",
        status: "not_measured",
        message: "Standards-compliant integrated loudness has not been measured yet.",
      });
    } else {
      const difference = Math.abs(measurements.integratedLufs - profile.audio.integratedLufs);
      checks.push({
        id: "integrated-loudness",
        status: difference <= 1 ? "pass" : "warning",
        message: `Measured ${measurements.integratedLufs.toFixed(1)} LUFS; target ${profile.audio.integratedLufs.toFixed(1)} LUFS.`,
      });
    }
  }

  if (profile.audio.truePeakMaxDbtp != null) {
    if (measurements.truePeakDbtp == null) {
      checks.push({
        id: "true-peak",
        status: "not_measured",
        message: "Standards-compliant true peak has not been measured yet.",
      });
    } else {
      checks.push({
        id: "true-peak",
        status: measurements.truePeakDbtp <= profile.audio.truePeakMaxDbtp ? "pass" : "fail",
        message: `Measured ${measurements.truePeakDbtp.toFixed(2)} dBTP; maximum ${profile.audio.truePeakMaxDbtp.toFixed(2)} dBTP.`,
      });
    }
  }

  return {
    profileId: profile.id,
    ready: !checks.some((check) => check.status === "fail"),
    checks,
  };
}
