import type { AssetId, CropId, ItemId, RecipeId, Speedup, Stats } from './catalog';
import type { World } from './world';
export type Rotation = 0 | 1 | 2 | 3;
export type Plot = {
    id: string;
    x: number;
    z: number;
    crop?: CropId;
    plantedAt?: number;
    readyAt?: number;
    watered?: boolean;
};
export type ProductionJob = {
    id: string;
    recipe: RecipeId;
    startedAt: number;
    readyAt: number;
    duration: number;
    output: ItemId;
    quantity: number;
    xp: number;
    inputs: Partial<Record<ItemId, number>>;
};
export type Construction = {
    id: string;
    target: number;
    duration: number;
    startedAt: number;
    readyAt: number;
    waitingFor?: string;
    newBuilding?: boolean;
    cost: {
        coins: number;
        items: Partial<Record<ItemId, number>>;
    };
};
export type Entity = {
    id: string;
    asset: AssetId;
    x: number;
    z: number;
    rotation: Rotation;
    level: number;
    legacy?: boolean;
    job?: ProductionJob;
    queue: ProductionJob[];
    output: Partial<Record<ItemId, number>>;
    construction?: Construction;
    stored?: boolean;
};
export type FarmState = {
    schema: 2;
    contentVersion: 3;
    economy: 'local-unverified';
    revision: number;
    coins: number;
    xp: number;
    clock: number;
    lastWallTime: number;
    nextId: number;
    expansion: number;
    inventory: Record<ItemId, number>;
    plots: Plot[];
    entities: Entity[];
    stats: Stats;
    claimed: string[];
    orderIndex: number;
    world: World;
    legacyPlotCap: number;
    legacyStorageCap: number;
    migrationNotes: string[];
    speedups: Record<Speedup, number>;
    produced: Partial<Record<ItemId, number>>;
    discovered: ItemId[];
    market: {
        epoch: number;
        bought: Partial<Record<ItemId, number>>;
    };
    receipts: {
        id: string;
        payload: string;
    }[];
    reserve: Partial<Record<ItemId, number>>;
    gather?: {
        item: 'wood' | 'stone';
        readyAt: number;
    };
    undo?: {
        entityId: string;
        x: number;
        z: number;
        rotation: Rotation;
    };
    contract: {
        stage: number;
        round: number;
    };
    fishing: {
        round: number;
        best: number;
        rewardedEpoch: number;
    };
};
export type FarmAction = {
    type: 'specialize';
    profession: 'food' | 'materials' | 'craft';
} | {
    type: 'project';
    stage: number;
} | {
    type: 'irrigation';
    rotations: number[];
    epoch: number;
} | {
    type: 'plant';
    plotId: string;
    crop: CropId;
} | {
    type: 'water' | 'harvest';
    plotId: string;
} | {
    type: 'batch';
    action: 'plant' | 'water' | 'harvest';
    plotIds: string[];
    crop: CropId;
    expectedRevision: number;
} | {
    type: 'sell';
    item: ItemId;
    quantity: number;
} | {
    type: 'reserve';
    item: ItemId;
    quantity: number;
} | {
    type: 'produce';
    entityId: string;
    recipe: RecipeId;
    quantity?: number;
} | {
    type: 'collect' | 'upgrade' | 'cancel-upgrade' | 'cancel-queue' | 'store';
    entityId: string;
} | {
    type: 'build';
    asset: AssetId;
    x: number;
    z: number;
    rotation: Rotation;
} | {
    type: 'move';
    entityId: string;
    x: number;
    z: number;
    rotation: Rotation;
} | {
    type: 'undo';
} | {
    type: 'claim';
    questId: string;
} | {
    type: 'chapter';
    chapter: number;
} | {
    type: 'deliver' | 'skip-order' | 'contract';
} | {
    type: 'expand';
    chunk?: number;
} | {
    type: 'dig';
    x: number;
    z: number;
} | {
    type: 'help-seeds';
} | {
    type: 'gather';
    item: 'wood' | 'stone';
} | {
    type: 'collect-gather';
} | {
    type: 'clear';
    obstacleId: string;
    pay: 'coins' | 'tools';
} | {
    type: 'collect-obstacle';
    obstacleId: string;
} | {
    type: 'bridge';
    bridgeId: string;
} | {
    type: 'buy';
    item: ItemId;
    quantity: number;
    epoch: number;
} | {
    type: 'speedup';
    targetId: string;
    minutes: Speedup;
} | {
    type: 'fish';
    moves: number[];
    round: number;
};
export type FarmCommand = FarmAction & {
    requestId?: string;
};
export type CommandResult = {
    ok: boolean;
    state: FarmState;
    message: string;
};
export interface FarmRepository {
    load(): Promise<FarmState | null>;
    save(next: FarmState, expectedRevision: number | null, reason?: 'command' | 'checkpoint' | 'import'): Promise<void>;
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
    exportOriginal?(): Promise<string | null>;
    close(): Promise<void>;
}
