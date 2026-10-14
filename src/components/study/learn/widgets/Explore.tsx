// Khung "kéo để quan sát": thanh trượt + nút −/+ điều khiển tham số một hình của svg kit, chú thích tự tính.
import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ExploreSpec } from '@/services/study/lessons/types';
import { nb } from '@/services/study/lessons/build';
import { renderVisual } from '@/services/generators/svg/render';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { Md } from '../../shared';

export function Explore({ spec }: { spec: ExploreSpec }) {
    const keys = Object.keys(spec.controls);
    const [v, setV] = useState<Record<string, number>>(() => Object.fromEntries(keys.map(k => [k, spec.controls[k].init])));
    const warn = spec.valid?.(v) ?? null;
    const svg = useMemo(() => (warn ? undefined : renderVisual(spec.visual(v))), [spec, v, warn]);
    const caption = warn ? '' : nb(spec.caption(v));
    const set = (k: string, x: number) => { const c = spec.controls[k]; setV(p => ({ ...p, [k]: Math.max(c.min, Math.min(c.max, x)) })); };
    return (
        <div className="learn-widget explore">
            <h3>{spec.title}</h3>
            <div className="explore-body">
                <div className="explore-visual">{svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="explore-warn">{warn}</p>}</div>
                <div className="explore-controls">
                    {keys.map(k => {
                        const c = spec.controls[k], st = c.step ?? 1;
                        return (
                            <label key={k} className="explore-control">
                                <span>{c.label}: <b>{nb(String(v[k]).replace('.', ','))}{c.unit ? ` ${c.unit}` : ''}</b></span>
                                <span className="explore-row">
                                    <button type="button" className="hub-icon" aria-label={`Giảm ${c.label}`} onClick={() => set(k, v[k] - st)} disabled={v[k] <= c.min}><Minus size={18} /></button>
                                    <input type="range" min={c.min} max={c.max} step={st} value={v[k]} aria-label={c.label} onChange={e => set(k, Number(e.target.value))} />
                                    <button type="button" className="hub-icon" aria-label={`Tăng ${c.label}`} onClick={() => set(k, v[k] + st)} disabled={v[k] >= c.max}><Plus size={18} /></button>
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
            {caption && <div className="explore-caption" aria-live="polite"><Md>{caption}</Md><SpeakButton text={questionToSpeech(spec.speak?.(v) ?? caption)} lang="vi-VN" size={20} /></div>}
        </div>
    );
}
