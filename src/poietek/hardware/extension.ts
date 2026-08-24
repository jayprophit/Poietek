import {
  HARDWARE_FOUNDATION_EXTENSION_KEY,
  HARDWARE_FOUNDATION_SCHEMA_VERSION,
  type HardwareFoundation,
} from "./contracts";
import {
  validateHardwareFoundation,
  type HardwareValidationIssue,
} from "./validation";

export interface ProjectWithHardwareExtensions {
  id: string;
  extensions: Record<string, unknown>;
}

export type HardwareFoundationReadResult =
  | { state: "missing" }
  | { state: "unsupported_version"; schemaVersion: string | null }
  | { state: "invalid"; issues: HardwareValidationIssue[] }
  | { state: "ready"; foundation: HardwareFoundation };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads imported hardware state without accepting or migrating unknown versions. */
export function readHardwareFoundation(
  project: ProjectWithHardwareExtensions,
): HardwareFoundationReadResult {
  const raw = project.extensions[HARDWARE_FOUNDATION_EXTENSION_KEY];
  if (raw === undefined) return { state: "missing" };
  if (!isRecord(raw)) {
    return {
      state: "invalid",
      issues: [
        {
          code: "HARDWARE_FOUNDATION_NOT_AN_OBJECT",
          path: HARDWARE_FOUNDATION_EXTENSION_KEY,
          message: "The hardware extension must be a serializable object.",
        },
      ],
    };
  }

  const schemaVersion =
    typeof raw.schemaVersion === "string" ? raw.schemaVersion : null;
  if (schemaVersion !== HARDWARE_FOUNDATION_SCHEMA_VERSION) {
    return { state: "unsupported_version", schemaVersion };
  }

  try {
    const foundation = raw as unknown as HardwareFoundation;
    const issues = validateHardwareFoundation(foundation);
    if (foundation.projectId !== project.id) {
      issues.push({
        code: "HARDWARE_PROJECT_MISMATCH",
        path: "projectId",
        message: "The hardware extension belongs to a different project.",
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
          code: "HARDWARE_FOUNDATION_STRUCTURE_INVALID",
          path: HARDWARE_FOUNDATION_EXTENSION_KEY,
          message: "The hardware extension is incomplete or malformed.",
        },
      ],
    };
  }
}

/**
 * Returns a project copy with validated hardware state attached. The caller must
 * commit the copy through the project's durable session/history mechanism.
 */
export function withHardwareFoundation<T extends ProjectWithHardwareExtensions>(
  project: T,
  foundation: HardwareFoundation,
): T {
  if (foundation.projectId !== project.id) {
    throw new Error("Hardware foundation project id does not match the project.");
  }
  const issues = validateHardwareFoundation(foundation);
  if (issues.length > 0) {
    throw new Error(
      `Hardware foundation is invalid: ${issues
        .map((item) => `${item.path}: ${item.message}`)
        .join("; ")}`,
    );
  }

  return {
    ...project,
    extensions: {
      ...project.extensions,
      [HARDWARE_FOUNDATION_EXTENSION_KEY]: foundation,
    },
  };
}
