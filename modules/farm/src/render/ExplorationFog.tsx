import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import type { World } from '../core/world';

/** Screen-space atmospheric veil. The visible territory is tied to actual owned regions. */
export function ExplorationFog({ world, reduced }: { world: World; reduced: boolean }) {
    const material = useRef<T.ShaderMaterial>(null), { camera } = useThree();
    const target = useMemo<number[]>(() => Array.from({ length: 36 }, (_, i) => world.owned.includes(i) ? 1 : 0), [world.owned]);
    const uniforms = useMemo(() => ({ known: { value: [...target] }, inverseProjection: { value: new T.Matrix4() }, cameraWorld: { value: new T.Matrix4() }, time: { value: 0 } }), []);
    useEffect(() => { if (reduced) uniforms.known.value = [...target]; }, [reduced, target, uniforms]);
    useFrame(({ clock }, delta) => {
        uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
        uniforms.cameraWorld.value.copy(camera.matrixWorld);
        uniforms.time.value = reduced ? 0 : clock.elapsedTime * .08;
        uniforms.known.value = uniforms.known.value.map((v, i) => T.MathUtils.lerp(v, target[i], 1 - Math.exp(-delta * 3)));
    });
    if (world.owned.length === 36) return null;
    return <mesh frustumCulled={false} renderOrder={1000} raycast={() => {}}><planeGeometry args={[2, 2]}/><shaderMaterial ref={material} uniforms={uniforms} transparent depthTest={false} depthWrite={false}
        vertexShader={'varying vec2 screenUV; void main(){screenUV=position.xy;gl_Position=vec4(position.xy,0.,1.);}'}
        fragmentShader={`varying vec2 screenUV; uniform mat4 inverseProjection; uniform mat4 cameraWorld; uniform float known[36]; uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        void main(){
            vec4 a=inverseProjection*vec4(screenUV,-1.,1.);a/=a.w; vec4 b=inverseProjection*vec4(screenUV,1.,1.);b/=b.w;
            vec3 origin=(cameraWorld*a).xyz, direction=normalize((cameraWorld*b).xyz-origin);
            vec2 p=(origin+direction*(-origin.y/direction.y)).xz;
            float distance=1000.;
            for(int i=0;i<36;i++){vec2 center=vec2(float(i-6*(i/6))*16.+8.,float(i/6)*16.+8.);vec2 q=max(abs(p-center)-vec2(8.),vec2(0.));distance=min(distance,length(q)+(1.-known[i])*160.);}
            float cloud=noise(p*.18+time*.23)*.65+noise(p*.43-time*.12)*.35;
            float alpha=smoothstep(1.6,8.,distance+(cloud-.5)*2.)*.985;
            vec3 color=mix(vec3(.62,.70,.68),vec3(.82,.86,.80),cloud);
            gl_FragColor=vec4(color,alpha);
        }`}/></mesh>;
}
