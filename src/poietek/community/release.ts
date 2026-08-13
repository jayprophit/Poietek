import { checkReleaseReadiness } from "../release/ReleaseReadinessEngine";
import { isCapabilityUsable } from "../platform/defaults";
import type { ReadinessCheck } from "../release/ReleaseReadinessEngine";
import type {
  CommunityReleaseAssessment,
  CommunityReleaseAssessmentInput,
} from "./contracts";

function check(
  id: string,
  status: ReadinessCheck["status"],
  message: string,
): ReadinessCheck {
  return { id, status, message };
}

export function assessCommunityRelease(
  input: CommunityReleaseAssessmentInput,
): CommunityReleaseAssessment {
  const base = checkReleaseReadiness({
    project: input.project,
    profile: input.destination.releaseProfile,
    measurements: input.measurements,
  });
  const checks: ReadinessCheck[] = [...base.checks];
  const item = input.catalogItem;

  checks.push(
    input.destination.allowedVisibility.includes(item.visibility)
      ? check("community-visibility", "pass", "Visibility is allowed for this destination.")
      : check(
          "community-visibility",
          "fail",
          `Visibility ${item.visibility} is not allowed for this destination.`,
        ),
  );

  if (
    input.destination.moderation === "required_before_remote_publish" &&
    item.moderation.state !== "approved"
  ) {
    checks.push(
      check(
        "community-moderation",
        "fail",
        "This destination requires an evidenced moderation approval before remote publication.",
      ),
    );
  } else {
    checks.push(
      check(
        "community-moderation",
        "pass",
        input.destination.moderation === "not_required"
          ? "Moderation approval is not required by this destination."
          : "Moderation approval has evidence.",
      ),
    );
  }

  if (input.destination.federation === "required") {
    checks.push(
      input.federationCapability && isCapabilityUsable(input.federationCapability)
        ? check("community-federation", "pass", "A probed federation adapter is available.")
        : check(
            "community-federation",
            "fail",
            "This destination requires federation, but no probed adapter is available.",
          ),
    );
  } else if (
    input.destination.federation === "optional" &&
    (!input.federationCapability || !isCapabilityUsable(input.federationCapability))
  ) {
    checks.push(
      check(
        "community-federation",
        "not_applicable",
        "Optional federation is unavailable; the local release remains usable.",
      ),
    );
  }

  const derivative = input.destination.derivativePolicy;
  if (derivative.kind === "preserve_original_only") {
    checks.push(
      check(
        "community-tuning-derivative",
        "pass",
        "The destination preserves the creator-original tuning.",
      ),
    );
  } else {
    const original = item.renditions.find(
      (rendition) => rendition.id === item.originalRenditionId,
    );
    const compatible = item.renditions.some(
      (rendition) =>
        rendition.kind === "time_preserving_derivative" &&
        rendition.derivedFromRenditionId === item.originalRenditionId &&
        Math.abs(rendition.tuning.referenceHz - derivative.targetReferenceHz) < 0.01 &&
        original != null &&
        Math.abs(rendition.durationSeconds - original.durationSeconds) < 0.001,
    );
    const required = derivative.kind === "required_time_preserving_derivative";
    checks.push(
      compatible
        ? check(
            "community-tuning-derivative",
            "pass",
            `A separate verified time-preserving A=${derivative.targetReferenceHz} Hz rendition exists.`,
          )
        : check(
            "community-tuning-derivative",
            required ? "fail" : "advisory",
            `No separate time-preserving A=${derivative.targetReferenceHz} Hz rendition exists; the creator original remains unchanged.`,
          ),
    );
  }

  const blocking = checks.some(
    (item) => item.status === "fail" || item.status === "not_measured",
  );
  return {
    profileId: input.destination.id,
    ready: !blocking,
    base,
    checks,
  };
}
