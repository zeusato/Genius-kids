import * as T from 'three';

/** Preserve the PNG's coverage instead of making every surviving edge pixel opaque.
 * MSAA coverage keeps instanced foliage depth-correct without transparent sorting.
 * Alpha hashing is the depth-writing fallback on contexts without MSAA. */
export const foliageCoverage: T.MeshBasicMaterial['onBeforeCompile'] = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
        if (diffuseColor.a < .035) discard;
        diffuseColor.a = smoothstep(.035, .98, diffuseColor.a);
    `);
};

/** Ground contact: tight shade at the root plus a diffuse, slightly irregular canopy.
 * No hard circle silhouette, texture allocation, or per-tree draw calls. */
export const contactShadowVertex = `
    varying vec2 contactUV;
    void main() {
        contactUV = uv * 2. - 1.;
        vec4 p = vec4(position, 1.);
        #ifdef USE_INSTANCING
            p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
    }
`;
export const contactShadowFragment = `
    varying vec2 contactUV;
    void main() {
        vec2 p = contactUV;
        float root = exp(-dot(p * vec2(3.8, 4.8), p * vec2(3.8, 4.8)));
        vec2 canopy = (p - vec2(.14, -.08)) * vec2(1.35, 1.65);
        float soft = exp(-dot(canopy, canopy) * 2.8);
        float variation = .91 + .09 * sin(p.x * 13. + sin(p.y * 11.));
        float edge = 1. - smoothstep(.65, 1., max(abs(p.x), abs(p.y)));
        float alpha = (root * .22 + soft * .13) * edge * variation;
        if (alpha < .003) discard;
        gl_FragColor = vec4(.075, .095, .045, alpha);
        #include <colorspace_fragment>
    }
`;
