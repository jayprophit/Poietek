"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoietekRuntime = void 0;
const projectFactory_1 = require("../domain/projectFactory");
const IndexedDbProjectRepository_1 = require("../project/IndexedDbProjectRepository");
const ProjectSession_1 = require("../project/ProjectSession");
const WebLocalAssetStore_1 = require("../assets/WebLocalAssetStore");
const ImportAudioService_1 = require("../assets/ImportAudioService");
const WebAudioTimelinePlayer_1 = require("../audio/WebAudioTimelinePlayer");
const CapabilityRouter_1 = require("../providers/CapabilityRouter");
const LocalProvider_1 = require("../providers/LocalProvider");
class PoietekRuntime {
    projects = new IndexedDbProjectRepository_1.IndexedDbProjectRepository();
    assets = new WebLocalAssetStore_1.WebLocalAssetStore();
    importAudio = new ImportAudioService_1.ImportAudioService(this.assets);
    player = new WebAudioTimelinePlayer_1.WebAudioTimelinePlayer(this.assets);
    providers = new CapabilityRouter_1.CapabilityRouter();
    session = null;
    initialization = null;
    constructor() {
        this.providers.register(new LocalProvider_1.LocalProvider());
    }
    async initialize() {
        if (!this.initialization) {
            this.initialization = this.initializeOnce();
        }
        try {
            return structuredClone(await this.initialization);
        }
        catch (error) {
            // A temporary storage failure must not permanently poison this runtime.
            this.initialization = null;
            throw error;
        }
    }
    async initializeOnce() {
        const list = await this.projects.list();
        let project = null;
        if (list[0]) {
            project = await this.projects.get(list[0].id);
        }
        if (!project) {
            project = (0, projectFactory_1.createBlankProject)();
            await this.projects.save(project);
        }
        this.session = new ProjectSession_1.ProjectSession(project, this.projects);
        return this.session.getSnapshot();
    }
    getSession() {
        if (!this.session) {
            throw new Error("PoietekRuntime has not been initialized.");
        }
        return this.session;
    }
    async openProject(id) {
        const project = await this.projects.get(id);
        if (!project)
            throw new Error(`Project ${id} was not found.`);
        this.session = new ProjectSession_1.ProjectSession(project, this.projects);
        return this.session.getSnapshot();
    }
}
exports.PoietekRuntime = PoietekRuntime;
