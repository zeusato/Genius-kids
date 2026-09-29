import { PostRef } from '../engine/circuit';
import { Point } from '../engine/route';
export type Pick = {
    type: 'post';
    post: PostRef;
} | {
    type: 'part';
    id: string;
    button?: boolean;
} | {
    type: 'wire';
    id: string;
} | {
    type: 'background';
};
export interface GestureAdapter {
    pick: (x: number, y: number) => Pick;
    board: (x: number, y: number) => Point;
    select: (id: string) => void;
    connect: (a: PostRef, b: PostRef) => void;
    move: (id: string, p: Point) => void;
    toggle: (id: string) => void;
    hold: (id: string, closed: boolean) => void;
    preview: (p: {
        from?: PostRef;
        point?: Point;
        part?: string;
    } | null) => void;
    camera: (dx: number, dy: number, scale: number) => void;
}
/** Both renderers send their native surface events into this same state machine. */
export class InteractionController {
    pointers = new Map<number, Point>();
    armed: PostRef | null = null;
    private active: {
        id: number;
        pick: Pick;
        start: Point;
        drag: boolean;
    } | null = null;
    private cameraMode = false;
    private cameraPrevious: Point[] = [];
    constructor(public adapter: GestureAdapter) { }
    down(id: number, x: number, y: number, button = 0) { if (button !== 0)
        return; this.pointers.set(id, [x, y]); if (this.pointers.size > 1) {
        this.cancelEdit();
        this.cameraMode = true;
        this.cameraPrevious = [...this.pointers.values()];
        return;
    } if (this.cameraMode)
        return; const pick = this.adapter.pick(x, y); this.active = { id, pick, start: [x, y], drag: false }; if (pick.type === 'part' && pick.button)
        this.adapter.hold(pick.id, true); }
    move(id: number, x: number, y: number) { if (!this.pointers.has(id))
        return; this.pointers.set(id, [x, y]); if (this.cameraMode) {
        const p = [...this.pointers.values()];
        if (p.length === 2 && this.cameraPrevious.length === 2) {
            const old = this.cameraPrevious;
            const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
            this.adapter.camera((p[0][0] + p[1][0] - old[0][0] - old[1][0]) / 2, (p[0][1] + p[1][1] - old[0][1] - old[1][1]) / 2, dist(p[0], p[1]) / Math.max(1, dist(old[0], old[1])));
        }
        this.cameraPrevious = p;
        return;
    } const a = this.active; if (!a || a.id !== id)
        return; if (Math.hypot(x - a.start[0], y - a.start[1]) >= 8)
        a.drag = true; if (a.drag) {
        if (a.pick.type === 'post')
            this.adapter.preview({ from: a.pick.post, point: this.adapter.board(x, y) });
        if (a.pick.type === 'part' && !a.pick.button)
            this.adapter.preview({ part: a.pick.id, point: this.adapter.board(x, y) });
    } }
    up(id: number, x: number, y: number) {
        this.pointers.delete(id);
        if (this.cameraMode) {
            if (!this.pointers.size) {
                this.cameraMode = false;
                this.cameraPrevious = [];
            }
            return;
        }
        const a = this.active;
        this.active = null;
        this.adapter.preview(null);
        if (!a)
            return;
        if (a.pick.type === 'part' && a.pick.button) {
            this.adapter.hold(a.pick.id, false);
            return;
        }
        const target = this.adapter.pick(x, y);
        if (a.drag) {
            if (a.pick.type === 'post' && target.type === 'post')
                this.adapter.connect(a.pick.post, target.post);
            if (a.pick.type === 'part')
                this.adapter.move(a.pick.id, this.adapter.board(x, y));
            this.armed = null;
            return;
        }
        if (a.pick.type === 'post') {
            this.tapPost(a.pick.post);
            return;
        }
        this.armed = null;
        if (a.pick.type === 'part') {
            this.adapter.select(a.pick.id);
            this.adapter.toggle(a.pick.id);
        }
        else if (a.pick.type === 'wire')
            this.adapter.select(a.pick.id);
    }
    tapPost(post: PostRef) { if (this.armed) {
        if (this.armed.partId !== post.partId || this.armed.postId !== post.postId)
            this.adapter.connect(this.armed, post);
        this.armed = null;
        this.adapter.preview(null);
    }
    else {
        this.armed = post;
        this.adapter.preview({ from: post });
    } }
    cancelEdit() { if (this.active?.pick.type === 'part' && this.active.pick.button)
        this.adapter.hold(this.active.pick.id, false); this.active = null; this.armed = null; this.adapter.preview(null); }
    cancel() { this.cancelEdit(); this.pointers.clear(); this.cameraMode = false; this.cameraPrevious = []; }
}
