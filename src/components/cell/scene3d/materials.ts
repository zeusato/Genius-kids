import { useEffect } from 'react';
import * as THREE from 'three';
import { SHARED_TIME } from './core';
import { CUT_GLSL_FRAG, CutUniforms, SHELL_GLSL, ShellUniforms } from './shell';
import type { QualityTier } from './params';

// === Vật liệu "hữu cơ" của scene tế bào ===
// Tier cao: MeshPhysicalMaterial (clearcoat bóng ướt, sheen mềm như nhung, iridescence óng ánh
// như bong bóng xà phòng). Tier thấp: MeshStandardMaterial với CÙNG phần tiêm shader.
// Phần tiêm (onBeforeCompile):
//   - dim / highlight: làm mờ bào quan không được chọn, viền sáng fresnel cho cái được chọn
//   - shell: biến dạng vỏ hướng tâm (shell.ts) + pháp tuyến tính lại bằng sai phân
//   - cut: cửa sổ cắt quay về camera + viền sáng ở mép
//   - anchor: instance neo trên vỏ đang phập phồng (protein màng, lỗ nhân), tự ẩn trong cửa sổ
//   - jelly: độ đục theo fresnel (mép đục, giữa trong) — cảm giác thạch/kẹo dẻo
//   - wobble: lắc lư nhẹ theo pháp tuyến (ty thể, tiêu thể...)
//   - band: hoa văn mặt cắt (lớp phospholipid kép, màng kép, sợi xenlulôzơ, lưới peptidoglycan)
//   - surface: hoa văn mặt ngoài vỏ (sợi xenlulôzơ, lưới peptidoglycan)
// LƯU Ý: three cache program theo onBeforeCompile.toString() — mọi biến thể phải khai báo
// customProgramCacheKey riêng, nếu không hai vật liệu khác cờ sẽ dùng nhầm shader của nhau.

type ColorRep = THREE.ColorRepresentation;

export interface FxUniforms {
    uDim: { value: number };
    uHighlight: { value: number };
    uHighlightColor: { value: THREE.Color };
}

export function createFx(highlight: ColorRep = '#ffffff'): FxUniforms {
    return {
        uDim: { value: 0 },
        uHighlight: { value: 0 },
        uHighlightColor: { value: new THREE.Color(highlight) }
    };
}

export type BandMode = 'bilayer' | 'double' | 'fibers' | 'mesh' | 'slime';
export type SurfaceMode = 'cellulose' | 'peptidoglycan' | 'water' | 'lipid';

const BAND_CODE: Record<BandMode, number> = { bilayer: 1, double: 2, fibers: 3, mesh: 4, slime: 5 };
const SURF_CODE: Record<SurfaceMode, number> = { cellulose: 1, peptidoglycan: 2, water: 3, lipid: 4 };

export interface OrganicOptions {
    // true = MeshPhysicalMaterial ở tier cao (clearcoat/sheen/iridescence). Chỉ bật cho bề mặt
    // "nhân vật chính" (màng, nhân, không bào...) — mỗi biến thể Physical là một shader rất nặng,
    // biên dịch 0,2–0,5 s trên ANGLE/D3D11 (đo trên Iris Xe) nên bật tràn lan sẽ đen màn vài giây.
    physical?: boolean;
    color: ColorRep;
    roughness?: number;
    metalness?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    sheen?: number;
    sheenColor?: ColorRep;
    sheenRoughness?: number;
    iridescence?: number;
    iridescenceIOR?: number;
    iridescenceThicknessRange?: [number, number];
    emissive?: ColorRep;
    emissiveIntensity?: number;
    envMapIntensity?: number;
    side?: THREE.Side;
    transparent?: boolean;
    opacity?: number;
    depthWrite?: boolean;
    vertexColors?: boolean;
    fog?: boolean;
    jelly?: { center: number; edge: number; power?: number };
    shell?: ShellUniforms;
    cut?: CutUniforms;
    cutGlow?: { color: ColorRep; strength: number };
    anchor?: { shell: ShellUniforms; cut?: CutUniforms };
    wobble?: { amp: number; freq: number; speed: number };
    band?: { mode: BandMode; thickness: number; a: ColorRep; b: ColorRep; c: ColorRep };
    surface?: { mode: SurfaceMode; scale: number; color2: ColorRep; strength: number };
    fx?: FxUniforms;
}

