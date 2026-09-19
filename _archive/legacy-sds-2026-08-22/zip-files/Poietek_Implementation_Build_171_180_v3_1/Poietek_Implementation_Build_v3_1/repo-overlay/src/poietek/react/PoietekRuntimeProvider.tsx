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
