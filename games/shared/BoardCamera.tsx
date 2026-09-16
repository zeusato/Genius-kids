import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import { Spherical, Vector3 } from 'three';
import { nearestAngle, TURN_ROTATION_MS } from './seating';

/** Turn the camera around the board while keeping manual orbit within ±.42 rad. */
export default function BoardCamera({ flip, top, distance, reduced = false, targetY = 0 }: {
  flip: boolean; top: boolean; distance: number; reduced?: boolean; targetY?: number;
}) {
  const { camera, invalidate } = useThree(), controls = useRef<Controls>(null);
  const previous = useRef<boolean | null>(null);
  const turn = useRef<{ at: number; from: Spherical; to: number } | null>(null);
  const target = new Vector3(0, targetY, 0);
  const limits = (theta: number) => {
    if (!controls.current) return;
    controls.current.minAzimuthAngle = theta - .42;
    controls.current.maxAzimuthAngle = theta + .42;
  };
  useEffect(() => {
    const theta = flip ? Math.PI : 0;
    if (previous.current !== null && previous.current !== flip && !reduced) {
      const from = new Spherical().setFromVector3(camera.position.clone().sub(target));
      turn.current = { at: performance.now(), from, to: nearestAngle(from.theta, theta) };
      if (controls.current) controls.current.enabled = false;
    } else {
      turn.current = null;
      limits(theta);
      camera.position.set(0, top ? distance : distance * .88, (flip ? -1 : 1) * (top ? .01 : distance * .57));
      camera.lookAt(target);
      if (controls.current) { controls.current.enabled = true; controls.current.target.copy(target); controls.current.update(); }
    }
    previous.current = flip;
    invalidate();
  }, [camera, distance, top, flip, reduced, targetY, invalidate]);
  useFrame(() => {
    const motion = turn.current;
    if (!motion) return;
    const progress = Math.min(1, (performance.now() - motion.at) / TURN_ROTATION_MS);
    const eased = progress * progress * (3 - 2 * progress);
    const theta = motion.from.theta + (motion.to - motion.from.theta) * eased;
    limits(theta);
    camera.position.setFromSpherical(new Spherical(motion.from.radius, motion.from.phi, theta)).add(target);
    camera.lookAt(target);
    controls.current?.target.copy(target);
    controls.current?.update();
    if (progress === 1) { turn.current = null; if (controls.current) controls.current.enabled = true; }
    else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false} rotateSpeed={.45} zoomSpeed={.55} minDistance={12} maxDistance={distance * 1.25} minPolarAngle={.001} maxPolarAngle={.8}/>;
}
