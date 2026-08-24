import {
  PLATFORM_FOUNDATION_SCHEMA_VERSION,
  type CapabilityReport,
  type ExternalWorkflowStatus,
  type PlatformFoundation,
  type RightsAcceptance,
} from "./contracts";
import { isCapabilityUsable } from "./defaults";

export interface PlatformValidationIssue {
  code: string;
  path: string;
  message: string;
}

function issue(
  code: string,
  path: string,
  message: string,
): PlatformValidationIssue {
  return { code, path, message };
}

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: string | null): value is string {
  return hasText(value) && Number.isFinite(Date.parse(value));
}

function validateCapability(
  report: CapabilityReport,
  path: string,
): PlatformValidationIssue[] {
  const issues: PlatformValidationIssue[] = [];

  if (!hasText(report.capabilityId)) {
    issues.push(issue("CAPABILITY_ID_REQUIRED", path, "Capability id is required."));
  }

  if (report.state === "available" || report.state === "degraded") {
    if (!hasText(report.implementationId)) {
      issues.push(
        issue(
          "CAPABILITY_IMPLEMENTATION_REQUIRED",
          path,
          "Usable capability states require an implementation id.",
        ),
      );
    }
    if (!isTimestamp(report.observedAt)) {
      issues.push(
        issue(
          "CAPABILITY_OBSERVATION_REQUIRED",
          path,
          "Usable capability states require a valid observation timestamp.",
        ),
      );
    }
  }

  if (report.state === "unavailable" && !hasText(report.reasonCode)) {
    issues.push(
      issue(
        "CAPABILITY_REASON_REQUIRED",
        path,
        "Unavailable capabilities require a reason code.",
      ),
    );
  }

  if (
    report.state === "requires_configuration" &&
    report.reasonCode !== "CONFIGURATION_REQUIRED"
  ) {
    issues.push(
      issue(
        "CAPABILITY_CONFIGURATION_REASON_REQUIRED",
        path,
        "Configuration-gated capabilities must use CONFIGURATION_REQUIRED.",
      ),
    );
  }

  if (
    report.state === "requires_consent" &&
    !hasText(report.requiredConsentScope)
  ) {
    issues.push(
      issue(
        "CAPABILITY_CONSENT_SCOPE_REQUIRED",
        path,
        "Consent-gated capabilities require an exact consent scope.",
      ),
    );
  }

  return issues;
}

function validateExternalStatus(
  status: ExternalWorkflowStatus,
  path: string,
): PlatformValidationIssue[] {
  if (status.state !== "accepted") return [];

  const issues: PlatformValidationIssue[] = [];
  if (!hasText(status.authorityId)) {
    issues.push(
      issue(
        "EXTERNAL_ACCEPTANCE_AUTHORITY_REQUIRED",
        path,
        "External acceptance requires the reporting authority id.",
      ),
    );
  }
  if (!hasText(status.externalReference)) {
    issues.push(
      issue(
        "EXTERNAL_ACCEPTANCE_REFERENCE_REQUIRED",
        path,
        "External acceptance requires an external reference.",
      ),
    );
  }
  if (!isTimestamp(status.observedAt)) {
    issues.push(
      issue(
        "EXTERNAL_ACCEPTANCE_OBSERVATION_REQUIRED",
        path,
        "External acceptance requires a valid observation timestamp.",
      ),
    );
  }
  return issues;
}

function validateRightsAcceptance(
  acceptance: RightsAcceptance,
  path: string,
): PlatformValidationIssue[] {
  if (acceptance.state !== "accepted") return [];

  const issues: PlatformValidationIssue[] = [];
  if (!hasText(acceptance.authorityId)) {
    issues.push(
      issue(
        "RIGHTS_ACCEPTANCE_AUTHORITY_REQUIRED",
        path,
        "Accepted rights require the external accepting authority or party id.",
      ),
    );
  }
  if (!hasText(acceptance.externalReference)) {
    issues.push(
      issue(
        "RIGHTS_ACCEPTANCE_REFERENCE_REQUIRED",
        path,
        "Accepted rights require an external acceptance reference.",
      ),
    );
  }
  if (!isTimestamp(acceptance.observedAt)) {
    issues.push(
      issue(
        "RIGHTS_ACCEPTANCE_OBSERVATION_REQUIRED",
        path,
        "Accepted rights require a valid observation timestamp.",
      ),
    );
  }
  return issues;
}

