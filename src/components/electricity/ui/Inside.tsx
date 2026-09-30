import React, { Component, lazy, Suspense, useState } from 'react';
import { ArrowLeft, Power } from 'lucide-react';
import { BenchProps } from './benchTypes';
import { PARTS } from '../engine/parts';
import { reading } from '../engine/solver';
import { driftMmPerSecond } from '../engine/simulation';
import { wireTones } from '../bench/wireColors';
import './workshop.css';

const WireDive = lazy(() => import('../bench/WireDive'));
class DiveBoundary extends Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onError(); }
    render() { return this.state.failed ? null : this.props.children; }
}
const webgl = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const postName = (id: string) => id === 'plus' ? '(+)' : id === 'minus' ? '(−)' : id === 'anode' ? '(+)' : id === 'cathode' ? '(−)' : id.toUpperCase();

/** Hình cắt lớp phẳng: dây (khi không có WebGL) và các linh kiện. */
function Cutaway({ sim, id, layer, reduced }: { sim: BenchProps['sim']; id: string; layer: number; reduced: boolean }) {
    const p = sim.circuit.parts.find(p => p.id === id), wire = sim.circuit.wires.find(w => w.id === id), r = reading(sim.solution, id), metal = !!wire;
    const name = p ? PARTS[p.kind].name : 'Dây dẫn', labels = metal ? ['Vỏ nhựa', 'Lõi đồng', 'Mạng tinh thể'] : ['Vỏ ngoài', 'Tiếp điểm', 'Bên trong'];
    return <svg className="ew-cutaway" viewBox="0 0 900 380" role="img" aria-label={`Hình cắt ${name}, lớp ${labels[layer]}`}>
        {metal ? <><rect x="50" y="100" width="800" height="180" rx="80" fill={layer === 0 ? '#568d82' : '#a8754f'} />{layer === 0 ? <><rect x="85" y="130" width="740" height="120" rx="50" fill="#c29763" /><text x="450" y="72" textAnchor="middle" fill="currentColor" fontSize="22">Vỏ nhựa: electron liên kết, không tự do như trong đồng</text></> : layer === 1 ? <>{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M80 ${125 + i * 20}H820`} stroke="#e5b278" strokeWidth="11" />)}</> : <>{Array.from({ length: 50 }, (_, i) => <circle key={`ion${i}`} cx={95 + (i % 10) * 78} cy={123 + Math.floor(i / 10) * 34} r="9" fill="#ecb880" />)}{Array.from({ length: 24 }, (_, i) => <circle key={`electron${i}`} cx={90 + (i % 12) * 62} cy={145 + Math.floor(i / 12) * 75} r="5" fill="#d3f4eb" className={!reduced && Math.abs(r.Iab) > 1e-7 ? 'ew-drift' : ''} style={{ animationDelay: `${i * .1}s`, animationDirection: r.Iab > 0 ? 'reverse' : 'normal' }} />)}</>}{wire?.broken && <path d="M450 95 430 180 462 210 446 285" stroke="#203c39" strokeWidth="24" />}</>
            : p?.kind === 'bulb' ? <><circle cx="450" cy="150" r="120" fill="#e7dbc0" stroke="#baab8b" strokeWidth="5" /><rect x="390" y="260" width="120" height="70" rx="18" fill="#b99661" /><path d={p.broken ? 'M415 285V150l22-30M467 150v135' : 'M415 285V150l22-30 26 30 22-30v165'} fill="none" stroke={r.Pabsorbed > .02 ? '#f5b747' : '#87705c'} strokeWidth="8" /><text x="225" y="318" fontSize="23" fill="currentColor">Cọc A · phần ren</text><text x="525" y="350" fontSize="23" fill="currentColor">Cọc B · điểm đáy</text>{p.loose && <path d="M382 275H518" stroke="#e17860" strokeDasharray="12 8" strokeWidth="12" />}</>
                : p?.kind === 'battery' ? <>{p.cells?.map((cell, i) => <g key={i} transform={`translate(${140 + i * 160} 85)`}><rect width="125" height="210" rx="18" fill="#d7b879" /><text x="62" y="55" textAnchor="middle" fontSize="40">{cell.polarity === 1 ? '+' : '−'}</text><rect x="20" y="90" width="85" height={Math.max(1, 100 * cell.charge01)} fill="#5c9a85" /><text x="62" y="235" textAnchor="middle" fill="currentColor" fontSize="20">{cell.present ? `${(cell.charge01 * 100).toFixed(1)}%` : 'Ngăn trống'}</text></g>)}</>
                    : p?.kind === 'led' ? <><path d="M330 250V140a120 120 0 0 1 240 0V250Z" fill="#df8870" /><path d="M395 250V350M510 250V315" stroke="#a5b4a9" strokeWidth="13" /><text x="260" y="370" fill="currentColor" fontSize="22">Chân dài · Anôt (+)</text><text x="530" y="330" fill="currentColor" fontSize="22">Catôt (−)</text></>
                        : p?.kind === 'bell' ? <><path d="M180 250h230" stroke="#b98c59" strokeWidth="65" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${190 + i * 18} 200v100`} stroke="#e1ad74" strokeWidth="9" />)}<path d={sim.runtime.bellOpen[p.id] ? 'M420 225 580 160 660 210' : 'M420 250 590 225 665 245'} stroke="#9bad9b" strokeWidth="12" fill="none" /><path d="M620 170a90 90 0 0 1 160 80H620Z" fill="#d0ac72" /><text x="450" y="340" textAnchor="middle" fill="currentColor" fontSize="22">{sim.runtime.bellOpen[p.id] ? 'Búa gõ · tiếp điểm vừa ngắt' : 'Cuộn dây hút búa · tiếp điểm đóng'}</text></>
                            : p?.kind === 'motor' || p?.kind === 'electromagnet' ? <><rect x="180" y="90" width="100" height="200" rx="20" fill="#cb826a" /><rect x="620" y="90" width="100" height="200" rx="20" fill="#6a9d91" /><text x="230" y="205" fontSize="40" textAnchor="middle">N</text><text x="670" y="205" fontSize="40" textAnchor="middle">S</text><g style={{ transformOrigin: '450px 190px' }} className={!reduced && Math.abs(r.Iab) >= .05 ? 'ew-fan-spin' : ''}><rect x="350" y="100" width="200" height="180" rx="30" fill="none" stroke="#c79662" strokeWidth="20" /><path d="M450 60v260" stroke="#8da596" strokeWidth="12" /></g><text x="450" y="360" textAnchor="middle" fontSize="22" fill="currentColor">Dòng điện qua cuộn dây tạo tác dụng từ · mô hình minh họa</text></>
                                : <><path d={p?.broken ? 'M180 230H375M515 230H740' : p?.closed ? 'M180 230H740' : 'M180 230H300L600 100M600 230H740'} stroke="#ba945b" strokeWidth="18" fill="none" /><circle cx="300" cy="230" r="24" fill="#ddb77b" /><circle cx="600" cy="230" r="24" fill="#ddb77b" /><text x="450" y="320" textAnchor="middle" fontSize="24" fill="currentColor">{p?.broken ? 'Tiếp điểm bị đứt' : p?.closed ? 'Tiếp điểm chạm nhau' : 'Quan sát đường đi qua tiếp điểm'}</text></>}
    </svg>;
}

