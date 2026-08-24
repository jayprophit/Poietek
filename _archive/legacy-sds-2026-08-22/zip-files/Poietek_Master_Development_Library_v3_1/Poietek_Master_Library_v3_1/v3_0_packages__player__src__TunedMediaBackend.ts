export interface TunedPlaybackRequest {
  mediaId: string;
  sourceAssetId: string;
  sourceReferenceHz: number;
  targetReferenceHz: number;
  mediaType: "audio" | "video";
  preserveTempo: true;
  preserveDuration: true;
  quality: "realtime_preview" | "high_quality" | "creator_rendered";
}

export interface TunedPlaybackSession {
  sessionId: string;
  sourceAssetId: string;
  targetReferenceHz: number;
  pitchShiftCents: number;
  durationSeconds: number;
}

export interface TunedMediaBackend {
  canRetune(request: TunedPlaybackRequest): Promise<boolean>;

  openTunedPlayback(
    request: TunedPlaybackRequest,
  ): Promise<TunedPlaybackSession>;

  close(sessionId: string): Promise<void>;

  /**
   * Popular/community variants can be rendered ahead of time for quality
   * and CDN efficiency. The result is a derivative rendition, never a
   * replacement for the creator original.
   */
  renderRendition?(
    request: TunedPlaybackRequest,
  ): Promise<{ assetId: string; contentHash: string }>;
}
