// GLSL của cảnh Cây Tiến Hóa. Giữ ÍT program (bài học Tế bào: biên dịch shader là nút thắt trên ANGLE):
// cành (1) + hào quang lớp phủ (1) + ngọn/knot (1) + vòng đại (1) + nền (1) + hạt (1).
// Không vòng lặp động; noise 1 octave. Mọi fragment kết thúc bằng tonemapping + colorspace.

const NOISE = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}`;

const TAIL = /* glsl */ `
#include <tonemapping_fragment>
#include <colorspace_fragment>`;

// ---------------- Cành ----------------
export const branchVertex = /* glsl */ `
attribute float aSide; attribute float aS; attribute float aFrac; attribute float aDist; attribute float aBranch;
attribute vec3 aColor; attribute vec2 aNormal; attribute float aHalfW;
uniform float uTime; uniform float uWind; uniform float uWiden; uniform float uPxPerUnit;
varying float vSide; varying float vS; varying float vFrac; varying float vDist; varying float vBranch; varying vec3 vColor;
void main() {
    vec3 p = position;
    vec2 n = aNormal * aSide;                         // pháp tuyến không dấu
    p.xy += n * sin(uTime * 1.3 + aDist * 0.012) * uWind * smoothstep(0.8, 1.0, aFrac);   // gió ở ngọn cành
    p.xy += aNormal * (uWiden + max(0.0, 0.8 / max(uPxPerUnit, 0.0001) - aHalfW));   // hào quang + dày tối thiểu ~1,6 px
    vSide = aSide; vS = aS; vFrac = aFrac; vDist = aDist; vBranch = aBranch; vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const branchFragment = /* glsl */ `
