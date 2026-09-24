import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabelRegistry } from './core';
import { SUN_RADIUS } from './scale';

interface LabelDeclutterProps {
    labels: React.MutableRefObject<LabelRegistry>;
    focusedId: string | null;
    hideAll?: boolean; // cảnh mở màn / chế độ Tới nơi
}

interface Placed { x0: number; y0: number; x1: number; y1: number }

// Ẩn nhãn Html khi:
//  1. hành tinh nằm SAU Mặt Trời nhìn từ camera (tia camera→nhãn cắt quả cầu Mặt Trời)
//  2. hành tinh đang được focus (nhãn lơ lửng trên đầu hành tinh to đùng thì thừa)
//  3. nhãn đè lên nhãn của thiên thể GẦN camera hơn — trước đây nhãn đè "cướp" cú chạm
//     (chạm Sao Thổ ra Sao Mộc)
// Chạy mỗi frame nhưng chỉ ghi style khi trạng thái đổi — không setState.
export const LabelDeclutter: React.FC<LabelDeclutterProps> = ({ labels, focusedId, hideAll = false }) => {
    const tmp = useMemo(() => ({
        world: new THREE.Vector3(),
        ndc: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        state: new Map<string, boolean>()
    }), []);

    useFrame(({ camera, size }) => {
        const entries = [...labels.current.values()].map((entry) => {
            entry.anchor.getWorldPosition(tmp.world);
            tmp.world.y += entry.offsetY;
            return { entry, pos: tmp.world.clone(), dist: tmp.world.distanceTo(camera.position) };
        });
        entries.sort((a, b) => a.dist - b.dist);

        const placed: Placed[] = [];
        const occR = SUN_RADIUS * 1.05;
        for (const { entry, pos, dist } of entries) {
            const el = entry.el.current;
            if (!el) continue;
            let visible = !hideAll && entry.id !== focusedId;

            if (visible) {
                // tia từ camera tới nhãn có cắt Mặt Trời (tâm gốc) trước khi tới nhãn?
                tmp.dir.copy(pos).sub(camera.position).normalize();
                const tca = -camera.position.dot(tmp.dir); // khoảng cách tới điểm gần tâm nhất
                if (tca > 0 && tca < dist) {
                    const d2 = camera.position.lengthSq() - tca * tca;
                    if (d2 < occR * occR) visible = false;
                }
            }

            if (visible) {
                tmp.ndc.copy(pos).project(camera);
                if (tmp.ndc.z > 1) visible = false;
                const cx = (tmp.ndc.x * 0.5 + 0.5) * size.width;
                const cy = (-tmp.ndc.y * 0.5 + 0.5) * size.height;
                const w = (el.offsetWidth || 70) + 4;
                const h = (el.offsetHeight || 22) + 2;
                const rect = { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
                if (visible && placed.some((p) => rect.x0 < p.x1 && rect.x1 > p.x0 && rect.y0 < p.y1 && rect.y1 > p.y0)) {
                    visible = false;
                }
                if (visible) placed.push(rect);
            }

            if (tmp.state.get(entry.id) !== visible) {
                tmp.state.set(entry.id, visible);
                el.style.opacity = visible ? '1' : '0';
                el.style.pointerEvents = visible ? 'auto' : 'none';
            }
        }
    });

    return null;
};