const BAND_GLSL = /* glsl */`
varying vec2 vBand;
uniform float uBandThick;
uniform vec3 uBandA;
uniform vec3 uBandB;
uniform vec3 uBandC;
float bandAA(float d, float w) {
    float fw = max(fwidth(d), 1e-5);
    return 1.0 - smoothstep(w - fw, w + fw, d);
}
vec3 bandColor(vec2 b) {
    float T = uBandThick;
    float s = clamp(b.x, 0.0, 1.0);
    float y = s * T;
    float x = b.y;
    float fx = max(fwidth(x), 1e-5);
    vec3 col;
#if BAND_MODE == 1
    // Lớp phospholipid kép: 2 hàng "đầu" ưa nước ở hai mép, "đuôi" kỵ nước ở giữa
    float sp = T * 0.3;
    float hr = T * 0.13;
    float cx = (fract(x / sp) - 0.5) * sp;
    float head = max(bandAA(length(vec2(cx, y - T * 0.84)), hr), bandAA(length(vec2(cx, y - T * 0.16)), hr));
    float tx = abs(fract(x / sp * 2.0 + 0.25) - 0.5) * sp * 0.5;
    float wav = sin(y / T * 18.0 + x * 40.0) * sp * 0.04;
    float tail = bandAA(abs(tx + wav), sp * 0.07) * step(T * 0.27, y) * step(y, T * 0.73);
    col = mix(uBandC, uBandB, tail);
    col = mix(col, uBandA, head);
    float detail = clamp(2.2 - fx / (sp * 0.22), 0.0, 1.0);
    col = mix(mix(uBandC, uBandA, 0.55), col, detail);
#elif BAND_MODE == 2
    // Màng kép của nhân: 2 lớp màng, khoảng quanh nhân ở giữa, lỗ nhân nối 2 lớp
    float m = max(step(0.06, s) * step(s, 0.36), step(0.64, s) * step(s, 0.94));
    float P = T * 3.4;
    float pore = bandAA(abs(fract(x / P) - 0.5) * P, T * 0.32) * step(0.06, s) * step(s, 0.94);
    col = mix(uBandC, uBandA, m);
    col = mix(col, uBandB, pore);
#elif BAND_MODE == 3
    // Thành xenlulôzơ: nhiều lớp mỏng xếp song song + đầu sợi cắt ngang
    float lam = 0.5 + 0.5 * sin(s * 42.0 + sin(x * 7.0) * 0.9);
    float fp = T * 0.2;
    vec2 fc = vec2((fract(x / fp + floor(s * 7.0) * 0.5) - 0.5) * fp, (fract(s * 7.0) - 0.5) * T / 7.0);
    float fib = bandAA(length(fc), T * 0.03) * clamp(2.0 - fx / (T * 0.04), 0.0, 1.0);
    col = mix(uBandC, uBandA, lam * 0.65);
    col = mix(col, uBandB, fib);
#elif BAND_MODE == 4
    // Lưới peptidoglycan: sợi đường đan chéo
    float g = T * 0.45;
    float l1 = bandAA(abs(fract((x + y) / g) - 0.5) * g, T * 0.05);
    float l2 = bandAA(abs(fract((x - y) / g) - 0.5) * g, T * 0.05);
    col = mix(uBandC, uBandA, max(l1, l2) * clamp(2.0 - fx / (T * 0.06), 0.4, 1.0));
#else
    // Vỏ nhầy: chất keo trong, lấm tấm bọt
    float bp = T * 0.8;
    float row = floor(x / bp);
    vec2 bc = vec2((fract(x / bp) - 0.5) * bp, (fract(s * 2.0 + row * 0.37) - 0.5) * T * 0.5);
    float bub = bandAA(length(bc), T * 0.09);
    col = mix(uBandC, uBandA, smoothstep(0.0, 1.0, s));
    col = mix(col, uBandB, bub * 0.7);
#endif
    return col;
}
`;

