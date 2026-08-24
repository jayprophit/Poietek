"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSession = void 0;
const validate_1 = require("../domain/validate");
class ProjectSession {
    current;
    repository;
    maxHistory;
    undoStack = [];
    redoStack = [];
    saveTail = Promise.resolve();
    constructor(current, repository, maxHistory = 40) {
        this.current = current;
        this.repository = repository;
        this.maxHistory = maxHistory;
    }
    getSnapshot() {
        return structuredClone(this.current);
    }
    canUndo() {
        return this.undoStack.length > 0;
    }
    canRedo() {
        return this.redoStack.length > 0;
    }
    async mutate(mutation) {
        const before = structuredClone(this.current);
        const after = mutation(structuredClone(this.current));
        after.updatedAt = new Date().toISOString();
        const issues = (0, validate_1.validateProject)(after);
        if (issues.length) {
            throw new Error(`Project mutation failed validation: ${issues.join(" | ")}`);
        }
        this.undoStack.push(before);
        if (this.undoStack.length > this.maxHistory)
            this.undoStack.shift();
        this.redoStack = [];
        this.current = after;
        await this.queueSave();
        return this.getSnapshot();
    }
    async undo() {
        const previous = this.undoStack.pop();
        if (!previous)
            return this.getSnapshot();
        this.redoStack.push(structuredClone(this.current));
        this.current = previous;
        this.current.updatedAt = new Date().toISOString();
        await this.queueSave();
        return this.getSnapshot();
    }
    async redo() {
        const next = this.redoStack.pop();
        if (!next)
            return this.getSnapshot();
        this.undoStack.push(structuredClone(this.current));
        this.current = next;
        this.current.updatedAt = new Date().toISOString();
        await this.queueSave();
        return this.getSnapshot();
    }
    queueSave() {
        const snapshot = this.getSnapshot();
        const save = this.saveTail
            .catch(() => undefined)
            .then(() => this.repository.save(snapshot));
        // Keep the serialization tail usable after a failed write, while returning
        // the real save promise so the initiating operation still observes failure.
        this.saveTail = save.catch(() => undefined);
        return save;
    }
}
exports.ProjectSession = ProjectSession;
