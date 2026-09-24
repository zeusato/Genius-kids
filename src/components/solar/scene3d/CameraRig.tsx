import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { SimClock, BodyRegistry, Scene3DApi, mergeApi } from './core';
import { HOME_CAMERA_POSITION, HOME_CAMERA_TARGET } from './scale';
import { azimuthOf, beltPose, CameraPose, FlightPlan, heroPose, planFlight, sunPose } from './orbit';
import { prefersReducedMotion } from './sceneParams';
import { playWhoosh } from '../sfx';

export type ArrivalFraming = 'center' | 'upper' | 'left';

interface CameraRigProps {
    focusedId: string | null;
    registry: React.MutableRefObject<BodyRegistry>;
    clock: SimClock;
    onFocusComplete: (id: string) => void;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    framing?: ArrivalFraming;       // tới nơi: đẩy hành tinh lên trên / sang trái để chừa chỗ cho thẻ
    intro?: boolean;                // cảnh bay mở màn từ ngoài Sao Hải Vương
    onIntroEnd?: () => void;
}

const HOME: CameraPose = {
    position: new THREE.Vector3(...HOME_CAMERA_POSITION),
    target: new THREE.Vector3(...HOME_CAMERA_TARGET)
};
const INTRO_START: CameraPose = {
    position: new THREE.Vector3(-46, 34, 175),
    target: new THREE.Vector3(0, -4, 0)
};

interface Flight {
    plan: FlightPlan;
    t: number;
    done: () => void;
}

