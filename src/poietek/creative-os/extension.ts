import {CREATIVE_OS_EXTENSION_KEY, CREATIVE_OS_SCHEMA_VERSION, type CreativeOsFoundation} from './contracts';
import {validateCreativeOsFoundation} from './validation';

export interface ProjectWithExtensions {id: string; extensions: Record<string, unknown>}
export type CreativeOsReadResult =
  | {state: 'missing'}
  | {state: 'unsupported_version'; schemaVersion: string | null}
  | {state: 'invalid'; issues: ReturnType<typeof validateCreativeOsFoundation>}
  | {state: 'ready'; foundation: CreativeOsFoundation};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readCreativeOsFoundation(project: ProjectWithExtensions): CreativeOsReadResult {
  const raw = project.extensions[CREATIVE_OS_EXTENSION_KEY];
  if (raw === undefined) return {state: 'missing'};
  if (!isRecord(raw)) return {state: 'invalid', issues: [{code: 'NOT_AN_OBJECT', path: CREATIVE_OS_EXTENSION_KEY, message: 'Creative OS extension must be an object.'}]};
  const schemaVersion = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
  if (schemaVersion !== CREATIVE_OS_SCHEMA_VERSION) return {state: 'unsupported_version', schemaVersion};
  const foundation = raw as unknown as CreativeOsFoundation;
  const issues = validateCreativeOsFoundation(foundation);
  if (foundation.projectId !== project.id) issues.push({code: 'PROJECT_MISMATCH', path: 'projectId', message: 'Creative OS extension belongs to another project.'});
  return issues.length ? {state: 'invalid', issues} : {state: 'ready', foundation};
}

export function withCreativeOsFoundation<T extends ProjectWithExtensions>(project: T, foundation: CreativeOsFoundation): T {
  if (project.id !== foundation.projectId) throw new Error('Creative OS project id does not match the project.');
  const issues = validateCreativeOsFoundation(foundation);
  if (issues.length) throw new Error(`Creative OS foundation is invalid: ${issues.map((item) => `${item.path}: ${item.message}`).join('; ')}`);
  return {...project, extensions: {...project.extensions, [CREATIVE_OS_EXTENSION_KEY]: foundation}};
}
