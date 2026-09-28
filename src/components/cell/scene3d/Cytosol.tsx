import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { SHARED_TIME } from './core';
import { createRandom, randomDirection } from './noise';
import { getSoftDotTexture } from './materials';
import { ShellShape, shellRadius } from './shell';

interface CytosolProps {
    shape: ShellShape;       // vỏ trong cùng (giới hạn vùng rải hạt)
    count: number;
    color?: string;
    color2?: string;
    size?: number;           // kích thước hạt (world units ở khoảng cách 1)
    avoid?: { center: [number, number, number]; radius: number }[]; // không rải trong nhân / không bào
    reject?: (x: number, y: number, z: number) => boolean;           // loại vùng hình dạng bất kỳ
    seed: string;
    outside?: boolean;       // true = hạt lơ lửng BÊN NGOÀI tế bào (dịch ngoại bào)
    opacity?: number;
}

// Hạt lơ lửng — toàn bộ chuyển động trên GPU (vertex shader đọc SHARED_TIME), CPU 0 việc/frame.
// Trong tế bào: tế bào chất sống động; ngoài tế bào: "bokeh" mờ tạo chiều sâu khi xoay.
export const Cytosol: React.FC<CytosolProps> = ({
    shape, count, color = '#d8fbff', color2 = '#f5d0fe', size = 0.05, avoid = [], reject, seed, outside = false, opacity = 0.55
}) => {
    const dpr = useThree((s) => s.viewport.dpr);
    const { geometry, material } = useMemo(() => {
        const rand = createRandom(seed);
        const pos = new Float32Array(count * 3);
        const seeds = new Float32Array(count);
        const cols = new Float32Array(count * 3);
        const c1 = new THREE.Color(color), c2 = new THREE.Color(color2);
        const tmp = new THREE.Color();
        let n = 0, guard = 0;
        while (n < count && guard < count * 30) {
            guard++;
            const [dx, dy, dz] = randomDirection(rand);
            const r = shellRadius(dx, dy, dz, shape);
            const t = outside ? r * (1.25 + rand() * 4.5) : r * 0.93 * Math.cbrt(rand());
            const x = dx * t, y = dy * t, z = dz * t;
            if (avoid.some((a) => Math.hypot(x - a.center[0], y - a.center[1], z - a.center[2]) < a.radius)) continue;
            if (reject?.(x, y, z)) continue;
            pos.set([x, y, z], n * 3);
            seeds[n] = rand();
            tmp.copy(c1).lerp(c2, rand() * rand());
            cols.set([tmp.r, tmp.g, tmp.b], n * 3);
            n++;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3));
        g.setAttribute('aSeed', new THREE.BufferAttribute(seeds.subarray(0, n), 1));
        g.setAttribute('color', new THREE.BufferAttribute(cols.subarray(0, n * 3), 3));
        const m = new THREE.ShaderMaterial({
            uniforms: {
                uTime: SHARED_TIME,
                uSize: { value: size },
                uScale: { value: 400 },
                uOpacity: { value: opacity },
                uMap: { value: getSoftDotTexture() }
            },
            vertexShader: /* glsl */`
                attribute float aSeed;
                attribute vec3 color;
                uniform float uTime;
                uniform float uSize;
                uniform float uScale;
                varying vec3 vColor;
                varying float vFade;
                void main() {
                    vec3 p = position;
                    float s = aSeed * 6.2831;
                    p += vec3(sin(uTime * 0.31 + s), sin(uTime * 0.23 + s * 1.7), cos(uTime * 0.27 + s * 2.3)) * ${outside ? '0.35' : '0.07'};
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    float dist = -mv.z;
                    gl_PointSize = uSize * uScale * (0.6 + aSeed * 0.8) / max(dist, 0.05);
                    gl_Position = projectionMatrix * mv;
                    vColor = color;
                    // hạt sát ống kính mờ đi (không thành đốm to che tầm nhìn), nhấp nháy nhẹ
                    vFade = smoothstep(0.25, 1.4, dist) * (0.65 + 0.35 * sin(uTime * (0.8 + aSeed) + s));
                }
            `,
            fragmentShader: /* glsl */`
                uniform sampler2D uMap;
                uniform float uOpacity;
                varying vec3 vColor;
                varying float vFade;
                void main() {
                    vec4 tex = texture2D(uMap, gl_PointCoord);
                    gl_FragColor = vec4(vColor, tex.a * uOpacity * vFade);
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        return { geometry: g, material: m };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed, count, outside, shape]);

    // gl_PointSize tính theo pixel vật lý → nhân dpr để hạt không co lại trên màn hình nét
    material.uniforms.uScale.value = 420 * dpr;

    return <points geometry={geometry} material={material} frustumCulled={false} raycast={() => null} renderOrder={5} />;
};
