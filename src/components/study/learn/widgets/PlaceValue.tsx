// Bảng hàng: dựng số bằng nút +/− từng hàng, đọc số; so sánh hai số; dời dấu phẩy khi × / : 10, 100, 1000.
import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { PlaceValueSpec } from '@/services/study/lessons/types';
import { fmt, readNumberVN } from '@/services/study/value';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { Md } from '../../shared';

const INT = ['Đơn vị', 'Chục', 'Trăm', 'Nghìn', 'Chục nghìn', 'Trăm nghìn', 'Triệu', 'Chục triệu', 'Trăm triệu'];
const DEC = ['Phần mười', 'Phần trăm', 'Phần nghìn'];
const PLACE = (e: number) => (e >= 0 ? INT[e] : DEC[-e - 1]);
const round9 = (x: number) => Math.round(x * 1e9) / 1e9;

/** chữ số của x theo hàng e (e từ int-1 xuống -dec) */
const digitAt = (x: number, e: number) => Math.floor(round9(x / 10 ** e) + 1e-9) % 10;
export const expandVN = (x: number, int: number, dec: number): string => {
    const parts: string[] = [];
    for (let e = int - 1; e >= -dec; e--) { const d = digitAt(x, e); if (d) parts.push(fmt(round9(d * 10 ** e))); }
    return parts.join(' + ') || '0';
};

function Table({ int, dec, values, hiCol, onStep }: { int: number; dec: number; values: number[]; hiCol?: number; onStep?: (e: number, d: 1 | -1) => void }) {
    const exps: number[] = [];
    for (let e = int - 1; e >= -dec; e--) exps.push(e);
    return (
        <div className="pv-scroll" role="region" aria-label="Bảng hàng" tabIndex={0}>
            <table className="pv">
                <thead><tr>{exps.map(e => <th key={e} scope="col" className={e < 0 ? 'dec' : ''}>{PLACE(e)}</th>)}</tr></thead>
                <tbody>{values.map((x, r) => <tr key={r}>{exps.map(e => <td key={e} className={`${e === hiCol ? 'hi' : ''}${e === 0 && dec ? ' comma' : ''}`}>
                    {onStep && <button type="button" aria-label={`Tăng hàng ${PLACE(e)}`} onClick={() => onStep(e, 1)}><Plus size={14} /></button>}
                    <b>{digitAt(x, e)}</b>
                    {onStep && <button type="button" aria-label={`Giảm hàng ${PLACE(e)}`} onClick={() => onStep(e, -1)}><Minus size={14} /></button>}
                </td>)}</tr>)}</tbody>
            </table>
        </div>
    );
}

export function PlaceValue({ spec }: { spec: PlaceValueSpec }) {
    const dec = spec.dec ?? 0;
    const [x, setX] = useState(spec.init);
    const [log, setLog] = useState('');
    const mode = spec.mode ?? 'build';
    if (mode === 'compare') {
        const y = spec.other ?? 0;
        let hi: number | undefined;
        for (let e = spec.int - 1; e >= -dec; e--) if (digitAt(x, e) !== digitAt(y, e)) { hi = e; break; }
        const sign = x > y ? '>' : x < y ? '<' : '=';
        return (
            <div className="learn-widget pvw">
                <Table int={spec.int} dec={dec} values={[x, y]} hiCol={hi} />
                <p className="explore-caption"><span>{hi === undefined ? `Hai số bằng nhau: ${fmt(x)} = ${fmt(y)}.` : `So sánh từ hàng cao nhất. Hàng ${PLACE(hi).toLowerCase()} khác nhau: ${digitAt(x, hi)} ${sign} ${digitAt(y, hi)}, nên ${fmt(x)} ${sign} ${fmt(y)}.`}</span></p>
            </div>
        );
    }
    if (mode === 'shift') {
        const ops: [string, number][] = [['× 10', 10], ['× 100', 100], ['× 1000', 1000], [': 10', 0.1], [': 100', 0.01], [': 1000', 0.001]];
        const apply = (label: string, f: number) => {
            const nx = round9(x * f);
            if (nx >= 10 ** spec.int || (nx !== 0 && nx < 10 ** -dec)) { setLog('Số quá lớn hoặc quá bé cho bảng này, em thử phép khác nhé.'); return; }
            const n = label.slice(2).length - 1;
            setLog(`${fmt(x)} ${label} = ${fmt(nx)}: dời dấu phẩy sang ${f > 1 ? 'phải' : 'trái'} ${n} chữ số.`);
            setX(nx);
        };
        return (
            <div className="learn-widget pvw">
                <Table int={spec.int} dec={dec} values={[x]} />
                <div className="learn-widget-actions">{ops.map(([l, f]) => <button key={l} className="study-btn soft" onClick={() => apply(l, f)}>{l}</button>)}
                    <button className="hub-text-link" onClick={() => { setX(spec.init); setLog(''); }}>Về số ban đầu</button></div>
                <p className="explore-caption"><span><Md inline>{log || `Số đang xét: ${fmt(x)}. Bấm một phép tính để xem dấu phẩy dời đi đâu.`}</Md></span></p>
            </div>
        );
    }
    const step = (e: number, d: 1 | -1) => {
        const cur = digitAt(x, e), next = (cur + d + 10) % 10;
        setX(round9(x + (next - cur) * 10 ** e));
    };
    const reading = readNumberVN(x);
    return (
        <div className="learn-widget pvw">
            <h3>Chạm + / − để đổi chữ số ở từng hàng</h3>
            <Table int={spec.int} dec={dec} values={[x]} onStep={step} />
            <div className="explore-caption">
                <span>Viết: <b>{fmt(x)}</b><br />Đọc: <b>{reading}</b><br />{x > 0 && <>Viết thành tổng: <b>{fmt(x)} = {expandVN(x, spec.int, dec)}</b></>}</span>
                <SpeakButton text={reading} lang="vi-VN" size={20} />
            </div>
        </div>
    );
}
