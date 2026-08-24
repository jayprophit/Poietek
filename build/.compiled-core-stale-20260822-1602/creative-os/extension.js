"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCreativeOsFoundation = readCreativeOsFoundation;
exports.withCreativeOsFoundation = withCreativeOsFoundation;
const contracts_1 = require("./contracts");
const validation_1 = require("./validation");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readCreativeOsFoundation(project) {
    const raw = project.extensions[contracts_1.CREATIVE_OS_EXTENSION_KEY];
    if (raw === undefined)
        return { state: 'missing' };
    if (!isRecord(raw))
        return { state: 'invalid', issues: [{ code: 'NOT_AN_OBJECT', path: contracts_1.CREATIVE_OS_EXTENSION_KEY, message: 'Creative OS extension must be an object.' }] };
    const schemaVersion = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
    if (schemaVersion !== contracts_1.CREATIVE_OS_SCHEMA_VERSION)
        return { state: 'unsupported_version', schemaVersion };
    const foundation = raw;
    const issues = (0, validation_1.validateCreativeOsFoundation)(foundation);
    if (foundation.projectId !== project.id)
        issues.push({ code: 'PROJECT_MISMATCH', path: 'projectId', message: 'Creative OS extension belongs to another project.' });
    return issues.length ? { state: 'invalid', issues } : { state: 'ready', foundation };
}
function withCreativeOsFoundation(project, foundation) {
    if (project.id !== foundation.projectId)
        throw new Error('Creative OS project id does not match the project.');
    const issues = (0, validation_1.validateCreativeOsFoundation)(foundation);
    if (issues.length)
        throw new Error(`Creative OS foundation is invalid: ${issues.map((item) => `${item.path}: ${item.message}`).join('; ')}`);
    return { ...project, extensions: { ...project.extensions, [contracts_1.CREATIVE_OS_EXTENSION_KEY]: foundation } };
}
