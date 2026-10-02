import React from 'react';
import type { Riddle } from '../content/types';

/** Chia một dòng câu đố thành đoạn thường / đoạn manh mối (đánh số theo thứ tự manh mối). */
export function markLine(line: string, r: Riddle): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const hits = r.clues.map((c, i) => ({ i, at: line.indexOf(c.quote), len: c.quote.length })).filter(h => h.at >= 0).sort((a, b) => a.at - b.at);
    let pos = 0;
    for (const h of hits) {
        if (h.at < pos) continue;
        if (h.at > pos) parts.push(line.slice(pos, h.at));
        parts.push(<mark key={h.i} className="rd-clue-mark" style={{ ['--i' as string]: h.i }}>{line.slice(h.at, h.at + h.len)}<sup>{h.i + 1}</sup></mark>);
        pos = h.at + h.len;
    }
    if (pos < line.length) parts.push(line.slice(pos));
    return parts;
}

export function Seals({ n, total = 3, animate = true }: { n: number; total?: number; animate?: boolean }) {
    return (
        <span className="rd-seals" aria-label={`${n} dấu ấn`}>
            {Array.from({ length: total }, (_, i) => <span key={i} className={`rd-seal${i < n ? ' is-on' : ''}${animate ? ' is-anim' : ''}`} style={{ ['--d' as string]: `${200 + i * 180}ms` }} aria-hidden="true">𓂀</span>)}
        </span>
    );
}

export function ClueList({ riddle }: { riddle: Riddle }) {
    return (
        <ol className="rd-clue-list">
            {riddle.clues.map((c, i) => (
                <li key={i} style={{ ['--i' as string]: i, ['--d' as string]: `${300 + i * 260}ms` }}>
                    <span className="rd-clue-num">{i + 1}</span>
                    <span><b>“{c.quote}”</b> {c.means}</span>
                </li>
            ))}
        </ol>
    );
}

export function AnswerBadge({ riddle }: { riddle: Riddle }) {
    return (
        <div className="rd-answer">
            {riddle.emoji && <span className="rd-answer-pic" aria-hidden="true">{riddle.emoji}</span>}
            <span>
                <strong>{riddle.answer}</strong>
                {riddle.answerVi && <small>{riddle.answerVi}</small>}
            </span>
        </div>
    );
}
