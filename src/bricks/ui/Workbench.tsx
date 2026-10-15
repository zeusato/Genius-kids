import { readMetrics, recordMetric } from '../progress/metrics';
import type { BricksEvent } from '../progress/progress';
// Màn lắp (plan mục 7). GĐ1: bản thử tương tác + hình ảnh — khay tối giản, 4 chế độ, bóng mờ, ↻, hoàn tác, A/B.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { World } from '../engine/world';
import { History } from '../engine/history';
import { pick, type Hit } from '../engine/pick';
import { suggest, type Candidate } from '../engine/place';
import { YAW, compose } from '../engine/orient';
import type { V3 } from '../engine/types';
import { decodeInto, LIMITS, type BrickModel } from '../engine/model';
import type { Step } from '../export/steps';
import { PartLibrary } from '../render/loader';
import { Materials, detectQuality, hasSavedQuality, type Quality } from '../render/materials';
import { buildBom } from '../export/bom';
import { GROUP_ICON, PRESCHOOL_PARTS, shortName, subgroupsOf } from '../content/groups';
import { PartViewer } from './PartViewer';
import { Dialog } from './Dialog';
import { placeMenu, projectBox } from './placeMenu';
import { ModelMeshes, buildSingle, pieceMatrix } from '../render/modelMeshes';
import { BrickCanvas, type CanvasApi } from '../render/BrickCanvas';
import { GestureMachine } from '../input/gesture';
import { IconRenderer } from '../render/icons';
import { Fx } from '../render/fx';
import { sfx, haptic } from './sound';
import { speak, cancelSpeech } from '../../utils/speech';
import './bricks.css';

export type Mode = 'build' | 'paint' | 'erase' | 'select';
/** Nút ⬒ Góc (mục 7.6): lần lượt Nghiêng → Trước → Phải → Trên. */
const VIEWS = [['iso', 'Nghiêng'], ['front', 'Trước'], ['right', 'Phải'], ['top', 'Trên']] as const;
interface Held { part: string; o: number }

export interface WorkbenchProps {
  preschool?: boolean;
  onPlaced?: (event: BricksEvent) => void;
  /** Cho bản thử: hiện công tắc A/B, số đo, nút thêm 2.000 mảnh. */
  lab?: boolean;
  onChange?: (world: World) => void;
  onReady?: (world: World) => void;
  initialQuality?: Quality;
  /** Khoá localStorage đánh dấu đã xem hướng dẫn lần đầu (theo học sinh). Không có = không hiện. */
  coachKey?: string;
  /** Lắp theo hướng dẫn (GĐ5): mô hình nguồn + các bước. */
  guide?: { source: World; steps: Step[] };
  onGuideDone?: () => void;
  /** Mô hình mở sẵn (từ Tủ Mô Hình). */
  initial?: BrickModel;
  /** Thanh trên: nút quay lại + tên (do Tủ Mô Hình cung cấp). */
  header?: React.ReactNode;
  /** Cho bên ngoài: chụp ảnh thu nhỏ, lấy thế giới, đặt góc nhìn. */
  control?: React.MutableRefObject<WorkbenchControl | null>;
}
export interface WorkbenchControl { world: World; lib: PartLibrary; thumbnail(): Promise<Blob | null> }

