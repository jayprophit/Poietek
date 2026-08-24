"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProductionEngineReadiness = readProductionEngineReadiness;
exports.withProductionEngineReadiness = withProductionEngineReadiness;
const contracts_1 = require("./contracts");
const validation_1 = require("./validation");
const object = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
function readProductionEngineReadiness(project) {
    const raw = project.extensions[contracts_1.PRODUCTION_ENGINE_EXTENSION_KEY];
    if (raw === undefined)
        return { state: 'missing' };
    if (!object(raw))
        return { state: 'invalid', issues: [{ code: 'ENGINE_STATE_NOT_OBJECT', path: contracts_1.PRODUCTION_ENGINE_EXTENSION_KEY, message: 'Production engine extension must be an object.' }] };
    const version = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
    if (version !== contracts_1.PRODUCTION_ENGINE_SCHEMA_VERSION)
        return { state: 'unsupported_version', schemaVersion: version };
    try {
        const readiness = raw;
        const issues = (0, validation_1.validateProductionEngineReadiness)(readiness);
        if (readiness.projectId !== project.id)
            issues.push({ code: 'PROJECT_MISMATCH', path: 'projectId', message: 'Engine state belongs to another project.' });
        return issues.length ? { state: 'invalid', issues } : { state: 'ready', readiness };
    }
    catch {
        return { state: 'invalid', issues: [{ code: 'ENGINE_STATE_MALFORMED', path: contracts_1.PRODUCTION_ENGINE_EXTENSION_KEY, message: 'Production engine extension is incomplete.' }] };
    }
}
function withProductionEngineReadiness(project, readiness) {
    if (readiness.projectId !== project.id)
        throw new Error('Production engine state project mismatch.');
    const issues = (0, validation_1.validateProductionEngineReadiness)(readiness);
    if (issues.length)
        throw new Error(`Invalid production engine state: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
    return { ...project, extensions: { ...project.extensions, [contracts_1.PRODUCTION_ENGINE_EXTENSION_KEY]: readiness } };
}
