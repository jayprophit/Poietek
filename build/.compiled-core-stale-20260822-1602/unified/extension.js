"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readUnifiedProductionSuite = readUnifiedProductionSuite;
exports.withUnifiedProductionSuite = withUnifiedProductionSuite;
const contracts_1 = require("./contracts");
const validation_1 = require("./validation");
const record = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
function readUnifiedProductionSuite(project) {
    const raw = project.extensions[contracts_1.UNIFIED_PRODUCTION_EXTENSION_KEY];
    if (raw === undefined)
        return { state: 'missing' };
    if (!record(raw)) {
        return { state: 'invalid', issues: [{ code: 'SUITE_NOT_OBJECT', path: contracts_1.UNIFIED_PRODUCTION_EXTENSION_KEY, message: 'The unified suite extension must be an object.' }] };
    }
    const schemaVersion = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : null;
    if (schemaVersion !== contracts_1.UNIFIED_PRODUCTION_SCHEMA_VERSION)
        return { state: 'unsupported_version', schemaVersion };
    try {
        const suite = raw;
        const issues = (0, validation_1.validateUnifiedProductionSuite)(suite);
        if (suite.projectId !== project.id)
            issues.push({ code: 'PROJECT_MISMATCH', path: 'projectId', message: 'The unified suite belongs to another project.' });
        return issues.length ? { state: 'invalid', issues } : { state: 'ready', suite };
    }
    catch {
        return { state: 'invalid', issues: [{ code: 'SUITE_MALFORMED', path: contracts_1.UNIFIED_PRODUCTION_EXTENSION_KEY, message: 'The unified suite is incomplete or malformed.' }] };
    }
}
function withUnifiedProductionSuite(project, suite) {
    if (suite.projectId !== project.id)
        throw new Error('Unified production suite project id does not match the project.');
    const issues = (0, validation_1.validateUnifiedProductionSuite)(suite);
    if (issues.length)
        throw new Error(`Unified production suite is invalid: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
    return { ...project, extensions: { ...project.extensions, [contracts_1.UNIFIED_PRODUCTION_EXTENSION_KEY]: suite } };
}
