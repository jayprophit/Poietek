import type {CreativeOsFoundation, CreativeGraphNodeKind} from './contracts';

export interface CreativeSearchResult {
  id: string;
  kind: CreativeGraphNodeKind | 'journal' | 'annotation';
  label: string;
  excerpt: string;
  score: number;
  sourceId: string;
}

function tokens(value: string) {
  return [...new Set(value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1))];
}

function scoreText(query: string[], title: string, body: string) {
  const normalizedTitle = title.toLocaleLowerCase();
  const normalizedBody = body.toLocaleLowerCase();
  return query.reduce((score, token) => score + (normalizedTitle.includes(token) ? 5 : 0) + (normalizedBody.includes(token) ? 1 : 0), 0);
}

export function searchCreativeOs(
  foundation: CreativeOsFoundation,
  query: string,
  limit = 30,
): CreativeSearchResult[] {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0 || limit <= 0) return [];
  const results: CreativeSearchResult[] = [];
  for (const node of foundation.graph.nodes) {
    const body = `${node.tags.join(' ')} ${JSON.stringify(node.metadata)}`;
    const score = scoreText(queryTokens, node.label, body);
    if (score > 0) results.push({id: `node:${node.id}`, kind: node.kind, label: node.label, excerpt: node.tags.join(' · '), score, sourceId: node.id});
  }
  for (const item of foundation.journal) {
    const score = scoreText(queryTokens, item.title, item.body);
    if (score > 0) results.push({id: `journal:${item.id}`, kind: 'journal', label: item.title, excerpt: item.body.slice(0, 180), score, sourceId: item.id});
  }
  for (const item of foundation.annotations) {
    const score = scoreText(queryTokens, item.modality, item.body);
    if (score > 0) results.push({id: `annotation:${item.id}`, kind: 'annotation', label: `${item.modality} annotation`, excerpt: item.body.slice(0, 180), score, sourceId: item.id});
  }
  return results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, limit);
}
