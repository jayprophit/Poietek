import { newId } from "../domain/ids";
import type { PoietekProject } from "../domain/types";
import { validateProject } from "../domain/validate";

export const RECOVERED_UNSAVED_LABEL = "Recovered — unsaved changes";

export interface CrashRecoverySnapshot {
  id: string;
  projectId: string;
  createdAt: string;
  lastDurableProjectUpdatedAt: string | null;
  reason: "crash_recovery_checkpoint";
  project: PoietekProject;
}

export interface CrashRecoverySnapshotRepository {
  get(snapshotId: string): Promise<CrashRecoverySnapshot | null>;
  save(snapshot: CrashRecoverySnapshot): Promise<void>;
  listForProject(projectId: string): Promise<CrashRecoverySnapshot[]>;
  delete(snapshotId: string): Promise<void>;
}

export type CrashRecoveryChoice = "recover" | "skip" | "discard";

export type CrashRecoveryResolution =
  | {
      action: "recover";
      snapshotId: string;
      project: PoietekProject;
      label: typeof RECOVERED_UNSAVED_LABEL;
      isUnsaved: true;
      snapshotRetainedUntilDurableSave: true;
    }
  | {
      action: "skip";
      snapshotId: string;
      project: null;
      label: null;
      isUnsaved: false;
      snapshotRetainedUntilDurableSave: true;
    }
  | {
      action: "discard";
      snapshotId: string;
      project: null;
      label: null;
      isUnsaved: false;
      snapshotRetainedUntilDurableSave: false;
    };

export interface RecoveredUnsavedExtension {
  state: "recovered_unsaved";
  snapshotId: string;
  recoveredAt: string;
  label: typeof RECOVERED_UNSAVED_LABEL;
}

export interface CrashRecoveryCoordinatorOptions {
  now?: () => Date;
  idFactory?: () => string;
  retainCheckpointCount?: number;
}

export class CrashRecoveryCoordinator {
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly retainCheckpointCount: number;

  constructor(
    private readonly repository: CrashRecoverySnapshotRepository,
    options: CrashRecoveryCoordinatorOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? (() => newId("rcv"));
    this.retainCheckpointCount = options.retainCheckpointCount ?? 2;
    if (
      !Number.isInteger(this.retainCheckpointCount) ||
      this.retainCheckpointCount < 1
    ) {
      throw new RangeError("retainCheckpointCount must be a positive integer.");
    }
  }

  async checkpoint(
    project: PoietekProject,
    lastDurableProjectUpdatedAt: string | null,
  ): Promise<CrashRecoverySnapshot> {
    assertValidProject(project, "Recovery checkpoint");
    if (
      lastDurableProjectUpdatedAt !== null &&
      !isValidIsoDate(lastDurableProjectUpdatedAt)
    ) {
      throw new Error("lastDurableProjectUpdatedAt must be an ISO date or null.");
    }

    const snapshot: CrashRecoverySnapshot = {
      id: this.idFactory(),
      projectId: project.id,
      createdAt: this.now().toISOString(),
      lastDurableProjectUpdatedAt,
      reason: "crash_recovery_checkpoint",
      project: structuredClone(project),
    };
    assertValidSnapshot(snapshot);
    await this.repository.save(snapshot);

    // Save the newest snapshot before pruning older ones. If the new write
    // fails, the previous recovery point remains intact.
    const snapshots = await this.repository.listForProject(project.id);
    const keepIds = new Set([
      snapshot.id,
      ...snapshots
        .filter((candidate) => candidate.id !== snapshot.id)
        .slice(0, this.retainCheckpointCount - 1)
        .map((candidate) => candidate.id),
    ]);
    for (const stale of snapshots.filter((candidate) => !keepIds.has(candidate.id))) {
      await this.repository.delete(stale.id);
    }
    return structuredClone(snapshot);
  }

  async findLatest(projectId: string): Promise<CrashRecoverySnapshot | null> {
    const [latest] = await this.repository.listForProject(projectId);
    return latest ? structuredClone(latest) : null;
  }

