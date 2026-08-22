import {PRODUCTION_ENGINE_EXTENSION_KEY, PRODUCTION_ENGINE_SCHEMA_VERSION, type ProductionEngineReadiness} from './contracts';
import {validateProductionEngineReadiness, type ProductionEngineIssue} from './validation';

export interface ProjectWithEngineExtensions {id: string; extensions: Record<string, unknown>}
export type ProductionEngineReadResult = {state: 'missing'} | {state: 'unsupported_version'; schemaVersion: string | null} | {state: 'invalid'; issues: ProductionEngineIssue[]} | {state: 'ready'; readiness: ProductionEngineReadiness};
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function readProductionEngineReadiness(project: ProjectWithEngineExtensions): ProductionEngineReadResult {
  const raw = project.extensions[PRODUCTION_ENGINE_EXTENSION_KEY];
  if (raw === undefined) return {state: 'missing'};
  if (!object(raw)) return {state: 'invalid', issues: [{code: 'ENGINE_STATE_NOT_OBJECT', path: PRODUCTION_ENGINE_EXTENSION_KEY, message: 'Production engine extension must be an object.'}]};
  const version = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
  if (version !== PRODUCTION_ENGINE_SCHEMA_VERSION) return {state: 'unsupported_version', schemaVersion: version};
  try {
    const readiness = raw as unknown as ProductionEngineReadiness;
    const issues = validateProductionEngineReadiness(readiness);
    if (readiness.projectId !== project.id) issues.push({code: 'PROJECT_MISMATCH', path: 'projectId', message: 'Engine state belongs to another project.'});
    return issues.length ? {state: 'invalid', issues} : {state: 'ready', readiness};
  } catch {
    return {state: 'invalid', issues: [{code: 'ENGINE_STATE_MALFORMED', path: PRODUCTION_ENGINE_EXTENSION_KEY, message: 'Production engine extension is incomplete.'}]};
  }
}

export function withProductionEngineReadiness<T extends ProjectWithEngineExtensions>(project: T, readiness: ProductionEngineReadiness): T {
  if (readiness.projectId !== project.id) throw new Error('Production engine state project mismatch.');
  const issues = validateProductionEngineReadiness(readiness);
  if (issues.length) throw new Error(`Invalid production engine state: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
  return {...project, extensions: {...project.extensions, [PRODUCTION_ENGINE_EXTENSION_KEY]: readiness}};
}
