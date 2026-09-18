import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import type { CommandResult, FarmState } from '../core/types';
import { heightAt, isWater, ownedAt } from '../core/world';
import { ASSETS } from '../core/catalog';
import { familyParts, type Joint } from './familyModels';
import { createWalker, familyGarden, relocateWalker, stepWalker, type Walker } from './familyLife';

export const FAMILY = ['father', 'mother', 'son', 'daughter'] as const;
export type FamilyMember = typeof FAMILY[number];
export type FamilyWork = NonNullable<CommandResult['harvest']> & { key: string; member: FamilyMember; started: number };
export function harvestMember(work: NonNullable<CommandResult['harvest']>): FamilyMember {
    const o = work.obstacle, n = (o.x * 13 + o.z * 7 + (o.generation ?? 0)) >>> 0;
    return o.kind === 'berry' ? (['mother', 'son', 'daughter'] as const)[n % 3] : n % 2 ? 'mother' : 'father';
}
function createPerson(member: FamilyMember) {
    const joints = Object.fromEntries(['root', 'body', 'head', 'leftArm', 'rightArm', 'leftForearm', 'rightForearm', 'leftLeg', 'rightLeg', 'leftShin', 'rightShin'].map(id => [id, new T.Object3D()])) as Record<Joint, T.Object3D>;
    const attach = (id: Joint, parent: Joint, x: number, y: number, z = 0) => { joints[id].position.set(x, y, z); joints[parent].add(joints[id]); };
    attach('body', 'root', 0, .67); attach('head', 'body', 0, .60);
    for (const side of ['left', 'right'] as const) {
        const sign = side === 'left' ? -1 : 1;
        attach(`${side}Arm`, 'body', sign * .282, .42);
        attach(`${side}Forearm`, `${side}Arm`, 0, -.215);
        attach(`${side}Leg`, 'root', sign * .12, .62);
        attach(`${side}Shin`, `${side}Leg`, 0, -.26);
    }
    if (member === 'son' || member === 'daughter') joints.head.scale.setScalar(1.08);
    return { member, joints, parts: familyParts(member).map(part => ({ ...part, color: new T.Color(part.color), matrix: new T.Matrix4().compose(new T.Vector3(...part.p), new T.Quaternion().setFromEuler(new T.Euler(0, 0, part.tilt ?? 0)), new T.Vector3(...part.size)) })) };
}

