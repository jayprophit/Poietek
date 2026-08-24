"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPlatformFoundation = readPlatformFoundation;
exports.withPlatformFoundation = withPlatformFoundation;
const contracts_1 = require("./contracts");
const validation_1 = require("./validation");
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Reads the versioned extension without migrating or silently accepting unknown
 * versions. Malformed imported records produce an honest invalid state.
 */
function readPlatformFoundation(project) {
    const raw = project.extensions[contracts_1.PLATFORM_FOUNDATION_EXTENSION_KEY];
    if (raw === undefined)
        return { state: "missing" };
    if (!isRecord(raw)) {
        return {
            state: "invalid",
            issues: [
                {
                    code: "FOUNDATION_NOT_AN_OBJECT",
                    path: contracts_1.PLATFORM_FOUNDATION_EXTENSION_KEY,
                    message: "The platform extension must be a serializable object.",
                },
            ],
        };
    }
    const schemaVersion = typeof raw.schemaVersion === "string" ? raw.schemaVersion : null;
    if (schemaVersion !== contracts_1.PLATFORM_FOUNDATION_SCHEMA_VERSION) {
        return { state: "unsupported_version", schemaVersion };
    }
    try {
        const foundation = raw;
        const issues = (0, validation_1.validatePlatformFoundation)(foundation);
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
    }
    catch {
        return {
            state: "invalid",
            issues: [
                {
                    code: "FOUNDATION_STRUCTURE_INVALID",
                    path: contracts_1.PLATFORM_FOUNDATION_EXTENSION_KEY,
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
function withPlatformFoundation(project, foundation) {
    if (foundation.projectId !== project.id) {
        throw new Error("Platform foundation project id does not match the project.");
    }
    const issues = (0, validation_1.validatePlatformFoundation)(foundation);
    if (issues.length > 0) {
        throw new Error(`Platform foundation is invalid: ${issues
            .map((item) => `${item.path}: ${item.message}`)
            .join("; ")}`);
    }
    return {
        ...project,
        extensions: {
            ...project.extensions,
            [contracts_1.PLATFORM_FOUNDATION_EXTENSION_KEY]: foundation,
        },
    };
}
