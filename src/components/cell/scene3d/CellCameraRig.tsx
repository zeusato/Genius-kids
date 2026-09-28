import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { BodyRegistry, mergeApi, Scene3DApi, SimClock } from './core';
import { prefersReducedMotion } from './params';
import { playWhoosh } from '../../solar/sfx';

export type Framing = 'center' | 'left' | 'upper';

export interface CameraPose {
    position: THREE.Vector3;
    target: THREE.Vector3;
}

export interface CellViewSpec {
    home: [number, number, number];     // vị trí camera góc nhìn toàn tế bào (nhìn về gốc)
    introFrom: [number, number, number]; // cảnh lặn: bắt đầu từ ngoài xa, thấy cả mô
    radius: number;                      // bán kính tế bào (giới hạn zoom)
}

// Chuyến bay nội suy theo LOG khoảng cách: mỗi giây phóng to cùng một TỈ LỆ → cảm giác "lặn"
// đều như thước trượt Cell Size and Scale, thay vì lao vút rồi phanh gấp. Hướng nhìn slerp.
interface Flight {
    from: CameraPose;
    to: CameraPose;
    duration: number;
    t: number;
    ease: (x: number) => number;
    done: () => void;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// Cảnh lặn: khởi động chậm, lao nhanh ở giữa, hạ cánh rất êm
const easeDive = (x: number) => {
    const e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    return 1 - Math.pow(1 - e, 1.6);
};

const _o1 = new THREE.Vector3();
const _o2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _tgt = new THREE.Vector3();
const _pos = new THREE.Vector3();

function sampleFlight(f: Flight, t: number, outPos: THREE.Vector3, outTgt: THREE.Vector3) {
    const e = f.ease(t);
    outTgt.lerpVectors(f.from.target, f.to.target, e);
    _o1.subVectors(f.from.position, f.from.target);
    _o2.subVectors(f.to.position, f.to.target);
    const d1 = Math.max(_o1.length(), 1e-4), d2 = Math.max(_o2.length(), 1e-4);
    _o1.divideScalar(d1);
    _o2.divideScalar(d2);
    _q.setFromUnitVectors(_o1, _o2);
    const qi = new THREE.Quaternion().slerp(_q, e);
    const dir = _o1.clone().applyQuaternion(qi);
    const dist = Math.exp(Math.log(d1) + (Math.log(d2) - Math.log(d1)) * e);
    outPos.copy(outTgt).addScaledVector(dir, dist);
}

function flightDuration(from: CameraPose, to: CameraPose): number {
    const d1 = from.position.distanceTo(from.target), d2 = to.position.distanceTo(to.target);
    const zoom = Math.abs(Math.log(Math.max(d2, 1e-3) / Math.max(d1, 1e-3)));
    const move = from.target.distanceTo(to.target) / Math.max(Math.min(d1, d2), 0.5);
    return THREE.MathUtils.clamp(0.8 + zoom * 0.32 + move * 0.25, 0.9, 2.2);
}

interface CellCameraRigProps {
    focusedId: string | null;
    registry: React.MutableRefObject<BodyRegistry>;
    clock: SimClock;
    view: CellViewSpec;
    viewKey: string;               // đổi loại tế bào → bay về góc nhìn mới
    intro: boolean;
    onIntroEnd?: () => void;
    onFocusComplete: (id: string) => void;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    framing: Framing;
    idleOrbit?: boolean;
    homeScale?: number;            // thí nghiệm làm tế bào dài ra → lùi camera xa hơn
}

export const CellCameraRig: React.FC<CellCameraRigProps> = ({
    focusedId, registry, clock, view, viewKey, intro, onIntroEnd, onFocusComplete, apiRef, framing, idleOrbit = true, homeScale = 1
}) => {
    const controlsRef = useRef<CameraControls>(null);
    const flightRef = useRef<Flight | null>(null);
    const introRef = useRef(false);
    const lastInput = useRef(performance.now());
    const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
    const reduced = prefersReducedMotion();

    const currentPose = (): CameraPose => {
        const c = controlsRef.current!;
        const position = new THREE.Vector3(), target = new THREE.Vector3();
        c.getPosition(position);
        c.getTarget(target);
        return { position, target };
    };

    const homeScaleRef = useRef(homeScale);
    homeScaleRef.current = homeScale;
    // Màn dọc (điện thoại): góc nhìn ngang hẹp → lùi camera để cả tế bào lọt khung theo chiều ngang
    const size = useThree((s) => s.size);
    const aspectScale = (a: number) => (a < 1.35 ? THREE.MathUtils.clamp(1.35 / a, 1, 2.3) : 1);
    const homePose = (): CameraPose => ({
        position: new THREE.Vector3(...view.home).multiplyScalar(homeScaleRef.current * aspectScale(camera.aspect)),
        target: new THREE.Vector3(0, 0, 0)
    });

    const startFlight = (to: CameraPose, done: () => void, opts: { duration?: number; from?: CameraPose; ease?: (x: number) => number; sound?: boolean } = {}) => {
        const c = controlsRef.current;
        if (!c) return;
        const from = opts.from ?? currentPose();
        c.setFocalOffset(0, 0, 0, true);
        c.enabled = false;
        if (opts.sound !== false && !reduced) playWhoosh();
        flightRef.current = {
            from,
            to,
            duration: reduced ? 0.01 : (opts.duration ?? flightDuration(from, to)),
            t: 0,
            ease: opts.ease ?? easeInOut,
            done: () => {
                c.enabled = true;
                done();
            }
        };
    };

    // API cho page
    useEffect(() => {
        mergeApi(apiRef, {
            zoomIn: () => controlsRef.current?.dolly(Math.max(0.3, (controlsRef.current?.distance ?? 4) * 0.3), true),
            zoomOut: () => controlsRef.current?.dolly(-Math.max(0.3, (controlsRef.current?.distance ?? 4) * 0.4), true),
            skipIntro: () => {
                if (introRef.current && flightRef.current) flightRef.current.t = 1;
            },
            viewDistance: () => controlsRef.current?.distance ?? 10,
            fovDeg: () => camera.fov
        });
    }, [apiRef, camera]);

    // Theo dõi thao tác của bé (để biết khi nào "ngồi yên" → camera tự xoay chầm chậm)
    useEffect(() => {
        const c = controlsRef.current;
        if (!c) return;
        const mark = () => { lastInput.current = performance.now(); };
        c.addEventListener('controlstart', mark);
        c.addEventListener('control', mark);
        return () => {
            c.removeEventListener('controlstart', mark);
            c.removeEventListener('control', mark);
        };
    }, []);

    // Đổi tế bào / cảnh lặn
    const prevView = useRef<string | null>(null);
    useEffect(() => {
        const c = controlsRef.current;
        if (!c) return;
        c.minDistance = 0.3;
        const viewChanged = prevView.current !== viewKey;
        prevView.current = viewKey;
        if (!intro && !viewChanged) return; // cảnh lặn vừa kết thúc: camera đã ở góc nhìn toàn cảnh
        if (intro) {
            introRef.current = true;
            c.maxDistance = 90;
            const from: CameraPose = { position: new THREE.Vector3(...view.introFrom), target: new THREE.Vector3(0, 0, 0) };
            c.setLookAt(...from.position.toArray(), 0, 0, 0, false);
            startFlight(homePose(), () => {
                introRef.current = false;
                c.maxDistance = view.radius * 9 * aspectScale(camera.aspect);
                onIntroEnd?.();
            }, { from, duration: 6.4, ease: easeDive, sound: false });
        } else {
            introRef.current = false;
            c.maxDistance = view.radius * 9 * aspectScale(camera.aspect);
            startFlight(homePose(), () => { }, { sound: false, duration: 1.2 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewKey, intro]);

    // Chọn / bỏ chọn bào quan
    const firstRun = useRef(true);
    useEffect(() => {
        const c = controlsRef.current;
        if (!c) return;
        if (firstRun.current) {
            firstRun.current = false;
            if (!focusedId) return;
        }
        if (introRef.current && flightRef.current) flightRef.current.t = 1; // chọn giữa cảnh lặn → kết thúc ngay
        let cancelled = false;
        if (focusedId) {
            const entry = registry.current[focusedId];
            if (!entry) { onFocusComplete(focusedId); return; }
            const target = new THREE.Vector3();
            entry.object.getWorldPosition(target);
            const cur = currentPose();
            // giữ hướng nhìn hiện tại (bé quen hướng đó), nâng nhẹ lên để thấy khối
            const dir = cur.position.clone().sub(target);
            if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
            dir.normalize();
            dir.y += 0.28;
            dir.normalize();
            const dist = entry.shell ? entry.radius * 2.35 : THREE.MathUtils.clamp(entry.radius * 3.2, 0.55, 9);
            const to: CameraPose = { position: target.clone().addScaledVector(dir, dist), target };
            startFlight(to, () => {
                if (cancelled) return;
                applyFraming(c, to, framing, camera);
                onFocusComplete(focusedId);
            });
        } else if (!introRef.current) {
            startFlight(homePose(), () => { });
        }
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    // Xoay/đổi cỡ màn hình khi đang ở góc nhìn toàn cảnh → về góc nhìn toàn cảnh hợp tỉ lệ mới
    const lastAspect = useRef(size.width / Math.max(size.height, 1));
    useEffect(() => {
        const a = size.width / Math.max(size.height, 1);
        const changed = Math.abs(aspectScale(a) - aspectScale(lastAspect.current)) > 0.05;
        lastAspect.current = a;
        const c = controlsRef.current;
        if (!changed || !c || introRef.current || focusedId || flightRef.current) return;
        c.maxDistance = Math.max(c.maxDistance, view.radius * 9 * aspectScale(a));
        startFlight(homePose(), () => { }, { duration: 0.8, sound: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.width, size.height]);

    // Bật/tắt thí nghiệm (tế bào dài ra) → bay tới góc nhìn toàn cảnh xa/gần tương ứng
    const firstScale = useRef(true);
    useEffect(() => {
        if (firstScale.current) { firstScale.current = false; return; }
        const c = controlsRef.current;
        if (!c || introRef.current || focusedId) return;
        c.maxDistance = Math.max(c.maxDistance, view.radius * 9 * homeScale);
        startFlight(homePose(), () => { }, { duration: 1.1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeScale]);

    // Xoay màn hình (dọc ↔ ngang) lúc đang xem một bào quan → chỉnh lại khung
    useEffect(() => {
        const c = controlsRef.current;
        if (!c || !focusedId || flightRef.current) return;
        applyFraming(c, currentPose(), framing, camera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [framing]);

    useFrame((_, delta) => {
        const c = controlsRef.current;
        if (!c) return;
        const f = flightRef.current;
        if (f) {
            f.t = Math.min(1, f.t + Math.min(delta, 0.1) / f.duration);
            sampleFlight(f, f.t, _pos, _tgt);
            c.setLookAt(_pos.x, _pos.y, _pos.z, _tgt.x, _tgt.y, _tgt.z, false);
            if (f.t >= 1) {
                flightRef.current = null;
                f.done();
            }
            return;
        }
        // Ngồi yên 9 giây ở góc nhìn toàn cảnh → tự xoay rất chậm (cảnh "thở", mời bé chạm)
        if (idleOrbit && !focusedId && !reduced && performance.now() - lastInput.current > 9000) {
            c.rotate(delta * 0.05, 0, false);
        }
    }, -0.5);

    // Bé dừng chuyển động sinh học khi camera đang bay (mục tiêu đứng yên)
    useFrame(() => {
        clock.timeScale = flightRef.current && !introRef.current ? 0 : 1;
    }, -0.9);

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            smoothTime={0.45}
            draggingSmoothTime={0.12}
            minDistance={0.3}
            maxDistance={view.radius * 9}
        />
    );
};

// Dịch khung hình (focal offset) để bào quan nằm bên trái (màn ngang, thẻ ở phải) hoặc phía trên
// (màn dọc, thẻ ở dưới) — camera vẫn xoay quanh đúng tâm bào quan.
// Đo thực tế (solar): offset Y dương đẩy mục tiêu LÊN, offset X dương đẩy sang TRÁI.
function applyFraming(c: CameraControls, pose: CameraPose, framing: Framing, camera: THREE.PerspectiveCamera) {
    if (framing === 'center') {
        c.setFocalOffset(0, 0, 0, true);
        return;
    }
    const dist = pose.position.distanceTo(pose.target);
    const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (framing === 'upper') c.setFocalOffset(0, halfH * 0.42, 0, true);
    else c.setFocalOffset(halfH * camera.aspect * 0.36, 0, 0, true);
}
