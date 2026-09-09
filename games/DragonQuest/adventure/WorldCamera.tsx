import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { cameraDistance, CameraMode, WorldNode } from './worldLayout';

export function WorldCamera({ node, mode, overview, recenter, reduced, blocked, active, bounds }: {
    node: WorldNode; mode: CameraMode; overview: boolean; recenter: number;
    reduced: boolean; blocked: boolean; active: boolean;
    bounds: { x:number; z:number; width:number; depth:number };
}) {
    const controls = useRef<OrbitControlsImpl>(null);
    const { camera, size, invalidate } = useThree();
    const transitioning = useRef(true), initialized = useRef(false);
    const anchor = useRef(new Vector3()), destination = useRef(new Vector3());
    const direction = useRef(new Vector3(.28, .65, .8).normalize());
    const distance = useRef(14);
    const aspect = size.width / size.height;

    useEffect(() => {
        transitioning.current = true;
        distance.current = cameraDistance(aspect, overview, bounds);
        direction.current.set(.28, .65, .8).normalize();
        invalidate();
    }, [mode, overview, recenter, aspect, bounds, invalidate]);

    useFrame((_, dt) => {
        const control = controls.current;
        if (!control) return;
        const tracking = mode === 'follow' && !overview;
        if (!tracking && !transitioning.current && initialized.current) return;
        anchor.current.set(overview ? bounds.x : node.x, overview ? 1 : node.y, overview ? bounds.z : node.z - (active ? .2 : 1.6));
        // A wheel/pinch changes only the distance in follow mode.
        if (tracking && !transitioning.current) distance.current = Math.max(8, Math.min(24, camera.position.distanceTo(control.target)));
        destination.current.copy(anchor.current).addScaledVector(direction.current, distance.current);
        const factor = reduced || !initialized.current ? 1 : 1 - Math.exp(-Math.min(dt, .08) * 4.2);
        control.target.lerp(anchor.current, factor);
        camera.position.lerp(destination.current, factor);
        control.update();
        initialized.current = true;
        if (camera.position.distanceTo(destination.current) < .03) transitioning.current = false;
        if (transitioning.current || (tracking && camera.position.distanceTo(destination.current) > .02)) invalidate();
    });

    return <OrbitControls ref={controls} makeDefault enabled={!blocked}
        enableDamping={!reduced} dampingFactor={.09} enableRotate={mode === 'free'} enablePan={mode === 'free'}
        minDistance={overview ? 25 : 8} maxDistance={overview ? cameraDistance(aspect,true,bounds)*1.5 : 60}
        minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI * .36}
        zoomSpeed={.7} rotateSpeed={.5} panSpeed={.6}
        onStart={() => { transitioning.current = false; }} onChange={() => invalidate()} />;
}
