import type { AssetId, CropId, ItemId, RecipeId, Stats } from './catalog';
export type Rotation = 0 | 1 | 2 | 3;
export type Plot = { id: string; x: number; z: number; crop?: CropId; plantedAt?: number; readyAt?: number; watered?: boolean };
export type Entity = { id: string; asset: AssetId; x: number; z: number; rotation: Rotation; level: number; job?: { recipe: RecipeId; startedAt: number; readyAt: number } };
export type FarmState = {
  schema: 1; contentVersion: 1; economy: 'local-unverified'; revision: number;
  coins: number; xp: number; clock: number; lastWallTime: number; nextId: number;
  expansion: number; inventory: Record<ItemId, number>; plots: Plot[]; entities: Entity[];
  stats: Stats; claimed: string[]; orderIndex: number;
};
export type FarmCommand =
  | { type: 'plant'; plotId: string; crop: CropId }
  | { type: 'water'; plotId: string }
  | { type: 'harvest'; plotId: string }
  | { type: 'sell'; item: ItemId; quantity: number }
  | { type: 'produce'; entityId: string; recipe: RecipeId }
  | { type: 'collect'; entityId: string }
  | { type: 'build'; asset: AssetId; x: number; z: number; rotation: Rotation }
  | { type: 'move'; entityId: string; x: number; z: number; rotation: Rotation }
  | { type: 'upgrade'; entityId: string }
  | { type: 'claim'; questId: string }
  | { type: 'deliver' }
  | { type: 'expand' }
  | { type: 'dig'; x: number; z: number }
  | { type: 'help-seeds' };
export type CommandResult = { ok: true; state: FarmState; message: string } | { ok: false; state: FarmState; message: string };
/** Server adapters must validate commands; importing this local state never grants trading eligibility. */
export interface FarmRepository {
  load(): Promise<FarmState | null>;
  save(next: FarmState, expectedRevision: number | null): Promise<void>;
  close?(): Promise<void>;
}
export interface FarmGateway {
  readonly mode: 'local' | 'online';
  execute(command: FarmCommand): Promise<CommandResult>;
  getSnapshot(): FarmState;
}
export interface FarmSession extends FarmGateway {
  checkpoint(): Promise<void>;
  importSnapshot(imported: FarmState): Promise<void>;
  close(): Promise<void>;
}
