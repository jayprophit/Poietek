"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScoreDocument = createScoreDocument;
exports.addScorePlayer = addScorePlayer;
exports.appendScoreMeasure = appendScoreMeasure;
exports.insertScoreNote = insertScoreNote;
exports.deriveScorePart = deriveScorePart;
exports.validateScoreDocument = validateScoreDocument;
exports.getProjectScoreDocument = getProjectScoreDocument;
exports.withProjectScoreDocument = withProjectScoreDocument;
exports.createMusicXmlExportRequest = createMusicXmlExportRequest;
const SCORE_EXTENSION_KEY = 'poietek.score.v1';
function createScoreDocument(id, title) {
    if (!id.trim())
        throw new Error('Score id is required.');
    if (!title.trim())
        throw new Error('Score title is required.');
    return {
        schemaVersion: '1.0.0',
        id,
        title,
        mode: 'setup',
        players: [],
        flows: [{
                id: `${id}:flow:1`,
                title: 'Flow 1',
                timeSignature: { numerator: 4, denominator: 4 },
                keySignatureFifths: 0,
                measures: [{ number: 1, notes: [] }],
            }],
        layouts: [{ id: `${id}:layout:full`, name: 'Full score', kind: 'full_score', playerIds: [] }],
        playback: {
            articulationInterpretation: true,
            followsProjectTempo: true,
            videoAssetId: null,
        },
        interchange: { musicXmlState: 'not_configured' },
    };
}
function addScorePlayer(document, player) {
    if (document.players.some((candidate) => candidate.id === player.id)) {
        throw new Error(`Duplicate score player: ${player.id}`);
    }
    if (!player.id.trim() || !player.name.trim() || !player.instrumentName.trim()) {
        throw new Error('Score players require id, name and instrument name.');
    }
    if (!Number.isInteger(player.staffCount) || player.staffCount < 1 || player.staffCount > 4) {
        throw new Error('Score player staff count must be an integer from 1 to 4.');
    }
    const part = {
        id: `${document.id}:layout:${player.id}`,
        name: `${player.name} — ${player.instrumentName}`,
        kind: 'part',
        playerIds: [player.id],
    };
    return {
        ...document,
        players: [...document.players, { ...player }],
        layouts: document.layouts.map((layout) => layout.kind === 'full_score'
            ? { ...layout, playerIds: [...layout.playerIds, player.id] }
            : layout).concat(part),
    };
}
function appendScoreMeasure(document, flowId) {
    if (!document.flows.some((flow) => flow.id === flowId)) {
        throw new Error(`Unknown score flow: ${flowId}`);
    }
    return {
        ...document,
        flows: document.flows.map((flow) => flow.id === flowId
            ? { ...flow, measures: [...flow.measures, { number: flow.measures.length + 1, notes: [] }] }
            : flow),
    };
}
function insertScoreNote(document, flowId, measureNumber, note) {
    if (!document.players.some((player) => player.id === note.playerId)) {
        throw new Error(`Score note references unknown player: ${note.playerId}`);
    }
    if (document.flows.some((flow) => flow.measures.some((measure) => (measure.notes.some((candidate) => candidate.id === note.id)))))
        throw new Error(`Duplicate score note: ${note.id}`);
    const flow = document.flows.find((candidate) => candidate.id === flowId);
    const measure = flow?.measures.find((candidate) => candidate.number === measureNumber);
    if (!flow || !measure)
        throw new Error(`Unknown score measure: ${flowId}/${measureNumber}`);
    const measureBeats = flow.timeSignature.numerator * (4 / flow.timeSignature.denominator);
    if (!Number.isFinite(note.startBeat) || note.startBeat < 0
        || !Number.isFinite(note.durationBeats) || note.durationBeats <= 0
        || note.startBeat + note.durationBeats > measureBeats) {
        throw new Error('Score note must fit inside the target measure.');
    }
    validateWrittenPitch(note.writtenPitch);
    return {
        ...document,
        flows: document.flows.map((candidate) => candidate.id === flowId
            ? {
                ...candidate,
                measures: candidate.measures.map((candidateMeasure) => candidateMeasure.number === measureNumber
                    ? { ...candidateMeasure, notes: [...candidateMeasure.notes, { ...note, articulations: [...note.articulations] }] }
                    : candidateMeasure),
            }
            : candidate),
    };
}
function validateWrittenPitch(pitch) {
    if (!['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(pitch.step)) {
        throw new Error('Written pitch step is invalid.');
    }
    if (!Number.isInteger(pitch.octave) || pitch.octave < -1 || pitch.octave > 9) {
        throw new Error('Written pitch octave must be an integer from -1 to 9.');
    }
    if (![-2, -1, 0, 1, 2].includes(pitch.alteration)) {
        throw new Error('Written pitch alteration must be from double-flat to double-sharp.');
    }
}
function deriveScorePart(document, playerId) {
    const player = document.players.find((candidate) => candidate.id === playerId);
    const layout = document.layouts.find((candidate) => (candidate.kind === 'part' && candidate.playerIds.length === 1 && candidate.playerIds[0] === playerId));
    if (!player || !layout)
        throw new Error(`No part layout exists for player: ${playerId}`);
    return {
        layout,
        player,
        flows: document.flows.map((flow) => ({
            ...flow,
            measures: flow.measures.map((measure) => ({
                ...measure,
                notes: measure.notes.filter((note) => note.playerId === playerId),
            })),
        })),
    };
}
function validateScoreDocument(document) {
    const issues = [];
    if (document.schemaVersion !== '1.0.0')
        issues.push('Unsupported score schema.');
    if (!document.id.trim())
        issues.push('Score id is required.');
    if (!document.title.trim())
        issues.push('Score title is required.');
    const playerIds = new Set();
    document.players.forEach((player) => {
        if (playerIds.has(player.id))
            issues.push(`Duplicate score player ${player.id}.`);
        playerIds.add(player.id);
    });
    const noteIds = new Set();
    document.flows.forEach((flow) => {
        if (flow.timeSignature.numerator < 1 || flow.timeSignature.numerator > 32) {
            issues.push(`Flow ${flow.id} has an invalid time-signature numerator.`);
        }
        flow.measures.forEach((measure, index) => {
            if (measure.number !== index + 1)
                issues.push(`Flow ${flow.id} measure numbers must be consecutive.`);
            const measureBeats = flow.timeSignature.numerator * (4 / flow.timeSignature.denominator);
            measure.notes.forEach((note) => {
                if (noteIds.has(note.id))
                    issues.push(`Duplicate score note ${note.id}.`);
                noteIds.add(note.id);
                if (!playerIds.has(note.playerId))
                    issues.push(`Score note ${note.id} references a missing player.`);
                if (note.startBeat < 0 || note.durationBeats <= 0 || note.startBeat + note.durationBeats > measureBeats) {
                    issues.push(`Score note ${note.id} does not fit in measure ${measure.number}.`);
                }
            });
        });
    });
    document.layouts.forEach((layout) => layout.playerIds.forEach((playerId) => {
        if (!playerIds.has(playerId))
            issues.push(`Layout ${layout.id} references missing player ${playerId}.`);
    }));
    return issues;
}
function getProjectScoreDocument(project) {
    const value = project.extensions[SCORE_EXTENSION_KEY];
    if (!value || typeof value !== 'object')
        return null;
    return value;
}
function withProjectScoreDocument(project, document) {
    const issues = validateScoreDocument(document);
    if (issues.length)
        throw new Error(issues.join(' '));
    return {
        ...project,
        updatedAt: new Date().toISOString(),
        extensions: { ...project.extensions, [SCORE_EXTENSION_KEY]: document },
    };
}
function createMusicXmlExportRequest(document, observations) {
    const adapter = observations.find((observation) => (observation.capability === 'musicxml_interchange' && observation.state === 'available'));
    if (!adapter) {
        return {
            scoreId: document.id,
            state: 'adapter_required',
            message: 'MusicXML export is unavailable until a validated interchange adapter is observed.',
        };
    }
    return {
        scoreId: document.id,
        state: 'ready_for_adapter',
        adapterId: adapter.adapterId,
        message: 'The score is ready for the observed MusicXML adapter; the returned file still requires validation.',
    };
}
