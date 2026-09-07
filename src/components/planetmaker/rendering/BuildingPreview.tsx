import React, { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Building, heightAt, placement, Region } from '../engine/region';
import { buildingInstances, Shape } from './architecture';
import { Batch } from './Instances';
export type Draft = Omit<Building, 'id' | 'foundation'> & { movingId?: string };
export function BuildingPreview({ region, draft, ground, onChange, onDragState }: { region: Region; draft: Draft; ground: React.RefObject<THREE.Group>; onChange: (draft: Draft) => void; onDragState: (dragging: boolean) => void }) {
    const { gl, camera, controls, invalidate } = useThree();
    const latest = useRef({ draft, onChange, onDragState }); latest.current = { draft, onChange, onDragState };
    const drag = useRef<{ pointer: number; original: Draft; dx: number; dz: number; sx: number; sy: number; moved: boolean; inside: boolean; controlsEnabled: boolean } | null>(null);
    const ray = useMemo(() => new THREE.Raycaster(), []), ndc = useMemo(() => new THREE.Vector2(), []);
    const hitGround = (x: number, y: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom || !ground.current || document.elementFromPoint(x, y) !== gl.domElement) return null;
        ndc.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1); ray.setFromCamera(ndc, camera);
        return ray.intersectObjects(ground.current.children, true)[0]?.point || null;
    };
    const finish = (cancel: boolean, restore = true) => {
        const active = drag.current; if (!active) return; drag.current = null;
        if (restore && (cancel || !active.inside || !active.moved)) latest.current.onChange(active.original);
        if (controls) (controls as any).enabled = active.controlsEnabled;
        if (gl.domElement.hasPointerCapture(active.pointer)) gl.domElement.releasePointerCapture(active.pointer);
        latest.current.onDragState(false); invalidate();
    };
    useEffect(() => {
        const move = (e: PointerEvent) => {
            const active = drag.current; if (!active || e.pointerId !== active.pointer) return;
            if (Math.hypot(e.clientX - active.sx, e.clientY - active.sy) < 4 && !active.moved) return;
            active.moved = true; const p = hitGround(e.clientX, e.clientY); active.inside = !!p;
            if (p) { const x = Math.round(p.x + 32 - active.dx), z = Math.round(p.z + 32 - active.dz); latest.current.onChange({ ...latest.current.draft, x, z }); invalidate(); }
        };
        const up = (e: PointerEvent) => { if (e.pointerId === drag.current?.pointer) { drag.current.inside = !!hitGround(e.clientX, e.clientY); finish(e.type === 'pointercancel'); } };
        const secondPointer = (e: PointerEvent) => { if (drag.current && e.pointerId !== drag.current.pointer) finish(true); };
        const blur = () => finish(true);
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); window.addEventListener('pointerdown', secondPointer, true); window.addEventListener('blur', blur);
        return () => { finish(true, false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('pointerdown', secondPointer, true); window.removeEventListener('blur', blur); };
    }, [gl, camera, controls, ground]);
    const down = (e: ThreeEvent<PointerEvent>) => {
        if (e.button !== 0 || drag.current || e.pointerType === 'touch' && !e.isPrimary) return; e.stopPropagation();
        const p = hitGround(e.clientX, e.clientY); if (!p) return;
        const d = latest.current.draft;
        drag.current = { pointer: e.pointerId, original: { ...d }, dx: p.x + 32 - d.x, dz: p.z + 32 - d.z, sx: e.clientX, sy: e.clientY, moved: false, inside: true, controlsEnabled: controls ? (controls as any).enabled : true };
        if (controls) (controls as any).enabled = false;
        gl.domElement.setPointerCapture(e.pointerId); latest.current.onDragState(true);
    };
    const check = placement(region, draft.type, draft.x, draft.z, draft.yaw, draft.movingId);
    const parts = useMemo(() => buildingInstances({ ...draft, id: 'preview', foundation: check.ok ? check.foundation : heightAt(region, draft.x, draft.z) }), [draft, region, check.foundation, check.ok]);
    return <group>{Object.entries(parts).map(([shape, items]) => <Batch key={shape} shape={shape as Shape} items={items} opacity={.72} tint={check.ok ? undefined : '#e87879'} onDown={down} />)}</group>;
}
