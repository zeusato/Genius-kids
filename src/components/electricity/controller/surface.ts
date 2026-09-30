import { postIds, postPosition, ref } from '../engine/circuit';
import { Point, routeAll } from '../engine/route';
import { layoutKey } from '../ui/benchTypes';
import { BenchProps } from '../ui/benchTypes';
import { InteractionController, Pick } from './gesture';

/** Độ cao dùng khi chiếu một điểm của bàn ra màn hình (renderer phẳng bỏ qua). */
export type ScreenHeight = 'post' | 'wire';

export interface SurfaceOptions {
    /** Renderer 3D: chạm trúng thân linh kiện theo tia (bóng đèn cao nhô khỏi mặt bàn). */
    pickPart?: (x: number, y: number) => string | null;
}

export function bindSurface(element: HTMLElement | SVGSVGElement, getProps: () => BenchProps, toBoard: (x: number, y: number) => Point, toScreen: (p: Point, height?: ScreenHeight) => Point, camera: (dx: number, dy: number, scale: number) => void, options: SurfaceOptions = {}) {
    let cachedKey = '', paths = new Map<string, Point[]>();
    const pick = (x: number, y: number): Pick => {
        const p = getProps(), point = toBoard(x, y);
        const posts = p.sim.circuit.parts.flatMap(part => postIds(part).map(id => { const pos = toScreen(postPosition(part, id), 'post'); return { post: ref(part.id, id), distance: Math.hypot(pos[0] - x, pos[1] - y) }; })).filter(v => v.distance < 24).sort((a, b) => a.distance - b.distance);
        // Hai cọc cùng gần: chọn cọc gần hơn rõ rệt, còn ngang nhau thì coi như chạm thân linh kiện.
        if (posts.length === 1 || (posts.length > 1 && posts[1].distance - posts[0].distance > 6))
            return { type: 'post', post: posts[0].post };
        if (posts.length > 1)
            return { type: 'part', id: posts[0].post.partId };
        const hit = options.pickPart?.(x, y);
        const part = hit ? p.sim.circuit.parts.find(v => v.id === hit) : p.sim.circuit.parts.find(part => Math.abs(point[0] - part.x) < 1.1 && Math.abs(point[1] - part.z) < .8);
        if (part)
            return { type: 'part', id: part.id, button: part.kind === 'button' };
        const target = document.elementFromPoint(x, y)?.closest('[data-wire]');
        if (target)
            return { type: 'wire', id: target.getAttribute('data-wire')! };
        const nextKey = layoutKey(p.sim.circuit);
        if (nextKey !== cachedKey) {
            cachedKey = nextKey;
            paths = routeAll(p.sim.circuit);
        }
        let nearest: {
            id: string;
            distance: number;
        } | null = null;
        for (const [id, path] of paths)
            for (let i = 1; i < path.length; i++) {
                const a = toScreen(path[i - 1], 'wire'), b = toScreen(path[i], 'wire'), dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))), distance = Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
                if (distance < 14 && (!nearest || distance < nearest.distance))
                    nearest = { id, distance };
            }
        return nearest ? { type: 'wire', id: nearest.id } : { type: 'background' };
    };
    const controller = new InteractionController({ pick, board: toBoard, select: id => getProps().onSelect(id), connect: (a, b) => getProps().onConnect(a, b), move: (id, point) => getProps().onMove(id, point), toggle: id => getProps().onToggle(id), hold: (id, closed) => getProps().onHold(id, closed), preview: p => getProps().onPreview(p), camera });
    const down = (e: PointerEvent) => { if (e.button !== 0)
        return; controller.armed = getProps().preview?.from ?? null; element.setPointerCapture(e.pointerId); controller.down(e.pointerId, e.clientX, e.clientY, e.button); };
    const move = (e: PointerEvent) => { controller.move(e.pointerId, e.clientX, e.clientY); getProps().onHover?.(controller.pointers.size ? null : [e.clientX, e.clientY]); };
    const up = (e: PointerEvent) => { controller.up(e.pointerId, e.clientX, e.clientY); if (element.hasPointerCapture(e.pointerId))
        element.releasePointerCapture(e.pointerId); };
    const cancel = () => controller.cancel();
    const lost = () => { if (controller.pointers.size)
        cancel(); };
    const leave = () => getProps().onHover?.(null);
    const wheel = (e: WheelEvent) => { e.preventDefault(); camera(0, 0, Math.exp(-e.deltaY * .001)); };
    element.addEventListener('pointerdown', down as EventListener);
    element.addEventListener('pointermove', move as EventListener);
    element.addEventListener('pointerup', up as EventListener);
    element.addEventListener('pointercancel', cancel);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('lostpointercapture', lost);
    element.addEventListener('wheel', wheel as EventListener, { passive: false });
    window.addEventListener('blur', cancel);
    return () => { cancel(); element.removeEventListener('pointerdown', down as EventListener); element.removeEventListener('pointermove', move as EventListener); element.removeEventListener('pointerup', up as EventListener); element.removeEventListener('pointercancel', cancel); element.removeEventListener('pointerleave', leave); element.removeEventListener('lostpointercapture', lost); element.removeEventListener('wheel', wheel as EventListener); window.removeEventListener('blur', cancel); };
}
