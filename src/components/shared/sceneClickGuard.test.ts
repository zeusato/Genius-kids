import { describe, expect, it } from 'vitest';
import { createSceneClickGuard } from './sceneClickGuard';

const pointer = (clientX: number, clientY: number, pointerId = 1, button = 0) => ({
    clientX, clientY, pointerId, button
});
const click = { detail: 1 };

describe('scene click gestures', () => {
    it('allows a click or tap with small hand movement', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(100, 100));
        guard.pointerMove(pointer(103, 102));
        guard.pointerUp(pointer(104, 102));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it.each([[30, 0], [0, 30], [4, 4]])('blocks camera drags by (%i, %i)', (x, y) => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerMove(pointer(x, y));
        guard.pointerUp(pointer(x, y));
        expect(guard.shouldBlockClick(click)).toBe(true);
    });

    it('remembers a drag even when released at its starting position', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(100, 100));
        guard.pointerMove(pointer(160, 100));
        guard.pointerUp(pointer(100, 100));
        expect(guard.shouldBlockClick(click)).toBe(true);
    });

    it('checks the release position even without a pointermove', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(20, 0));
        expect(guard.shouldBlockClick(click)).toBe(true);
    });

    it('allows the next deliberate click immediately after dragging', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(30, 0));
        expect(guard.shouldBlockClick(click)).toBe(true);
        guard.pointerDown(pointer(30, 0));
        guard.pointerUp(pointer(30, 0));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it('blocks two-finger gestures until every finger is lifted', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0, 1));
        guard.pointerDown(pointer(10, 0, 2));
        guard.pointerUp(pointer(10, 0, 2));
        expect(guard.shouldBlockClick(click)).toBe(true);
        guard.pointerUp(pointer(0, 0, 1));
        expect(guard.shouldBlockClick(click)).toBe(true);
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it('blocks canceled gestures and recovers for the next tap', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerCancel(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(true);
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it('ignores movement and cancellation from unrelated pointers', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerMove(pointer(100, 100, 2));
        guard.pointerCancel(pointer(100, 100, 2));
        guard.pointerUp(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it('clears active pointers when the window loses focus', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.blur();
        expect(guard.shouldBlockClick(click)).toBe(true);
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(false);
    });

    it.each([1, 2])('does not select with mouse button %i', (button) => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0, 1, button));
        guard.pointerUp(pointer(0, 0));
        expect(guard.shouldBlockClick(click)).toBe(true);
    });

    it('preserves keyboard activation after a drag', () => {
        const guard = createSceneClickGuard();
        guard.pointerDown(pointer(0, 0));
        guard.pointerUp(pointer(30, 0));
        expect(guard.shouldBlockClick({ detail: 0 })).toBe(false);
    });
});
