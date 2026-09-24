import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SOLAR_SYSTEM_DATA } from '../../../data/solarData';
import { orbitRadius } from './scale';
import { orbitAngle, orbitPoint } from './orbit';
import { SimClock } from './core';

const SEGMENTS = 256;
const N = SOLAR_SYSTEM_DATA.length;

interface OrbitTrailsProps {
    clock: SimClock;
    focusedId: string | null;
}

// 8 quỹ đạo gộp vào MỘT LineSegments (1 draw call thay 8). Mỗi đường là "vệt" màu của hành tinh:
// sáng nhất ngay sau lưng hành tinh, mờ dần về một nền rất nhạt (vẫn thấy trọn hình quỹ đạo —
// hình elip của Sao Thủy là điểm dạy học). Tăng tốc thời gian (🐇/🚀) thì vệt DÀI ra: đó mới là
// cách đúng để "thấy" thời gian chạy nhanh (camera không hề bay). Hành tinh đang chọn: vệt sáng hơn.
export const OrbitTrails: React.FC<OrbitTrailsProps> = ({ clock, focusedId }) => {
    const { geometry, material } = useMemo(() => {
        const pos = new Float32Array(N * SEGMENTS * 2 * 3);
        const angle = new Float32Array(N * SEGMENTS * 2);
        const orbit = new Float32Array(N * SEGMENTS * 2);
        const p = new THREE.Vector3();
        let k = 0;
        SOLAR_SYSTEM_DATA.forEach((planet, oi) => {
            const phys = planet.physical!;
            const d = orbitRadius(phys.au);
            const e = planet.id === 'mercury' ? phys.eccentricity : 0;
            for (let i = 0; i < SEGMENTS; i++) {
                for (const j of [i, i + 1]) {
                    const a = (j / SEGMENTS) * Math.PI * 2; // giữ 2π ở điểm cuối — không nội suy qua mối nối
                    orbitPoint(d, e, a, p);
                    pos.set([p.x, p.y, p.z], k * 3);
                    angle[k] = a;
                    orbit[k] = oi;
                    k++;
                }
            }
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1));
        geo.setAttribute('aOrbit', new THREE.BufferAttribute(orbit, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uHead: { value: new Array(N).fill(0) },
                uColor: { value: SOLAR_SYSTEM_DATA.map((pl) => new THREE.Color(pl.color).lerp(new THREE.Color('#ffffff'), 0.35)) },
                uSpan: { value: 1.6 },
                uFocus: { value: -1 }
            },
            vertexShader: /* glsl */`
                attribute float aAngle;
                attribute float aOrbit;
                uniform float uHead[${N}];
                uniform vec3 uColor[${N}];
                varying float vAngle;
                varying float vHead;
                varying vec3 vColor;
                varying float vOrbit;
                void main() {
                    int oi = int(aOrbit + 0.5);
                    vAngle = aAngle;
                    vHead = uHead[oi];
                    vColor = uColor[oi];
                    vOrbit = aOrbit;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform float uSpan;
                uniform float uFocus;
                varying float vAngle;
                varying float vHead;
                varying vec3 vColor;
                varying float vOrbit;
                void main() {
                    float behind = mod(vHead - vAngle, 6.2831853);
                    float trail = pow(clamp(1.0 - behind / uSpan, 0.0, 1.0), 1.6);
                    float focus = abs(vOrbit - uFocus) < 0.5 ? 1.0 : 0.0;
                    float a = 0.1 + trail * 0.6 + focus * 0.22;
                    vec3 col = mix(vec3(0.85, 0.9, 1.0), vColor, clamp(trail * 1.4 + focus, 0.0, 1.0));
                    gl_FragColor = vec4(col, a);
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false
        });
        return { geometry: geo, material: mat };
    }, []);

    useFrame((_, delta) => {
        const heads = material.uniforms.uHead.value as number[];
        SOLAR_SYSTEM_DATA.forEach((planet, i) => {
            heads[i] = ((orbitAngle(planet.id, planet.physical!.periodYears, clock.t) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        });
        // 1x → 1,6 rad; 5x → ~2,6; 20x → ~4,2 (làm mượt để đổi tốc độ không giật)
        const targetSpan = 1.6 + Math.log2(Math.max(clock.timeScale, 1)) * 0.6;
        if (clock.timeScale > 0) {
            material.uniforms.uSpan.value += (targetSpan - material.uniforms.uSpan.value) * Math.min(1, delta * 2);
        }
        material.uniforms.uFocus.value = focusedId ? SOLAR_SYSTEM_DATA.findIndex((p) => p.id === focusedId) : -1;
    });

    return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
};
