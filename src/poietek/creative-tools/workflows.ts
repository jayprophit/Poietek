import {CREATIVE_TOOLKIT_SCHEMA_VERSION, type LocalFeedbackIdea, type StemExtractionJob} from './contracts';

export function createLocalStemExtractionJob(input: Omit<StemExtractionJob, 'schemaVersion' | 'state' | 'localOnly' | 'implementationId' | 'outputAssetIds' | 'limitations'>): StemExtractionJob {
  return {
    ...input,
    schemaVersion: CREATIVE_TOOLKIT_SCHEMA_VERSION,
    state: input.sourceFolderHandleId ? 'ready' : 'draft',
    localOnly: true,
    implementationId: null,
    outputAssetIds: [],
    limitations: input.manifestFormat === 'poietek' ? [] : [`${input.manifestFormat} parsing requires a reviewed, tested adapter.`],
  };
}

export function createLocalFeedbackIdea(input: Omit<LocalFeedbackIdea, 'schemaVersion' | 'votes' | 'state' | 'externalReference'>): LocalFeedbackIdea {
  if (!input.title.trim() || !input.detail.trim()) throw new Error('Feedback title and detail are required.');
  return {...input, schemaVersion: CREATIVE_TOOLKIT_SCHEMA_VERSION, votes: 1, state: 'draft', externalReference: null};
}

export function voteForLocalIdea(idea: LocalFeedbackIdea): LocalFeedbackIdea {
  if (idea.state === 'submitted') throw new Error('Submitted feedback votes are owned by the external service.');
  return {...idea, votes: idea.votes + 1};
}
