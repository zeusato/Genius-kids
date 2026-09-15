import type { DownloadProgress } from './download';

export const PWA_CHANNEL = 'genius-pwa-v1';
export type DownloadPhase = 'idle' | 'downloading' | 'paused' | 'complete' | 'error';
export interface DownloadState {
    phase: DownloadPhase;
    progress: DownloadProgress;
    error?: string;
}
export interface WorkerStatus {
    channel: typeof PWA_CHANNEL;
    version: string;
    core: DownloadState;
    offline: DownloadState;
}
export type WorkerCommand = 'STATUS' | 'DOWNLOAD_OFFLINE' | 'PAUSE_OFFLINE' | 'SKIP_WAITING';
export interface ReleaseInfo {
    version: string;
    builtAt: string;
    coreBytes: number;
    offlineBytes: number;
}
