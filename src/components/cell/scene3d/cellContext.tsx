import React, { createContext, useContext, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { BodyRegistry, focusStateOf, FocusState, SimClock } from './core';
import type { QualityTier } from './params';

// Trạng thái thí nghiệm — object mutable (UI ghi target, scene tween value mỗi frame, không re-render)
export interface TimelineState {
    t: number;        // 0..1
    playing: boolean;
}

export interface CellExperiments {
    water: { value: number; target: number }; // thực vật: 0 = khô héo, 1 = căng nước
    mitosis: TimelineState;                   // động vật: phân chia tế bào
    fission: TimelineState;                   // vi khuẩn: nhân đôi
}

export function createExperiments(): CellExperiments {
    return { water: { value: 1, target: 1 }, mitosis: { t: 0, playing: false }, fission: { t: 0, playing: false } };
}

// Ngữ cảnh chung cho mọi bào quan trong một tế bào (tránh truyền props qua nhiều tầng).
// Provider nằm TRONG Canvas (context React không tự đi qua ranh giới reconciler của R3F).
export interface CellSceneCtx {
    experiments: CellExperiments;
    tier: QualityTier;
    focusedId: string | null;
    working: string | null;      // bào quan camera đã bay tới → đang "biểu diễn công việc"
    onSelect: (id: string) => void;
    registry: React.MutableRefObject<BodyRegistry>;
    clock: SimClock;
    interactive: boolean;        // false trong cảnh lặn (chưa cho chạm)
}

export const CellCtx = createContext<CellSceneCtx | null>(null);

export function useCellCtx(): CellSceneCtx {
    const ctx = useContext(CellCtx);
    if (!ctx) throw new Error('useCellCtx phải nằm trong <CellCtx.Provider>');
    return ctx;
}

export function useFocus(id: string | string[]): FocusState {
    const { focusedId } = useCellCtx();
    return focusStateOf(id, focusedId);
}

// Đăng ký điểm neo của bào quan vào registry (camera bay tới + nhãn đặt ở đâu)
export function useRegister(
    id: string | null,        // null = không đăng ký (bản sao, ví dụ vùng nhân vừa nhân đôi)
    object: React.RefObject<THREE.Object3D | null>,
    radius: number,
    label?: React.RefObject<THREE.Object3D | null>,
    shell = false
): void {
    const { registry } = useCellCtx();
    useEffect(() => {
        const o = object.current;
        if (!o || !id) return;
        registry.current[id] = { object: o, radius, label: label?.current ?? undefined, shell };
        return () => {
            if (registry.current[id]?.object === o) delete registry.current[id];
        };
    }, [id, object, radius, label, shell, registry]);
}

// Handler chạm chuẩn cho mesh bào quan: chặn lan truyền, đổi con trỏ
export function useSelectHandlers(id: string) {
    const { onSelect, interactive } = useCellCtx();
    return useMemo(() => ({
        onClick: (e: ThreeEvent<MouseEvent>) => {
            if (!interactive) return;
            e.stopPropagation();
            onSelect(id);
        },
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
            if (!interactive) return;
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
        },
        onPointerOut: () => {
            document.body.style.cursor = 'default';
        }
    }), [id, onSelect, interactive]);
}

export const CellCtxProvider: React.FC<{ value: CellSceneCtx; children: React.ReactNode }> = ({ value, children }) => (
    <CellCtx.Provider value={value}>{children}</CellCtx.Provider>
);
