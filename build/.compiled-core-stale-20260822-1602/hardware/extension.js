"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHardwareFoundation = readHardwareFoundation;
exports.withHardwareFoundation = withHardwareFoundation;
const contracts_1 = require("./contracts");
const validation_1 = require("./validation");
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Reads imported hardware state without accepting or migrating unknown versions. */
function readHardwareFoundation(project) {
    const raw = project.extensions[contracts_1.HARDWARE_FOUNDATION_EXTENSION_KEY];
    if (raw === undefined)
        return { state: "missing" };
    if (!isRecord(raw)) {
        return {
            state: "invalid",
            issues: [
                {
                    code: "HARDWARE_FOUNDATION_NOT_AN_OBJECT",
                    path: contracts_1.HARDWARE_FOUNDATION_EXTENSION_KEY,
                    message: "The hardware extension must be a serializable object.",
                },
            ],
        };
    }
    const schemaVersion = typeof raw.schemaVersion === "string" ? raw.schemaVersion : null;
    if (schemaVersion !== contracts_1.HARDWARE_FOUNDATION_SCHEMA_VERSION) {
        return { state: "unsupported_version", schemaVersion };
    }
    try {
        const foundation = raw;
        const issues = (0, validation_1.validateHardwareFoundation)(foundation);
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
    }
    catch {
        return {
            state: "invalid",
            issues: [
                {
                    code: "HARDWARE_FOUNDATION_STRUCTURE_INVALID",
                    path: contracts_1.HARDWARE_FOUNDATION_EXTENSION_KEY,
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
function withHardwareFoundation(project, foundation) {
    if (foundation.projectId !== project.id) {
        throw new Error("Hardware foundation project id does not match the project.");
    }
    const issues = (0, validation_1.validateHardwareFoundation)(foundation);
    if (issues.length > 0) {
        throw new Error(`Hardware foundation is invalid: ${issues
            .map((item) => `${item.path}: ${item.message}`)
            .join("; ")}`);
    }
    return {
        ...project,
        extensions: {
            ...project.extensions,
            [contracts_1.HARDWARE_FOUNDATION_EXTENSION_KEY]: foundation,
        },
    };
}
