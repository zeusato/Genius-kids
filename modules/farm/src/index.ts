/** Optional integration boundary. No host code imports this entry yet. */
export { default as FarmApp } from './FarmApp';
export { execute, advanceTime, createFarm, placementError } from './core/engine';
export { ASSETS, CROPS, RECIPES, ITEMS, QUESTS } from './core/catalog';
export { validateSnapshot, serializeBackup, parseBackup } from './core/validation';
export { LocalFarmGateway, LocalFarmRepository, openLocalFarm } from './adapters/local';
export type { FarmCommand, FarmGateway, FarmRepository, FarmSession, FarmState } from './core/types';
