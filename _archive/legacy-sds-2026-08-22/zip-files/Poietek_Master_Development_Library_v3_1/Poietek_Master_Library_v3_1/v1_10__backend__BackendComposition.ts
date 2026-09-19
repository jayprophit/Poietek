import type { HostedBackend } from "./BackendServices";

export interface OptionalPlatformServices {
  webHostingProvider?: "firebase" | "other";
  pushMessaging?: "firebase-cloud-messaging" | "native" | "none";
  remoteConfig?: "firebase" | "local" | "other";
  crashDiagnostics?: "firebase" | "sentry" | "native" | "none";
}

export interface BackendComposition {
  canonicalBackend: HostedBackend | null;
  platformServices: OptionalPlatformServices;
}

/**
 * Recommended prototype composition:
 * - local project/media remains canonical for creative work.
 * - Supabase is the canonical hosted account/database/realtime backend.
 * - Firebase may host the web build and provide optional non-overlapping services.
 * - Never dual-write canonical project records to Supabase and Firestore merely
 *   "for redundancy"; use an explicit migration/export adapter instead.
 */
export function composePrototypeBackend(
  supabaseBackend: HostedBackend | null,
): BackendComposition {
  return {
    canonicalBackend: supabaseBackend,
    platformServices: {
      webHostingProvider: "firebase",
      pushMessaging: "firebase-cloud-messaging",
      remoteConfig: "firebase",
      crashDiagnostics: "none"
    }
  };
}
