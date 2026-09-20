/**
 * Universal-Bridge session reader (P8, Poietek <-> Universal-Bridge).
 *
 * Reads UB session/profile JSON produced by the C++ bridge and maps it to
 * Poietek CapabilityReport observations. Reports describe observed state;
 * they never promise an operation will succeed. Historical absolute paths
 * inside UB evidence are never treated as live locations.
 */

export const UB_SESSION_BRIDGE_VERSION = "1.0.0";

function report(capabilityId, state, metadata = {}, reasonCode = null, message = null) {
  return {
    capabilityId,
    state,
    source: "provider",
    implementationId: "universal-bridge",
    observedAt: new Date().toISOString(),
    reasonCode,
    message,
    retryable: state !== "available",
    requiredConsentScope: null,
    metadata,
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseUbSession(text) {
  let session;
  try {
    session = JSON.parse(text);
  } catch {
    throw new Error("ub-session: invalid JSON");
  }
  if (!isRecord(session)) throw new Error("ub-session: session must be an object");
  if (typeof session.session_id !== "string" || !session.session_id) {
    throw new Error("ub-session: missing session_id");
  }
  if (typeof session.schema !== "string" || !session.schema) {
    throw new Error("ub-session: missing schema");
  }
  if (!Array.isArray(session.tracks)) {
    throw new Error("ub-session: missing tracks array");
  }
  const reports = [
    report(
      "ub.session.import",
      "available",
      {
        schema: session.schema,
        sessionId: session.session_id,
        trackCount: session.tracks.length,
        valid: session.valid === true,
        bridge: UB_SESSION_BRIDGE_VERSION,
      },
      null,
      `Imported UB session ${session.session_id} (${session.tracks.length} tracks).`,
    ),
    report(
      "ub.session.writeback",
      session.write_back_enabled === true ? "available" : "unavailable",
      { writeBackEnabled: session.write_back_enabled === true },
      session.write_back_enabled === true ? null : "WRITEBACK_DISABLED",
      session.write_back_enabled === true
        ? "Session allows write-back."
        : "Session is read-only; write-back disabled at source.",
    ),
  ];
  return { session, reports };
}

export function parseUbAdapter(text) {
  let profile;
  try {
    profile = JSON.parse(text);
  } catch {
    throw new Error("ub-adapter: invalid JSON");
  }
  if (!isRecord(profile)) throw new Error("ub-adapter: profile must be an object");
  const schemaVersion =
    profile.adapter_schema_version || profile.schema_version || null;
  if (!schemaVersion) throw new Error("ub-adapter: missing schema version");
  return report(
    "ub.device.profile",
    "available",
    {
      schemaVersion,
      name: profile.name || profile.id || null,
      bridge: UB_SESSION_BRIDGE_VERSION,
    },
    null,
    `Observed UB adapter profile schema ${schemaVersion}.`,
  );
}

export async function readUbSessionFile(path, readFile) {
  const text = await readFile(path, "utf8");
  return parseUbSession(text);
}

export async function readUbAdapterFile(path, readFile) {
  const text = await readFile(path, "utf8");
  return parseUbAdapter(text);
}
