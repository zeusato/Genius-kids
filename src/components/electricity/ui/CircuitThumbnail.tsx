import React, { useMemo } from 'react';
import { Circuit, postPosition } from '../engine/circuit';
import { routeAll } from '../engine/route';
import { solve, reading } from '../engine/solver';
import { bulbBrightness } from '../engine/simulation';
import { PartGlyph } from '../flat/FlatBench';
export function CircuitThumbnail({ circuit, title }: {
    circuit: Circuit;
    title: string;
}) { const paths = useMemo(() => routeAll(circuit), [circuit]), solution = useMemo(() => solve(circuit), [circuit]); return <svg viewBox="0 0 1400 800" aria-label={`Ảnh đúng mạch ${title}`}><rect width="1400" height="800" rx="45" fill="#eee3cd"/>{[...paths].map(([id, points], i) => <path key={id} d={points.map((p, n) => `${n ? 'L' : 'M'}${p[0] * 100} ${p[1] * 100}`).join(' ')} fill="none" stroke={i % 2 ? '#48897d' : '#d07f65'} strokeWidth="12" strokeLinejoin="round"/>)}{circuit.parts.map(p => <g key={p.id} transform={`translate(${p.x * 100} ${p.z * 100}) rotate(${p.rot})`}><PartGlyph part={p} brightness={p.kind === 'bulb' ? bulbBrightness(reading(solution, p.id).Pabsorbed) : 0}/></g>)}</svg>; }
