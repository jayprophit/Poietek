import type {
  DeclaredWorkflowPackage,
  WorkflowPackageManifest,
  WorkflowPackageReadiness,
  WorkflowPackageVerificationObservation,
} from './contracts';

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function validateWorkflowPackageManifest(manifest: WorkflowPackageManifest): string[] {
  const issues: string[] = [];
  if (!manifest.id.trim() || !manifest.name.trim() || !manifest.publisher.trim()) {
    issues.push('Package id, name and publisher are required.');
  }
  if (!VERSION_PATTERN.test(manifest.version)) issues.push('Package version must use semantic version form.');
  if (!manifest.source.reference.trim()) issues.push('Package source reference is required.');
  if (manifest.digest && !SHA256_PATTERN.test(manifest.digest.value)) issues.push('Package SHA-256 must contain 64 hexadecimal characters.');
  if (manifest.digest?.algorithm !== undefined && manifest.digest.algorithm !== 'sha256') issues.push('Only SHA-256 package digests are supported.');
  if (!manifest.platforms.length) issues.push('Package platform targets are required.');
  if (new Set(manifest.platforms).size !== manifest.platforms.length) issues.push('Package platform targets must be unique.');
  if (new Set(manifest.requestedCapabilities).size !== manifest.requestedCapabilities.length) issues.push('Package capabilities must be unique.');
  if (manifest.minimumProjectSchema !== '1.1.0') issues.push('Package minimum project schema is unsupported.');
  if (manifest.kind === 'language_pack') {
    if (!manifest.locale?.trim()) issues.push('Language packages require a locale.');
    if (!Number.isFinite(manifest.translationCoveragePercent)
      || (manifest.translationCoveragePercent ?? -1) < 0
      || (manifest.translationCoveragePercent ?? 101) > 100) {
      issues.push('Language package translation coverage must be from 0 to 100 percent.');
    }
  }
  if (manifest.trust === 'verified') {
    if (!manifest.reviewEvidence || !manifest.digest) issues.push('Verified packages require digest-matched review evidence.');
    if (manifest.reviewEvidence && manifest.digest
      && manifest.reviewEvidence.digestSha256.toLowerCase() !== manifest.digest.value.toLowerCase()) {
      issues.push('Package review evidence does not match the declared digest.');
    }
  }
  if (manifest.trust === 'quarantined' && !manifest.quarantineReason?.trim()) issues.push('Quarantined packages require a reason.');
  if (manifest.trust !== 'quarantined' && manifest.quarantineReason) issues.push('Only quarantined packages may retain a quarantine reason.');
  return issues;
}

/** Declaration records provenance only. It never downloads, installs, loads, or executes package content. */
export function declareWorkflowPackage(input: DeclaredWorkflowPackage): WorkflowPackageManifest {
  const manifest: WorkflowPackageManifest = {
    ...input,
    requestedCapabilities: [...input.requestedCapabilities],
    platforms: [...input.platforms],
    trust: 'declared',
    reviewEvidence: null,
    quarantineReason: null,
  };
  const issues = validateWorkflowPackageManifest(manifest);
  if (issues.length) throw new Error(issues.join(' '));
  return manifest;
}

export function verifyWorkflowPackage(
  manifest: WorkflowPackageManifest,
  observation: WorkflowPackageVerificationObservation,
): WorkflowPackageManifest {
  if (manifest.trust === 'quarantined') throw new Error('A quarantined package must be re-declared before review.');
  if (observation.packageId !== manifest.id) throw new Error('Package review belongs to another manifest.');
  if (!manifest.digest) throw new Error('Package verification requires a declared SHA-256 digest.');
  if (!SHA256_PATTERN.test(observation.digestSha256)
    || observation.digestSha256.toLowerCase() !== manifest.digest.value.toLowerCase()) {
    throw new Error('Observed package digest does not match the declared SHA-256.');
  }
  if (!observation.reviewerId.trim() || !observation.evidenceReference.trim()) {
    throw new Error('Package verification requires named reviewer evidence.');
  }
  if (Number.isNaN(Date.parse(observation.reviewedAt))) throw new Error('Package review time must be an ISO date.');
  if (observation.projectSchema !== manifest.minimumProjectSchema) throw new Error('Package compatibility was not observed for this project schema.');
  const next: WorkflowPackageManifest = {
    ...manifest,
    trust: 'verified',
    reviewEvidence: {
      reviewerId: observation.reviewerId,
      reviewedAt: observation.reviewedAt,
      digestSha256: observation.digestSha256.toLowerCase(),
      evidenceReference: observation.evidenceReference,
    },
    quarantineReason: null,
  };
  const issues = validateWorkflowPackageManifest(next);
  if (issues.length) throw new Error(issues.join(' '));
  return next;
}

export function quarantineWorkflowPackage(manifest: WorkflowPackageManifest, reason: string): WorkflowPackageManifest {
  if (!reason.trim()) throw new Error('Package quarantine requires a reason.');
  return {...manifest, trust: 'quarantined', quarantineReason: reason.trim()};
}

export function deriveWorkflowPackageReadiness(manifest: WorkflowPackageManifest): WorkflowPackageReadiness {
  if (manifest.trust === 'quarantined') {
    return {state: 'quarantined', canLoadMetadata: false, canExecute: false, message: manifest.quarantineReason ?? 'Package is quarantined.'};
  }
  if (manifest.trust !== 'verified') {
    return {state: 'verification_required', canLoadMetadata: true, canExecute: false, message: 'Manifest metadata is visible, but digest and reviewer evidence are still required.'};
  }
  if (manifest.kind === 'script' || manifest.kind === 'dsp' || manifest.kind === 'native_extension') {
    return {state: 'host_adapter_required', canLoadMetadata: true, canExecute: false, message: 'Verification does not grant execution; a separately reviewed sandbox or native host adapter is required.'};
  }
  return {state: 'metadata_ready', canLoadMetadata: true, canExecute: false, message: 'Verified metadata may be reviewed. Package contents are not loaded or executed by this model.'};
}
