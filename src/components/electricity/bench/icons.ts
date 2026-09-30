import { useSyncExternalStore } from 'react';
import type { PartKind } from '../engine/circuit';

/**
 * Kho icon hộp đồ nghề. Icon được chụp từ chính mô hình 3D (IconBaker trong chunk bàn 3D) một lần mỗi phiên;
 * file này không import three để Workshop dùng được mà không kéo cả renderer vào chunk chính.
 */
export type PartIcons = Partial<Record<PartKind, string>>;
let icons: PartIcons | null = null;
const listeners = new Set<() => void>();

export function setPartIcons(next: PartIcons) { icons = next; listeners.forEach(f => f()); }
export function getPartIcons() { return icons; }
export function usePartIcons(): PartIcons | null {
    return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => icons, () => null);
}
