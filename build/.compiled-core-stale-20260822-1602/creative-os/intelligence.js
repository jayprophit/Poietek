"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyAdviceWithIntent = classifyAdviceWithIntent;
exports.summarizePreflight = summarizePreflight;
function normalize(value) {
    return value.trim().toLocaleLowerCase();
}
/**
 * Creative intent can demote style/reference advice, but it can never suppress a
 * genuine destination requirement. The returned finding always records the rule.
 */
function classifyAdviceWithIntent(proposal, intent) {
    const affected = intent.enabled
        ? intent.rules.filter((rule) => rule.active && rule.modality === proposal.modality && (normalize(proposal.subject).includes(normalize(rule.trait)) ||
            normalize(rule.trait).includes(normalize(proposal.subject))))
        : [];
    const targetRequirement = proposal.proposedClassification === 'required_by_target';
    const protectedByIntent = affected.some((rule) => rule.instruction === 'preserve' || rule.instruction === 'do_not_treat_as_error');
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
function summarizePreflight(findings, targetProfileId, evaluatedAt) {
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
