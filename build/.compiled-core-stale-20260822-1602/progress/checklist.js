"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MASTER_BUILD_CHECKLIST = exports.SDS_PROGRESS_SOURCE = void 0;
exports.summarizeMasterBuildProgress = summarizeMasterBuildProgress;
exports.searchMasterBuildChecklist = searchMasterBuildChecklist;
exports.renderMasterBuildChecklistMarkdown = renderMasterBuildChecklistMarkdown;
const IndustryQualification_1 = require("../diagnostics/IndustryQualification");
const maturityPoints = {
    verified: 100,
    working: 75,
    foundation: 40,
    specified: 20,
    external_gate: 0,
};
const statusFromMaturity = (maturity) => {
    if (maturity === 'verified')
        return 'complete';
    if (maturity === 'working' || maturity === 'foundation')
        return 'partly_done';
    if (maturity === 'external_gate')
        return 'blocked_external';
    return 'missing';
};
exports.SDS_PROGRESS_SOURCE = {
    path: 'C:\\Users\\jpowe\\Desktop\\Studio-Daw-Station-SDS-\\sds.txt',
    lineCount: 5504,
    characterCount: 152303,
    sha256: '83b1cf2b4d103ef22f36d1a31442efc095469b330c84821b4cac3ab509163fff',
    auditedAt: '2026-08-14',
};
exports.MASTER_BUILD_CHECKLIST = IndustryQualification_1.INDUSTRY_QUALIFICATION_ASSESSMENTS.map((lane) => {
    const items = lane.criteria.map((item) => ({
        id: item.id,
        title: item.title,
        status: statusFromMaturity(item.state),
        maturity: item.state,
        mandatory: item.mandatory,
        progressPoints: maturityPoints[item.state],
        evidence: [...item.evidence],
        professionalExit: item.fiveStarExit,
    }));
    const mandatory = items.filter((item) => item.mandatory);
    const completeItems = mandatory.filter((item) => item.status === 'complete').length;
    return {
        id: lane.id,
        kind: lane.kind,
        order: lane.order,
        name: lane.name,
        purpose: lane.purpose,
        progressPercent: lane.score,
        strictCompletionPercent: Math.round((completeItems / mandatory.length) * 100),
        completeItems,
        requiredItems: mandatory.length,
        items,
    };
});
const averageProgress = (lanes) => Math.round(lanes.reduce((total, lane) => total + lane.progressPercent, 0) /
    lanes.length);
