import * as THREE from 'three';

// Vá MeshStandardMaterial của hành tinh qua onBeforeCompile (KHÔNG thêm draw call):
//  1. Viền mờ phía đêm — ambient đã hạ gần 0 để lằn ranh ngày/đêm sắc nét, viền này giữ
//     hình khối không "biến mất" vào nền trời đen.
//  2. (tùy chọn) Bóng vành đổ lên hành tinh — giao tia từ điểm bề mặt về phía Mặt Trời với mặt
//     phẳng vành, lấy alpha texture vành tại bán kính đó. Hiện tượng thật (ảnh Cassini).
// Mặt Trời luôn ở gốc tọa độ khi `sunAtOrigin`; ngược lại dùng hướng sáng cố định (modal).

export interface RingShadowConfig {
    texture: THREE.Texture;
    inner: number; // bán kính trong (world units)
    outer: number;
}

export interface PlanetSurfaceUniforms {
    uLightDir: { value: THREE.Vector3 };     // chỉ dùng khi không sunAtOrigin
    uRimColor: { value: THREE.Color };
    uRimStrength: { value: number };
    uRingCenter: { value: THREE.Vector3 };
    uRingNormal: { value: THREE.Vector3 };
    uRingInner: { value: number };
    uRingOuter: { value: number };
    uRingTex: { value: THREE.Texture | null };
}

export function createPlanetSurfaceMaterial(
    map: THREE.Texture | null,
    opts: { sunAtOrigin?: boolean; lightDir?: THREE.Vector3; rimColor?: string; rimStrength?: number; ring?: RingShadowConfig } = {}
): THREE.MeshStandardMaterial & { userData: { uniforms: PlanetSurfaceUniforms } } {
    const mat = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
    const uniforms: PlanetSurfaceUniforms = {
        uLightDir: { value: (opts.lightDir ?? new THREE.Vector3(1, 0.4, 0.8)).clone().normalize() },
        uRimColor: { value: new THREE.Color(opts.rimColor ?? '#5a6a8c') },
        uRimStrength: { value: opts.rimStrength ?? 0.1 },
        uRingCenter: { value: new THREE.Vector3() },
        uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
        uRingInner: { value: opts.ring?.inner ?? 0 },
        uRingOuter: { value: opts.ring?.outer ?? 1 },
        uRingTex: { value: opts.ring?.texture ?? null }
    };
    mat.userData.uniforms = uniforms;
    const sunAtOrigin = opts.sunAtOrigin !== false;
    const ring = !!opts.ring;
    mat.customProgramCacheKey = () => `planet-surface-${sunAtOrigin ? 1 : 0}-${ring ? 1 : 0}`;

    mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        if (sunAtOrigin) shader.defines = { ...shader.defines, SUN_AT_ORIGIN: '' };
        if (ring) shader.defines = { ...shader.defines, RING_SHADOW: '' };

        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vPWorld;\nvarying vec3 vNWorld;')
            .replace(
                '#include <project_vertex>',
                '#include <project_vertex>\nvPWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNWorld = normalize(mat3(modelMatrix) * objectNormal);'
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                /* glsl */ `#include <common>
varying vec3 vPWorld;
varying vec3 vNWorld;
uniform vec3 uLightDir;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform vec3 uRingCenter;
uniform vec3 uRingNormal;
uniform float uRingInner;
uniform float uRingOuter;
uniform sampler2D uRingTex;
vec3 planetLightDir() {
#ifdef SUN_AT_ORIGIN
    return normalize(-vPWorld);
#else
    return normalize(uLightDir);
#endif
}`
            )
            .replace(
                '#include <lights_fragment_end>',
                /* glsl */ `#include <lights_fragment_end>
#ifdef RING_SHADOW
{
    vec3 Ls = planetLightDir();
    float denom = dot(Ls, uRingNormal);
    if (abs(denom) > 1e-4) {
        float tHit = dot(uRingCenter - vPWorld, uRingNormal) / denom;
        if (tHit > 0.0) {
            float rq = length(vPWorld + Ls * tHit - uRingCenter);
            float ru = (rq - uRingInner) / (uRingOuter - uRingInner);
            if (ru > 0.0 && ru < 1.0) {
                float shade = 1.0 - texture2D(uRingTex, vec2(ru, 0.5)).a * 0.82;
                reflectedLight.directDiffuse *= shade;
                reflectedLight.directSpecular *= shade;
            }
        }
    }
}
#endif`
            )
            .replace(
                '#include <opaque_fragment>',
                /* glsl */ `{
    float dayF = smoothstep(-0.15, 0.35, dot(normalize(vNWorld), planetLightDir()));
    float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
    outgoingLight += uRimColor * fres * uRimStrength * (1.0 - dayF);
}
#include <opaque_fragment>`
            );
    };
    return mat as THREE.MeshStandardMaterial & { userData: { uniforms: PlanetSurfaceUniforms } };
}

// Bán kính trong/ngoài của vành Sao Thổ theo bán kính hành tinh — dùng chung cho vành + bóng
export const SATURN_RING_INNER = 1.4;
export const SATURN_RING_OUTER = 2.3;

// Pháp tuyến mặt phẳng xích đạo/vành sau khi nghiêng trục quanh Z (rotation-z = −tilt)
export function tiltedNormal(tiltDeg: number): THREE.Vector3 {
    return new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(tiltDeg));
}