// CameraControls (drei) đảm nhận cử chỉ của bé: 1 ngón xoay, 2 ngón pinch zoom + pan, wheel.
// Đường bay thì do rig TỰ lái (planFlight): thời lượng cố định ~1,3–2,2s, vòng cung trên mặt
// phẳng quỹ đạo, không bao giờ xuyên Mặt Trời (bản cũ dùng damping của camera-controls: 3–5s
// đuôi dài, đi thẳng — ~54% lượt tour chui qua Mặt Trời). Góc tới nơi đặt theo hướng Mặt Trời
// (heroPose) để luôn thấy ~80% đĩa sáng + lằn ranh ngày/đêm. timeScale=0 khi bay để mục tiêu đứng yên.
export const CameraRig: React.FC<CameraRigProps> = ({
    focusedId,
    registry,
    clock,
    onFocusComplete,
    apiRef,
    framing = 'center',
    intro = false,
    onIntroEnd
}) => {
    const controlsRef = useRef<CameraControls>(null);
    const flightRef = useRef<Flight | null>(null);
    const introRef = useRef(intro);
    const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
    const tmp = useRef({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() }).current;
    const reduced = prefersReducedMotion();

    const currentPose = (): CameraPose => {
        const controls = controlsRef.current!;
        const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
        controls.getPosition(pos);
        controls.getTarget(tgt);
        return { position: pos, target: tgt };
    };

    const startFlight = (to: CameraPose, onDone: () => void, opts: { duration?: number; from?: CameraPose; sound?: boolean } = {}) => {
        const controls = controlsRef.current;
        if (!controls) return;
        const from = opts.from ?? currentPose();
        controls.setFocalOffset(0, 0, 0, false);
        controls.enabled = false;
        if (opts.sound !== false) playWhoosh();
        flightRef.current = {
            plan: planFlight(from, to, { reducedMotion: reduced, duration: opts.duration }),
            t: 0,
            done: () => {
                controls.enabled = true;
                onDone();
            }
        };
    };

    // Expose zoom +/- (giữ song song với pinch) + bỏ qua cảnh mở màn
    useEffect(() => {
        mergeApi(apiRef, {
            zoomIn: () => controlsRef.current?.dolly(8, true),
            zoomOut: () => controlsRef.current?.dolly(-8, true),
            skipIntro: () => {
                if (!introRef.current || !flightRef.current) return;
                flightRef.current.t = 1; // nhảy tới cuối — frame sau gọi done()
            }
        });
    }, [apiRef]);

    // Cảnh mở màn: bắt đầu ở ngoài xa rồi lướt vào góc nhìn toàn hệ (~3,6s, chạm để bỏ qua)
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls || !introRef.current) return;
        controls.maxDistance = 400;
        controls.setLookAt(...INTRO_START.position.toArray(), ...INTRO_START.target.toArray(), false);
        startFlight(HOME, () => {
            introRef.current = false;
            controls.maxDistance = 140;
            onIntroEnd?.();
        }, { duration: 3.6, from: INTRO_START, sound: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const firstFocusRun = useRef(true);
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        if (firstFocusRun.current) {
            firstFocusRun.current = false;
            if (!focusedId) return; // lần mount đầu: camera đã ở góc nhìn toàn hệ (hoặc đang mở màn)
        }
        if (introRef.current && flightRef.current) {
            // bé chọn thiên thể ngay trong lúc mở màn → kết thúc mở màn ngay
            flightRef.current.t = 1;
        }
        let cancelled = false;

        if (focusedId) {
            // Dừng mô phỏng để mục tiêu đứng yên trong suốt chuyến bay
            clock.timeScale = 0;
            const cur = currentPose();
            let to: CameraPose;
            let radius = 1;

            if (focusedId === 'sun') {
                to = sunPose(cur.position);
                radius = 2.5;
            } else if (focusedId === 'asteroid-belt') {
                to = beltPose(azimuthOf(cur.position) - 0.25);
                radius = 0.4;
            } else {
                const entry = registry.current[focusedId];
                if (!entry) {
                    onFocusComplete(focusedId);
                    return;
                }
                const p = new THREE.Vector3();
                entry.object.getWorldPosition(p);
                radius = entry.radius;
                to = heroPose(p, entry.radius, {
                    currentCamera: cur.position,
                    ringNormal: entry.ringNormal,
                    // Trái Đất nghiêng về phía đêm hơn để lộ đèn thành phố ở lằn ranh
                    phaseDeg: focusedId === 'earth' ? 62 : 45
                });
            }

            startFlight(to, () => {
                if (cancelled) return;
                controls.minDistance = Math.max(radius * 1.6, 0.6);
                applyFraming(controls, to, framing, camera, focusedId === 'asteroid-belt');
                onFocusComplete(focusedId);
            });
        } else if (!introRef.current) {
            // Quay về góc nhìn toàn hệ (page tự khôi phục timeScale theo tốc độ UI)
            startFlight(HOME, () => {
                controls.minDistance = 6;
            });
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    // Đổi kiểu khung hình khi xoay màn hình (dọc ↔ ngang) lúc đang ở một hành tinh
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls || !focusedId || flightRef.current) return;
        applyFraming(controls, currentPose(), framing, camera, focusedId === 'asteroid-belt');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [framing]);

    // Lái camera theo đường bay — chạy trước CameraControls.update trong cùng frame
    useFrame((_, delta) => {
        const flight = flightRef.current;
        const controls = controlsRef.current;
        if (!flight || !controls) return;
        // kẹp delta 0,1s (như đồng hồ mô phỏng): máy yếu ~10–20fps vẫn bay đúng thời lượng,
        // chỉ khi tab bị ẩn lâu mới không nhảy cóc tới đích
        flight.t = Math.min(1, flight.t + Math.min(delta, 0.1) / flight.plan.duration);
        flight.plan.sample(flight.t, tmp.pos, tmp.tgt);
        controls.setLookAt(tmp.pos.x, tmp.pos.y, tmp.pos.z, tmp.tgt.x, tmp.tgt.y, tmp.tgt.z, false);
        if (flight.t >= 1) {
            flightRef.current = null;
            flight.done();
        }
    }, -0.5);

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            smoothTime={0.6}
            minDistance={6}
            maxDistance={140}
            maxPolarAngle={1.45}
        />
    );
};

// Dịch khung hình (focal offset) để hành tinh nằm phần trên (màn dọc) hoặc bên trái (màn ngang),
// chừa chỗ cho thẻ thông tin — camera vẫn xoay quanh đúng tâm hành tinh.
function applyFraming(controls: CameraControls, pose: CameraPose, framing: ArrivalFraming, camera: THREE.PerspectiveCamera, skip: boolean) {
    if (skip || framing === 'center') {
        controls.setFocalOffset(0, 0, 0, true);
        return;
    }
    const dist = pose.position.distanceTo(pose.target);
    const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // (đo thực tế trên màn hình: offset Y dương đẩy mục tiêu LÊN, offset X dương đẩy sang TRÁI)
    if (framing === 'upper') controls.setFocalOffset(0, halfH * 0.38, 0, true);
    else controls.setFocalOffset(halfH * camera.aspect * 0.4, 0, 0, true);
}
