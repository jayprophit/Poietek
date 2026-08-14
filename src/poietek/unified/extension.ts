import {
  UNIFIED_PRODUCTION_EXTENSION_KEY,
  UNIFIED_PRODUCTION_SCHEMA_VERSION,
  type UnifiedProductionSuite,
} from './contracts';
import {
  validateUnifiedProductionSuite,
  type UnifiedProductionValidationIssue,
} from './validation';

export interface UnifiedProjectWithExtensions {
  id: string;
  extensions: Record<string, unknown>;
}

export type UnifiedProductionReadResult =
  | {state: 'missing'}
  | {state: 'unsupported_version'; schemaVersion: string | null}
  | {state: 'invalid'; issues: UnifiedProductionValidationIssue[]}
  | {state: 'ready'; suite: UnifiedProductionSuite};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function readUnifiedProductionSuite(
  project: UnifiedProjectWithExtensions,
): UnifiedProductionReadResult {
  const raw = project.extensions[UNIFIED_PRODUCTION_EXTENSION_KEY];
  if (raw === undefined) return {state: 'missing'};
  if (!record(raw)) {
    return {state: 'invalid', issues: [{code: 'SUITE_NOT_OBJECT', path: UNIFIED_PRODUCTION_EXTENSION_KEY, message: 'The unified suite extension must be an object.'}]};
  }
  const schemaVersion = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
  if (schemaVersion !== UNIFIED_PRODUCTION_SCHEMA_VERSION) return {state: 'unsupported_version', schemaVersion};
  try {
    const suite = raw as unknown as UnifiedProductionSuite;
    const issues = validateUnifiedProductionSuite(suite);
    if (suite.projectId !== project.id) issues.push({code: 'PROJECT_MISMATCH', path: 'projectId', message: 'The unified suite belongs to another project.'});
    return issues.length ? {state: 'invalid', issues} : {state: 'ready', suite};
  } catch {
    return {state: 'invalid', issues: [{code: 'SUITE_MALFORMED', path: UNIFIED_PRODUCTION_EXTENSION_KEY, message: 'The unified suite is incomplete or malformed.'}]};
  }
}

export function withUnifiedProductionSuite<T extends UnifiedProjectWithExtensions>(
  project: T,
  suite: UnifiedProductionSuite,
): T {
  if (suite.projectId !== project.id) throw new Error('Unified production suite project id does not match the project.');
  const issues = validateUnifiedProductionSuite(suite);
  if (issues.length) throw new Error(`Unified production suite is invalid: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
  return {...project, extensions: {...project.extensions, [UNIFIED_PRODUCTION_EXTENSION_KEY]: suite}};
}
