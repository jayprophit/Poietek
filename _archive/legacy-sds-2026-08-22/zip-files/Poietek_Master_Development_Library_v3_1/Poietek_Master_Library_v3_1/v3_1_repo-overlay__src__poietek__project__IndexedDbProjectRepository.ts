import type { PoietekProject } from "../domain/types";
import { validateProject } from "../domain/validate";
import type { ProjectRepository, ProjectSummary } from "./ProjectRepository";

const DB_NAME = "poietek-projects-v2";
const DB_VERSION = 1;
const STORE = "projects";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}

async function openDb(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: "id" });
    }
  };

  return requestResult(request);
}

export class IndexedDbProjectRepository implements ProjectRepository {
  async get(id: string): Promise<PoietekProject | null> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readonly");
      const value = await requestResult(
        tx.objectStore(STORE).get(id) as IDBRequest<PoietekProject | undefined>,
      );
      await txComplete(tx);
      return value ? structuredClone(value) : null;
    } finally {
      db.close();
    }
  }

  async save(project: PoietekProject): Promise<void> {
    const issues = validateProject(project);
    if (issues.length) {
      throw new Error(`Project validation failed: ${issues.join(" | ")}`);
    }

    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(structuredClone(project));
      await txComplete(tx);
    } finally {
      db.close();
    }
  }

  async list(): Promise<ProjectSummary[]> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readonly");
      const projects = await requestResult(
        tx.objectStore(STORE).getAll() as IDBRequest<PoietekProject[]>,
      );
      await txComplete(tx);

      return projects
        .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } finally {
      db.close();
    }
  }

  async delete(id: string): Promise<void> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      await txComplete(tx);
    } finally {
      db.close();
    }
  }
}