const SURFACE_GLSL = /* glsl */`
uniform vec3 uSurf;        // x = tỉ lệ, y = độ đậm
uniform vec3 uSurfColor2;
float surfLine(float v, float w) {
    float d = abs(fract(v) - 0.5);
    float fw = max(fwidth(v), 1e-5);
    return 1.0 - smoothstep(w - fw, w + fw, d);
}
float surfacePattern(vec3 p) {
    float S = uSurf.x;
#if SURF_MODE == 1
    // Bó sợi xenlulôzơ đan chéo nhiều hướng
    float a = surfLine(dot(p, vec3(0.82, 0.57, 0.0)) * S, 0.09);
    float b = surfLine(dot(p, vec3(-0.35, 0.62, 0.7)) * S * 1.15, 0.07);
    float c = surfLine(dot(p, vec3(0.1, -0.45, 0.89)) * S * 0.9, 0.06);
    float fade = clamp(1.6 - max(fwidth(p.x), fwidth(p.y)) * S * 4.0, 0.0, 1.0);
    return max(a, max(b * 0.8, c * 0.6)) * fade;
#elif SURF_MODE == 2
    // Lưới peptidoglycan: sợi dọc thân que + cầu nối quanh chu vi
    float ang = atan(p.z, p.y) / 6.2831853;
    float a = surfLine(p.x * S, 0.08);
    float b = surfLine(ang * S * 7.0 + p.x * S * 0.5, 0.08);
    float fade = clamp(1.6 - max(fwidth(p.x), fwidth(p.y)) * S * 4.0, 0.0, 1.0);
    return max(a, b) * fade;
#elif SURF_MODE == 3
    // Vân sáng "caustic" lăn tăn như đáy bể nước dưới nắng (không bào) — cộng vào emissive
    vec3 q = p * S;
    float c1 = sin(q.x + uTime * 0.7) * sin(q.y * 1.3 - uTime * 0.5) * sin(q.z * 0.9 + uTime * 0.6);
    float c2 = sin(q.x * 1.7 - uTime * 0.4 + 1.3) * sin(q.z * 1.5 + uTime * 0.8) * sin(q.y * 0.8 + 2.1);
    float net = 1.0 - abs(c1 + c2 * 0.7);
    return pow(clamp(net, 0.0, 1.0), 8.0);
#else
    // Mặt màng lấm tấm "đầu" phospholipid (lưới điểm 3D cắt qua mặt cầu → hạt to nhỏ tự nhiên),
    // mờ dần khi ở xa để không nhiễu răng cưa
    vec3 c = fract(p * S) - 0.5;
    float d = length(c);
    float fw = max(fwidth(d), 1e-4);
    float head = 1.0 - smoothstep(0.3 - fw, 0.3 + fw, d);
    float fade = clamp(1.8 - max(fwidth(p.x), fwidth(p.y)) * S * 3.0, 0.0, 1.0);
    return head * fade;
#endif
}
`;

export interface OrganicMaterial {
    material: THREE.MeshStandardMaterial;
    fx: FxUniforms;
}

