import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

import {
  UB_SESSION_BRIDGE_VERSION,
  parseUbSession,
  parseUbAdapter,
  readUbSessionFile,
} from "../bridges/ub-session/read-session.mjs";

function ubridgeRoot() {
  if (process.env.UBRIDGE_ROOT && existsSync(process.env.UBRIDGE_ROOT)) {
    return process.env.UBRIDGE_ROOT;
  }
  const sibling = new URL("../Universal-Bridge/", pathToFileURL(`${process.cwd()}/`));
  const candidate = new URL(sibling.href).pathname;
  // Windows file URL pathname has a leading slash: /C:/...
  const normalized = decodeURIComponent(candidate).replace(/^\/([A-Za-z]:)/, "$1");
  return existsSync(normalized) ? normalized : null;
}

describe("ub-session bridge (Poietek <-> Universal-Bridge)", () => {
  it("reads a real UB session into capability reports", async () => {
    const root = ubridgeRoot();
    if (!root) return; // isolated run without the UB checkout
    const path = join(root, "output", "UBRIDE-CERT-001-events", "session.ubridge.json");
    if (!existsSync(path)) return;
    const { session, reports } = await readUbSessionFile(path, readFile);
    assert.equal(session.session_id, "mpc-ubride-cert-001");
    assert.equal(session.tracks.length, 4);
    const byId = Object.fromEntries(reports.map((r) => [r.capabilityId, r]));
    assert.equal(byId["ub.session.import"].state, "available");
    assert.equal(byId["ub.session.import"].metadata.trackCount, 4);
    assert.equal(byId["ub.session.import"].source, "provider");
    assert.ok(byId["ub.session.import"].observedAt);
  });

  it("never surfaces historical absolute paths as live locations", async () => {
    const root = ubridgeRoot();
    if (!root) return;
    const path = join(root, "output", "UBRIDE-CERT-001-events", "session.ubridge.json");
    if (!existsSync(path)) return;
    const { reports } = await readUbSessionFile(path, readFile);
    const text = JSON.stringify(reports);
    assert.ok(!text.includes("C:\\Users") && !text.includes("C:/Users"));
  });

  it("reads a real UB adapter profile", async () => {
    const root = ubridgeRoot();
    if (!root) return;
    const path = join(root, "profiles", "mpc-beats.adapter.json");
    if (!existsSync(path)) return;
    const text = await readFile(path, "utf8");
    const report = parseUbAdapter(text);
    assert.equal(report.capabilityId, "ub.device.profile");
    assert.equal(report.state, "available");
    assert.ok(report.metadata.schemaVersion);
  });

  it("rejects invalid session payloads", () => {
    assert.throws(() => parseUbSession("not json"), /invalid JSON/);
    assert.throws(() => parseUbSession("{}"), /session_id/);
    assert.throws(
      () => parseUbSession(JSON.stringify({ session_id: "x" })),
      /schema/,
    );
  });

  it("marks disabled write-back unavailable, honestly", () => {
    const { reports } = parseUbSession(
      JSON.stringify({ session_id: "s", schema: "ubridge-0.1/x", tracks: [] }),
    );
    const writeback = reports.find((r) => r.capabilityId === "ub.session.writeback");
    assert.equal(writeback.state, "unavailable");
    assert.equal(writeback.reasonCode, "WRITEBACK_DISABLED");
    assert.equal(writeback.retryable, true);
  });

  it("round-trips a synthetic session file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ub-session-"));
    try {
      const path = join(dir, "demo.ubridge.json");
      await writeFile(
        path,
        JSON.stringify({ session_id: "demo", schema: "ubridge-0.1/x", tracks: [{}, {}] }),
      );
      const { reports } = await readUbSessionFile(path, readFile);
      assert.equal(reports[0].metadata.trackCount, 2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("exposes its bridge version", () => {
    assert.equal(UB_SESSION_BRIDGE_VERSION, "1.0.0");
  });
});
