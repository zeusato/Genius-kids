import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { TURN_ROTATION_MS } from './seating';

export default function FlatBoardTurn({ flip, reduced, children }: { flip: boolean; reduced: boolean; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null), previous = useRef(flip);
  useLayoutEffect(() => {
    const changed = previous.current !== flip;
    previous.current = flip;
    if (!changed || reduced) return;
    const animation = element.current?.animate([
      { transform: `rotate(${flip ? 180 : -180}deg)` }, { transform: 'rotate(0deg)' },
    ], { duration: TURN_ROTATION_MS, easing: 'cubic-bezier(.4,0,.2,1)' });
    return () => animation?.cancel();
  }, [flip, reduced]);
  return <div ref={element} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>;
}
