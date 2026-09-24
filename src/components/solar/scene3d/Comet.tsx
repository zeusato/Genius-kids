import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { LOW_SPHERE, getGlowTexture, SimClock } from './core';
import { initialPhase } from './sceneParams';

interface CometProps {
    clock: SimClock;
    onSelect: (id: string) => void;
    quality?: 'high' | 'low';
}

// Quỹ đạo cực dẹt: cận nhật ~6, viễn nhật ~52 (units)
const A = 29, E = 0.793;
const B = A * Math.sqrt(1 - E * E);
const C = A * E;
const PERIOD = 48;
const OMEGA = (2 * Math.PI) / PERIOD;
const LIFE = 2.4; // tuổi thọ một hạt đuôi (giây mô phỏng)

function cometPoint(theta: number, out: THREE.Vector3) {
    // ngược chiều kim đồng hồ nhìn từ bắc — cùng chiều các hành tinh
    return out.set(Math.cos(theta) * A - C, Math.sin(theta + 0.5) * A * 0.12, -Math.sin(theta) * B);
}

// Sao chổi — nhân băng + coma + HAI đuôi bằng hạt, tính hoàn toàn trên GPU (CPU 0 việc/frame):
//  - đuôi ion (khí bị gió Mặt Trời thổi): xanh, thẳng, luôn chỉ RA XA Mặt Trời
//  - đuôi bụi: vàng nhạt, cong, trễ lại theo quỹ đạo
// Mỗi hạt tự suy ra thời điểm được phát ra → vị trí nhân lúc đó (công thức quỹ đạo) + vận tốc.
// Gần Mặt Trời thì băng bốc hơi mạnh → đuôi dài và sáng hơn (đúng vật lý).
export const Comet: React.FC<CometProps> = ({ clock, onSelect, quality = 'high' }) => {
    const groupRef = useRef<THREE.Group>(null);
    const comaRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const phase0 = useMemo(() => initialPhase('comet'), []);
    const size = useThree((s) => s.size);
    const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
    const dpr = useThree((s) => s.viewport.dpr);

    const orbitGeo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 200; i++) pts.push(cometPoint((i / 200) * Math.PI * 2, new THREE.Vector3()));
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, []);

    const count = quality === 'high' ? 520 : 220;
    const tail = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const slot = new Float32Array(count);
        const seed = new Float32Array(count * 3);
        const kind = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            slot[i] = i / count;
            seed[i * 3] = Math.random() * 2 - 1;
            seed[i * 3 + 1] = Math.random() * 2 - 1;
            seed[i * 3 + 2] = Math.random();
            kind[i] = i % 3 === 0 ? 1 : 0; // 1/3 bụi, 2/3 ion
        }
        // position giả (bắt buộc cho three) — vị trí thật tính trong vertex shader
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        geo.setAttribute('aSlot', new THREE.BufferAttribute(slot, 1));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
        geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uT: { value: 0 },
                uPhase0: { value: phase0 },
                uScale: { value: 500 },
                uIon: { value: new THREE.Color('#8fdcff') },
                uDust: { value: new THREE.Color('#ffe0a6') }
            },
            vertexShader: /* glsl */`
                uniform float uT;
                uniform float uPhase0;
                uniform float uScale;
                attribute float aSlot;
                attribute vec3 aSeed;
                attribute float aKind;
                varying float vFade;
                varying float vKind;
                const float A = ${A.toFixed(4)};
                const float B = ${B.toFixed(4)};
                const float C = ${C.toFixed(4)};
                const float OMEGA = ${OMEGA.toFixed(6)};
                const float LIFE = ${LIFE.toFixed(2)};
                vec3 cometAt(float th) { return vec3(cos(th) * A - C, sin(th + 0.5) * A * 0.12, -sin(th) * B); }
                void main() {
                    float age = mod(uT + aSlot * LIFE, LIFE);
                    float te = uT - age;
                    float th = uPhase0 + te * OMEGA;
                    vec3 p0 = cometAt(th);
                    float dist = length(p0);
                    float nearF = clamp((22.0 - dist) / 16.0, 0.0, 1.0);
                    vec3 away = normalize(p0);
                    vec3 vel = normalize(cometAt(th + 0.01) - p0); // hướng bay của nhân
                    float speed = 0.35 + nearF * 3.4;
                    vec3 dir = aKind > 0.5
                        ? normalize(away * 0.75 - vel * 0.55)   // bụi: cong, trễ lại sau quỹ đạo
                        : away;                                  // ion: thẳng theo gió Mặt Trời
                    vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + 1e-4);
                    vec3 up2 = normalize(cross(side, dir));
                    float spread = (aKind > 0.5 ? 0.22 : 0.07) * age;
                    vec3 pos = p0 + dir * speed * age * (0.8 + aSeed.z * 0.4)
                             + (side * aSeed.x + up2 * aSeed.y) * spread;
                    float life01 = age / LIFE;
                    vFade = (1.0 - life01) * (0.25 + nearF * 0.9);
                    vKind = aKind;
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mv;
                    float worldSize = (aKind > 0.5 ? 0.34 : 0.22) * (0.6 + life01 * 1.6);
                    gl_PointSize = clamp(worldSize * uScale / -mv.z, 1.0, 64.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform vec3 uIon;
                uniform vec3 uDust;
                varying float vFade;
                varying float vKind;
                void main() {
                    vec2 q = gl_PointCoord - 0.5;
                    float a = smoothstep(0.5, 0.0, length(q));
                    vec3 col = vKind > 0.5 ? uDust : uIon;
                    gl_FragColor = vec4(col * a * vFade * 0.55, 1.0);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        return { geo, mat };
    }, [count, phase0]);

    const tmp = useMemo(() => new THREE.Vector3(), []);

    useFrame(() => {
        const grp = groupRef.current;
        if (!grp) return;
        // t quấn theo chu kỳ để giữ độ chính xác float trên GPU
        const tWrapped = clock.t % PERIOD;
        cometPoint(phase0 + tWrapped * OMEGA, tmp);
        grp.position.copy(tmp);
        if (comaRef.current) {
            // vị trí cục bộ trong group: lùi về phía camera một đoạn > bán kính nhân
            comaRef.current.position.copy(camera.position).sub(tmp).setLength(0.18);
        }
        tail.mat.uniforms.uT.value = tWrapped;
        const fovRad = THREE.MathUtils.degToRad(camera.fov ?? 45);
        tail.mat.uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan(fovRad / 2));
    });

    return (
        <>
            <lineLoop geometry={orbitGeo}>
                <lineBasicMaterial color="#7fd8ff" transparent opacity={0.12} />
            </lineLoop>

            <points geometry={tail.geo} material={tail.mat} frustumCulled={false} renderOrder={3} />

            <group ref={groupRef}>
                {/* Nhân: băng bẩn trộn bụi — thật ra đen như than, chỉ sáng nhờ coma bao quanh */}
                <mesh geometry={LOW_SPHERE} scale={0.1}>
                    <meshStandardMaterial color="#5b6670" roughness={0.9} />
                </mesh>

                {/* Coma — đám khí BAO TRÙM cả nhân. Sprite đặt ở tâm sẽ bị nửa trước của nhân che
                    (depth test) → trông như đĩa phẳng cắt ngang giữa sao chổi. Nên đẩy sprite ra
                    TRƯỚC nhân theo hướng camera (mỗi frame) để quầng phủ lên toàn bộ nhân. */}
                <group ref={comaRef}>
                    <sprite scale={[1.1, 1.1, 1]} renderOrder={4}>
                        <spriteMaterial map={getGlowTexture()} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.75} color="#bfeeff" />
                    </sprite>
                    <sprite scale={[0.32, 0.32, 1]} renderOrder={4}>
                        <spriteMaterial map={getGlowTexture()} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.95} color="#f2fdff" />
                    </sprite>
                </group>

                {/* Vùng chạm */}
                <mesh
                    visible={false}
                    onClick={(e) => { e.stopPropagation(); onSelect('comet'); }}
                    onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[0.7, 10, 10]} />
                </mesh>

                {hovered && (
                    <Html center position={[0, 0.7, 0]} zIndexRange={[35, 0]} wrapperClass="pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/70 border border-white/20 whitespace-nowrap">Sao chổi ☄️</span>
                    </Html>
                )}
            </group>
        </>
    );
};
