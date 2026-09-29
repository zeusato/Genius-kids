import { Circuit, PostRef } from '../engine/circuit';
import { Point } from '../engine/route';
import { Simulation } from '../engine/simulation';
export interface BenchProps {
    sim: Simulation;
    selected: string | null;
    schematic: boolean;
    night: boolean;
    portrait: boolean;
    reduced: boolean;
    flow: 'electron' | 'conventional' | 'off';
    preview: {
        from?: PostRef;
        point?: Point;
        part?: string;
    } | null;
    onPreview: (p: BenchProps['preview']) => void;
    onSelect: (id: string) => void;
    onConnect: (a: PostRef, b: PostRef) => void;
    onMove: (id: string, p: Point) => void;
    onToggle: (id: string) => void;
    onHold: (id: string, closed: boolean) => void;
    onContextLost?: () => void;
    fitKey: number;
}
export const layoutKey = (c: Circuit) => JSON.stringify({ parts: c.parts.map(p => [p.id, p.kind, p.x, p.z, p.rot]), wires: c.wires.map(w => [w.id, w.a, w.b]), hints: c.presentationHints });