  async resolve(
    snapshotId: string,
    choice: CrashRecoveryChoice,
  ): Promise<CrashRecoveryResolution> {
    if (choice !== "recover" && choice !== "skip" && choice !== "discard") {
      throw new Error(`Unsupported crash-recovery choice: ${String(choice)}.`);
    }
    const snapshot = await this.repository.get(snapshotId);
    if (!snapshot) throw new Error(`Recovery snapshot ${snapshotId} was not found.`);
    assertValidSnapshot(snapshot);

    if (choice === "discard") {
      await this.repository.delete(snapshotId);
      return {
        action: "discard",
        snapshotId,
        project: null,
        label: null,
        isUnsaved: false,
        snapshotRetainedUntilDurableSave: false,
      };
    }

    if (choice === "skip") {
      // Skip is deliberately non-destructive: the caller opens its durable
      // project and may offer this recovery point again later.
      return {
        action: "skip",
        snapshotId,
        project: null,
        label: null,
        isUnsaved: false,
        snapshotRetainedUntilDurableSave: true,
      };
    }

    const recoveredAt = this.now().toISOString();
    const project: PoietekProject = {
      ...structuredClone(snapshot.project),
      updatedAt: recoveredAt,
      extensions: {
        ...structuredClone(snapshot.project.extensions),
        poietekRecovery: {
          state: "recovered_unsaved",
          snapshotId,
          recoveredAt,
          label: RECOVERED_UNSAVED_LABEL,
        } satisfies RecoveredUnsavedExtension,
      },
    };
    assertValidProject(project, "Recovered project");

    // Recover does not delete the checkpoint. The caller must first make a
    // durable project save, then acknowledge it through markDurablySaved().
    return {
      action: "recover",
      snapshotId,
      project,
      label: RECOVERED_UNSAVED_LABEL,
      isUnsaved: true,
      snapshotRetainedUntilDurableSave: true,
    };
  }

  async markDurablySaved(snapshotId: string): Promise<void> {
    await this.repository.delete(snapshotId);
  }
}

export function readRecoveredUnsavedState(
  project: PoietekProject,
): RecoveredUnsavedExtension | null {
  const value = project.extensions.poietekRecovery;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<RecoveredUnsavedExtension>;
  if (
    candidate.state !== "recovered_unsaved" ||
    typeof candidate.snapshotId !== "string" ||
    typeof candidate.recoveredAt !== "string" ||
    !isValidIsoDate(candidate.recoveredAt) ||
    candidate.label !== RECOVERED_UNSAVED_LABEL
  ) {
    return null;
  }
  return {
    state: candidate.state,
    snapshotId: candidate.snapshotId,
    recoveredAt: candidate.recoveredAt,
    label: candidate.label,
  };
}

