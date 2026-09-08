import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { heightAt, Region } from '../engine/region';
import { vehicleRoutes, routePosition, WalkRoute } from '../engine/traffic';
import { vehicleParts } from './vehicleModels';
import { shapeGeometry } from './Instances';

function VehicleBatch({ shape, region, routes, animate }: { shape: 'box' | 'cylinder'; region: Region; routes: WalkRoute[]; animate: boolean }) {
    const mesh = useRef<THREE.InstancedMesh>(null), elapsed = useRef(0);
    const geometry = useMemo(() => shapeGeometry(shape), [shape]);
    const data = useMemo(() => routes.flatMap((_, index) => vehicleParts(index % 6)[shape].map(p => {
        const local = new THREE.Object3D(); local.position.set(...p.position); local.scale.set(...p.scale); local.rotation.set(0, 0, p.roll || 0); local.updateMatrix();
        return { vehicle: index, matrix: local.matrix.clone(), color: p.color };
    })), [routes, shape]);
    const capacity = Math.max(1, data.length), vehicle = useMemo(() => new THREE.Object3D(), []), matrix = useMemo(() => new THREE.Matrix4(), []);
    const transforms = useMemo(() => routes.map(() => new THREE.Matrix4()), [routes]);
    useLayoutEffect(() => { if (mesh.current) { data.forEach((p, i) => mesh.current!.setColorAt(i, new THREE.Color(p.color))); mesh.current.count = data.length; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true; } }, [data]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame((_, delta) => {
        if (!mesh.current) return; if (animate) elapsed.current += Math.min(delta, .1);
        routes.forEach((route, i) => { const p = routePosition(route, elapsed.current, .12); vehicle.position.set(p.x - 32, heightAt(region, p.x, p.z) + .04, p.z - 32); vehicle.rotation.y = p.yaw; vehicle.updateMatrix(); transforms[i].copy(vehicle.matrix); });
        data.forEach((p, i) => mesh.current!.setMatrixAt(i, matrix.multiplyMatrices(transforms[p.vehicle], p.matrix)));
        mesh.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh key={capacity} ref={mesh} args={[geometry, undefined, capacity]} frustumCulled={false} raycast={() => null} castShadow><meshStandardMaterial roughness={.65} /></instancedMesh>;
}
export function Vehicles({ region, version, animate }: { region: Region; version: number; animate: boolean }) {
    const routes = useMemo(() => vehicleRoutes(region), [region, version]);
    return <><VehicleBatch shape="box" region={region} routes={routes} animate={animate} /><VehicleBatch shape="cylinder" region={region} routes={routes} animate={animate} /></>;
}