export function createOrganicMaterial(o: OrganicOptions, tier: QualityTier): OrganicMaterial {
    const physical = tier === 'high' && !!o.physical;
    const common: THREE.MeshStandardMaterialParameters = {
        color: o.color,
        roughness: o.roughness ?? 0.45,
        metalness: o.metalness ?? 0,
        emissive: o.emissive ?? o.color,
        emissiveIntensity: o.emissiveIntensity ?? 0.08,
        envMapIntensity: o.envMapIntensity ?? 1,
        side: o.side ?? THREE.FrontSide,
        transparent: o.transparent ?? !!o.jelly,
        opacity: o.opacity ?? 1,
        depthWrite: o.depthWrite ?? !(o.transparent ?? !!o.jelly),
        vertexColors: o.vertexColors ?? false,
        fog: o.fog ?? true
    };
    const material: THREE.MeshStandardMaterial = physical
        ? new THREE.MeshPhysicalMaterial({
            ...common,
            clearcoat: o.clearcoat ?? 0.6,
            clearcoatRoughness: o.clearcoatRoughness ?? 0.25,
            sheen: o.sheen ?? 0,
            sheenColor: o.sheenColor ?? '#ffffff',
            sheenRoughness: o.sheenRoughness ?? 0.5,
            iridescence: o.iridescence ?? 0,
            iridescenceIOR: o.iridescenceIOR ?? 1.3,
            iridescenceThicknessRange: o.iridescenceThicknessRange ?? [120, 480]
        })
        : new THREE.MeshStandardMaterial(common);

    const fx = o.fx ?? createFx();
    const shellMode = !!o.shell;
    const anchor = o.anchor;
    const needShellFns = shellMode || !!anchor;
    const cut = o.cut;
    const band = o.band;
    const surface = shellMode ? o.surface : undefined;
    const wobble = !shellMode && !anchor ? o.wobble : undefined;
    const jelly = o.jelly;
    const cutGlow = o.cutGlow;

    const extra: Record<string, { value: unknown }> = { uTime: SHARED_TIME, ...fx };
    if (shellMode) Object.assign(extra, o.shell);
    if (anchor) {
        Object.assign(extra, anchor.shell);
        if (anchor.cut) Object.assign(extra, anchor.cut);
    }
    if (cut) Object.assign(extra, cut);
    if (cutGlow) {
        extra.uCutGlowColor = { value: new THREE.Color(cutGlow.color) };
        extra.uCutGlow = { value: cutGlow.strength };
    }
    if (jelly) extra.uJelly = { value: new THREE.Vector3(jelly.center, jelly.edge, jelly.power ?? 2.2) };
    if (wobble) extra.uWob = { value: new THREE.Vector3(wobble.amp, wobble.freq, wobble.speed) };
    if (band) {
        extra.uBandThick = { value: band.thickness };
        extra.uBandA = { value: new THREE.Color(band.a) };
        extra.uBandB = { value: new THREE.Color(band.b) };
        extra.uBandC = { value: new THREE.Color(band.c) };
    }
    if (surface) {
        extra.uSurf = { value: new THREE.Vector3(surface.scale, surface.strength, 0) };
        extra.uSurfColor2 = { value: new THREE.Color(surface.color2) };
    }

    const key = [
        'cell-organic-v1', physical ? 'P' : 'S', shellMode ? 'sh' : '', anchor ? (anchor.cut ? 'anc' : 'an') : '',
        cut ? 'cut' : '', cutGlow ? 'cg' : '', jelly ? 'jl' : '', wobble ? 'wb' : '',
        band ? `b${BAND_CODE[band.mode]}` : '', surface ? `s${SURF_CODE[surface.mode]}` : ''
    ].join('|');

    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, extra);
        let vs = shader.vertexShader;
        let fs = shader.fragmentShader;

        // ---------- vertex ----------
        let vHead = 'uniform float uTime;\n';
        if (needShellFns) vHead += SHELL_GLSL;
        if (shellMode) vHead += 'varying vec3 vShellLocal;\n';
        if (anchor) vHead += 'attribute vec3 aDir;\n' + (anchor.cut ? CUT_GLSL_FRAG : '');
        if (wobble) vHead += 'uniform vec3 uWob;\n';
        if (band) vHead += 'attribute vec2 aBand;\nvarying vec2 vBand;\n';
        vs = vs.replace('#include <common>', `#include <common>\n${vHead}`);

        if (shellMode) {
            vs = vs.replace('#include <beginnormal_vertex>', /* glsl */`
                vec3 shD = normalize(position);
                vec3 shP = shellPoint(shD);
                vec3 shT1 = normalize(cross(shD, abs(shD.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
                vec3 shT2 = cross(shD, shT1);
                vec3 shP1 = shellPoint(normalize(shD + shT1 * 0.004));
                vec3 shP2 = shellPoint(normalize(shD + shT2 * 0.004));
                vec3 objectNormal = normalize(cross(shP1 - shP, shP2 - shP));
                if (dot(objectNormal, shD) < 0.0) objectNormal = -objectNormal;
                #ifdef USE_TANGENT
                    vec3 objectTangent = vec3(tangent.xyz);
                #endif
            `);
            vs = vs.replace('#include <begin_vertex>', 'vec3 transformed = shP;\nvShellLocal = shP;');
        } else if (wobble) {
            vs = vs.replace('#include <begin_vertex>', /* glsl */`
                #include <begin_vertex>
                #ifdef USE_INSTANCING
                    float wbSeed = float(gl_InstanceID) * 1.618;
                #else
                    float wbSeed = 0.0;
                #endif
                transformed += objectNormal * uWob.x * sin(dot(position, vec3(2.3, 3.1, 2.7)) * uWob.y + uTime * uWob.z + wbSeed * 6.2831);
            `);
        }
        if (band) vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBand = aBand;');

        if (anchor) {
            vs = vs.replace('#include <project_vertex>', /* glsl */`
                vec3 anD = normalize(aDir);
                vec3 anP = shellPoint(anD);
                float anKeep = 1.0;
                ${anchor.cut ? 'anKeep = 1.0 - step(uCutCos - 0.03, dot(normalize(anP / uCutHalf), uCutAxis));' : ''}
                vec4 mvPosition = vec4(transformed * anKeep, 1.0);
                #ifdef USE_INSTANCING
                    mvPosition = instanceMatrix * mvPosition;
                #endif
                mvPosition.xyz += anP;
                mvPosition = modelViewMatrix * mvPosition;
                gl_Position = projectionMatrix * mvPosition;
            `);
        }

        // ---------- fragment ----------
        let fHead = 'uniform float uTime;\nuniform float uDim;\nuniform float uHighlight;\nuniform vec3 uHighlightColor;\n';
        if (shellMode && (cut || surface)) fHead += 'varying vec3 vShellLocal;\n';
        if (cut) fHead += CUT_GLSL_FRAG;
        if (cutGlow) fHead += 'uniform vec3 uCutGlowColor;\nuniform float uCutGlow;\n';
        if (jelly) fHead += 'uniform vec3 uJelly;\n';
        if (band) fHead += `#define BAND_MODE ${BAND_CODE[band.mode]}\n${BAND_GLSL}`;
        if (surface) fHead += `#define SURF_MODE ${SURF_CODE[surface.mode]}\n${SURFACE_GLSL}`;
        fs = fs.replace('#include <common>', `#include <common>\n${fHead}`);

        if (cut && shellMode) {
            fs = fs.replace('#include <clipping_planes_fragment>', /* glsl */`
                #include <clipping_planes_fragment>
                vec3 cutD = normalize(vShellLocal / uCutHalf);
                float cutK = dot(cutD, uCutAxis);
                if (cutK > uCutCos) discard;
            `);
        }

        let colorMod = '';
        if (band) colorMod += 'diffuseColor.rgb = bandColor(vBand);\n';
        if (surface && surface.mode !== 'water') colorMod += 'diffuseColor.rgb = mix(diffuseColor.rgb, uSurfColor2, surfacePattern(vShellLocal) * uSurf.y);\n';
        colorMod += /* glsl */`
            float dimLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dimLum) * 0.42, uDim * 0.82);
        `;
        fs = fs.replace('#include <color_fragment>', `#include <color_fragment>\n${colorMod}`);

        if (jelly) {
            fs = fs.replace('#include <normal_fragment_begin>', /* glsl */`
                #include <normal_fragment_begin>
                float jlF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
                diffuseColor.a *= mix(uJelly.x, uJelly.y, pow(clamp(jlF, 0.0, 1.0), uJelly.z));
            `);
        }

        let emissiveMod = /* glsl */`
            totalEmissiveRadiance *= (1.0 - 0.85 * uDim);
            float hlF = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
            totalEmissiveRadiance += uHighlightColor * uHighlight * (0.12 + 1.4 * hlF);
        `;
        if (cut && cutGlow && shellMode) {
            emissiveMod += 'totalEmissiveRadiance += uCutGlowColor * uCutGlow * smoothstep(uCutCos - 0.07, uCutCos, cutK);\n';
        }
        if (surface && surface.mode === 'water') {
            emissiveMod += 'totalEmissiveRadiance += uSurfColor2 * surfacePattern(vShellLocal) * uSurf.y * (1.0 - uDim);\n';
        }
        fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${emissiveMod}`);

        shader.vertexShader = vs;
        shader.fragmentShader = fs;
    };
    material.customProgramCacheKey = () => key;
    return { material, fx };
}

// Giải phóng GPU khi đổi mẫu tế bào: vật liệu/hình khối tạo bằng code (truyền qua prop material=)
// KHÔNG được R3F tự dispose như phần tử JSX → phải tự dọn, nếu không mỗi lần đổi mẫu lại rò program.
export function useDisposable(...items: ({ dispose: () => void } | null | undefined)[]): void {
    useEffect(() => () => {
        for (const it of items) it?.dispose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, items);
}

// Làm mờ / làm sáng mượt theo trạng thái focus — gọi trong useFrame
export function dampFx(fx: FxUniforms, focus: 'none' | 'this' | 'other', delta: number, pulse = 0): void {
    const k = 1 - Math.exp(-delta * 6);
    const dimT = focus === 'other' ? 1 : 0;
    const hlT = focus === 'this' ? 0.55 + pulse : 0;
    fx.uDim.value += (dimT - fx.uDim.value) * k;
    fx.uHighlight.value += (hlT - fx.uHighlight.value) * k;
}

// Chấm sáng mềm (canvas → texture) cho sprite phát sáng, hạt, quầng — không cần file ảnh
let softDot: THREE.CanvasTexture | null = null;
export function getSoftDotTexture(): THREE.CanvasTexture {
    if (softDot) return softDot;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    softDot = new THREE.CanvasTexture(c);
    softDot.colorSpace = THREE.SRGBColorSpace;
    return softDot;
}
