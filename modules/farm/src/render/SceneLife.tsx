import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as T from 'three';
import { sceneryModel } from './models';
export function SceneLife({ reduced }: {
    reduced: boolean;
}) {
    const scenery = useMemo(() => sceneryModel(24, 24), []), birds = useRef<T.Group>(null);
    useFrame(({ clock }) => { if (reduced || !birds.current)
        return; const t = clock.elapsedTime * .12; birds.current.position.set(12 + Math.sin(t) * 7, 4.5 + Math.sin(t * 2) * .3, 10 + Math.cos(t) * 6); birds.current.rotation.y = -t; });
    return <><primitive object={scenery} dispose={null}/><group ref={birds} position={[12, 4.5, 10]}>{[0, 1, 2].map(i => <group key={i} position={[i * .6, i * .1, i * .35]}>{[-1, 1].map(side => <mesh key={side} rotation={[0, 0, side * .3]} position={[side * .12, 0, 0]}><boxGeometry args={[.25, .035, .09]}/><meshStandardMaterial color="#6c7662"/></mesh>)}</group>)}</group></>;
}
/** Developer-only visible measurement. No access to player state or hidden browser APIs. */
export function FrameMeter() {
    const { gl } = useThree(), frames = useRef<number[]>([]), last = useRef(0), [text, setText] = useState('Đang đo…');
    useFrame(({ clock }, delta) => { frames.current.push(delta * 1000); if (clock.elapsedTime - last.current < 3)
        return; const samples = frames.current.sort((a, b) => a - b); const mean = samples.reduce((a, b) => a + b, 0) / samples.length; setText(`${Math.round(1000 / mean)} fps · p95 ${Math.round(samples[Math.floor(samples.length * .95)] ?? 0)}ms · ${gl.info.render.calls} draws · ${Math.round(gl.info.render.triangles / 1000)}k tris`); frames.current = []; last.current = clock.elapsedTime; });
    return <Html fullscreen zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}><output className="farm-frame-meter" aria-label="Hiệu năng QA">{text}</output></Html>;
}
