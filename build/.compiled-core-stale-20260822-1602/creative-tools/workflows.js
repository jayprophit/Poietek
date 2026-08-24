"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalStemExtractionJob = createLocalStemExtractionJob;
exports.createLocalFeedbackIdea = createLocalFeedbackIdea;
exports.voteForLocalIdea = voteForLocalIdea;
const contracts_1 = require("./contracts");
function createLocalStemExtractionJob(input) {
    return {
        ...input,
        schemaVersion: contracts_1.CREATIVE_TOOLKIT_SCHEMA_VERSION,
        state: input.sourceFolderHandleId ? 'ready' : 'draft',
        localOnly: true,
        implementationId: null,
        outputAssetIds: [],
        limitations: input.manifestFormat === 'poietek' ? [] : [`${input.manifestFormat} parsing requires a reviewed, tested adapter.`],
    };
}
function createLocalFeedbackIdea(input) {
    if (!input.title.trim() || !input.detail.trim())
        throw new Error('Feedback title and detail are required.');
    return { ...input, schemaVersion: contracts_1.CREATIVE_TOOLKIT_SCHEMA_VERSION, votes: 1, state: 'draft', externalReference: null };
}
function voteForLocalIdea(idea) {
    if (idea.state === 'submitted')
        throw new Error('Submitted feedback votes are owned by the external service.');
    return { ...idea, votes: idea.votes + 1 };
}
