export type RackSignalRole =
  | 'player'
  | 'instrument'
  | 'effect'
  | 'mixer'
  | 'utility'
  | 'controller';

export type RackPortSignal = 'note' | 'audio' | 'cv' | 'gate';

export interface RackSignalModule {
  id: string;
  title: string;
  role: RackSignalRole;
  inputs: readonly RackPortSignal[];
  outputs: readonly RackPortSignal[];
  groupId?: string;
}

export interface RackSignalConnection {
  id: string;
  sourceModuleId: string;
  sourceTitle: string;
  destinationModuleId: string;
  destinationTitle: string;
  signal: RackPortSignal;
  mode: 'automatic_logical';
}

export interface RackSignalFlow {
  modules: readonly RackSignalModule[];
  connections: readonly RackSignalConnection[];
  unconnectedOutputCount: number;
  note: string;
}