export function Workbench({ preschool = false, lab = false, onChange, onReady, initialQuality, initial, header, control, coachKey, guide, onGuideDone, onPlaced }: WorkbenchProps) {
  const [lib, setLib] = useState<PartLibrary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [held, setHeld] = useState<Held | null>(null);
  const [color, setColor] = useState('red');
  const [mode, setMode] = useState<Mode>('build');
  const [group, setGroup] = useState('brick');
  const [ghost, setGhost] = useState<Candidate | null>(null);
  const [quick, setQuick] = useState(false);
  const [offset, setOffset] = useState(40);
  const [quality, setQualityState] = useState<Quality>(() => initialQuality ?? detectQuality());
  const setQuality = (q: Quality) => { setQualityState(q); try { localStorage.setItem('bricks-quality', q); } catch { /* bỏ qua */ } };
  const [lost, setLost] = useState(false);
  /** Máy không có WebGL: vẫn xem/tải được danh sách mảnh (mục 8.4). */
  const webgl = useMemo(() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }, []);
  const [stats, setStats] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [explode, setExplode] = useState(0);
  const [settings, setSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [sub, setSub] = useState<string | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  /** Bảng màu gọn (góp ý chủ dự án 15/10): nút màu đang chọn + dải màu vừa dùng; bảng đủ màu chỉ bật lên khi cần. */
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['red', 'yellow', 'blue', 'white', 'green']);
  // chạm ra ngoài bảng màu thì đóng
  useEffect(() => {
    if (!paletteOpen) return;
    const away = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.bk-palette, .bk-current')) setPaletteOpen(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [paletteOpen]);
  const [recent, setRecent] = useState<string[]>([]);
  const onPlacedRef = useRef(onPlaced); onPlacedRef.current = onPlaced;
  const selectedAt = useRef(0), placedAt = useRef(0), rotations = useRef(0);
  const moving = useRef<number | null>(null);
  const choice = useRef(0);
  const trayCleanup = useRef<() => void>(() => {});
  const lastSpeech = useRef(0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const say = (text: string) => { if (Date.now() - lastSpeech.current >= 1500) { lastSpeech.current = Date.now(); speak(text); } };
  useEffect(() => () => { choice.current++; trayCleanup.current(); cancelSpeech(); }, []);
  // --- Lắp theo hướng dẫn ---
  const [guideStep, setGuideStep] = useState(0);
  const [guideDone, setGuideDone] = useState<Set<number>>(() => new Set());
  const guideRef = useRef({ step: 0, done: new Set<number>() }); guideRef.current = { step: guideStep, done: guideDone };
  /** Mảnh nguồn còn cần lắp ở bước hiện tại. */
  const guideTargets = () => guide ? (guide.steps[guideRef.current.step]?.pieces ?? []).filter(id => !guideRef.current.done.has(id)).map(id => guide.source.pieces.get(id)!) : [];
  /** Ứng viên có khớp một mảnh nguồn của bước hiện tại không (đúng mảnh, màu, vị trí, hướng tương đương). */
  const matchTarget = (c: Candidate, color: string) => guideTargets().find(t => t.part === c.part && t.color === color && t.pos.every((v, i) => Math.abs(v - c.pos[i]) < 0.5) && t.def.symClass[t.o] === t.def.symClass[c.o]);
  // --- Xem quá trình lắp ---
  const [replay, setReplay] = useState<number | null>(null);
  useEffect(() => {
    if (replay === null) return;
    const total = worldRef.current?.pieces.size ?? 0;
    if (replay >= total) { const t = window.setTimeout(() => setReplay(null), 900); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => { setReplay(r => (r === null ? null : r + 1)); sfx.tick(); }, Math.max(60, 2400 / Math.max(total, 1)));
    return () => window.clearTimeout(t);
  }, [replay]);
  // Hướng dẫn lần đầu (plan mục 7.7): 0 chọn gạch → 1 đặt + lắp → 2 xoay xem → xong
  const COACH = ['Chọn một viên gạch ở khay bên dưới nhé!', 'Chạm lên bàn để đặt thử, chạm lần nữa hoặc bấm nút xanh để lắp.', 'Kéo một ngón tay trên khung để xoay xem mô hình.'];
  const [coach, setCoach] = useState<number>(() => { try { return coachKey && !localStorage.getItem(coachKey) ? 0 : -1; } catch { return -1; } });
  const coachRef = useRef(coach); coachRef.current = coach;
  const advanceCoach = (from: number) => {
    if (coachRef.current !== from) return;
    const next = from + 1 < COACH.length ? from + 1 : -1;
    setCoach(next);
    if (next < 0) { cancelSpeech(); try { if (coachKey) localStorage.setItem(coachKey, '1'); } catch { /* bỏ qua */ } }
  };
  useEffect(() => { if (coach >= 0) speak(COACH[coach]); return () => cancelSpeech(); }, [coach]);
  const selectedRef = useRef(selected); selectedRef.current = selected;

  const api = useRef<CanvasApi>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const histRef = useRef<History | null>(null);
  const lastHit = useRef<Hit | null>(null);
  const trayDrag = useRef(false);
  const heldRef = useRef(held); heldRef.current = held;
  const ghostRef = useRef(ghost); ghostRef.current = ghost;
  const modeRef = useRef(mode); modeRef.current = mode;
  const colorRef = useRef(color); colorRef.current = color;
  const quickRef = useRef(quick); quickRef.current = quick;

  useEffect(() => {
    let alive = true;
    let loaded: PartLibrary | undefined;
    PartLibrary.load().then(async l => {
      loaded = l;
      if (!alive) { l.dispose(); return; }
      await l.ensureGroups(['brick', 'plate']);
      if (!alive) return;
      const w = new World(l.catalog);
      if (initial) {
        if (initial.parts.some(p => !l.catalog.parts[p]) || initial.colors.some(c => !l.catalog.palette.some(p => p.key === c))) throw Error('Mô hình có mảnh hoặc màu cần bản app mới hơn. Hãy cập nhật app để mở; bản lưu vẫn được giữ nguyên.');
        await l.ensureParts(initial.parts);
        const r = decodeInto(w, initial);
        if (r.unknownParts.length) setToast(`Có ${r.skipped} mảnh cần bản app mới hơn — đã giữ nguyên trong bản lưu.`);
      }
      if (!alive) return;
      worldRef.current = w; histRef.current = new History(w);
      setLib(l); onReady?.(w);
    }).catch(e => alive && setError(String(e.message || e)));
    return () => { alive = false; loaded?.dispose(); };
  }, []);

  useEffect(() => {
    if (!control || !lib || !worldRef.current) return;
    control.current = {
      world: worldRef.current,
      lib,
      thumbnail: async () => {
        const a = api.current, w = worldRef.current; if (!a || !w) return null;
        // khung ảnh: vừa mô hình, góc nghiêng chuẩn, không bóng mờ
        const saved = ghostRef.current; ghostRef.current = null; drawOverlay();
        const blob = await a.snapshot(320, 240);
        ghostRef.current = saved; drawOverlay();
        return blob;
      },
    };
    return () => { control.current = null; };
  }, [control, lib]);

  // Tự chọn mức chất lượng (mục 8.3): đo 3 s đầu phiên; chỉ khi chưa ai chọn tay và không phải bản thử có ?q=.
  useEffect(() => {
    if (!lib || initialQuality || hasSavedQuality()) return;
    let alive = true;
    const run = async () => {
      await new Promise(r => setTimeout(r, 1500));          // chờ biên dịch shader + dựng mô hình
      for (let round = 0; round < 2 && alive; round++) {
        const fps = await api.current?.benchmark(3000) ?? -1;
        if (!alive || fps < 0) return;                         // tab ẩn: không đo (bẫy mục 17)
        const q = qualityRef.current, next: Quality | null = q === 'high' && fps < 40 ? 'mid' : q === 'mid' && fps < 28 ? 'low' : null;
        if (!next) return;
        setQualityState(next);
        flash(next === 'mid' ? 'Đã chọn chất lượng Vừa cho máy này (đổi trong ⚙)' : 'Đã chọn chất lượng Tiết kiệm cho máy này (đổi trong ⚙)');
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    void run();
    return () => { alive = false; };
  }, [lib]);

  // Bản thử: mở cửa cho script kiểm tra (thêm mảnh, dựng lại, camera)
  useEffect(() => {
    if (!lab || !lib) return;
    (window as any).__bricksLab = { world: worldRef.current, history: histRef.current, bump: () => setVersion(v => v + 1), api: () => api.current, lib };
  }, [lab, lib]);

  const qualityRef = useRef(quality); qualityRef.current = quality;
  const mats = useMemo(() => lib && new Materials(lib.catalog, quality), [lib, quality]);
  const model = useMemo(() => (lib && mats ? new ModelMeshes(lib, mats) : null), [lib, mats]);
  const icons = useMemo(() => (lib && mats ? new IconRenderer(lib, mats) : null), [lib, mats]);
  useEffect(() => () => icons?.dispose(), [icons]);
  useEffect(() => () => model?.clear(), [model]);
  const [groupReady, setGroupReady] = useState(0);
  useEffect(() => { if (lib) void lib.ensureGroups(group === 'recent' ? [...new Set(recent.map(k => lib.catalog.parts[k].group))] : [group]).then(() => setGroupReady(v => v + 1)).catch(e => setToast(String(e.message || e))); }, [lib, group]);
  const overlay = useMemo(() => new THREE.Group(), []);
  const fx = useMemo(() => { const f = new Fx(() => api.current?.invalidate(), reducedMotion); overlay.add(f.group); return f; }, [overlay]);
  useEffect(() => () => fx.dispose(), [fx]);
  /** Tháo kèm "bụp": hạt văng màu của mảnh. */
  const removeWithPop = (id: number) => {
    const w = worldRef.current, p = w?.pieces.get(id), m = mats;
    if (p && m) fx.pop([(p.bbox[0] + p.bbox[3]) / 2, (p.bbox[1] + p.bbox[4]) / 2, (p.bbox[2] + p.bbox[5]) / 2], m.color(p.color).color);
    histRef.current?.remove(id); sfx.pop(); haptic(10);
  };
  useEffect(() => () => { mats?.dispose(); }, [mats]);

  // Dựng lại mô hình khi thế giới đổi
  useEffect(() => {
    const w = worldRef.current;
    if (!w || !model || !lib) return;
    let alive = true;
    lib.ensureParts([...w.pieces.values()].map(p => p.part)).then(() => {
      if (!alive) return;
      const hidden = replay === null ? undefined : new Set([...w.pieces.keys()].slice(replay));
      model.rebuild(w, { explode, hidden });
      const s = model.stats;
      setStats(`${s.pieces} mảnh · ${s.studs} núm · ${s.drawCalls} lệnh vẽ · ${(s.triangles / 1000).toFixed(0)}k tam giác`);
      drawOverlay();
      api.current?.invalidate();
    });
    return () => { alive = false; };
  }, [version, model, explode, replay]);
  // báo thay đổi chỉ khi dữ liệu đổi (không báo khi kéo Nổ tung)
  useEffect(() => { if (worldRef.current) onChange?.(worldRef.current); }, [version]);

  // --- Bóng mờ và các lớp phủ ---
  const drawOverlay = useCallback(() => {
    for (const c of [...overlay.children]) {
      if (c.userData.keep) continue;   // lớp hiệu ứng (fx) tự quản
      if (c.userData.transient) { const m = c as THREE.Mesh; m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
      overlay.remove(c);
    }
    const w = worldRef.current, g = ghostRef.current, h = heldRef.current;
    if (!w || !lib || !mats) return;
    if (g && h && lib.has(g.part)) {
      const tint = mats.color(colorRef.current).color;
      const mat = g.ok ? mats.ghostOk : mats.ghostBad;
      if (g.ok) mats.ghostOk.color.copy(tint);
      const body = buildSingle(lib, w.catalog, g.part, () => mat);
      const xray = buildSingle(lib, w.catalog, g.part, () => mats.xray);
      for (const obj of [body, xray]) { obj.matrixAutoUpdate = false; obj.matrix.copy(pieceMatrix(g.pos, g.o, new THREE.Matrix4(), 1)); overlay.add(obj); }
      xray.renderOrder = 10;
      // đường rơi + ô bóng đổ dưới chân
      const bb = w.shape(g.part, g.pos, g.o).bbox;
      const cx = (bb[0] + bb[3]) / 2, cz = (bb[2] + bb[5]) / 2;
      if (bb[4] < -2) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx, bb[4], cz), new THREE.Vector3(cx, -0.5, cz)]),
          new THREE.LineDashedMaterial({ color: g.ok ? '#2d8cff' : '#ff5a5a', dashSize: 4, gapSize: 3, transparent: true, opacity: 0.8 }));
        line.userData.transient = true; line.computeLineDistances(); overlay.add(line);
      }
      const foot = new THREE.Mesh(new THREE.PlaneGeometry(bb[3] - bb[0], bb[5] - bb[2]), new THREE.MeshBasicMaterial({ color: '#1b2a34', transparent: true, opacity: 0.12, depthWrite: false }));
      foot.userData.transient = true; foot.rotation.x = Math.PI / 2; foot.position.set(cx, -0.3, cz); overlay.add(foot);
      // các điểm nối sắp khớp sáng lên
      for (const j of g.joins) {
        const [p] = j.key.split('|'); const [x, y, z] = p.split(',').map(v => Number(v) / 8);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#21d07a', transparent: true, opacity: 0.85, depthTest: false }));
        dot.userData.transient = true; dot.position.set(x, y, z); dot.renderOrder = 11; overlay.add(dot);
      }
    }
    // gợi ý của bước hướng dẫn: bóng xanh
    for (const t of guideTargets()) {
      if (!lib.has(t.part)) continue;
      const g = buildSingle(lib, w.catalog, t.part, () => mats.hint);
      g.matrixAutoUpdate = false; g.matrix.copy(pieceMatrix(t.pos, t.o, new THREE.Matrix4(), 1)); overlay.add(g);
    }
    // mảnh đang chọn: phủ vàng
    const sel = selectedRef.current !== null ? w.pieces.get(selectedRef.current) : undefined;
    if (sel && lib.has(sel.part)) {
      const m = buildSingle(lib, w.catalog, sel.part, () => mats.highlight);
      m.matrixAutoUpdate = false; m.matrix.copy(pieceMatrix(sel.pos, sel.o, new THREE.Matrix4(), 1.02)); overlay.add(m);
    }
    // mảnh lơ lửng: phủ đỏ
    for (const id of w.floating()) {
      const p = w.pieces.get(id)!;
      if (!lib.has(p.part)) continue;
      const m = buildSingle(lib, w.catalog, p.part, () => mats.floatMark);
      m.matrixAutoUpdate = false; m.matrix.copy(pieceMatrix(p.pos, p.o, new THREE.Matrix4(), 1.01)); overlay.add(m);
    }
    api.current?.invalidate();
  }, [lib, mats, overlay]);
  useEffect(() => { drawOverlay(); }, [ghost, held, color, selected, guideStep, guideDone, drawOverlay]);
  useEffect(() => { if (guide && lib) void lib.ensureParts([...guide.source.pieces.values()].map(p => p.part)).then(() => drawOverlay()); }, [guide, lib]);
  useEffect(() => { if (mode !== 'select') setSelected(null); }, [mode]);

  // --- Tính gợi ý ---
  const suggestAt = useCallback((x: number, y: number): Candidate | null => {
    const w = worldRef.current, h = heldRef.current, r = api.current?.ray(x, y);
    if (!w || !h || !r) return null;
    const ignore = moving.current === null ? undefined : new Set([moving.current]);
    const hit = pick(w, r.o, r.d, ignore);
    if (!hit) return null;
    lastHit.current = hit;
    return suggest(w, h.part, h.o, hit, { prev: ghostRef.current, bottomUpOnly: preschool, ignore, magnet: preschool ? 1.6 : 1 }).best;
  }, [preschool]);

  const setGhostTracked = (c: Candidate | null) => {
    const prev = ghostRef.current;
    if (c && !c.ok && (prev?.ok || prev?.reason !== c.reason)) recordMetric(initial?.ownerId, 'invalid', 1, c.reason);
    if (c && prev && (c.pos.join() !== prev.pos.join() || c.o !== prev.o)) { sfx.tick(); haptic(6); }
    ghostRef.current = c; setGhost(c);
  };

  const commit = useCallback((c: Candidate) => {
    const h = histRef.current, w = worldRef.current;
    if (!h || !w || !c.ok) { sfx.bad(); if (c && !c.ok) flash(reasonText(c.reason)); return; }
    const id = moving.current;
    if (id === null && w.pieces.size >= LIMITS.pieces) { flash('Mô hình đã đủ 4.000 mảnh. Tạo mô hình mới để lắp tiếp nhé.'); return; }
    const checked = w.check(c.part, c.pos, c.o, id === null ? undefined : new Set([id]));
    if (!checked.ok || (id !== null && checked.lift)) { sfx.bad(); flash(reasonText(checked.reason)); return; }
    let matched: ReturnType<typeof matchTarget>;
    if (guide) {
      matched = matchTarget(c, colorRef.current);
      if (!matched) { sfx.bad(); haptic(20); flash('Chưa đúng — đặt vào chỗ bóng xanh, đúng mảnh và màu nhé'); return; }
    }
    if (id !== null) { h.move(id, c.pos, c.o); moving.current = null; }
    else h.place(c.part, colorRef.current, c.pos, c.o, checked.lift);
    if (id === null) {
      recordMetric(initial?.ownerId, 'placed'); if (quickRef.current) recordMetric(initial?.ownerId, 'quick');
      if (rotations.current) recordMetric(initial?.ownerId, 'rotateBeforePlace', rotations.current); rotations.current = 0;
      if (selectedAt.current) recordMetric(initial?.ownerId, 'selectionMs', Math.round(performance.now() - selectedAt.current));
      selectedAt.current = performance.now(); placedAt.current = Date.now();
      onPlacedRef.current?.({ type: 'placed', group: w.catalog.parts[c.part].group, heightCm: Math.max(...[...w.pieces.values()].map(p => -p.bbox[1])) * 0.04 });
    }
    if (w.pieces.size === LIMITS.warnPieces) flash('Mô hình đã có 3.000 mảnh; lưu lại thường xuyên nhé.');
    if (guide && matched) {
      const done = new Set(guideRef.current.done); done.add(matched.id);
      const left = (guide.steps[guideRef.current.step]?.pieces ?? []).filter(id => !done.has(id));
      setGuideDone(done);
      if (!left.length) {
        const next = guideRef.current.step + 1;
        if (next >= guide.steps.length) { flash('Hoàn thành! Em đã lắp xong mô hình 🎉'); speak('Hoàn thành! Em giỏi quá!'); onGuideDone?.(); }
        else { setGuideStep(next); flash(`Bước ${next + 1}/${guide.steps.length}`); }
      }
    }
    sfx.snap(); haptic(12); advanceCoach(1);
    const placed = [...w.pieces.values()].pop();
    if (placed && lib && (id === null || placed.id !== id)) fx.settle(buildSingle(lib, w.catalog, placed.part, () => mats!.ghostOk), pieceMatrix(placed.pos, placed.o, new THREE.Matrix4(), 1));
    ghostRef.current = null; setGhost(null);
    setVersion(v => v + 1);
  }, [guide, lib, mats, fx]);

  const flash = (t: string) => { if (preschool) { cancelSpeech(); speak(t); }  // bé chưa biết chữ: mọi gợi ý có giọng đọc (mục 7.7)
    setToast(t); window.setTimeout(() => setToast(s => (s === t ? null : s)), 1600); };

  /** 🎯 Giữa / chạm đúp chỗ trống: camera vừa khung toàn mô hình (bàn trống → góc mặc định). */
  const fitAll = () => {
    const w = worldRef.current; if (!w?.pieces.size) { api.current?.fit(null); return; }
    const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (const p of w.pieces.values()) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.bbox[i]); hi[i] = Math.max(hi[i], p.bbox[i + 3]); }
    api.current?.fit([lo, hi]);
  };

  // --- Máy trạng thái chạm ---
  /** Điểm màn hình có nằm trên bóng mờ không (hình chiếu hộp bao, nới 24 px). */
  const hitsGhost = useCallback((x: number, y: number) => {
    const g = ghostRef.current, w = worldRef.current, a = api.current;
    if (!g || !w || !a) return false;
    const r = projectBox(w.shape(g.part, g.pos, g.o).bbox, p => a.project(p));
    return !!r && x >= r.x0 - 24 && x <= r.x1 + 24 && y >= r.y0 - 24 && y <= r.y1 + 24;
  }, []);

  const machine = useMemo(() => new GestureMachine({
    hitsGhost,
    orbit: (dx, dy) => { api.current?.orbit(dx, dy); advanceCoach(2); },
    pinch: (scale, dx, dy) => { api.current?.zoom(scale); if (!preschool) api.current?.pan(dx, dy); },
    // vặn hai ngón = xoay quanh trục đứng; chế độ bé tắt (dễ nhầm với chụm)
    twist: preschool ? undefined : angle => api.current?.spin(angle),
    rightTap: () => { if (modeRef.current === 'build' && heldRef.current) rotate(); },
    orbitEnd: (distance, type) => { if (type === 'touch' && distance < 24) recordMetric(initial?.ownerId, 'nearTap'); },
    tap: (x, y, mouse, double) => {
      const w = worldRef.current, hist = histRef.current, a = api.current;
      if (!w || !hist || !a) return;
      if (double) {
        // chạm đúp chỗ trống = vừa khung. Đang cầm mảnh thì chạm đúp trên bàn vẫn là "dời bóng rồi lắp" (mục 7.2).
        const r = a.ray(x, y), hit = r && pick(w, r.o, r.d);
        if (!hit || (hit.kind === 'ground' && !heldRef.current)) { fitAll(); return; }
      }
      const m = modeRef.current;
      if (m === 'build' && heldRef.current) {
        const g = ghostRef.current;
        if (g?.ok && !mouse && hitsGhost(x, y)) { commit(g); return; }
        const c = suggestAt(x, y);
        if (!c) return;
        if ((quickRef.current || mouse) && c.ok) commit(c);
        else { setGhostTracked(c); if (!c.ok) flash(reasonText(c.reason)); }
        return;
      }
      const r = a.ray(x, y); if (!r) return;
      const hit = pick(w, r.o, r.d);
      if (!hit || hit.kind !== 'piece') { if (m === 'select') setSelected(null); return; }
      if (m === 'erase') { removeWithPop(hit.id); setVersion(v => v + 1); }
      else if (m === 'paint') { hist.color(hit.id, colorRef.current); sfx.tick(); setVersion(v => v + 1); }
      else if (m === 'select') { setSelected(hit.id); sfx.tick(); }
      else if (m === 'build') {
        // tay không ở chế độ Lắp: lấy mẫu — cầm đúng loại, màu, hướng của mảnh được chạm
        const p = w.pieces.get(hit.id)!;
        setHeld({ part: p.part, o: p.o }); setColor(p.color);
      }
    },
    dragMove: (x, y) => { setGhostTracked(suggestAt(x, y)); },
    dragEnd: () => {
      const g = ghostRef.current;
      if (g?.ok) commit(g);
      else if (trayDrag.current) { ghostRef.current = null; setGhost(null); }
      trayDrag.current = false;
    },
    dragCancel: () => { if (trayDrag.current) { ghostRef.current = null; setGhost(null); } trayDrag.current = false; },
    hover: (x, y) => { if (modeRef.current === 'build' && heldRef.current) { const c = suggestAt(x, y); if (c) setGhostTracked(c); } },
  }), [commit, suggestAt, hitsGhost]);
  useEffect(() => { machine.fingerOffset = offset; }, [machine, offset]);

  // Pointer trên khung 3D
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const rel = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
    const down = (e: PointerEvent) => { api.current?.autoRotate(false); if ((e.target as HTMLElement).closest('.bk-float, .bk-coach, button')) return; try { el.setPointerCapture(e.pointerId); } catch { /* pointer giả lập hoặc đã nhả */ } if (e.button === 1) e.preventDefault(); /* chuột giữa: không tự cuộn trang */ const [x, y] = rel(e); machine.down(e.pointerId, x, y, e.pointerType, e.button, Math.max(e.width || 0, e.height || 0)); };
    const move = (e: PointerEvent) => { const [x, y] = rel(e); machine.move(e.pointerId, x, y); };
    const up = (e: PointerEvent) => { const [x, y] = rel(e); machine.up(e.pointerId, x, y); };
    const cancel = () => machine.cancel();
    const wheel = (e: WheelEvent) => { e.preventDefault(); api.current?.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1); };
    const gesture = (e: Event) => e.preventDefault(); // iOS: chặn phóng cả trang; chuột phải: chặn menu (kéo phải = xoay)
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel); el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gesture as any); el.addEventListener('contextmenu', gesture);
    const hide = () => { if (document.hidden) machine.cancel(); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('blur', cancel);
    return () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel); el.removeEventListener('wheel', wheel); el.removeEventListener('gesturestart', gesture as any); el.removeEventListener('contextmenu', gesture);
      document.removeEventListener('visibilitychange', hide); window.removeEventListener('blur', cancel);
    };
  }, [machine, lib]);

  // Bóng mờ hiện ngay khi chọn mảnh (plan mục 7.3): quanh chỗ vừa lắp, hoặc giữa bàn
  const showInitialGhost = useCallback((h: Held) => {
    const w = worldRef.current; if (!w) return;
    const last = [...w.pieces.values()].pop();
    const from: V3 = last ? [(last.bbox[0] + last.bbox[3]) / 2, -4000, (last.bbox[2] + last.bbox[5]) / 2] : [10, -4000, 10];
    const hit = pick(w, from, [0, 1, 0]);
    if (!hit) return;
    lastHit.current = hit;
    const s = suggest(w, h.part, h.o, hit, { bottomUpOnly: preschool });
    ghostRef.current = s.best; setGhost(s.best);
  }, [preschool]);

  const choosePart = async (part: string) => {
    if (!lib) return;
    selectedAt.current = performance.now(); rotations.current = 0;
    const request = ++choice.current;
    try { await lib.ensureParts([part]); } catch { flash('Chưa tải được mảnh. Thử chọn lại nhé.'); return false; }
    if (request !== choice.current) return false;
    moving.current = null;
    setRecent(r => [part, ...r.filter(k => k !== part)].slice(0, 16));
    say(lib.catalog.parts[part].name);
    const target = guide ? guideTargets().find(t => t.part === part) : undefined;
    const h = { part, o: target?.o ?? 0 };
    if (target) { setColor(target.color); colorRef.current = target.color; }
    setHeld(h); heldRef.current = h; setMode('build'); advanceCoach(0);
    showInitialGhost(h);
    return true;
  };

  /** ↻: hướng lắp được tiếp theo tại chỗ đang nhắm (plan mục 7.4 bước 7). */
  const rotate = (reverse = false) => {
    recordMetric(initial?.ownerId, 'rotate'); rotations.current++;
    const w = worldRef.current, h = heldRef.current; if (!w || !h) return;
    const hit = lastHit.current;
    if (hit?.kind === 'piece' && !w.pieces.has(hit.id)) { showInitialGhost(h); return; }
    if (!hit) { const n = { ...h, o: compose(YAW[1], h.o) }; setHeld(n); return; }
    const s = suggest(w, h.part, h.o, hit, { wantOptions: 24, maxChecks: 200, bottomUpOnly: preschool, ignore: moving.current === null ? undefined : new Set([moving.current]) });
    if (!s.options.length) { sfx.bad(); haptic(20); flash('Không có hướng khác ở chỗ này'); return; }
    // thứ tự tự nhiên (mục 7.4 bước 7): xoay quanh trục đứng 0° → 90° → 180° → 270° trước, hướng nằm nghiêng sau
    const rank = (o: number) => { const y = YAW.indexOf(o); return y < 0 ? 4 + o : y; };
    s.options.sort((a, b) => rank(a.o) - rank(b.o));
    const def = w.def(h.part), cur = ghostRef.current;
    // hướng hiện tại: theo lớp đối xứng (xoay 90° làm tâm mảnh lệch nửa núm nên KHÔNG so vị trí — lỗi cũ: luôn nhảy về đầu danh sách)
    const same = (o: Candidate) => !!cur && def.symClass[o.o] === def.symClass[cur.o];
    let i = s.options.findIndex(o => same(o) && o.pos.join() === cur!.pos.join());
    if (i < 0) i = s.options.findIndex(same);
    const next = s.options[(i + (reverse ? s.options.length - 1 : 1)) % s.options.length];
    const nh = { ...h, o: next.o }; heldRef.current = nh; setHeld(nh);
    setGhostTracked(next);
  };

  // --- Bong bóng chế độ Chọn (plan mục 7.3) ---
  const selAction = (kind: 'same' | 'lift' | 'rotate' | 'paint' | 'copy' | 'remove') => {
    const w = worldRef.current, hst = histRef.current, id = selectedRef.current;
    if (!w || !hst || id === null) return;
    const p = w.pieces.get(id); if (!p) return;
    if (kind === 'same' || kind === 'copy') {
      const h = { part: p.part, o: p.o }; setHeld(h); heldRef.current = h; setColor(p.color); colorRef.current = p.color; setMode('build'); setSelected(null);
      showInitialGhost(h); return;
    }
    if (kind === 'paint') { hst.color(id, colorRef.current); sfx.tick(); setVersion(v => v + 1); return; }
    if (kind === 'remove') { removeWithPop(id); setSelected(null); setVersion(v => v + 1); return; }
    if (kind === 'lift') {
      const h = { part: p.part, o: p.o }, pos = p.pos;
      moving.current = id; setSelected(null); setColor(p.color); colorRef.current = p.color;
      setHeld(h); heldRef.current = h; setMode('build');
      const c = w.check(h.part, pos, h.o, new Set([id]));
      const cand: Candidate = { part: h.part, pos, o: h.o, ok: c.ok, reason: c.reason, joins: c.joins, lift: c.lift, score: 0 };
      ghostRef.current = cand; setGhost(cand); return;
    }
    // xoay tại chỗ: hướng tiếp theo quanh trục đứng, dịch nhẹ nếu cần
    const ignore = new Set([id]);
    for (let k = 1; k < 4; k++) {
      const o = compose(YAW[k], p.o);
      for (const [dx, dz] of [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10], [10, 10], [-10, -10], [10, -10], [-10, 10], [20, 0], [-20, 0], [0, 20], [0, -20]]) {
        const pos: V3 = [p.pos[0] + dx, p.pos[1], p.pos[2] + dz];
        const r = w.check(p.part, pos, o, ignore);
        if (r.ok && !r.lift) { const n = hst.move(id, pos, o); if (n) setSelected(n.id); sfx.snap(); setVersion(v => v + 1); return; }
      }
    }
    sfx.bad(); haptic(20); flash('Không đủ chỗ để xoay');
  };

  const cancelHeld = () => { moving.current = null; choice.current++; heldRef.current = null; setHeld(null); ghostRef.current = null; setGhost(null); };
  const undo = () => { cancelHeld(); if (Date.now() - placedAt.current < 3000) recordMetric(initial?.ownerId, 'undoSoon'); placedAt.current = 0; if (histRef.current?.undo()) { setVersion(v => v + 1); sfx.pop(); } };
  const redo = () => { cancelHeld(); if (histRef.current?.redo()) { setVersion(v => v + 1); sfx.tick(); } };

  // Phím tắt (máy tính)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') rotate(e.shiftKey);
      else if (e.key === 'Escape') { if (paletteOpen) { setPaletteOpen(false); return; } cancelHeld(); setSettings(false); }
      else if (e.key === 'Delete' && selectedRef.current !== null) selAction('remove');
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  // Kéo thẻ từ khay ra khung (plan mục 7.2)
  const trayPointerDown = (part: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    trayCleanup.current();
    const sx = e.clientX, sy = e.clientY, id = e.pointerId, type = e.pointerType;
    let started = false, ended = false, longPressed = false;
    // nhấn giữ 500 ms không kéo = xem mảnh 3D (mục 7.1); không chọn mảnh
    const hold = window.setTimeout(() => { if (!started && !ended) { longPressed = true; setViewer(part); } }, 500);
    const cleanup = () => { ended = true; clearTimeout(hold); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel); };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id || !wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      if (!started && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 12 && ev.clientY < r.bottom) {
        started = true; trayDrag.current = true;
        void choosePart(part).then(ok => { if (ok && !ended) machine.beginTrayDrag(id, ev.clientX - r.left, ev.clientY - r.top, type); });
      } else if (started) machine.move(id, ev.clientX - r.left, ev.clientY - r.top);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      cleanup();
      const r = wrap.current?.getBoundingClientRect();
      if (started && r) {
        choice.current++;
        if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) machine.cancel();
        else machine.up(id, ev.clientX - r.left, ev.clientY - r.top);
      } else if (!longPressed) void choosePart(part);
    };
    const cancel = () => { if (started && !ended) recordMetric(initial?.ownerId, 'trayCancel'); cleanup(); choice.current++; machine.cancel(); };
    trayCleanup.current = cancel;
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', cancel);
  };

  // Bản thử: lấp 2.000 mảnh ngẫu nhiên để đo
  const fillTest = async () => {
    const w = worldRef.current, h = histRef.current; if (!w || !h || !lib) return;
    const keys = ['3001', '3003', '3004', '3010', '3020', '3022', '3039', '3040b', '3062b', '6141', '3068b'];
    await lib.ensureParts(keys);
    let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const cols = ['red', 'blue', 'yellow', 'white', 'green', 'orange', 'trans-clear'];
    let tries = 0;
    while (w.pieces.size < 2000 && tries++ < 30000) {
      const hit = pick(w, [(rnd() - 0.5) * 800, -4000, (rnd() - 0.5) * 800], [0, 1, 0]); if (!hit) continue;
      const s = suggest(w, keys[Math.floor(rnd() * keys.length)], rnd() < 0.5 ? 0 : YAW[1], hit);
      if (s.best?.ok) h.place(s.best.part, cols[Math.floor(rnd() * cols.length)], s.best.pos, s.best.o, s.best.lift);
    }
    h.clear(); setVersion(v => v + 1);
  };
  const measureFps = () => {
    if (!lab) { api.current?.autoRotate(true); return; }
    const a = api.current; if (!a) return;
    let frames = 0; const t0 = performance.now();
    a.autoRotate(true);
    const count = () => { frames++; if (performance.now() - t0 < 4000) requestAnimationFrame(count); else { a.autoRotate(false); flash(`≈ ${Math.round(frames / 4)} khung/giây khi xoay`); } };
    requestAnimationFrame(count);
  };

  if (error) return <div className="bk-root bk-error"><div className="bk-top">{header}</div><p role="alert">{error}</p></div>;
  if (!lib) return <div className="bk-root bk-loading">Đang mở xưởng…</div>;
  const catalog = lib.catalog;
  const palette = preschool ? catalog.palette.filter(c => catalog.preschoolColors.includes(c.key)) : catalog.palette;
  const needed = guide ? guideTargets() : [];
  const simpleParts = PRESCHOOL_PARTS;
  const baseParts = (guide ? [...new Set(needed.map(t => t.part))] : group === 'recent' ? recent : catalog.groups.find(g => g.id === group)?.parts ?? [])
    .filter(k => (!preschool || simpleParts.has(k)) && (!search || catalog.parts[k].name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) || k.includes(search)));
  // nhóm con: chỉ khi xem một nhóm (không tìm kiếm, không theo hướng dẫn, không phải chế độ bé — bé chỉ có ~30 mảnh)
  const subs = guide || search || preschool || group === 'recent' ? [] : subgroupsOf(group, baseParts, catalog.parts);
  const groupParts = sub ? subs.find(s => s.id === sub)?.parts ?? baseParts : baseParts;
  /** Màu có thật với mảnh đang cầm (Rebrickable); null = không rõ. Màu khác vẫn chọn được, chỉ có chấm mờ (mục 7.1, D6). */
  /** Lăn chuột dọc trên hàng ngang = cuộn ngang (thanh cuộn đã ẩn cho gọn). */
  const sideScroll = (e: React.WheelEvent<HTMLElement>) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY; };
  const realColors = held ? catalog.parts[held.part]?.colors ?? null : null;
  const pickColor = (key: string, name: string) => { setColor(key); say(name); setPaletteOpen(false); setRecentColors(r => [key, ...r.filter(k => k !== key)].slice(0, 6)); };
  const swatch = (c: (typeof palette)[number], extra = '') => { const rare = !!realColors && !realColors.includes(c.key);
    return <button key={c.key} className={`bk-swatch ${extra} ${color === c.key ? 'on' : ''} ${rare ? 'rare' : ''}`} style={{ background: c.hex, opacity: c.alpha < 255 ? 0.6 : 1 }} title={rare ? `${c.nameVi} (mảnh này ít có màu này ngoài đời)` : c.nameVi} aria-label={rare ? `${c.nameVi}, ít có thật` : c.nameVi} onClick={() => pickColor(c.key, c.nameVi)} />; };
  // menu ✓ ↻ ✥ đặt ra ngoài hình chiếu bóng mờ (không che mảnh trên màn nhỏ); cỡ menu ước theo nút đang hiện
  const stageW = wrap.current?.clientWidth ?? 800, stageH = wrap.current?.clientHeight ?? 600, btn = preschool ? 66 : 52;
  const ghostRect = ghost && api.current ? projectBox(worldRef.current!.shape(ghost.part, ghost.pos, ghost.o).bbox, p => api.current!.project(p)) : null;
  const ghostMenu = ghostRect && ghost ? placeMenu(ghostRect, (ghost.ok ? btn : 24 + reasonText(ghost.reason).length * 8.5) + 2 * btn + 12, btn, stageW, stageH) : null;

  return (
    <div className={`bk-root ${preschool ? 'bk-kid' : ''}`}>
      <div className="bk-top">
        {header ?? <strong>Xưởng Lắp Ghép</strong>}
        <button className="bk-btn" onClick={() => setSettings(true)} aria-label="Cài đặt và trợ giúp">⚙</button>
        <button className="bk-btn" onClick={undo} disabled={!histRef.current?.canUndo} aria-label="Hoàn tác">↶</button>
        <button className="bk-btn" onClick={redo} disabled={!histRef.current?.canRedo} aria-label="Làm lại">↷</button>
        {guide && <span className="bk-guide">📘 Bước {Math.min(guideStep + 1, guide.steps.length)}/{guide.steps.length}</span>}
        {!guide && <button className="bk-btn" onClick={() => setReplay(r => (r === null ? 0 : null))} title="Xem quá trình lắp" aria-label="Xem quá trình lắp">{replay === null ? '▶' : '■'}</button>}
        <label className="bk-explode" title="Nổ tung: kéo để tách mảnh, thả để ráp lại">💥<input type="range" min={0} max={1} step={0.02} value={explode} onChange={e => setExplode(Number(e.target.value))} onPointerUp={() => setExplode(0)} onTouchEnd={() => setExplode(0)} aria-label="Nổ tung mô hình" /></label>
        <span className="bk-stats">{lab ? stats : ''}</span>
      </div>
      {settings && <Dialog className="bk-export" label="Cài đặt xưởng" onClose={() => setSettings(false)}>
        <div className="bk-export-head"><strong>Cài đặt & trợ giúp</strong><button className="bk-btn" onClick={() => setSettings(false)} aria-label="Đóng cài đặt">✕</button></div>
        <p><label>Chất lượng hình ảnh <select value={quality} onChange={e => setQuality(e.target.value as Quality)}><option value="high">Cao</option><option value="mid">Vừa</option><option value="low">Tiết kiệm</option></select></label></p>
        <p><label><input type="checkbox" checked={quick} onChange={e => setQuick(e.target.checked)} /> Lắp nhanh khi chạm một lần</label></p>
        <p>Chọn mảnh → chạm bàn để xem bóng mờ → bấm ✓ để lắp. Kéo trên bàn để xoay, dùng hai ngón để phóng to. Phím R xoay, Shift+R xoay ngược, Esc bỏ mảnh, Ctrl+Z hoàn tác.</p>
        <button className="bk-btn" onClick={() => { setCoach(0); setSettings(false); }}>Xem lại hướng dẫn</button>
        <details><summary>Số liệu trên máy · 30 ngày gần nhất</summary><p>Chỉ lưu trên thiết bị này, không gửi lên máy chủ.</p><pre className="bk-credits">{JSON.stringify(readMetrics(initial?.ownerId ?? ""), null, 2)}</pre><button className="bk-btn" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(readMetrics(initial?.ownerId ?? ""), null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "so-lieu-lap-ghep.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Tải số liệu JSON</button></details>
        <details><summary>Ghi công dữ liệu</summary><p>Hình học mảnh: thư viện LDraw.org (CC BY). Điểm nối: LDCad Shadow Library (CC BY-SA 4.0). Xếp hạng mảnh và màu: dữ liệu Rebrickable.</p><pre className="bk-credits">{JSON.stringify(catalog.credits, null, 2)}</pre></details>
      </Dialog>}
      {viewer && icons && <PartViewer part={viewer} color={color} catalog={catalog} icons={icons} onClose={() => setViewer(null)} onChoose={() => { const k = viewer; setViewer(null); void choosePart(k); }} />}
      <div className="bk-main">
        <div className="bk-modes">
          {(preschool ? [['build', '🧱', 'Lắp'], ['paint', '🖌', 'Sơn'], ['erase', '🔨', 'Tháo']] as const : [['build', '🧱', 'Lắp'], ['paint', '🖌', 'Sơn'], ['erase', '🔨', 'Tháo'], ['select', '✋', 'Chọn']] as const).map(([m, icon, label]) =>
            <button key={m} className={`bk-btn bk-mode ${mode === m ? 'on' : ''}`} onClick={() => { cancelHeld(); setMode(m); if (m !== 'build') { ghostRef.current = null; setGhost(null); } }} aria-label={label}><span>{icon}</span><small>{label}</small></button>)}
          <hr />
          <button className="bk-btn bk-mode" onClick={fitAll} aria-label="Vừa khung"><span>🎯</span><small>Giữa</small></button>
          <button className="bk-btn bk-mode" onClick={measureFps} aria-label="Xoay 360"><span>🔄</span><small>360°</small></button>
          <button className="bk-btn bk-mode" onClick={() => { const n = (viewIdx + 1) % VIEWS.length; setViewIdx(n); api.current?.view(VIEWS[n][0]); flash(`Nhìn ${VIEWS[n][1].toLowerCase()}`); }} aria-label={`Đổi góc nhìn (đang: ${VIEWS[viewIdx][1]})`}><span>⬒</span><small>{VIEWS[viewIdx][1]}</small></button>
        </div>
        <div className="bk-stage" ref={wrap}>
          {!webgl && <NoWebgl world={worldRef.current} name={typeof header === 'string' ? header : 'mo-hinh'} />}
          {webgl && model && <BrickCanvas ref={api} model={model.group} overlay={overlay} quality={quality} reducedMotion={reducedMotion} onContextLost={l => { setLost(l); if (!l) setVersion(v => v + 1); }} preschool={preschool} capture={lab} alwaysRender={lab && new URLSearchParams(location.search).get('demo') === '1'} />}
          {lost && <div className="bk-lost">Đang khôi phục 3D…</div>}
          {ghost && ghostMenu && mode === 'build' && (
            <div className="bk-float" style={ghostMenu}>
              {ghost.ok ? <button className="bk-btn ok" onClick={() => ghost && commit(ghost)} aria-label="Lắp">✓</button>
                : <span className="bk-bad" role="status">✕ {reasonText(ghost.reason)}</span>}
              <button className="bk-btn" onClick={() => rotate()} aria-label="Đổi hướng">↻</button>
              <button className="bk-btn bk-handle" aria-label="Kéo để dời mảnh" title="Kéo để dời mảnh"
                onPointerDown={e => { if (e.button !== 0 || !wrap.current) return; const r = wrap.current.getBoundingClientRect(); try { wrap.current.setPointerCapture(e.pointerId); } catch { /* pointer giả lập */ } machine.beginGhostDrag(e.pointerId, e.clientX - r.left, e.clientY - r.top, e.pointerType); }}>✥</button>
            </div>)}
          {toast && <div className="bk-toast">{toast}</div>}
          {coach >= 0 && (
            <div className="bk-coach" role="status">
              <span className="bk-coach-n">{coach + 1}/{COACH.length}</span>
              <p>{COACH[coach]}</p>
              <button className="bk-btn" onClick={() => speak(COACH[coach])} aria-label="Nghe lại">🔊</button>
              <button className="bk-btn" onClick={() => { coachRef.current = COACH.length - 1; advanceCoach(COACH.length - 1); }}>Bỏ qua</button>
            </div>)}
          {selected !== null && mode === 'select' && (() => {
            const w = worldRef.current, p = w?.pieces.get(selected), a = api.current;
            if (!w || !p || !a) return null;
            const r = projectBox(p.bbox, q => a.project(q));
            if (!r) return null;
            const at = placeMenu(r, 6 * btn + 5 * 6 + 12, btn + 12, stageW, stageH);
            return (
              <div className="bk-float bk-bubble" style={at}>
                <button className="bk-btn" onClick={() => selAction('same')} title="Lấy mảnh giống thế này" aria-label="Lấy mảnh giống thế này">🫳</button>
                <button className="bk-btn" onClick={() => selAction('lift')} title="Nhấc để dời" aria-label="Nhấc để dời">✋</button>
                <button className="bk-btn" onClick={() => selAction('rotate')} title="Xoay tại chỗ" aria-label="Xoay tại chỗ">↻</button>
                <button className="bk-btn" onClick={() => selAction('paint')} title="Sơn màu đang chọn" aria-label="Sơn màu đang chọn">🖌</button>
                <button className="bk-btn" onClick={() => selAction('copy')} title="Nhân bản" aria-label="Nhân bản">⧉</button>
                <button className="bk-btn" onClick={() => selAction('remove')} title="Tháo" aria-label="Tháo">🗑</button>
              </div>);
          })()}
          {held && <div className="bk-held">Trên tay: <b>{catalog.parts[held.part]?.name}</b></div>}
        </div>
      </div>
      <div className="bk-tray">
        {/* Một hàng: tìm kiếm + nhóm; nhóm con của nhóm đang chọn hiện ngay sau nó (góp ý 15/10: khay chiếm quá nhiều chiều cao) */}
        <div className="bk-groups" onWheel={sideScroll}>
          <input className="bk-search" aria-label="Tìm mảnh" placeholder="🔍 Tìm mảnh…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className={`bk-chip ${group === "recent" ? "on" : ""}`} onClick={() => { setGroup("recent"); setSub(null); }} title="Vừa dùng"><span aria-hidden>{GROUP_ICON.recent}</span> Vừa dùng</button>
          {catalog.groups.filter(g => !preschool || g.parts.some(k => simpleParts.has(k))).map(g => <React.Fragment key={g.id}>
            <button className={`bk-chip ${group === g.id ? 'on' : ''}`} onClick={() => { setGroup(g.id); setSub(null); }}><span aria-hidden>{GROUP_ICON[g.id] ?? '🧩'}</span> {g.nameVi}</button>
            {group === g.id && subs.length > 0 && <span className="bk-subs" role="group" aria-label={`Nhóm con của ${g.nameVi}`}>
              <button className={`bk-chip bk-sub ${sub === null ? 'on' : ''}`} onClick={() => setSub(null)}>Tất cả</button>
              {subs.map(sg => <button key={sg.id} className={`bk-chip bk-sub ${sub === sg.id ? 'on' : ''}`} onClick={() => setSub(sg.id)}>{sg.label}</button>)}
            </span>}
          </React.Fragment>)}
        </div>
        <div className="bk-row">
          <div className="bk-parts" onWheel={sideScroll}>
            {groupParts.map(k => <PartCard key={k} part={k} name={catalog.parts[k].name} label={guide || search || group === 'recent' ? catalog.parts[k].name : shortName(catalog.parts[k].name, group)} color={color} icons={icons} ready={groupReady > 0 && lib.has(k)} on={held?.part === k} onPointerDown={trayPointerDown(k)} onChoose={() => void choosePart(k)} onView={() => setViewer(k)} />)}
          </div>
          <div className="bk-colorbar">
            <button className={`bk-swatch bk-current ${realColors && !realColors.includes(color) ? 'rare' : ''}`} style={{ background: catalog.palette.find(c => c.key === color)?.hex }}
              onClick={() => setPaletteOpen(o => !o)} aria-expanded={paletteOpen} aria-label={`Màu đang chọn: ${catalog.palette.find(c => c.key === color)?.nameVi ?? ''}. Mở bảng màu`}><span aria-hidden>▾</span></button>
            {recentColors.filter(k => k !== color && palette.some(c => c.key === k)).slice(0, 5).map(k => swatch(palette.find(c => c.key === k)!, 'bk-recent'))}
          </div>
          {paletteOpen && <div className="bk-palette" role="dialog" aria-label="Bảng màu">
            {palette.map(c => swatch(c))}
          </div>}
          {/* nút ↻ XOAY ở khay đã bỏ (góp ý 15/10): xoay nằm cạnh bóng mờ, phím R và chuột phải */}
        </div>
        {lab && (
          <div className="bk-lab">
            <label><input type="checkbox" checked={quick} onChange={e => setQuick(e.target.checked)} /> Lắp nhanh (chạm 1 lần)</label>
            <label>Lệch ngón <select value={offset} onChange={e => setOffset(Number(e.target.value))}><option value={0}>0 px</option><option value={40}>40 px</option></select></label>
            <label>Chất lượng <select value={quality} onChange={e => setQuality(e.target.value as Quality)}><option value="high">Cao</option><option value="mid">Vừa</option><option value="low">Thấp</option></select></label>
            <button className="bk-btn" onClick={fillTest}>Thêm 2.000 mảnh</button>
            <button className="bk-btn" onClick={() => { worldRef.current?.clear(); histRef.current?.clear(); setVersion(v => v + 1); }}>Xoá hết</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Thiết bị không có WebGL: không vẽ được 3D, nhưng vẫn tải được danh sách mảnh (CSV). */
function NoWebgl({ world, name }: { world: World | null; name: string }) {
  const download = () => {
    if (!world) return;
    const rows = buildBom(world).map(r => [r.nameVi, r.colorVi, r.qty, r.ldraw].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const url = URL.createObjectURL(new Blob(['﻿Tên mảnh,Màu,Số lượng,Mã mảnh\n' + rows.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${name}-danh-sach-manh.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="bk-lost" role="alert"><div><p>Thiết bị này không hiển thị được hình 3D.</p>{!!world?.pieces.size && <button className="bk-btn" onClick={download}>Tải danh sách mảnh (CSV)</button>}</div></div>;
}

/** Thẻ mảnh: hình 3D đúng màu đang chọn (vẽ khi rảnh) + tên. */
function PartCard({ part, name, label, color, icons, ready, on, onPointerDown, onChoose, onView }: { part: string; name: string; label: string; color: string; icons: IconRenderer | null; ready: boolean; on: boolean; onPointerDown: (e: React.PointerEvent) => void; onChoose: () => void; onView: () => void }) {
  const [url, setUrl] = useState<string | undefined>(() => icons?.cached(part, color));
  useEffect(() => {
    let alive = true;
    if (!icons || !ready) return;
    const c = icons.cached(part, color);
    if (c) { setUrl(c); return; }
    void icons.icon(part, color).then(u => alive && setUrl(u));
    return () => { alive = false; };
  }, [icons, part, color, ready]);
  return (
    <button className={`bk-part ${on ? 'on' : ''}`} onPointerDown={onPointerDown} onClick={e => { if (e.detail === 0) onChoose(); }} onContextMenu={e => { e.preventDefault(); onView(); }} aria-label={name} title={`${name} — nhấn giữ để xem kỹ`}>
      {url ? <img src={url} alt="" draggable={false} /> : <span className="bk-part-ph" />}
      <span className="bk-part-name">{label}</span>
    </button>
  );
}

export function reasonText(r?: string) {
  return r === 'collide' ? 'Chạm vào mảnh khác' : r === 'noJoin' ? 'Chưa có chỗ gắn' : r === 'smooth' ? 'Mặt trơn, không gắn được' : r === 'outside' ? 'Ra ngoài vùng xây' : 'Không lắp được ở đây';
}