uniform float uTime; uniform float uNowFrac; uniform float uFrontOn; uniform float uTier;
uniform sampler2D uState;
varying float vSide; varying float vS; varying float vFrac; varying float vDist; varying float vBranch; varying vec3 vColor;
${NOISE}
void main() {
    if (vFrac > uNowFrac + 0.0005) discard;                        // "tương lai" khi dùng cỗ máy thời gian
    vec4 st = texelFetch(uState, ivec2(int(vBranch + 0.5), 0), 0);
    float side = abs(vSide);
    float aa = max(fwidth(vSide) * 1.5, 0.02);
    float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, side);
    float shade = sqrt(max(0.0, 1.0 - side * side));               // giả khối trụ
    vec3 col = vColor * (0.32 + 0.78 * shade);
    if (uTier > 0.5) {
        col *= 0.84 + 0.32 * vnoise(vec2(vDist * 0.09, vSide * 2.2));   // vân vỏ cây
        float p = fract((vDist - uTime * 70.0) / 150.0);                   // nhựa sống chạy từ gốc ra ngọn
        float sap = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.2, p)) * pow(shade, 3.0);
        col += vColor * sap * 0.75 * (1.0 - st.b);
    }
    col += vec3(1.0, 0.88, 0.65) * smoothstep(0.014, 0.0, abs(vFrac - uNowFrac)) * uFrontOn * 1.1;  // mặt trước thời gian
    float crack = step(0.9, vnoise(vec2(vDist * 0.35, vSide * 4.0)));
    vec3 stone = vec3(0.52, 0.55, 0.6) * (0.55 + 0.45 * shade) * (1.0 - 0.35 * crack);
    col = mix(col, stone, st.b);                                                   // hóa đá
    col = mix(col, vec3(1.0, 0.86, 0.45) * (0.55 + 0.75 * shade), (st.r > vS ? 0.85 : 0.0));   // dòng dõi phủ dần
    col += vec3(1.0, 0.95, 0.8) * st.a * 0.6 * shade;                              // nhấp nháy
    col *= 1.0 - 0.72 * st.g;
    alpha *= 1.0 - 0.5 * st.g;
    gl_FragColor = vec4(col, alpha);
    ${TAIL}
}`;

// hào quang lớp phủ: cùng hình học cành, nới rộng + mờ, màu từ uOverlay
export const auraFragment = /* glsl */ `
uniform float uNowFrac; uniform sampler2D uOverlay; uniform float uTime;
varying float vSide; varying float vS; varying float vFrac; varying float vDist; varying float vBranch; varying vec3 vColor;
void main() {
    if (vFrac > uNowFrac + 0.0005) discard;
    vec4 ov = texelFetch(uOverlay, ivec2(int(vBranch + 0.5), 0), 0);
    if (ov.a < 0.5) discard;
    float side = abs(vSide);
    float a = pow(1.0 - side, 1.6) * (0.42 + 0.08 * sin(uTime * 2.0 + vDist * 0.01));
    gl_FragColor = vec4(ov.rgb * 1.1, a);
    ${TAIL}
}`;

// ---------------- Ngọn + nút rẽ nhánh (chung 1 InstancedMesh, 1 program) ----------------
// iKind: 0 cầu thủy tinh (động vật) · 1 lá · 2 nấm/bào tử · 3 bong bóng (vi sinh vật, tảo) · 4 hóa thạch · 5 nút rẽ nhánh · 6 Người
export const tipVertex = /* glsl */ `
attribute vec3 iColor; attribute vec4 iIcon; attribute float iKind; attribute float iPhase; attribute vec4 iState; attribute float iVis;
uniform float uTime; uniform float uPxPerUnit;
varying vec2 vUv; varying vec3 vColor; varying vec4 vIcon; varying float vKind; varying vec4 vState; varying float vPx; varying float vPhase;
void main() {
    vUv = position.xy;
    vColor = iColor; vIcon = iIcon; vKind = iKind; vState = iState; vPhase = iPhase;
    float scale = length(instanceMatrix[0].xyz);
    vPx = scale * uPxPerUnit;
    float breathe = 1.0 + 0.035 * sin(uTime * 1.7 + iPhase) + 0.25 * iState.x + 0.18 * iState.w;
    vec4 wp = instanceMatrix * vec4(position.xy * breathe * iVis, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * wp;
}`;

export const tipFragment = /* glsl */ `
uniform sampler2D uAtlas; uniform float uTime; uniform float uIconPx;
varying vec2 vUv; varying vec3 vColor; varying vec4 vIcon; varying float vKind; varying vec4 vState; varying float vPx; varying float vPhase;
${NOISE}
float icon(vec2 uv) {
    if (vIcon.z <= 0.0) return 0.0;
    vec2 t = clamp(uv * 0.5 + 0.5, 0.0, 1.0);
    return texture2D(uAtlas, vIcon.xy + t * vIcon.zw).a;
}
void main() {
    vec2 uv = vUv;
    float r2 = dot(uv, uv);
    float aa = max(fwidth(length(uv)) * 1.5, 0.01);
    float iconVis = smoothstep(uIconPx - 4.0, uIconPx + 4.0, vPx * 2.0);
    vec3 col; float alpha;
    int kind = int(vKind + 0.5);
    if (kind == 5) {                                       // nút rẽ nhánh: đốm sáng
        float d = sqrt(r2);
        alpha = smoothstep(1.0, 0.2, d);
        col = mix(vColor, vec3(1.0), smoothstep(0.5, 0.0, d)) * (1.0 + vState.x);
        alpha *= 0.9;
    } else if (kind == 1) {                                // lá
        vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * uv;
        float d = max(length(q - vec2(0.55, 0.0)), length(q + vec2(0.55, 0.0)));
        alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
        float vein = smoothstep(0.05, 0.0, abs(q.x)) * 0.35;
        float ic = icon(uv * 1.05) * iconVis;
        col = vColor * (0.35 + 0.45 * (1.0 - d)) + vec3(vein) * vColor + vec3(1.0, 0.98, 0.9) * ic;
        col += vColor * pow(d, 6.0) * 0.8;
    } else if (kind == 4) {                                // hóa thạch: đĩa đá, hình khắc chìm
        float d = sqrt(r2);
        alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
        float stone = 0.35 + 0.18 * vnoise(uv * 6.0 + vPhase);
        float ic = icon(uv * 1.12);
        float rim = smoothstep(0.78, 1.0, d);
        col = vec3(stone) * vec3(0.95, 0.92, 0.86) * (1.0 - 0.55 * ic * iconVis) + vec3(0.12) * icon(uv * 1.12 + vec2(0.03, -0.03)) * iconVis + rim * 0.12;
    } else if (kind == 3) {                                // bong bóng vi sinh vật
        float d = sqrt(r2);
        alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
        float ring = smoothstep(0.78, 0.9, d) * (1.0 - smoothstep(0.93, 1.0, d));
        vec2 w = uv * 1.25 + 0.04 * vec2(sin(uTime * 1.3 + vPhase), cos(uTime * 1.1 + vPhase));
        float ic = icon(w) * iconVis;
        col = vColor * (0.12 + 0.9 * ring) + vColor * 0.35 * (1.0 - d) + mix(vColor, vec3(1.0), 0.65) * ic;
        alpha *= max(0.28 + 0.72 * ring, ic);
        alpha = max(alpha, 0.2 * (1.0 - smoothstep(1.0 - aa, 1.0, d)));
    } else {                                               // cầu thủy tinh (0, 2 nấm, 6 Người)
        float d = sqrt(r2);
        alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
        vec3 n = vec3(uv, sqrt(max(0.0, 1.0 - r2)));
        vec3 L = normalize(vec3(-0.5, 0.6, 0.62));
        float fres = pow(1.0 - n.z, 2.5);
        float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
        float ic = icon(uv * 1.18 + n.xy * 0.06) * iconVis;
        vec3 base = vColor * (0.16 + 0.22 * max(dot(n, L), 0.0));
        if (kind == 2) base += vColor * 0.18 * step(0.9, vnoise(uv * 9.0 + vPhase));   // bào tử lấm tấm
        col = base + vec3(1.0, 0.97, 0.9) * ic + vColor * fres * 1.05 + vec3(spec) * 0.7;
        if (kind == 6) col += vec3(1.0, 0.85, 0.4) * (0.4 + 0.3 * sin(uTime * 3.0)) * smoothstep(0.7, 1.0, d);
    }
    col += vec3(1.0, 0.9, 0.6) * vState.x * 0.35;      // đang chọn
    col += vec3(1.0) * vState.w * 0.4;                 // nhấp nháy
    col *= 1.0 - 0.7 * vState.y;                       // mờ
    alpha *= 1.0 - 0.55 * vState.y;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
    ${TAIL}
}`;

// ---------------- Vòng đại ----------------
export const ringsVertex = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const ringsFragment = /* glsl */ `
uniform float uR; uniform float uOrient; uniform float uNowFrac; uniform float uTime; uniform sampler2D uLUT;
uniform vec3 uBandColor[6]; uniform float uBandFrom[6]; uniform vec2 uShock; uniform float uFrost; uniform float uTier;
varying vec2 vP;
${NOISE}
void main() {
    vec2 p = uOrient > 0.5 ? vec2(vP.x, vP.y / 1.7) : vP;  // bỏ giãn dọc (PORTRAIT_STRETCH) → tọa độ quạt chuẩn
    float r = length(p) / uR;
    float th = atan(p.y, p.x);
    float inFan = smoothstep(-0.08, -0.03, th) * (1.0 - smoothstep(3.17, 3.22, th)) * step(-1.2, th);
    float ma = texture2D(uLUT, vec2(clamp(r, 0.0, 1.0), 0.5)).r;
    vec3 band = uBandColor[5];
    if (ma > uBandFrom[1]) band = uBandColor[0];
    else if (ma > uBandFrom[2]) band = uBandColor[1];
    else if (ma > uBandFrom[3]) band = uBandColor[2];
    else if (ma > uBandFrom[4]) band = uBandColor[3];
    else if (ma > uBandFrom[5]) band = uBandColor[4];
    float fw = fwidth(r);
    float a = 0.0; vec3 col = vec3(0.0);
    if (r < 1.0) {
        float grain = uTier > 0.5 ? 0.85 + 0.25 * vnoise(p * 0.02) : 1.0;
        col = band * grain * 0.9;
        a = 0.3 * inFan;
        col += band * 0.35 * (0.5 + 0.5 * sin(r * uR * 0.32)) * 0.35;           // vân "vòng gỗ"
        // đường ranh các đại (vòng 66 triệu năm màu đỏ)
        float w = max(fwidth(ma) * 1.4, 0.0001);
        float edge = 0.0;
        for (int k = 1; k < 5; k++) edge = max(edge, 1.0 - smoothstep(0.0, w, abs(ma - uBandFrom[k])));
        float kpg = 1.0 - smoothstep(0.0, w * 1.6, abs(ma - uBandFrom[5]));
        col = mix(col, vec3(0.75, 0.85, 1.0), edge * 0.45);
        col = mix(col, vec3(0.97, 0.45, 0.45), kpg * 0.8);
        a = max(a, max(edge * 0.35, kpg * 0.6) * inFan);
        a *= 1.0 - smoothstep(uNowFrac, uNowFrac + 0.004, r);                  // "tương lai" bị ẩn
    }
    // vành "hôm nay": quầng ấm như bình minh
    float fr = max(fwidth(r), 1e-5);
    float dd = r - 1.0;                                                // quầng vành rộng ~14 px ở mọi mức zoom
    float today = (1.0 - smoothstep(0.0, fr * 14.0, dd)) * smoothstep(-fr * 3.0, 0.0, dd) * step(0.999, uNowFrac);
    col += vec3(1.0, 0.72, 0.38) * today * 0.9 * inFan;
    a = max(a, today * 0.7 * inFan);
    // sóng xung kích (thiên thạch)
    float shock = smoothstep(0.02, 0.0, abs(r - uShock.x)) * uShock.y;
    col += vec3(1.0, 0.6, 0.35) * shock * 1.4;
    a = max(a, shock * inFan);
    // băng giá
    if (uFrost > 0.0) { float f = uFrost * (0.4 + 0.6 * vnoise(p * 0.03 + uTime * 0.05)); col = mix(col, vec3(0.8, 0.9, 1.0), f * 0.6); a = max(a, f * 0.35 * inFan); }
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
    ${TAIL}
}`;

// ranh đại: vẽ bằng các vòng mảnh riêng (Line) — xem EraRings.tsx

// ---------------- Nền trời ----------------
export const skyVertex = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const skyFragment = /* glsl */ `
uniform vec3 uSkyTint; uniform vec2 uRoot; uniform float uFrost; uniform float uTime;
varying vec2 vP;
void main() {
    float d = length(vP - uRoot) / 2600.0;
    vec3 deep = vec3(0.012, 0.02, 0.045);
    vec3 col = mix(uSkyTint * 1.6, deep, smoothstep(0.0, 1.0, d));
    col += vec3(0.05, 0.12, 0.2) * smoothstep(0.35, 0.0, d);                  // vũng sáng nguyên thủy
    col = mix(col, vec3(0.7, 0.8, 0.9) * 0.35, uFrost * 0.5);
    gl_FragColor = vec4(col, 1.0);
    ${TAIL}
}`;

// ---------------- Hạt bụi sáng ----------------
export const particleVertex = /* glsl */ `
attribute float aSeed; attribute vec3 aColor;
uniform float uTime; uniform float uPixelRatio;
varying vec3 vColor; varying float vTw;
void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.13 + aSeed * 40.0) * 18.0;
    p.y += cos(uTime * 0.11 + aSeed * 30.0) * 14.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vTw = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed) + aSeed * 60.0);
    vColor = aColor;
    gl_PointSize = (2.0 + 5.0 * fract(aSeed * 13.7)) * uPixelRatio * clamp(900.0 / -mv.z, 0.6, 4.0);
    gl_Position = projectionMatrix * mv;
}`;

export const particleFragment = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c)) * vTw * 0.75;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    ${TAIL}
}`;
