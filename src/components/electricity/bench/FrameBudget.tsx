import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
/** Drop to the shared SVG renderer after sustained slow frames, never change the circuit. */
export function FrameBudget({ onSlow }: {
    onSlow: () => void;
}) {
    const { gl, setFrameloop } = useThree(), samples = useRef<number[]>([]), warm = useRef(0);
    React.useEffect(() => { const visibility = () => setFrameloop(document.hidden ? 'never' : 'always'); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, [setFrameloop]);
    useFrame((_, dt) => { if (document.hidden || dt > .5)
        return; warm.current += dt; if (warm.current < 2)
        return; samples.current.push(dt); if (samples.current.length < 120)
        return; const sorted = samples.current.slice().sort((a, b) => a - b), average = sorted.reduce((a, b) => a + b, 0) / sorted.length; const element = gl.domElement; element.dataset.frameMetrics = JSON.stringify({ fps: Math.round(1 / average), frameP95ms: +(sorted[Math.floor(sorted.length * .95)] * 1000).toFixed(2), drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles, dpr: gl.getPixelRatio() }); if (average > .045)
        onSlow(); samples.current = []; });
    return null;
}
