import type { PoietekProject } from "../../domain/src/types";
import { validateProjectShallow } from "../../domain/src/validate";
import type { ProjectRepository, ProjectSummary } from "./ProjectRepository";

const DB_NAME = "poietek-projects-v1";
const DB_VERSION = 1;
const PROJECT_STORE = "projects";

interface StoredProject {
  id: string;
  revision: string;
  project: PoietekProject;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open project database."));
  });
}

function newRevision(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function cloneProject(project: PoietekProject): PoietekProject {
  return structuredClone(project);
}

export class IndexedDbProjectRepository implements ProjectRepository {
  async create(project: PoietekProject): Promise<void> {
    const issues = validateProjectShallow(project);
    if (issues.length > 0) {
      throw new Error(`Invalid project: ${issues[0].path}: ${issues[0].message}`);
    }

    const db = await openDatabase();
    try {
      const tx = db.transaction(PROJECT_STORE, "readwrite");
      const store = tx.objectStore(PROJECT_STORE);

      const existing = await requestToPromise(store.get(project.id) as IDBRequest<StoredProject | undefined>);
      if (existing) {
        tx.abort();
        throw new Error(`Project ${project.id} already exists.`);
      }

      store.add({
        id: project.id,
        revision: newRevision(),
        project: cloneProject(project),
      } satisfies StoredProject);

      await transactionDone(tx);
    } finally {
      db.close();
    }
  }

  async get(projectId: string): Promise<PoietekProject | null> {
    const db = await openDatabase();
    try {
      const tx = db.transaction(PROJECT_STORE, "readonly");
      const stored = await requestToPromise(
        tx.objectStore(PROJECT_STORE).get(projectId) as IDBRequest<StoredProject | undefined>,
      );
      await transactionDone(tx);
      return stored ? cloneProject(stored.project) : null;
    } finally {
      db.close();
    }
  }

  async save(project: PoietekProject): Promise<string> {
    const issues = validateProjectShallow(project);
    if (issues.length > 0) {
      throw new Error(`Invalid project: ${issues[0].path}: ${issues[0].message}`);
    }

    const db = await openDatabase();
    const revision = newRevision();

    try {
      const tx = db.transaction(PROJECT_STORE, "readwrite");
      tx.objectStore(PROJECT_STORE).put({
        id: project.id,
        revision,
        project: cloneProject(project),
      } satisfies StoredProject);

      await transactionDone(tx);
      return revision;
    } finally {
      db.close();
    }
  }

  async list(): Promise<ProjectSummary[]> {
    const db = await openDatabase();
    try {
      const tx = db.transaction(PROJECT_STORE, "readonly");
      const all = await requestToPromise(
        tx.objectStore(PROJECT_STORE).getAll() as IDBRequest<StoredProject[]>,
      );
      await transactionDone(tx);

      return all
        .map(({ project }) => ({
          id: project.id,
          title: project.title,
          schemaVersion: project.schemaVersion,
          updatedAt: project.updatedAt,
        }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } finally {
      db.close();
    }
  }

  async delete(projectId: string): Promise<void> {
    const db = await openDatabase();
    try {
      const tx = db.transaction(PROJECT_STORE, "readwrite");
      tx.objectStore(PROJECT_STORE).delete(projectId);
      await transactionDone(tx);
    } finally {
      db.close();
    }
  }
}
