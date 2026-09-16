import BoardCamera from '../shared/BoardCamera';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { boardTexture, faceTexture, gardenGeometry, point, slab } from './geometry';
import type { Match, Move } from './model';
export interface Motion extends Move { piece: number; at: number; duration: number }
export interface BoardProps { match: Match; selected: number | null; moves: Move[]; enabled: boolean; vietnamese: boolean; flip: boolean; reduced?: boolean; view: 'straight' | 'tilted'; light: boolean; motion: Motion | null; checked: boolean; onPick(square: number): void; onFailure(): void }
function Camera({flip,view,reduced}: Pick<BoardProps,'flip'|'view'|'reduced'>) {
  const {size}=useThree();
  return <BoardCamera flip={flip} top={view==='straight'} reduced={reduced} distance={Math.max(17.5,16/Math.max(.5,size.width/size.height))}/>;
}
function Pieces(p: BoardProps) {
  const bodies = useRef<T.InstancedMesh>(null), faces = useRef(new Map<number, T.InstancedMesh>()), { invalidate } = useThree();
  const pieces = useMemo(() => p.match.board.flatMap((piece, square) => piece ? [{ piece, square }] : []), [p.match.board]);
  const types = useMemo(() => [...new Set(pieces.map(entry => entry.piece))], [pieces]);
  const textures = useMemo(() => new Map(Array.from({ length: 14 }, (_, i) => { const code = i < 7 ? i + 1 : -(i - 6); return [code, faceTexture(code, p.vietnamese)] as const; })), [p.vietnamese]);
  const dummy = useMemo(() => new T.Object3D(), []);
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures]);
  function update(t: number) {
    const slots = new Map<number, number>();
    pieces.forEach(({ piece, square }, index) => {
      const target = point(square), moving = p.motion?.to === square;
      let [x, y, z] = target;
      if (moving && p.motion) { const source = point(p.motion.from), ease = t * t * (3 - 2 * t); x = T.MathUtils.lerp(source[0], x, ease); z = T.MathUtils.lerp(source[2], z, ease); y += Math.sin(Math.PI * t) * .4; }
      if (p.selected === square) y += .07;
      dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); bodies.current?.setMatrixAt(index, dummy.matrix);
      const slot = slots.get(piece) ?? 0, face = faces.current.get(piece); slots.set(piece, slot + 1);
      dummy.position.y += .126; dummy.rotation.set(-Math.PI / 2, 0, p.flip ? Math.PI : 0); dummy.updateMatrix(); face?.setMatrixAt(slot, dummy.matrix);
    });
    if (bodies.current) { bodies.current.count = pieces.length; bodies.current.instanceMatrix.needsUpdate = true; bodies.current.computeBoundingSphere(); }
    for (const [piece, mesh] of faces.current) { mesh.count = slots.get(piece) ?? 0; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
  }
  useEffect(() => { update(p.motion ? 0 : 1); invalidate(); }, [pieces, p.selected, p.flip, p.motion, textures]);
  useFrame(() => { if (p.motion) { const t = Math.min(1, (performance.now() - p.motion.at) / p.motion.duration); update(t); if (t < 1) invalidate(); } });
  return <><instancedMesh ref={bodies} args={[undefined, undefined, 32]} castShadow receiveShadow><cylinderGeometry args={[.405, .42, .24, 40]}/><meshStandardMaterial color='#c79e65' roughness={.48}/></instancedMesh>
    {types.map(piece => <instancedMesh key={`${piece}:${p.vietnamese}`} ref={ref => { if (ref) faces.current.set(piece, ref); else faces.current.delete(piece); }} args={[undefined, undefined, 5]}><circleGeometry args={[.403, 40]}/><meshBasicMaterial map={textures.get(piece)} toneMapped={false}/></instancedMesh>)}
  </>;
}
function Markers(p: BoardProps) {
  const legal = useRef<T.InstancedMesh>(null), dummy = useMemo(() => new T.Object3D(), []);
  useEffect(() => { p.moves.forEach((move, index) => { const [x, , z] = point(move.to); dummy.position.set(x, .1, z); dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.scale.setScalar(p.match.board[move.to] ? 3 : 1); dummy.updateMatrix(); legal.current?.setMatrixAt(index, dummy.matrix); }); if (legal.current) { legal.current.count = p.moves.length; legal.current.instanceMatrix.needsUpdate = true; legal.current.computeBoundingSphere(); } }, [p.moves, p.match.board, dummy]);
  const ring = (square: number, color: string, radius: number, key: string) => <mesh key={key} position={[point(square)[0], .095, point(square)[2]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius, radius + .045, 48]}/><meshBasicMaterial color={color} transparent opacity={.9} depthWrite={false}/></mesh>;
  const last = p.match.history.at(-1), king = p.match.board.findIndex(piece => piece === (p.match.active === 0 ? 1 : -1));
  return <><instancedMesh ref={legal} args={[undefined, undefined, 90]}><ringGeometry args={[.065, .12, 24]}/><meshBasicMaterial color='#356b48' transparent opacity={.8} depthWrite={false}/></instancedMesh>{p.selected !== null && ring(p.selected, '#348166', .46, 'selected')}{p.checked && king >= 0 && ring(king, '#cf5140', .47, 'check')}{last && [last.from, last.to].map((square, i) => ring(square, '#b27f37', .43, `last-${i}`))}</>;
}
function Scene(p: BoardProps) {
  const { gl, scene, invalidate } = useThree();
  const board = useMemo(() => slab(9.65, 10.65, .43), []), table = useMemo(() => slab(11.3, 12.3, .25, .25), []), garden = useMemo(gardenGeometry, []), map = useMemo(() => boardTexture(p.vietnamese), [p.vietnamese]);
  useEffect(() => () => { board.dispose(); table.dispose(); garden.dispose(); }, [board, table, garden]);
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => { const room = new RoomEnvironment(), generator = new T.PMREMGenerator(gl), env = generator.fromScene(room, .04); scene.environment = env.texture; scene.environmentIntensity = .35; room.dispose(); generator.dispose(); invalidate(); return () => { scene.environment = null; env.dispose(); }; }, [gl, scene, invalidate]);
  useEffect(() => { const lost = (e: Event) => { e.preventDefault(); p.onFailure(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, p.onFailure]);
  useFrame(() => { if (import.meta.env.DEV) { gl.domElement.dataset.triangles = String(gl.info.render.triangles); gl.domElement.dataset.drawCalls = String(gl.info.render.calls); } });
  return <><Camera flip={p.flip} view={p.view} reduced={p.reduced}/><color attach='background' args={['#d6ddca']}/><fog attach='fog' args={['#d6ddca', 70, 120]}/><ambientLight intensity={.3}/><hemisphereLight args={['#fff8e2', '#84916c', .8]}/><directionalLight position={[-5, 14, 6]} intensity={1.8} castShadow={!p.light} shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.035}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow><planeGeometry args={[120, 120]}/><meshStandardMaterial color='#b7bea5' roughness={1}/></mesh>
    {!p.light && <mesh geometry={garden} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={.8}/></mesh>}
    <mesh geometry={table} position={[0, -.83, 0]} receiveShadow castShadow><meshStandardMaterial color='#836043' roughness={.65}/></mesh>
    <group onClick={event => { event.stopPropagation(); if (!p.enabled || event.delta > 6) return; const file = Math.round(event.point.x + 4), rank = Math.round(4.5 - event.point.z); if (file >= 0 && file < 9 && rank >= 0 && rank < 10) p.onPick(rank * 9 + file); }}>
      <mesh geometry={board} position={[0, -.42, 0]} castShadow receiveShadow><meshStandardMaterial color='#b5874e' roughness={.48}/></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .075, 0]} receiveShadow><planeGeometry args={[9.6, 10.6]}/><meshStandardMaterial map={map} roughness={.76}/></mesh>
      <Pieces {...p}/><Markers {...p}/>
    </group>
  </>;
}
export default function Board3D(p: BoardProps) { return <Canvas role='img' aria-label='Bàn cờ tướng 3D. Chọn quân rồi chọn giao điểm. Chuyển 2D để chơi bằng bàn phím.' camera={{ position: [0, 17, 11], fov: 39, near: .1, far: 150 }} dpr={p.light ? 1 : [1, 1.5]} shadows={!p.light} frameloop='demand' gl={{ antialias: true, powerPreference: 'low-power' }} onPointerMissed={() => p.enabled && p.onPick(-1)}><Scene {...p}/></Canvas>; }
