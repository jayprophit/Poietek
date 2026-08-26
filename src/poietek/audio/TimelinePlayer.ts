import type {PoietekProject} from '../domain/types';

export interface TimelinePlayer {
  play(
    project: PoietekProject,
    fromSeconds?: number,
  ): Promise<void>;

  pause(): Promise<void>;

  stop(): Promise<void>;

  seek(
    project: PoietekProject,
    seconds: number,
  ): Promise<void>;

  getPlayheadSeconds(): number;
}