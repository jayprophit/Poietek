import { createBlankProject } from "../domain/projectFactory";
import type { PoietekProject } from "../domain/types";
import type {TimelinePlayer} from '../audio/TimelinePlayer';
import { IndexedDbProjectRepository } from "../project/IndexedDbProjectRepository";
import { ProjectSession } from "../project/ProjectSession";
import { WebLocalAssetStore } from "../assets/WebLocalAssetStore";
import { ImportAudioService } from "../assets/ImportAudioService";
import { WebAudioTimelinePlayer } from "../audio/WebAudioTimelinePlayer";
import { CapabilityRouter } from "../providers/CapabilityRouter";
import { LocalProvider } from "../providers/LocalProvider";

export class PoietekRuntime {
  readonly projects = new IndexedDbProjectRepository();
  readonly assets = new WebLocalAssetStore();
  readonly importAudio = new ImportAudioService(this.assets);
  readonly player: TimelinePlayer = new WebAudioTimelinePlayer(this.assets);
  readonly providers = new CapabilityRouter();

  private session: ProjectSession | null = null;
  private initialization: Promise<PoietekProject> | null = null;

  constructor() {
    this.providers.register(new LocalProvider());
  }

  async initialize(): Promise<PoietekProject> {
    if (!this.initialization) {
      this.initialization = this.initializeOnce();
    }

    try {
      return structuredClone(await this.initialization);
    } catch (error) {
      // A temporary storage failure must not permanently poison this runtime.
      this.initialization = null;
      throw error;
    }
  }

  private async initializeOnce(): Promise<PoietekProject> {
    const list = await this.projects.list();
    let project: PoietekProject | null = null;

    if (list[0]) {
      project = await this.projects.get(list[0].id);
    }

    if (!project) {
      project = createBlankProject();
      await this.projects.save(project);
    }

    this.session = new ProjectSession(project, this.projects);
    return this.session.getSnapshot();
  }

  getSession(): ProjectSession {
    if (!this.session) {
      throw new Error("PoietekRuntime has not been initialized.");
    }
    return this.session;
  }

  async openProject(id: string): Promise<PoietekProject> {
    const project = await this.projects.get(id);
    if (!project) throw new Error(`Project ${id} was not found.`);
    this.session = new ProjectSession(project, this.projects);
    return this.session.getSnapshot();
  }
}