const strictCompletion = (lanes) => {
    const required = lanes.reduce((total, lane) => total + lane.requiredItems, 0);
    const complete = lanes.reduce((total, lane) => total + lane.completeItems, 0);
    return Math.round((complete / required) * 100);
};
function summarizeMasterBuildProgress(lanes = exports.MASTER_BUILD_CHECKLIST) {
    const items = lanes.flatMap((lane) => lane.items).filter((item) => item.mandatory);
    const product = lanes.filter((lane) => lane.kind === 'system');
    const architecture = lanes.filter((lane) => lane.kind === 'volume');
    const counts = {
        complete: items.filter((item) => item.status === 'complete').length,
        partly_done: items.filter((item) => item.status === 'partly_done').length,
        missing: items.filter((item) => item.status === 'missing').length,
        blocked_external: items.filter((item) => item.status === 'blocked_external')
            .length,
        working: items.filter((item) => item.maturity === 'working').length,
        foundation: items.filter((item) => item.maturity === 'foundation').length,
        specified: items.filter((item) => item.maturity === 'specified').length,
        total: items.length,
    };
    return {
        schemaVersion: '1.0.0',
        assessedAt: '2026-08-14',
        sourceLineCount: exports.SDS_PROGRESS_SOURCE.lineCount,
        sourceCharacterCount: exports.SDS_PROGRESS_SOURCE.characterCount,
        sourceSha256: exports.SDS_PROGRESS_SOURCE.sha256,
        overallProgressPercent: averageProgress(lanes),
        strictCompletionPercent: strictCompletion(lanes),
        productProgressPercent: averageProgress(product),
        productStrictCompletionPercent: strictCompletion(product),
        architectureProgressPercent: averageProgress(architecture),
        architectureStrictCompletionPercent: strictCompletion(architecture),
        fiveStarQualified: lanes.every((lane) => lane.completeItems === lane.requiredItems),
        qualifiedLanes: lanes.filter((lane) => lane.completeItems === lane.requiredItems).length,
        laneCount: lanes.length,
        counts,
    };
}
function searchMasterBuildChecklist(query, kind = 'all', status = 'all') {
    const tokens = query
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length > 1);
    return exports.MASTER_BUILD_CHECKLIST.filter((lane) => {
        if (kind !== 'all' && lane.kind !== kind)
            return false;
        const items = status === 'all'
            ? lane.items
            : lane.items.filter((item) => item.status === status);
        if (!items.length)
            return false;
        if (!tokens.length)
            return true;
        const rawHaystack = [
            lane.name,
            lane.purpose,
            ...items.flatMap((item) => [
                item.title,
                item.status,
                item.maturity,
                ...item.evidence,
                item.professionalExit,
            ]),
        ]
            .join(' ')
            .toLocaleLowerCase();
        const haystack = rawHaystack.replaceAll('dbtp', 'dbtp true peak');
        return tokens.every((token) => haystack.includes(token));
    }).map((lane) => ({
        ...lane,
        items: status === 'all'
            ? lane.items
            : lane.items.filter((item) => item.status === status),
    }));
}
const checklistLabel = {
    complete: 'COMPLETE',
    partly_done: 'PARTLY DONE',
    missing: 'MISSING',
    blocked_external: 'EXTERNAL GATE',
};
function renderMasterBuildChecklistMarkdown() {
    const summary = summarizeMasterBuildProgress();
    const lines = [
        '# Poietek master build checklist',
        '',
        `Snapshot: ${summary.assessedAt} · schema ${summary.schemaVersion}`,
        '',
        `Historical source: \`${exports.SDS_PROGRESS_SOURCE.path}\``,
        '',
        `Source evidence: ${summary.sourceLineCount.toLocaleString()} lines · ${summary.sourceCharacterCount.toLocaleString()} decoded characters · SHA-256 \`${summary.sourceSha256}\``,
        '',
        '## Portfolio dashboard',
        '',
        '| Measure | Current | Meaning |',
        '| --- | ---: | --- |',
        `| Weighted delivery progress | ${summary.overallProgressPercent}% | Specified 20%, foundation 40%, working slice 75%, verified 100%, external gate 0% |`,
        `| Strict verified completion | ${summary.strictCompletionPercent}% | Only mandatory criteria with repeatable verification count as complete |`,
        `| Product implementation: 13 systems | ${summary.productProgressPercent}% progress / ${summary.productStrictCompletionPercent}% strict | Running product capability, not document maturity |`,
        `| Architecture and delivery: 14 volumes | ${summary.architectureProgressPercent}% progress / ${summary.architectureStrictCompletionPercent}% strict | Controlled architecture, UI, API, security, test and release evidence |`,
        `| Five-star lanes | ${summary.qualifiedLanes}/${summary.laneCount} | A lane qualifies only when every mandatory item is verified |`,
        '',
        '## Status totals',
        '',
        `- [x] Complete and verified: **${summary.counts.complete}/${summary.counts.total} (${((summary.counts.complete / summary.counts.total) * 100).toFixed(1)}%)**`,
        `- [ ] PARTLY DONE: **${summary.counts.partly_done}/${summary.counts.total} (${((summary.counts.partly_done / summary.counts.total) * 100).toFixed(1)}%)** — ${summary.counts.working} working slices and ${summary.counts.foundation} foundations`,
        `- [ ] MISSING: **${summary.counts.missing}/${summary.counts.total} (${((summary.counts.missing / summary.counts.total) * 100).toFixed(1)}%)** — specified but not usefully implemented`,
        `- [ ] EXTERNAL GATE: **${summary.counts.blocked_external}/${summary.counts.total} (${((summary.counts.blocked_external / summary.counts.total) * 100).toFixed(1)}%)** — requires real hardware, provider, authority, licence, signing identity or independent acceptance`,
        '',
        'A checklist percentage is not a marketing rating. One hundred percent requires every mandatory item below to be implemented, integrated, tested on its real targets and marked `verified`; plans, contracts and external submissions do not count as finished.',
        '',
        '## All 108 mandatory criteria',
        '',
    ];
    for (const lane of exports.MASTER_BUILD_CHECKLIST) {
        lines.push(`### ${lane.kind === 'system' ? 'System' : 'Volume'} ${String(lane.order).padStart(2, '0')} — ${lane.name}`, '', `**${lane.progressPercent}% delivery progress · ${lane.strictCompletionPercent}% strictly complete · ${lane.completeItems}/${lane.requiredItems} verified**`, '', lane.purpose, '');
        for (const item of lane.items) {
            const mark = item.status === 'complete' ? 'x' : ' ';
            lines.push(`- [${mark}] **${checklistLabel[item.status]} — ${item.title}**`, `  - Current evidence: ${item.evidence.join('; ')}`, `  - Professional exit: ${item.professionalExit}`);
        }
        lines.push('');
    }
    lines.push('## Update rule', '', 'Change a status only with repository or external evidence. Rerun `npm run verify`; automated tests compare this document with the machine-readable tracker so percentages, item counts and lane names cannot drift silently.', '');
    return lines.join('\n');
}