/**
 * Soi bên trong: dây dẫn có cảnh 3D ba lớp (vỏ → lõi → mạng tinh thể); linh kiện dùng hình cắt lớp.
 * Công tắc mini vẫn điều khiển MẠCH BÊN NGOÀI; quay lại giữ nguyên vị trí, lựa chọn và kết quả.
 */
export function Inside({ sim, selected, onClose, onToggle, onObserve, reduced }: {
    sim: BenchProps['sim'];
    selected: string;
    onClose: () => void;
    onToggle: (id: string) => void;
    onObserve: (id: string) => void;
    reduced: boolean;
}) {
    const [flat, setFlat] = useState(() => !webgl()), [layer, setLayer] = useState(0);
    const p = sim.circuit.parts.find(p => p.id === selected), wire = sim.circuit.wires.find(w => w.id === selected), r = reading(sim.solution, selected), metal = !!wire;
    const name = p ? PARTS[p.kind].name : 'Dây dẫn', labels = metal ? ['Vỏ nhựa', 'Lõi đồng', 'Mạng tinh thể'] : ['Vỏ ngoài', 'Tiếp điểm', 'Bên trong'];
    const tone = wire ? wireTones(sim.circuit, sim.solution).get(wire.id) ?? 'teal' : 'teal';
    const flowing = Math.abs(r.Iab) > 1e-7 && !wire?.broken;
    const caption = metal
        ? layer === 0 ? 'Vỏ nhựa bọc ngoài, bên trong là bó sợi đồng. Nhựa giữ electron chặt nên cách điện; đồng có electron tự do nên dẫn điện.'
            : layer === 1 ? (flowing ? 'Trong từng sợi đồng, electron tự do vừa dao động vừa trôi chậm về phía cực (+), ngược chiều dòng điện quy ước.' : 'Electron tự do vẫn dao động không ngừng, nhưng chưa trôi theo một hướng vì mạch đang hở.')
                : flowing ? 'Cả “biển” electron trôi rất chậm giữa các ion đồng. Tín hiệu lan gần như tức thì dọc dây, nên bật công tắc là đèn sáng ngay.' : 'Không có dòng điện: electron tự do chỉ chuyển động hỗn loạn tại chỗ. Bên nhựa, electron bị giữ quanh nguyên tử.'
        : p?.broken ? 'Có chỗ đứt bên trong; linh kiện không còn tạo đường dẫn.' : p?.loose ? 'Bóng đang lỏng, tiếp điểm chưa chạm nhau.' : p?.kind === 'battery' ? 'Pin cung cấp năng lượng. Mức còn lại thuộc từng viên; không tự nạp lại khi mở sổ.' : p?.kind === 'bulb' ? 'Hai tiếp điểm nối tới hai đầu dây tóc. Bóng sợi đốt không có cực cộng/trừ.' : p?.kind === 'led' ? 'LED có chiều dẫn. Đổi hai dây để thử chiều ngược; luôn dùng điện trở bảo vệ.' : 'Lần theo đường đi từ cọc này đến cọc kia.';
    const switches = sim.circuit.parts.filter(p => p.kind === 'switch');
    const pick = (i: number) => { setLayer(i); onObserve(selected); };
    const dark = metal && !flat;
    return <section className={`ew-ws ew-inside is-night ${dark ? 'is-dive' : ''}`} aria-label={`Soi bên trong ${name}`}>
        {dark && <div className="ew-ws-stage"><DiveBoundary onError={() => setFlat(true)}><Suspense fallback={<div className="ew-ws-loading"><span>Đang mở lõi đồng…</span></div>}><WireDive layer={layer} current={wire?.broken ? 0 : r.Iab} reduced={reduced} tone={tone} onError={() => setFlat(true)} /></Suspense></DiveBoundary></div>}
        <div className="ew-ws-top">
            <button className="ew-round" onClick={onClose} aria-label="Về đúng mạch đang làm"><ArrowLeft size={20} /></button>
            <div className="ew-ws-title"><span>Soi bên trong · mô hình minh họa</span><h1>{wire ? `Dây ${wire.a.partId} ${postName(wire.a.postId)} → ${wire.b.partId} ${postName(wire.b.postId)}` : `${name} ${selected}`}</h1></div>
            <div className={`ew-chip ${flowing ? 'is-ok' : 'is-idle'}`}><i />{flowing ? 'Đang có dòng điện' : 'Chưa có dòng điện'}</div>
        </div>
        <div className="ew-layer-bar" role="group" aria-label="Lớp quan sát">{labels.map((t, i) => <button key={t} aria-pressed={layer === i} onClick={() => pick(i)}><b>{i + 1}</b>{t}</button>)}</div>
        {dark && layer === 2 && <div className="ew-dive-titles" aria-hidden="true"><div><b>Đồng · lõi dây</b><span>electron tự do{flowing ? ' trôi chậm về cực (+)' : ' dao động tại chỗ'}</span></div><div><b>Nhựa · vỏ dây</b><span>electron bị giữ quanh nguyên tử</span></div></div>}
        {!dark && <div className="ew-inside-card"><Cutaway sim={sim} id={selected} layer={layer} reduced={reduced} /></div>}
        <aside className="ew-dive-caption">
            <p>{caption}</p>
            {metal && flowing && <small>Ví dụ dây đồng 1 mm², I = {Math.abs(r.Iab).toFixed(3).replace('.', ',')} A → electron chỉ nhích khoảng {driftMmPerSecond(r.Iab).toFixed(4).replace('.', ',')} mm mỗi giây. Hình đã phóng to và làm nhanh có chủ ý.</small>}
            {switches.length > 0 && <div className="ew-dive-switches">{switches.map(s => <button key={s.id} onClick={() => onToggle(s.id)} aria-pressed={!!s.closed}><Power size={15} />{s.closed ? 'Mở' : 'Đóng'} cầu dao {s.id} ngoài mạch</button>)}</div>}
            {metal && <button className="ew-dive-flat" onClick={() => setFlat(v => !v)}>{flat ? 'Xem cảnh 3D' : 'Xem hình cắt phẳng'}</button>}
        </aside>
        {dark && layer === 2 && <div className="ew-scale"><i /><b>0,5 nm</b><span>hình phóng to có chủ ý</span></div>}
    </section>;
}
