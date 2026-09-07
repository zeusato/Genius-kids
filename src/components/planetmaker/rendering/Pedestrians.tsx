import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { heightAt, Region } from '../engine/region';
import { pedestrianRoutes, routePosition } from '../engine/traffic';

export function Pedestrians({ region, version, animate }: { region: Region; version: number; animate: boolean }) {
    const bodies = useRef<THREE.InstancedMesh>(null), heads = useRef<THREE.InstancedMesh>(null), legs = useRef<THREE.InstancedMesh>(null);
    const routes = useMemo(() => pedestrianRoutes(region), [region, version]), time = useRef(0), obj = useMemo(() => new THREE.Object3D(), []), color = useMemo(() => new THREE.Color(), []);
    useFrame((_, delta) => {
        if (!bodies.current || !heads.current || !legs.current) return;
        if (animate) time.current += Math.min(delta, .1);
        routes.forEach((route, i) => {
            const p = routePosition(route, time.current), y = heightAt(region, p.x, p.z), stride = Math.sin(time.current * 8 + route.phase) * .45;
            obj.position.set(p.x - 32, y + .43, p.z - 32); obj.scale.set(1, 1, 1); obj.rotation.set(0, p.yaw, 0); obj.updateMatrix(); bodies.current!.setMatrixAt(i, obj.matrix);
            bodies.current!.setColorAt(i, color.set(['#e7a35c', '#6f97cf', '#b77fbd', '#72ad8b', '#dc7e74'][i % 5]));
            obj.position.y = y + .68; obj.updateMatrix(); heads.current!.setMatrixAt(i, obj.matrix);
            for (let side = 0; side < 2; side++) { const offset = side ? .065 : -.065; obj.position.set(p.x - 32 + Math.cos(p.yaw) * offset, y + .19, p.z - 32 - Math.sin(p.yaw) * offset); obj.rotation.set(side ? stride : -stride, p.yaw, 0, 'YXZ'); obj.updateMatrix(); legs.current!.setMatrixAt(i * 2 + side, obj.matrix); }
        });
        for (const mesh of [bodies.current, heads.current, legs.current]) { mesh.count = routes.length * (mesh === legs.current ? 2 : 1); mesh.instanceMatrix.needsUpdate = true; }
        if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    });
    return <group>
        <instancedMesh ref={bodies} args={[undefined, undefined, 48]} frustumCulled={false} raycast={() => null}><boxGeometry args={[.25, .3, .16]} /><meshStandardMaterial /></instancedMesh>
        <instancedMesh ref={heads} args={[undefined, undefined, 48]} frustumCulled={false} raycast={() => null}><sphereGeometry args={[.115, 8, 6]} /><meshStandardMaterial color="#edc69f" /></instancedMesh>
        <instancedMesh ref={legs} args={[undefined, undefined, 96]} frustumCulled={false} raycast={() => null}><boxGeometry args={[.085, .25, .1]} /><meshStandardMaterial color="#40576a" /></instancedMesh>
    </group>;
}
