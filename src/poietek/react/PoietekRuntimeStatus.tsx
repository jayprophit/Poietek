import React from "react";
import { usePoietekRuntime } from "./PoietekRuntimeProvider";

export function PoietekRuntimeStatus() {
  const { project, status, error } = usePoietekRuntime();

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 10000,
        maxWidth: 320,
        padding: "9px 11px",
        borderRadius: 10,
        background: "rgba(10,10,14,.92)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.15)",
        boxShadow: "0 8px 28px rgba(0,0,0,.35)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        pointerEvents: "none",
      }}
    >
      <strong>Poietek Local Runtime</strong>
      <div style={{ opacity: 0.8, marginTop: 2 }}>
        {status === "ready" && project
          ? `${project.title} · saved locally`
          : status === "error"
            ? `Error: ${error}`
            : "Starting local project store…"}
      </div>
    </div>
  );
}

