import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BodyRegistry, Scene3DApi, mergeApi } from './core';
import { SUN_RADIUS } from './scale';

export interface StormState {
    startedAt: number | null; // thời điểm (giây, đồng hồ R3F) bắt đầu phun; null = không có bão
}

interface SolarStormProps {
    registry: React.MutableRefObject<BodyRegistry>;
    storm: React.MutableRefObject<StormState>;
    aurora: React.MutableRefObject<number>; // 0..1 — EarthSurface đọc để vẽ cực quang
    apiRef: React.MutableRefObject<Scene3DApi | null>;
}

const COUNT = 700;
const TRAVEL = 4.2;   // giây bay từ Mặt Trời tới Trái Đất (thật ra 1–3 ngày!)
const AURORA_HOLD = 9;

// Bão Mặt Trời (phun trào vành nhật hoa — CME): đám hạt tích điện phụt ra từ Mặt Trời, bay về phía
// Trái Đất, bị từ trường dẫn về hai cực → CỰC QUANG bừng sáng. Không nhấp nháy mạnh (an toàn cho
// trẻ nhạy cảm ánh sáng) — chỉ sáng dần rồi tắt dần.
export const SolarStorm: React.FC<SolarStormProps> = ({ registry, storm, aurora, apiRef }) => {
    const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
    const r3fClock = useThree((s) => s.clock);
    useEffect(() => {
        mergeApi(apiRef, {
            triggerStorm: () => {
                if (storm.current.startedAt === null) storm.current.startedAt = r3fClock.elapsedTime;
            }
        });
    }, [apiRef, storm, r3fClock]);
    const size = useThree((s) => s.size);
    const dpr = useThree((s) => s.viewport.dpr);
    const pointsRef = useRef<THREE.Points>(null);
    const earth = useMemo(() => new THREE.Vector3(), []);

    const { geo, mat } = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const seed = new Float32Array(COUNT * 4);
        for (let i = 0; i < COUNT; i++) {
            seed.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()], i * 4);
        }
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
        g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
        const m = new THREE.ShaderMaterial({
            uniforms: {
                uProgress: { value: 0 },
                uTarget: { value: new THREE.Vector3(1, 0, 0) },
                uScale: { value: 500 },
                uSunR: { value: SUN_RADIUS }
            },
            vertexShader: /* glsl */`
                attribute vec4 aSeed;
                uniform float uProgress;
                uniform vec3 uTarget;
                uniform float uScale;
                uniform float uSunR;
                varying float vA;
                void main() {
                    // mỗi hạt xuất phát lệch nhau một chút (aSeed.w) → đám mây kéo dài thành luồng
                    float p = clamp(uProgress * 1.25 - aSeed.w * 0.25, 0.0, 1.0);
                    vec3 dir = normalize(uTarget);
                    vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
                    vec3 up = cross(side, dir);
                    float along = mix(uSunR, length(uTarget), p);
                    // đám mây nở rộng khi bay xa, hội tụ lại khi tới gần Trái Đất (từ trường "hút")
                    float spread = (0.4 + along * 0.12) * (1.0 - smoothstep(0.8, 1.0, p) * 0.85);
                    vec3 pos = dir * along + (side * aSeed.x + up * aSeed.y * 0.6) * spread;
                    vA = (p > 0.0 && p < 1.0 ? 1.0 : 0.0) * (1.0 - p * 0.4);
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = clamp(0.12 * uScale / -mv.z, 1.0, 24.0);
                }
            `,
            fragmentShader: /* glsl */`
                varying float vA;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    float a = smoothstep(0.5, 0.0, d) * vA;
                    gl_FragColor = vec4(vec3(1.0, 0.72, 0.35) * a * 0.9, 1.0);
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        return { geo: g, mat: m };
    }, []);

    useFrame(({ clock }) => {
        const s = storm.current;
        const pts = pointsRef.current;
        if (!pts) return;
        if (s.startedAt === null) {
            pts.visible = false;
            aurora.current = Math.max(0, aurora.current - 0.01);
            return;
        }
        const elapsed = clock.elapsedTime - s.startedAt;
        const entry = registry.current.earth;
        if (entry) entry.object.getWorldPosition(earth);
        mat.uniforms.uTarget.value.copy(earth);
        mat.uniforms.uProgress.value = Math.min(1, elapsed / TRAVEL);
        mat.uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        pts.visible = elapsed < TRAVEL * 1.3;

        // cực quang: bừng lên khi hạt tới nơi, giữ một lúc rồi tắt dần
        const since = elapsed - TRAVEL * 0.95;
        let a = 0;
        if (since > 0) a = since < 1.5 ? since / 1.5 : since < 1.5 + AURORA_HOLD ? 1 : Math.max(0, 1 - (since - 1.5 - AURORA_HOLD) / 3);
        aurora.current = a;
        if (since > 1.5 + AURORA_HOLD + 3) s.startedAt = null;
    });

    return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} renderOrder={3} visible={false} />;
};
