import {
  PLATFORM_FOUNDATION_EXTENSION_KEY,
  PLATFORM_FOUNDATION_SCHEMA_VERSION,
  type PlatformFoundation,
} from "./contracts";
import {
  validatePlatformFoundation,
  type PlatformValidationIssue,
} from "./validation";

export interface ProjectWithExtensions {
  id: string;
  extensions: Record<string, unknown>;
}

export type PlatformFoundationReadResult =
  | { state: "missing" }
  | { state: "unsupported_version"; schemaVersion: string | null }
  | { state: "invalid"; issues: PlatformValidationIssue[] }
  | { state: "ready"; foundation: PlatformFoundation };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads the versioned extension without migrating or silently accepting unknown
 * versions. Malformed imported records produce an honest invalid state.
 */
export function readPlatformFoundation(
  project: ProjectWithExtensions,
): PlatformFoundationReadResult {
  const raw = project.extensions[PLATFORM_FOUNDATION_EXTENSION_KEY];
  if (raw === undefined) return { state: "missing" };
  if (!isRecord(raw)) {
    return {
      state: "invalid",
      issues: [
        {
          code: "FOUNDATION_NOT_AN_OBJECT",
          path: PLATFORM_FOUNDATION_EXTENSION_KEY,
          message: "The platform extension must be a serializable object.",
        },
      ],
    };
  }

  const schemaVersion =
    typeof raw.schemaVersion === "string" ? raw.schemaVersion : null;
  if (schemaVersion !== PLATFORM_FOUNDATION_SCHEMA_VERSION) {
    return { state: "unsupported_version", schemaVersion };
  }

  try {
    const foundation = raw as unknown as PlatformFoundation;
    const issues = validatePlatformFoundation(foundation);
    if (foundation.projectId !== project.id) {
      issues.push({
        code: "FOUNDATION_PROJECT_MISMATCH",
        path: "projectId",
        message: "The platform extension belongs to a different project.",
      });
    }
    return issues.length > 0
      ? { state: "invalid", issues }
      : { state: "ready", foundation };
  } catch {
    return {
      state: "invalid",
      issues: [
        {
          code: "FOUNDATION_STRUCTURE_INVALID",
          path: PLATFORM_FOUNDATION_EXTENSION_KEY,
          message: "The platform extension is incomplete or malformed.",
        },
      ],
    };
  }
}

/**
 * Attaches a validated foundation to canonical project extensions. The caller is
 * responsible for committing the returned project through ProjectSession.
 */
export function withPlatformFoundation<T extends ProjectWithExtensions>(
  project: T,
  foundation: PlatformFoundation,
): T {
  if (foundation.projectId !== project.id) {
    throw new Error("Platform foundation project id does not match the project.");
  }
  const issues = validatePlatformFoundation(foundation);
  if (issues.length > 0) {
    throw new Error(
      `Platform foundation is invalid: ${issues
        .map((item) => `${item.path}: ${item.message}`)
        .join("; ")}`,
    );
  }

  return {
    ...project,
    extensions: {
      ...project.extensions,
      [PLATFORM_FOUNDATION_EXTENSION_KEY]: foundation,
    },
  };
}
