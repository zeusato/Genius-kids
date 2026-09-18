import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as T from 'three';
import swallow from '../assets/terrain/swallow-flight-v1.png';

export function SceneLife({ reduced }: {
    reduced: boolean;
}) {
    const birds = useRef<T.Group>(null), texture = useTexture(swallow);
    texture.colorSpace = T.SRGBColorSpace;
    const points = useMemo(() => [new T.Vector3(), new T.Vector3()], []);
    const visit = useRef({ active: false, age: 0, wait: 15, duration: 28, direction: 1 });
    const flightPosition = (out: T.Vector3, age: number, index: number) => {
        const { duration, direction } = visit.current;
        const phase = age * .18 - index * .24;
        const arrive = 1 - T.MathUtils.smoothstep(age, 0, 6);
        const leave = T.MathUtils.smoothstep(age, duration - 8, duration);
        const travel = direction * (-90 * arrive + 120 * leave);
        return out.set(12 + Math.sin(phase) * 8 + travel, 5.2 + Math.sin(phase * 2) * .25 + index * .18 + leave * 7, 10 + Math.cos(phase) * 7 + travel * .3);
    };
    useFrame(({ camera, size: viewport }, delta) => {
        if (!birds.current) return;
        const flock = visit.current;
        // Pause decorative time in background tabs; never leave frozen birds on the map.
        birds.current.visible = !reduced && flock.active;
        if (reduced) return;
        const step = Math.min(delta, .1);
        if (!flock.active) {
            flock.wait -= step;
            if (flock.wait <= 0) {
                flock.active = true; flock.age = 0;
                flock.duration = 26 + Math.random() * 6;
                flock.direction = Math.random() < .5 ? -1 : 1;
            }
            return;
        }
        flock.age += step;
        if (flock.age >= flock.duration) {
            flock.active = false; flock.wait = 80 + Math.random() * 60;
            birds.current.visible = false;
            return;
        }
        birds.current.children.forEach((child, i) => {
            const bird = child as T.Sprite;
            flightPosition(bird.position, flock.age, i);
            points[0].copy(bird.position).project(camera);
            flightPosition(points[1], flock.age + .05, i).project(camera);
            const heading = Math.atan2((points[1].y - points[0].y) * viewport.height, (points[1].x - points[0].x) * viewport.width);
            bird.material.rotation = heading - Math.PI / 4;
            bird.material.opacity = T.MathUtils.smoothstep(flock.age, 0, 1) * (1 - T.MathUtils.smoothstep(flock.age, flock.duration - 1, flock.duration));
            const size = 1.3 - i * .1;
            bird.scale.set(size, size * (.97 + Math.sin(flock.age * 3 + i) * .03), 1);
        });
    });
    return <group ref={birds} visible={false}>{[0, 1, 2].map(i => <sprite key={i} raycast={() => {}} scale={1.3 - i * .1}><spriteMaterial map={texture} transparent alphaTest={.08} depthWrite={false} toneMapped={false}/></sprite>)}</group>;
}
/** Developer-only visible measurement. No access to player state or hidden browser APIs. */
export function FrameMeter() {
    const { gl } = useThree(), frames = useRef<number[]>([]), last = useRef(0), [text, setText] = useState('Đang đo…');
    useFrame(({ clock }, delta) => { frames.current.push(delta * 1000); if (clock.elapsedTime - last.current < 3)
        return; const samples = frames.current.sort((a, b) => a - b); const mean = samples.reduce((a, b) => a + b, 0) / samples.length; setText(`${Math.round(1000 / mean)} fps · p95 ${Math.round(samples[Math.floor(samples.length * .95)] ?? 0)}ms · ${gl.info.render.calls} draws · ${Math.round(gl.info.render.triangles / 1000)}k tris`); frames.current = []; last.current = clock.elapsedTime; });
    return <Html fullscreen zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}><output className="farm-frame-meter" aria-label="Hiệu năng QA">{text}</output></Html>;
}
