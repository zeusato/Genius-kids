// Sân khấu nguyên tố: mẫu vật nhô ra khỏi ô DOM, bay ra giữa vùng sân khấu; kéo để xoay VẬT (camera đứng yên
// để ánh xạ px ↔ thế giới luôn đúng); véo/cuộn đổi tầng z ∈ [0,3] (mẫu vật → sắp xếp → nguyên tử → hạt nhân).
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { ElementFull } from '../engine/elements';
import type { ExperimentSpec } from '../../../data/periodic/experiments';
import type { QualityTier } from './params';
import { cellRect, pxToWorld, stageFrame, worldPerPx } from './screen';
import { FadeGroup, easeInOut } from './common';
import { Pedestal, Specimen } from './Specimens';
import { Arrangement, BohrAtom, Nucleus } from './AtomLevels';
import { Experiment, type Cue } from './Experiments';
import { CATEGORY_COLORS } from '../../../data/elementsData';

import type { StageLive } from './live';
export type { StageLive } from './live';

const BASE = 2.5;   // cỡ thế giới của mẫu vật ở scale 1

interface Props {
    el: ElementFull;
    tier: QualityTier;
    live: StageLive;
    closing: boolean;
    onClosed: () => void;
    experiment: ExperimentSpec | null;
    experimentPower: boolean;
    cloud: boolean;
    tempC: number;
    onCue: (c: Cue, power?: number) => void;
}

const layer = (k: number, live: StageLive) => () => {
    const d = live.zoomNow - k;
    return { vis: Math.max(0, 1 - Math.abs(d) * 1.6), scale: Math.min(6, Math.exp(d * 1.8)) };
};

export const ElementStage: React.FC<Props> = ({ el, tier, live, closing, onClosed, experiment, experimentPower, cloud, tempC, onCue }) => {
    const root = useRef<THREE.Group>(null), spin = useRef<THREE.Group>(null);
    const size = useThree(s => s.size);
    const anim = useRef({ t: 0, dir: 1, from: new THREE.Vector3(), fromS: 0.1, done: false });
    const expClock = useRef({ t: 0 });
    const color = CATEGORY_COLORS[el.category].color;
    // Tầng chỉ dựng khi sắp lặn tới (một chiều: đã dựng thì giữ) — mở nguyên tố nhanh, không tính hạt nhân/mây thừa.
    const [upTo, setUpTo] = useState(0);

    // mở: bắt đầu tại ô DOM
    useEffect(() => {
        const vp = { w: window.innerWidth, h: window.innerHeight };
        const r = cellRect(el.atomicNumber);
        const k = worldPerPx(vp);
        const a = anim.current;
        if (r) { pxToWorld(r.x, r.y, vp, a.from); a.fromS = (r.size * k) / BASE; }
        else { const f = stageFrame(vp); pxToWorld(f.cx, f.cy, vp, a.from); a.fromS = 0.05; }
        a.t = 0; a.dir = 1; a.done = false;
        live.zoom = 0; live.zoomNow = 0; live.rotY = 0; live.rotX = 0.15;
    }, [el.atomicNumber, live]);
    useEffect(() => { if (closing) { anim.current.dir = -1; anim.current.done = false; live.zoom = 0; } }, [closing, live]);

    const target = useRef(new THREE.Vector3());
    useFrame((st, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05);
        const a = anim.current;
        const vp = { w: size.width, h: size.height };
        const f = stageFrame(vp);
        pxToWorld(f.cx, f.cy, vp, target.current);
        const toS = (f.size * worldPerPx(vp)) / BASE;
        a.t = Math.min(1, Math.max(0, a.t + a.dir * dt / 0.75));
        if (a.dir < 0 && a.t <= 0 && !a.done) { a.done = true; onClosed(); }
        const e = easeInOut(a.t);
        const g = root.current;
        if (g) {
            g.position.lerpVectors(a.from, target.current, e);
            g.position.z = Math.sin(e * Math.PI) * 1.5;
            g.scale.setScalar(a.fromS + (toS - a.fromS) * e);
        }
        live.zoomNow += (live.zoom - live.zoomNow) * Math.min(1, dt * 5);
        if (Math.abs(live.zoom - live.zoomNow) < 0.002) live.zoomNow = live.zoom;
        if (spin.current) {
            if (!live.dragging && live.zoomNow < 0.5 && !experiment) live.rotY += dt * 0.35;   // thí nghiệm: đứng yên cho dễ nhìn
            const flip = (1 - e) * Math.PI * 1.2;       // lộn một vòng khi bay ra khỏi ô
            spin.current.rotation.y += (live.rotY + flip - spin.current.rotation.y) * Math.min(1, dt * 8);
            spin.current.rotation.x += (live.rotX - spin.current.rotation.x) * Math.min(1, dt * 8);
        }
        const need = Math.min(3, Math.ceil(live.zoomNow + 0.9));
        if (need > upTo) setUpTo(need);
        expClock.current.t = (performance.now() - live.expStart) / 1000;
        void st;
    });

    return (
        <group ref={root}>
            <group ref={spin}>
                <FadeGroup get={layer(0, live)}>
                    {experiment
                        ? <Experiment el={el} spec={experiment} tier={tier} clock={expClock.current} onCue={onCue} power={experimentPower} />
                        : <Specimen el={el} tier={tier} />}
                </FadeGroup>
                {upTo >= 1 && <FadeGroup get={layer(1, live)}><Arrangement el={el} tier={tier} tempC={tempC} /></FadeGroup>}
                {upTo >= 2 && <FadeGroup get={layer(2, live)}><BohrAtom el={el} tier={tier} cloud={cloud} /></FadeGroup>}
                {upTo >= 3 && <FadeGroup get={layer(3, live)}><Nucleus el={el} tier={tier} /></FadeGroup>}
            </group>
            <FadeGroup get={() => ({ vis: Math.max(0, 1 - live.zoomNow * 2), scale: 1 })}>
                <Pedestal color={color} tier={tier} />
            </FadeGroup>
        </group>
    );
};
