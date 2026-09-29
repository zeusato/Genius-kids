import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
const CAMERA = { position: [0, 2, 12] as [
        number,
        number,
        number
    ], fov: 40 };
function Core({ layer, current, reduced, onError }: {
    layer: number;
    current: number;
    reduced: boolean;
    onError: () => void;
}) {
    const { camera, gl } = useThree(), ions = useRef<InstancedMesh>(null), electrons = useRef<InstancedMesh>(null), dummy = useMemo(() => new Object3D(), []);
    useEffect(() => { if (!ions.current)
        return; for (let i = 0; i < 96; i++) {
        dummy.position.set((i % 12 - 5.5) * .58, (Math.floor(i / 12) % 4 - 1.5) * .43, (Math.floor(i / 48) - .5) * .8);
        dummy.updateMatrix();
        ions.current.setMatrixAt(i, dummy.matrix);
    } ions.current.instanceMatrix.needsUpdate = true; }, [layer]);
    useEffect(() => { const lost = (e: Event) => { e.preventDefault(); onError(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, onError]);
    useFrame(({ clock }, dt) => { const target = layer === 0 ? 12 : layer === 1 ? 10 : 8; camera.position.z += (target - camera.position.z) * (reduced ? 1 : 1 - Math.exp(-dt * 6)); camera.lookAt(0, 0, 0); if (!electrons.current)
        return; const t = reduced ? 0 : clock.elapsedTime, drift = Math.abs(current) < 1e-7 ? 0 : -Math.sign(current) * Math.min(.22, Math.log1p(Math.abs(current) * 20) * .05); for (let i = 0; i < 48; i++) {
        const base = (i % 12 - 5.5) * .58, x = ((base + t * drift + 3.6) % 7.2 + 7.2) % 7.2 - 3.6;
        dummy.position.set(x + Math.sin(t * 11 + i * 4) * .035, (Math.floor(i / 12) - 1.5) * .42 + Math.sin(t * 14 + i * 3) * .04, Math.sin(i * 7) * .6 + Math.cos(t * 17 + i) * .04);
        dummy.updateMatrix();
        electrons.current.setMatrixAt(i, dummy.matrix);
    } electrons.current.instanceMatrix.needsUpdate = true; });
    return <><color attach="background" args={['#203a36']}/><ambientLight intensity={2}/><directionalLight position={[1, 5, 6]} intensity={3}/>
 {layer === 0 && <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[1.05, 1.05, 7.8, 32, 1, true, 0, Math.PI * 1.45]}/><meshStandardMaterial color="#589c8c" roughness={.4} side={2}/></mesh>}
 {layer < 2 ? Array.from({ length: 7 }, (_, i) => <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[0, Math.sin(i * Math.PI / 3) * .52, Math.cos(i * Math.PI / 3) * .52]}><cylinderGeometry args={[.22, .22, 8.2, 12]}/><meshStandardMaterial color="#d49d67" roughness={.38} metalness={.5}/></mesh>) : <><instancedMesh ref={ions} args={[undefined, undefined, 96]}><sphereGeometry args={[.12, 12, 8]}/><meshStandardMaterial color="#d6a16e" metalness={.3} roughness={.4}/></instancedMesh><instancedMesh ref={electrons} args={[undefined, undefined, 48]}><sphereGeometry args={[.035, 6, 4]}/><meshBasicMaterial color="#bcefe2"/></instancedMesh></>}
 </>;
}
export default function WireDive(props: Parameters<typeof Core>[0]) { return <Canvas camera={CAMERA} dpr={[1, 1.5]} aria-label="Đi từ vỏ nhựa đến lõi đồng và mạng tinh thể"><Core {...props}/></Canvas>; }