export function validatePlatformFoundation(
  foundation: PlatformFoundation,
): PlatformValidationIssue[] {
  const issues: PlatformValidationIssue[] = [];

  if (foundation.schemaVersion !== PLATFORM_FOUNDATION_SCHEMA_VERSION) {
    issues.push(
      issue(
        "SCHEMA_VERSION_UNSUPPORTED",
        "schemaVersion",
        `Expected ${PLATFORM_FOUNDATION_SCHEMA_VERSION}.`,
      ),
    );
  }
  if (!hasText(foundation.projectId)) {
    issues.push(issue("PROJECT_ID_REQUIRED", "projectId", "Project id is required."));
  }
  if (!Number.isSafeInteger(foundation.revision) || foundation.revision < 0) {
    issues.push(
      issue(
        "REVISION_INVALID",
        "revision",
        "Revision must be a non-negative safe integer.",
      ),
    );
  }
  if (!isTimestamp(foundation.createdAt) || !isTimestamp(foundation.updatedAt)) {
    issues.push(
      issue(
        "TIMESTAMP_INVALID",
        "createdAt",
        "Foundation timestamps must be valid ISO-compatible date strings.",
      ),
    );
  }

  const capabilities: Array<[CapabilityReport, string]> = [
    [foundation.collaboration.localChangeLogCapability, "collaboration.localChangeLogCapability"],
    [foundation.collaboration.remoteSyncCapability, "collaboration.remoteSyncCapability"],
    [foundation.rights.localRecordsCapability, "rights.localRecordsCapability"],
    [foundation.rights.externalRegistrationCapability, "rights.externalRegistrationCapability"],
    [foundation.provenance.localHashingCapability, "provenance.localHashingCapability"],
    [foundation.provenance.signatureCapability, "provenance.signatureCapability"],
    [foundation.provenance.timestampAuthorityCapability, "provenance.timestampAuthorityCapability"],
    [foundation.provenance.blockchainCapability, "provenance.blockchainCapability"],
    [foundation.commerce.publishingCapability, "commerce.publishingCapability"],
    [foundation.commerce.paymentCapability, "commerce.paymentCapability"],
    [foundation.commerce.fulfillmentCapability, "commerce.fulfillmentCapability"],
    [foundation.privacy.security.encryptedStorageCapability, "privacy.security.encryptedStorageCapability"],
    [foundation.privacy.security.credentialVaultCapability, "privacy.security.credentialVaultCapability"],
    [foundation.privacy.security.auditLogCapability, "privacy.security.auditLogCapability"],
    [foundation.learning.assistantCapability, "learning.assistantCapability"],
    [foundation.plugins.scanningCapability, "plugins.scanningCapability"],
    [foundation.plugins.sandboxCapability, "plugins.sandboxCapability"],
    [foundation.videoVfx.decodeCapability, "videoVfx.decodeCapability"],
    [foundation.videoVfx.timelineCapability, "videoVfx.timelineCapability"],
    [foundation.videoVfx.renderCapability, "videoVfx.renderCapability"],
    [foundation.videoVfx.gpuCapability, "videoVfx.gpuCapability"],
    [foundation.ai.inferenceCapability, "ai.inferenceCapability"],
    [foundation.ai.mediaGenerationCapability, "ai.mediaGenerationCapability"],
  ];
  foundation.interoperability.externalSystems.forEach((system, index) => {
    capabilities.push([
      system.capability,
      `interoperability.externalSystems[${index}].capability`,
    ]);
  });
  foundation.plugins.instances.forEach((plugin, index) => {
    capabilities.push([
      plugin.hostCapability,
      `plugins.instances[${index}].hostCapability`,
    ]);
  });
  foundation.videoVfx.jobs.forEach((job, index) => {
    capabilities.push([job.capability, `videoVfx.jobs[${index}].capability`]);
  });
  for (const [capability, path] of capabilities) {
    issues.push(...validateCapability(capability, path));
  }

  const seenChangeIds = new Set<string>();
  foundation.collaboration.changes.forEach((change, index) => {
    const path = `collaboration.changes[${index}]`;
    if (seenChangeIds.has(change.id)) {
      issues.push(issue("CHANGE_ID_DUPLICATE", path, `Duplicate change id ${change.id}.`));
    }
    seenChangeIds.add(change.id);
    if (change.projectId !== foundation.projectId) {
      issues.push(
        issue(
          "CHANGE_PROJECT_MISMATCH",
          path,
          "Collaboration change belongs to a different project.",
        ),
      );
    }
    if (
      !Number.isSafeInteger(change.baseRevision) ||
      change.baseRevision < 0 ||
      change.nextRevision !== change.baseRevision + 1
    ) {
      issues.push(
        issue(
          "CHANGE_REVISION_INVALID",
          path,
          "A local change must advance exactly one safe integer revision.",
        ),
      );
    }
    if (
      (change.remoteDelivery.state === "acknowledged" ||
        change.remoteDelivery.state === "rejected") &&
      (!hasText(change.remoteDelivery.externalReference) ||
        !isTimestamp(change.remoteDelivery.observedAt))
    ) {
      issues.push(
        issue(
          "REMOTE_DELIVERY_EVIDENCE_REQUIRED",
          `${path}.remoteDelivery`,
          "A remote outcome requires an external reference and observation time.",
        ),
      );
    }
  });

  const contributorIds = new Set(
    foundation.rights.contributorPassports.map((passport) => passport.id),
  );
  foundation.rights.splitProposals.forEach((proposal, proposalIndex) => {
    const path = `rights.splitProposals[${proposalIndex}]`;
    const total = proposal.shares.reduce((sum, share) => sum + share.basisPoints, 0);
    proposal.shares.forEach((share, shareIndex) => {
      if (
        !Number.isSafeInteger(share.basisPoints) ||
        share.basisPoints < 0 ||
        share.basisPoints > 10_000
      ) {
        issues.push(
          issue(
            "SPLIT_BASIS_POINTS_INVALID",
            `${path}.shares[${shareIndex}].basisPoints`,
            "Split shares must be whole basis points from 0 through 10000.",
          ),
        );
      }
      if (!contributorIds.has(share.contributorId)) {
        issues.push(
          issue(
            "SPLIT_CONTRIBUTOR_MISSING",
            `${path}.shares[${shareIndex}]`,
            `Contributor ${share.contributorId} has no passport in this foundation.`,
          ),
        );
      }
      issues.push(
        ...validateRightsAcceptance(
          share.acceptance,
          `${path}.shares[${shareIndex}].acceptance`,
        ),
      );
    });
    if (proposal.status !== "draft" && total !== 10_000) {
      issues.push(
        issue(
          "SPLIT_TOTAL_INVALID",
          path,
          "A proposed split must total exactly 10000 basis points.",
        ),
      );
    }
    if (
      proposal.status === "fully_accepted" &&
      proposal.shares.some((share) => share.acceptance.state !== "accepted")
    ) {
      issues.push(
        issue(
          "SPLIT_ACCEPTANCE_INCOMPLETE",
          path,
          "A fully accepted split requires explicit acceptance from every share.",
        ),
      );
    }
  });

  foundation.rights.agreements.forEach((agreement, agreementIndex) => {
    agreement.participantAcceptances.forEach((participant, participantIndex) => {
      issues.push(
        ...validateRightsAcceptance(
          participant.acceptance,
          `rights.agreements[${agreementIndex}].participantAcceptances[${participantIndex}].acceptance`,
        ),
      );
    });
  });
  foundation.rights.registrations.forEach((registration, index) => {
    issues.push(
      ...validateExternalStatus(
        registration.externalStatus,
        `rights.registrations[${index}].externalStatus`,
      ),
    );
  });

  foundation.provenance.evidence.forEach((evidence, index) => {
    const path = `provenance.evidence[${index}]`;
    if (evidence.legalEffect !== "evidence_only_not_rights_determination") {
      issues.push(
        issue(
          "PROVENANCE_LEGAL_EFFECT_INVALID",
          path,
          "Provenance records are evidence only and cannot determine rights.",
        ),
      );
    }
    if (evidence.kind === "blockchain_anchor" && evidence.anchor.state === "anchored") {
      if (
        !hasText(evidence.anchor.network) ||
        !hasText(evidence.anchor.transactionId) ||
        !hasText(evidence.anchor.blockReference) ||
        !isTimestamp(evidence.anchor.observedAt)
      ) {
        issues.push(
          issue(
            "BLOCKCHAIN_ANCHOR_EVIDENCE_REQUIRED",
            `${path}.anchor`,
            "An anchored record requires network, transaction, block and observation evidence.",
          ),
        );
      }
    }
  });
  if (
    foundation.provenance.blockchainEnabled &&
    !isCapabilityUsable(foundation.provenance.blockchainCapability)
  ) {
    issues.push(
      issue(
        "BLOCKCHAIN_ENABLED_WITHOUT_CAPABILITY",
        "provenance.blockchainEnabled",
        "Blockchain evidence cannot be enabled until a real adapter is available.",
      ),
    );
  }

  foundation.commerce.listings.forEach((listing, index) => {
    if (!/^\d+$/.test(listing.price.minorUnits)) {
      issues.push(
        issue(
          "LISTING_PRICE_INVALID",
          `commerce.listings[${index}].price.minorUnits`,
          "Listing price must be a non-negative integer encoded as a string.",
        ),
      );
    }
    issues.push(
      ...validateExternalStatus(
        listing.externalStatus,
        `commerce.listings[${index}].externalStatus`,
      ),
    );
  });
  foundation.commerce.orders.forEach((order, index) => {
    const path = `commerce.orders[${index}]`;
    issues.push(...validateExternalStatus(order.paymentStatus, `${path}.paymentStatus`));
    if (
      order.localStatus === "fulfilled" &&
      (order.paymentStatus.state !== "accepted" ||
        !hasText(order.fulfillmentReference))
    ) {
      issues.push(
        issue(
          "ORDER_FULFILLMENT_EVIDENCE_REQUIRED",
          path,
          "Fulfillment requires confirmed external payment and a fulfillment reference.",
        ),
      );
    }
  });

  foundation.privacy.consentReceipts.forEach((receipt, index) => {
    const path = `privacy.consentReceipts[${index}]`;
    if (!hasText(receipt.scope) || !hasText(receipt.policyVersion)) {
      issues.push(
        issue(
          "CONSENT_SCOPE_AND_POLICY_REQUIRED",
          path,
          "Consent records require an exact scope and policy version.",
        ),
      );
    }
    if (receipt.decision === "withdrawn" && !isTimestamp(receipt.withdrawnAt)) {
      issues.push(
        issue(
          "CONSENT_WITHDRAWAL_TIME_REQUIRED",
          path,
          "Withdrawn consent requires a valid withdrawal timestamp.",
        ),
      );
    }
  });

  foundation.learning.suggestions.forEach((suggestion, index) => {
    if (
      suggestion.status === "applied" &&
      (!hasText(suggestion.previewDigest) ||
        !hasText(suggestion.appliedCommandId) ||
        !isTimestamp(suggestion.appliedAt))
    ) {
      issues.push(
        issue(
          "LEARNING_ACTION_COMMAND_REQUIRED",
          `learning.suggestions[${index}]`,
          "Applied learning actions require a preview and an undoable command record.",
        ),
      );
    }
  });

  foundation.interoperability.formats.forEach((format, index) => {
    if (format.support !== "unavailable" && !hasText(format.implementationId)) {
      issues.push(
        issue(
          "INTERCHANGE_IMPLEMENTATION_REQUIRED",
          `interoperability.formats[${index}]`,
          "Claimed interchange support requires an implementation id.",
        ),
      );
    }
  });

  foundation.plugins.instances.forEach((plugin, index) => {
    const path = `plugins.instances[${index}]`;
    if (plugin.support === "available" && !isCapabilityUsable(plugin.hostCapability)) {
      issues.push(
        issue(
          "PLUGIN_HOST_UNAVAILABLE",
          path,
          "A plug-in cannot be marked available when its host capability is unavailable.",
        ),
      );
    }
    if (plugin.support === "render_only" && !hasText(plugin.frozenRenderAssetId)) {
      issues.push(
        issue(
          "PLUGIN_FROZEN_RENDER_REQUIRED",
          path,
          "Render-only plug-ins must reference the preserved frozen render.",
        ),
      );
    }
  });

  foundation.videoVfx.jobs.forEach((job, index) => {
    const path = `videoVfx.jobs[${index}]`;
    if (job.progress !== null && (job.progress < 0 || job.progress > 1)) {
      issues.push(
        issue("RENDER_PROGRESS_INVALID", `${path}.progress`, "Progress must be from 0 through 1."),
      );
    }
    if (job.status === "completed" && !hasText(job.outputAssetId)) {
      issues.push(
        issue(
          "RENDER_OUTPUT_REQUIRED",
          path,
          "A completed render requires a durable output asset id.",
        ),
      );
    }
  });

  foundation.ai.actions.forEach((action, index) => {
    const path = `ai.actions[${index}]`;
    if (
      (action.status === "preview_ready" ||
        action.status === "accepted" ||
        action.status === "applied") &&
      !hasText(action.previewDigest)
    ) {
      issues.push(
        issue(
          "AI_PREVIEW_REQUIRED",
          path,
          "AI output must have a stable preview before acceptance or application.",
        ),
      );
    }
    if (
      (action.status === "accepted" || action.status === "applied") &&
      !isTimestamp(action.userAcceptedAt)
    ) {
      issues.push(
        issue(
          "AI_USER_ACCEPTANCE_REQUIRED",
          path,
          "Accepted AI output requires an explicit user acceptance timestamp.",
        ),
      );
    }
    if (
      action.status === "applied" &&
      (!hasText(action.appliedCommandId) || !isTimestamp(action.appliedAt))
    ) {
      issues.push(
        issue(
          "AI_UNDOABLE_COMMAND_REQUIRED",
          path,
          "Applied AI output requires an undoable project command record.",
        ),
      );
    }
  });

  return issues;
}
