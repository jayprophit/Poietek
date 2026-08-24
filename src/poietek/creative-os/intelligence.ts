import type {
  AdviceClass,
  CreativeIntentLock,
  CreativeModality,
  CrossModalFinding,
  UniversalPreflight,
} from './contracts';

export interface AdviceProposal {
  id: string;
  modality: CreativeModality;
  subject: string;
  proposedClassification: AdviceClass;
  state: CrossModalFinding['state'];
  message: string;
  targetProfileId: string | null;
  requirementId: string | null;
  evidenceRefs: string[];
  measuredAt: string | null;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

/**
 * Creative intent can demote style/reference advice, but it can never suppress a
 * genuine destination requirement. The returned finding always records the rule.
 */
export function classifyAdviceWithIntent(
  proposal: AdviceProposal,
  intent: CreativeIntentLock,
): CrossModalFinding {
  const affected = intent.enabled
    ? intent.rules.filter((rule) => rule.active && rule.modality === proposal.modality && (
        normalize(proposal.subject).includes(normalize(rule.trait)) ||
        normalize(rule.trait).includes(normalize(proposal.subject))
      ))
    : [];
  const targetRequirement = proposal.proposedClassification === 'required_by_target';
  const protectedByIntent = affected.some((rule) =>
    rule.instruction === 'preserve' || rule.instruction === 'do_not_treat_as_error',
  );
  const classification = !targetRequirement && protectedByIntent
    ? 'creative_option'
    : proposal.proposedClassification;
  const message = !targetRequirement && protectedByIntent
    ? `${proposal.message} Creative Intent Lock marks this characteristic as intentional; no automatic correction is required.`
    : proposal.message;

  return {
    ...proposal,
    classification,
    message,
    affectedIntentRuleIds: affected.map((rule) => rule.id),
  };
}

export function summarizePreflight(
  findings: CrossModalFinding[],
  targetProfileId: string | null,
  evaluatedAt: string,
): UniversalPreflight {
  return {
    targetProfileId,
    evaluatedAt,
    findings,
    summary: {
      requiredFailures: findings.filter((item) => item.classification === 'required_by_target' && item.state === 'fail').length,
      technicalWarnings: findings.filter((item) => item.classification === 'technical_best_practice' && ['warning', 'fail'].includes(item.state)).length,
      creativeSuggestions: findings.filter((item) => item.classification === 'creative_option' && ['warning', 'fail'].includes(item.state)).length,
      unmeasuredRequiredChecks: findings.filter((item) => item.classification === 'required_by_target' && item.state === 'not_measured').length,
    },
  };
}
