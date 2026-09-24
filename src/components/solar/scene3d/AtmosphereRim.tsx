import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SHELL_SPHERE } from './core';

interface AtmosphereRimProps {
    radius: number;             // bán kính bề mặt hành tinh — quầng sáng nhất sát đây
    color: string;
    strength?: number;
    thickness?: number;         // vỏ khí quyển = radius × thickness
    geometry?: THREE.BufferGeometry;
    // Nguồn sáng: Mặt Trời ở gốc (scene chính) hoặc hướng cố định (modal/Kích thước thật).
    // Không truyền gì → quầng đều mọi phía (Xưởng Hành Tinh).
    sunAtOrigin?: boolean;
    lightDir?: [number, number, number];
    // Cắt hành tinh: vỏ khí bị khoét CÙNG múi với hành tinh (khí quyển chỉ là lớp ngoài cùng)
    clippingPlanes?: THREE.Plane[];
}

// Quầng khí quyển v3 — vỏ cầu BackSide, additive, tính theo ĐỘ DÀY QUANG HỌC:
// với mỗi điểm ảnh, lấy đoạn tia nhìn đi xuyên qua lớp khí (giao tia với cầu khí, cắt bớt phần sau
// hành tinh nếu tia chạm hành tinh), độ sáng ∝ 1 − e^(−k·độ dày). Tự cho quầng mềm, sáng nhất sát
// mép hành tinh, mờ dần ra ngoài — đúng ở MỌI góc nhìn mà không cần giả định "hành tinh luôn che
// phần giữa" (giả định đó vỡ khi hành tinh bị khoét múi: lộ ruột vỏ khí sáng rực).
// Chỉ sáng phía ban ngày, ửng cam ở vùng hoàng hôn (tán xạ Rayleigh — hiện tượng thật).
export const AtmosphereRim: React.FC<AtmosphereRimProps> = ({
    radius,
    color,
    strength = 0.9,
    thickness = 1.14,
    geometry = SHELL_SPHERE,
    sunAtOrigin = false,
    lightDir,
    clippingPlanes
}) => {
    const hasLight = sunAtOrigin || !!lightDir;
    const material = useMemo(() => {
        const m = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uTwilight: { value: new THREE.Color('#ff8a4c') },
                uStrength: { value: strength },
                uThickness: { value: thickness },
                uLightDir: { value: new THREE.Vector3(...(lightDir ?? [1, 0.4, 0.8])).normalize() }
            },
            defines: {
                ...(sunAtOrigin ? { SUN_AT_ORIGIN: '' } : {}),
                ...(hasLight ? { HAS_LIGHT: '' } : {})
            },
            vertexShader: /* glsl */`
                #include <clipping_planes_pars_vertex>
                varying vec3 vPWorld;
                varying vec3 vCenter;
                varying float vRa;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vPWorld = wp.xyz;
                    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                    vRa = length(modelMatrix[0].xyz); // bán kính vỏ khí trong world (hình cầu đơn vị × scale)
                    vec4 mvPosition = viewMatrix * wp;
                    gl_Position = projectionMatrix * mvPosition;
                    #include <clipping_planes_vertex>
                }
            `,
            fragmentShader: /* glsl */`
                #include <clipping_planes_pars_fragment>
                uniform vec3 uColor;
                uniform vec3 uTwilight;
                uniform float uStrength;
                uniform float uThickness;
                uniform vec3 uLightDir;
                varying vec3 vPWorld;
                varying vec3 vCenter;
                varying float vRa;
                // giao tia (gốc o, hướng d đơn vị) với cầu tâm c bán kính r → (t0, t1), t0 > t1 nếu trượt
                vec2 hitSphere(vec3 o, vec3 d, vec3 c, float r) {
                    vec3 oc = o - c;
                    float b = dot(oc, d);
                    float h = b * b - (dot(oc, oc) - r * r);
                    if (h < 0.0) return vec2(1.0, -1.0);
                    h = sqrt(h);
                    return vec2(-b - h, -b + h);
                }
                void main() {
                    #include <clipping_planes_fragment>
                    vec3 d = normalize(vPWorld - cameraPosition);
                    float Rp = vRa / uThickness;
                    vec2 ta = hitSphere(cameraPosition, d, vCenter, vRa);
                    float tIn = max(ta.x, 0.0);
                    float tOut = ta.y;
                    vec2 tp = hitSphere(cameraPosition, d, vCenter, Rp);
                    if (tp.x <= tp.y && tp.x > 0.0) tOut = min(tOut, tp.x); // tia chạm hành tinh → bị chặn
                    float path = max(tOut - tIn, 0.0);
                    // chuẩn hoá theo đoạn dài nhất có thể (tia tiếp tuyến mép hành tinh)
                    float maxPath = 2.0 * sqrt(max(vRa * vRa - Rp * Rp, 1e-6));
                    float depth = path / maxPath;
                    float halo = 1.0 - exp(-3.2 * depth * depth);
                    vec3 col = uColor;
                    float day = 1.0;
                #ifdef HAS_LIGHT
                    #ifdef SUN_AT_ORIGIN
                        vec3 L = normalize(-vCenter);
                    #else
                        vec3 L = normalize(uLightDir);
                    #endif
                    // điểm giữa đoạn tia trong lớp khí → hướng từ tâm hành tinh ra điểm đó
                    vec3 mid = cameraPosition + d * (0.5 * (tIn + tOut)) - vCenter;
                    float s = dot(normalize(mid), L);
                    day = smoothstep(-0.35, 0.3, s);
                    col = mix(uTwilight, uColor, smoothstep(-0.1, 0.45, s));
                #endif
                    gl_FragColor = vec4(col * halo * day * uStrength, 1.0);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        if (clippingPlanes) {
            m.clipping = true;
            m.clippingPlanes = clippingPlanes;
            m.clipIntersection = true;
        }
        return m;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color, strength, thickness, sunAtOrigin, hasLight, lightDir?.[0], lightDir?.[1], lightDir?.[2], clippingPlanes]);

    return <mesh geometry={geometry} material={material} scale={radius * thickness} renderOrder={2} />;
};

// Màu khí quyển theo màu thật NASA
export const ATMOSPHERE_COLORS: Record<string, string> = {
    earth: '#6FA8DC',
    venus: '#E8DCC3',
    mars: '#D98559',
    neptune: '#8FBDD3',
    uranus: '#ACD8D8'
};