export class InMemoryCrashRecoverySnapshotRepository
  implements CrashRecoverySnapshotRepository
{
  private readonly snapshots = new Map<string, CrashRecoverySnapshot>();

  async get(snapshotId: string): Promise<CrashRecoverySnapshot | null> {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async save(snapshot: CrashRecoverySnapshot): Promise<void> {
    assertValidSnapshot(snapshot);
    this.snapshots.set(snapshot.id, structuredClone(snapshot));
  }

  async listForProject(projectId: string): Promise<CrashRecoverySnapshot[]> {
    return [...this.snapshots.values()]
      .filter((snapshot) => snapshot.projectId === projectId)
      .sort(compareNewestFirst)
      .map((snapshot) => structuredClone(snapshot));
  }

  async delete(snapshotId: string): Promise<void> {
    this.snapshots.delete(snapshotId);
  }
}

const RECOVERY_DB_NAME = "poietek-crash-recovery-v1";
const RECOVERY_DB_VERSION = 1;
const RECOVERY_STORE = "snapshots";

export class IndexedDbCrashRecoverySnapshotRepository
  implements CrashRecoverySnapshotRepository
{
  async get(snapshotId: string): Promise<CrashRecoverySnapshot | null> {
    const db = await openRecoveryDb();
    try {
      const transaction = db.transaction(RECOVERY_STORE, "readonly");
      const snapshot = await requestResult(
        transaction.objectStore(RECOVERY_STORE).get(snapshotId) as IDBRequest<
          CrashRecoverySnapshot | undefined
        >,
      );
      await transactionComplete(transaction);
      if (!snapshot) return null;
      assertValidSnapshot(snapshot);
      return structuredClone(snapshot);
    } finally {
      db.close();
    }
  }

  async save(snapshot: CrashRecoverySnapshot): Promise<void> {
    assertValidSnapshot(snapshot);
    const db = await openRecoveryDb();
    try {
      const transaction = db.transaction(RECOVERY_STORE, "readwrite");
      transaction.objectStore(RECOVERY_STORE).put(structuredClone(snapshot));
      await transactionComplete(transaction);
    } finally {
      db.close();
    }
  }

  async listForProject(projectId: string): Promise<CrashRecoverySnapshot[]> {
    const db = await openRecoveryDb();
    try {
      const transaction = db.transaction(RECOVERY_STORE, "readonly");
      const snapshots = await requestResult(
        transaction.objectStore(RECOVERY_STORE).getAll() as IDBRequest<
          CrashRecoverySnapshot[]
        >,
      );
      await transactionComplete(transaction);
      return snapshots
        .filter((snapshot) => snapshot.projectId === projectId)
        .map((snapshot) => {
          assertValidSnapshot(snapshot);
          return structuredClone(snapshot);
        })
        .sort(compareNewestFirst);
    } finally {
      db.close();
    }
  }

  async delete(snapshotId: string): Promise<void> {
    const db = await openRecoveryDb();
    try {
      const transaction = db.transaction(RECOVERY_STORE, "readwrite");
      transaction.objectStore(RECOVERY_STORE).delete(snapshotId);
      await transactionComplete(transaction);
    } finally {
      db.close();
    }
  }
}

function compareNewestFirst(
  left: CrashRecoverySnapshot,
  right: CrashRecoverySnapshot,
): number {
  const byCreatedAt = right.createdAt.localeCompare(left.createdAt);
  return byCreatedAt || right.id.localeCompare(left.id);
}

function assertValidSnapshot(snapshot: CrashRecoverySnapshot): void {
  if (!snapshot.id) throw new Error("Recovery snapshot id is required.");
  if (!snapshot.projectId) throw new Error("Recovery snapshot projectId is required.");
  if (snapshot.project.id !== snapshot.projectId) {
    throw new Error("Recovery snapshot projectId does not match its project.");
  }
  if (!isValidIsoDate(snapshot.createdAt)) {
    throw new Error("Recovery snapshot createdAt must be a valid ISO date.");
  }
  if (
    snapshot.lastDurableProjectUpdatedAt !== null &&
    !isValidIsoDate(snapshot.lastDurableProjectUpdatedAt)
  ) {
    throw new Error(
      "Recovery snapshot lastDurableProjectUpdatedAt must be an ISO date or null.",
    );
  }
  if (snapshot.reason !== "crash_recovery_checkpoint") {
    throw new Error("Recovery snapshot reason is unsupported.");
  }
  assertValidProject(snapshot.project, "Recovery snapshot project");
}

function assertValidProject(project: PoietekProject, label: string): void {
  const issues = validateProject(project);
  if (issues.length) throw new Error(`${label} is invalid: ${issues.join(" | ")}`);
}

function isValidIsoDate(value: string): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB recovery request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB recovery transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB recovery transaction aborted."));
  });
}

async function openRecoveryDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB crash-recovery storage is unavailable on this platform.");
  }
  const request = indexedDB.open(RECOVERY_DB_NAME, RECOVERY_DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(RECOVERY_STORE)) {
      db.createObjectStore(RECOVERY_STORE, { keyPath: "id" });
    }
  };
  return requestResult(request);
}
