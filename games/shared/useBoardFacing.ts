import { useLayoutEffect, useRef, useState } from 'react';
import { TURN_ROTATION_MS } from './seating';

/** Finish placing the piece before turning the board; never ask for a handoff. */
export function useBoardFacing(initial: boolean, automatic: boolean | null, moving: boolean, reduced: boolean) {
  const [flip, setFlip] = useState(initial), [rotating, setRotating] = useState(false);
  const previous = useRef(flip);
  useLayoutEffect(() => {
    if (!moving && automatic !== null) setFlip(automatic);
  }, [automatic, moving]);
  useLayoutEffect(() => {
    const changed = previous.current !== flip;
    previous.current = flip;
    if (!changed || reduced) { setRotating(false); return; }
    setRotating(true);
    const timer = setTimeout(() => setRotating(false), TURN_ROTATION_MS + 40);
    return () => clearTimeout(timer);
  }, [flip, reduced]);
  return { flip, setFlip, rotating };
}
