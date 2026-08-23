import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PoietekProject } from "../domain/types";
import { PoietekRuntime } from "../app/PoietekRuntime";

interface RuntimeContextValue {
  runtime: PoietekRuntime;
  project: PoietekProject | null;
  status: "starting" | "ready" | "error";
  error: string | null;
  refreshProject(): void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export function PoietekRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtime = useMemo(() => new PoietekRuntime(), []);
  const [project, setProject] = useState<PoietekProject | null>(null);
  const [status, setStatus] = useState<RuntimeContextValue["status"]>("starting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    runtime.initialize()
      .then((loaded) => {
        if (!active) return;
        setProject(loaded);
        setStatus("ready");
        // Native-first warm engine trigger: when running under native shell, perform
        // a best-effort CPU/memory warm-up to reduce first-audio/connect latency.
        try {
          // @ts-ignore
          if (typeof (window as any).__TAURI__ !== 'undefined') {
            // Best-effort invocation; do not block initialization on this.
            // @ts-ignore
            (window as any).__TAURI__.invoke('warm_native_engine', {}).then((result: any) => {
              // console.debug is intentionally minimal; developers can expand logging
              console.debug('warm_native_engine result', result);
            }).catch(() => {});
          }
        } catch (e) {}
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [runtime]);

  const value: RuntimeContextValue = {
    runtime,
    project,
    status,
    error,
    refreshProject() {
      try {
        setProject(runtime.getSession().getSnapshot());
      } catch {}
    },
  };

  return (
    <RuntimeContext.Provider value={value}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function usePoietekRuntime(): RuntimeContextValue {
  const value = useContext(RuntimeContext);
  if (!value) {
    throw new Error("usePoietekRuntime must be used inside PoietekRuntimeProvider.");
  }
  return value;
}