/** A small bevel with shared vertices/geometry, no texture or model downloads. */
function softBox() {
    const geometry = new T.BoxGeometry(1, 1, 1, 2, 2, 2), positions = geometry.attributes.position, normals = geometry.attributes.normal;
    const p = new T.Vector3(), inner = new T.Vector3(), normal = new T.Vector3(), radius = .16;
    for (let i = 0; i < positions.count; i++) {
        p.fromBufferAttribute(positions, i); inner.copy(p).clampScalar(-.5 + radius, .5 - radius);
        normal.copy(p).sub(inner).normalize(); p.copy(inner).addScaledVector(normal, radius);
        positions.setXYZ(i, p.x, p.y, p.z); normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
    return geometry;
}

/** Two shared draws; ambient life is cosmetic. Requested harvesting takes priority. */
export function Family({ state: s, works, reduced, origin }: { state: FarmState; works: FamilyWork[]; reduced: boolean; origin: (work: FamilyWork, x: number, y: number) => void }) {
    const boxes = useRef<T.InstancedMesh>(null), rounds = useRef<T.InstancedMesh>(null), { camera, gl, invalidate } = useThree();
    const people = useMemo(() => FAMILY.map(createPerson), []);
    const boxGeometry = useMemo(softBox, []);
    useEffect(() => () => boxGeometry.dispose(), [boxGeometry]);
    const scratch = useMemo(() => ({ matrix: new T.Matrix4(), point: new T.Vector3() }), []);
    const home = s.entities.find(e => e.asset === 'home')!;
    const layout = s.entities.map(e => `${e.id}:${e.asset}:${e.x}:${e.z}:${e.rotation}:${!!e.stored}`).join('|') + '/' + s.plots.map(p => `${p.x}:${p.z}`).join('|');
    const garden = useMemo(() => familyGarden(s), [layout, s.world.heights, s.world.water, s.world.obstacles, s.world.owned, s.world.bridges]);
    const walkers = useRef<Walker[]>([]), assigned = useRef(new Set<FamilyMember>()), animationStep = useRef(0);
    useEffect(() => {
        FAMILY.forEach((member, i) => {
            if (!walkers.current[i]) walkers.current[i] = createWalker(garden, home.x + [-.9, .2, -.65, .45][i], home.z + [4.8, 4.85, 5.65, 5.7][i], s.world.seed ^ Math.imul(i + 1, 73856093));
            else relocateWalker(walkers.current[i], garden);
        });
        dirty.current = true; invalidate();
    }, [garden, home.x, home.z, invalidate]);
    const approaches = useMemo(() => new Map(works.map(work => {
        const o = work.obstacle;
        const free = (dx: number, dz: number, step: number) => {
            const x = o.x + dx * step, z = o.z + dz * step;
            return ownedAt(s.world, x, z) && !isWater(s.world, x, z) && heightAt(s.world, x, z) === heightAt(s.world, o.x, o.z)
                && !s.world.obstacles.some(v => !v.cleared && v.x === x && v.z === z)
                && !s.plots.some(p => p.x === x && p.z === z)
                && !s.entities.some(e => {
                    if (e.stored) return false;
                    const a = ASSETS[e.asset], width = e.rotation % 2 ? a.depth : a.width, depth = e.rotation % 2 ? a.width : a.depth;
                    return x >= e.x && x < e.x + width && z >= e.z && z < e.z + depth;
                });
        };
        const directions = [[0, 1], [-1, 0], [1, 0], [0, -1]];
        const direction = directions.find(([dx, dz]) => free(dx, dz, 1) && free(dx, dz, 2));
        const nearby = direction ?? directions.find(([dx, dz]) => free(dx, dz, 1));
        return [work.key, { direction: nearby ?? [0, 1], near: nearby ? .75 : 0, run: direction ? 1.15 : nearby ? .4 : 0 }] as const;
    })), [works, s.world.obstacles, s.world.heights, s.world.water, s.world.owned, s.entities, s.plots]);
    const notified = useRef(new Set<string>()), callback = useRef(origin); callback.current = origin;
    const dirty = useRef(true);
    useEffect(() => {
        const active = new Set(works.map(w => w.key));
        for (const key of notified.current) if (!active.has(key)) notified.current.delete(key);
        for (const work of works) if (!notified.current.has(work.key)) {
            notified.current.add(work.key);
            const o = work.obstacle;
            scratch.point.set(o.x + .5, heightAt(s.world, o.x, o.z) + 1, o.z + .5).project(camera);
            const rect = gl.domElement.getBoundingClientRect();
            callback.current(work, rect.left + (scratch.point.x + 1) * rect.width / 2, rect.top + (1 - scratch.point.y) * rect.height / 2);
        }
        dirty.current = true;
        invalidate();
    }, [works, home.x, home.z, s.world.heights, reduced, invalidate, camera, gl, scratch]);
    useFrame((_, delta) => {
        if (!boxes.current || !rounds.current || walkers.current.length !== FAMILY.length) return;
        if (document.hidden) return;
        if (reduced && !works.length && !dirty.current) return;
        animationStep.current += Math.min(.1, delta);
        if (!dirty.current && animationStep.current < 1 / 30) return;
        const dt = animationStep.current; animationStep.current = 0;
        dirty.current = false;
        let box = 0, round = 0;
        const now = performance.now();
        const reserved = new Set(walkers.current.filter(w => w.visible).map(w => w.path.at(-1) ?? Math.floor(w.z) * 96 + Math.floor(w.x)));
        const colors = !boxes.current.instanceColor || !rounds.current.instanceColor;
        people.forEach(({ member, parts, joints }, index) => {
            const work = works.find(w => w.member === member), child = index > 1;
            const age = work ? (now - work.started) / 1000 : 0;
            const walker = walkers.current[index];
            if (!walker) return;
            if (!work && assigned.current.has(member)) { relocateWalker(walker, garden); walker.pause = 2 + walker.rng() * 3; assigned.current.delete(member); }
            if (!work && !reduced) {
                stepWalker(walker, garden, dt, reserved, child ? 1.08 : .92);
                if (!walker.walking && !walker.greeting) {
                    const friend = walkers.current.find(other => other !== walker && other.visible && !other.walking && Math.hypot(other.x - walker.x, other.z - walker.z) < 2.2);
                    if (friend && walker.rng() < dt * .25) { walker.greeting = 9; walker.facing = Math.atan2(friend.x - walker.x, friend.z - walker.z); }
                }
            }
            const walking = !reduced && (work ? age < .55 : walker.walking), striking = !!work && age >= .55 && age < 1.65 && !reduced;
            let x = walker.x, z = walker.z, y = walker.y, heading = walker.heading;
            if (work) {
                const o = work.obstacle;
                const { direction, near, run } = approaches.get(work.key)!;
                const distance = near + (reduced ? 0 : run * (1 - Math.min(1, age / .55)));
                x = o.x + .5 + direction[0] * distance; z = o.z + .5 + direction[1] * distance;
                heading = Math.atan2(-direction[0], -direction[1]);
                y = heightAt(s.world, x, z);
                walker.x = x; walker.z = z; walker.y = y; walker.heading = walker.facing = heading;
                assigned.current.add(member);
            }
            const pastime = !work && !walking && !reduced ? walker.greeting > 6 ? 'wave' : walker.activity : null;
            const time = work ? age : walker.time;
            const stride = Math.sin(time * (work ? 22 : 9)), picking = striking && work?.obstacle.kind === 'berry';
            const swing = striking ? Math.sin((age - .55) * 14) : 0;
            joints.root.position.set(x, y + (walking ? Math.abs(stride) * .035 : 0), z);
            joints.root.rotation.set(0, heading, 0); joints.root.scale.setScalar(work || walker.visible ? child ? .72 : 1 : 0);
            joints.body.rotation.set(walking ? .13 : picking || pastime === 'tend' ? .30 : striking ? .10 + swing * .08 : 0, striking && !picking ? swing * .09 : 0, walking ? stride * .04 : 0);
            joints.head.rotation.set(picking || pastime === 'tend' ? .22 : walking ? -.10 : -.025, pastime === 'look' ? Math.sin(time * .75) * .20 : 0, child && !work ? (index === 2 ? -.07 : .06) : 0);
            for (const side of ['left', 'right'] as const) {
                const sign = side === 'left' ? -1 : 1, phase = stride * sign;
                joints[`${side}Leg`].rotation.x = walking ? phase * .58 : 0;
                joints[`${side}Shin`].rotation.x = walking ? Math.max(0, -phase) * .75 : 0;
                const arm = joints[`${side}Arm`], forearm = joints[`${side}Forearm`];
                arm.rotation.set(walking ? -phase * .60 : -.08, 0, -sign * .10);
                forearm.rotation.set(walking ? -.35 - Math.max(0, phase) * .28 : -.13, 0, 0);
                if (striking) {
                    arm.rotation.x = picking ? -.65 + Math.sin(age * 10 + sign) * .15 : side === 'right' ? -.85 + swing * .85 : -.45 + swing * .25;
                    forearm.rotation.x = picking ? -.65 : side === 'right' ? -.35 - Math.max(0, -swing) * .5 : -.55;
                } else if (pastime === 'tend') {
                    arm.rotation.x = -.6 + Math.sin(time * 3 + sign) * .12; forearm.rotation.x = -.55;
                } else if (pastime === 'wave' && side === 'right') {
                    arm.rotation.set(-.6, 0, -.9); forearm.rotation.set(-1.2, 0, Math.sin(time * 5) * .18);
                } else if (pastime === 'knock' && side === 'right') {
                    arm.rotation.x = -.85; forearm.rotation.x = -.55 + Math.sin(time * 5) * .15;
                } else if (pastime === 'rest') {
                    arm.rotation.x = -.1; forearm.rotation.x = -.65;
                }
            }
            joints.root.updateMatrixWorld(true);
            for (const part of parts) {
                scratch.matrix.multiplyMatrices(joints[part.joint].matrixWorld, part.matrix);
                if (part.tool && (!work || work.obstacle.kind === 'berry' || part.tool === 'axe' && work.obstacle.kind !== 'tree' || part.tool === 'pick' && work.obstacle.kind === 'tree')) scratch.matrix.makeScale(0, 0, 0);
                const mesh = part.shape === 'box' ? boxes.current! : rounds.current!, i = part.shape === 'box' ? box++ : round++;
                mesh.setMatrixAt(i, scratch.matrix); if (colors) mesh.setColorAt(i, part.color);
            }
        });
        for (const mesh of [boxes.current, rounds.current]) { mesh.instanceMatrix.needsUpdate = true; if (colors && mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
        if (works.length && !reduced) invalidate();
    });
    const boxCount = people.reduce((n, p) => n + p.parts.filter(p => p.shape === 'box').length, 0), roundCount = people.reduce((n, p) => n + p.parts.filter(p => p.shape === 'round').length, 0);
    return <group><instancedMesh ref={boxes} args={[boxGeometry, undefined, boxCount]} frustumCulled={false} raycast={() => {}}><meshStandardMaterial roughness={.9}/></instancedMesh><instancedMesh ref={rounds} args={[undefined, undefined, roundCount]} frustumCulled={false} raycast={() => {}}><sphereGeometry args={[1, 12, 6]}/><meshStandardMaterial roughness={.9}/></instancedMesh></group>;
}
