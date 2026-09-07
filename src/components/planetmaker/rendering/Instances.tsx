import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Instance, Shape } from './architecture';
export function shapeGeometry(shape: Shape) {
    if (shape === 'box') return new THREE.BoxGeometry(1, 1, 1);
    if (shape === 'cone') return new THREE.ConeGeometry(.5, 1, 10);
    if (shape === 'sphere') return new THREE.SphereGeometry(.5, 12, 8);
    if (shape === 'cylinder') return new THREE.CylinderGeometry(.5, .5, 1, 12);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-.5,-.5,-.5, .5,-.5,-.5, 0,.5,-.5, -.5,-.5,.5, .5,-.5,.5, 0,.5,.5], 3));
    g.setIndex([0,2,1, 3,4,5, 0,3,5, 0,5,2, 1,2,5, 1,5,4, 0,1,4, 0,4,3]); g.computeVertexNormals(); return g;
}
export function Batch({ shape, items, onSelect, onDown, opacity = 1, tint }: { shape: Shape; items: Instance[]; onSelect?: (id: string) => void; onDown?: (e: ThreeEvent<PointerEvent>) => void; opacity?: number; tint?: string }) {
    const ref = useRef<THREE.InstancedMesh>(null), geometry = useMemo(() => shapeGeometry(shape), [shape]);
    const capacity = 2 ** Math.ceil(Math.log2(Math.max(1, items.length)));
    useLayoutEffect(() => {
        const mesh = ref.current; if (!mesh) return;
        const obj = new THREE.Object3D(), color = new THREE.Color();
        items.forEach((v, i) => { obj.position.set(...v.position); obj.scale.set(...v.scale); obj.rotation.set(v.pitch || 0, v.yaw || 0, 0, 'YXZ'); obj.updateMatrix(); mesh.setMatrixAt(i, obj.matrix); mesh.setColorAt(i, color.set(tint || v.color)); });
        mesh.count = items.length; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
    }, [items, capacity, tint]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return <instancedMesh key={capacity} ref={ref} args={[geometry, undefined, capacity]} raycast={onSelect || onDown ? THREE.InstancedMesh.prototype.raycast : () => null} onPointerDown={onDown || (onSelect ? e => { const id = items[e.instanceId ?? -1]?.id; if (id) { e.stopPropagation(); onSelect(id); } } : undefined)} castShadow={opacity === 1} receiveShadow>
        <meshStandardMaterial roughness={.78} flatShading={shape === 'gable'} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
    </instancedMesh>;
}
