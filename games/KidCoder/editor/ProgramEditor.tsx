import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, GripVertical, Redo2, Trash2, Undo2 } from 'lucide-react';
import { Command, COMMANDS, ProgramNode, copyProgram, countBlocks, newNode, validateProgram } from '../engine/model';
import { Slot, findNode, insertNode, locate, moveNode, updateNode } from './operations';

interface Props { program: ProgramNode[]; onChange: (nodes: ProgramNode[]) => void; allowed: Command[]; disabled: boolean; activeId?: string | null; errorId?: string | null; budget: number }
export function ProgramEditor({ program, onChange, allowed, disabled, activeId, errorId, budget }: Props) {
    const [selection, setSelection] = useState<string | null>(null), [target, setTarget] = useState<Slot | null>(null);
    const [past, setPast] = useState<ProgramNode[][]>([]), [future, setFuture] = useState<ProgramNode[][]>([]), [notice, setNotice] = useState('');
    const [drag, setDrag] = useState<{ x: number; y: number; type: Command } | null>(null), [over, setOver] = useState<string | null>(null);
    const root = useRef<HTMLDivElement>(null), dragRef = useRef<{ startX: number; startY: number; type: Command; id?: string; moved: boolean } | null>(null);
    const clickSuppressed = useRef(false), latest = useRef({ program, disabled, target }); latest.current = { program, disabled, target };
    const commitRef = useRef<(p: ProgramNode[]) => boolean>(() => false);
    function commit(next: ProgramNode[]) {
        if (disabled) return false;
        const error = validateProgram(next, allowed, true); if (error) { setNotice(error); return false; }
        setPast(p => [...p.slice(-29), program]); setFuture([]); setNotice(''); onChange(next);
        return true;
    }
    commitRef.current = commit;
    const defaultSlot = (): Slot => target || { parent: null, branch: 'body', index: program.length };
    function add(type: Command) {
        if (clickSuppressed.current) { clickSuppressed.current = false; return; }
        const node = newNode(type), slot = defaultSlot(); if (!commit(insertNode(program, slot, node))) return; setSelection(node.id);
        setTarget(type === 'repeat' || type === 'if' ? { parent: node.id, branch: 'body', index: 0 } : target ? { ...slot, index: slot.index + 1 } : null);
    }
    function begin(e: React.PointerEvent, type: Command, id?: string) {
        if (disabled || e.button !== 0) return;
        dragRef.current = { startX: e.clientX, startY: e.clientY, type, id, moved: false };
    }
    useEffect(() => {
        let pointer: {x:number;y:number}|null=null;
        let scrollTimer: ReturnType<typeof setInterval>|null=null;
        const stopScroll=()=>{if(scrollTimer)clearInterval(scrollTimer);scrollTimer=null;pointer=null;};
        function move(e: PointerEvent) {
            const d = dragRef.current; if (!d) return;
            if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 8) return;
            d.moved = true; e.preventDefault(); setDrag({ x: e.clientX, y: e.clientY, type: d.type });
            pointer={x:e.clientX,y:e.clientY};
            const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-code-slot]');
            setOver(slot && root.current?.contains(slot) ? slot.dataset.codeSlot || null : null);
            if(!scrollTimer)scrollTimer=setInterval(()=>{
                const list=root.current?.querySelector<HTMLElement>('.kc-program-list');if(!list||!pointer)return;
                const r=list.getBoundingClientRect();
                if(pointer.x<r.left||pointer.x>r.right||pointer.y<r.top-25||pointer.y>r.bottom+25)return;
                if(pointer.y<r.top+30)list.scrollTop-=8;else if(pointer.y>r.bottom-30)list.scrollTop+=8;
                const hit=document.elementFromPoint(pointer.x,pointer.y)?.closest<HTMLElement>('[data-code-slot]');
                setOver(hit&&root.current?.contains(hit)?hit.dataset.codeSlot||null:null);
            },35);
        }
        function finish(e: PointerEvent) {
            stopScroll();
            const d = dragRef.current; dragRef.current = null; setDrag(null); setOver(null);
            if (!d?.moved) return;
            clickSuppressed.current = true;
            // A drag may finish outside the original button and therefore produce no click.
            window.setTimeout(() => { clickSuppressed.current = false; }, 0);
            if (latest.current.disabled || e.type === 'pointercancel') return;
            const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-code-slot]');
            if (!el || !root.current?.contains(el) || !el.dataset.codeSlot) return;
            const slot = JSON.parse(el.dataset.codeSlot) as Slot, current = latest.current.program;
            const node = d.id ? findNode(current,d.id) : newNode(d.type);
            if (!node) return;
            const next = d.id ? moveNode(current, d.id, slot) : insertNode(current, slot, node);
            if (next !== current && commitRef.current(next)) { setSelection(node.id); setTarget(!d.id && (node.type==='repeat'||node.type==='if') ? {parent:node.id,branch:'body',index:0} : null); }
        }
        window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', finish);
        return () => { stopScroll(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', finish); };
    }, []);
    useEffect(() => {
        const focusId=activeId||selection;
        const item = focusId ? root.current?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(focusId)}"] > .kc-block-row`) : null;
        const pane = root.current?.querySelector<HTMLElement>('.kc-program-list');
        if (item && pane) { const row=item.getBoundingClientRect(), bounds=pane.getBoundingClientRect(); if(row.top<bounds.top)pane.scrollTop+=row.top-bounds.top-5; else if(row.bottom>bounds.bottom)pane.scrollTop+=row.bottom-bounds.bottom+5; }
    }, [activeId,selection,program]);
    function shift(delta: number) {
        if (!selection) return; const slot = locate(program, selection); if (!slot) return;
        commit(moveNode(program, selection, { ...slot, index: Math.max(0, slot.index + (delta > 0 ? 2 : -1)) }));
    }
    function list(nodes: ProgramNode[], parent: string | null = null, branch: Slot['branch'] = 'body', depth = 0): React.ReactNode {
        return <div className={`kc-block-list depth-${depth}`}>
            {nodes.map((node, i) => {
                const meta = COMMANDS[node.type], slot: Slot = { parent, branch, index: i }, serialized = JSON.stringify(slot);
                return <div key={node.id} data-node-id={node.id} className={`kc-block ${selection === node.id ? 'selected' : ''} ${activeId === node.id ? 'executing' : ''} ${errorId === node.id ? 'failed' : ''} ${over === serialized ? 'drop-before' : ''}`} style={{ '--block': meta.color } as React.CSSProperties}>
                    <div className="kc-block-row" data-code-slot={serialized}>
                        <button className="kc-grip" aria-label={`Kéo ${meta.label}`} disabled={disabled} onPointerDown={e => begin(e, node.type, node.id)}><GripVertical size={15}/></button>
                        <button className="kc-block-select" aria-pressed={selection === node.id} onClick={() => { setSelection(node.id); setTarget({ parent, branch, index: i + 1 }); }}><span className="kc-block-symbol">{meta.icon}</span><span>{meta.short}</span></button>
                        {node.type === 'repeat' && <label className="kc-count"><select aria-label="Số lần lặp" value={node.count} disabled={disabled} onChange={e => commit(updateNode(program, node.id, n => ({ ...n, count: Number(e.target.value) } as ProgramNode)))}>{[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select> lần</label>}
                        {node.type === 'if' && <select className="kc-sensor-select" aria-label="Điều kiện cảm biến" disabled={disabled} value={node.sensor} onChange={e => commit(updateNode(program, node.id, n => ({ ...n, sensor: e.target.value } as ProgramNode)))}><option value="clear">đường trống</option><option value="sample">có mẫu mới</option></select>}
                        <button className="kc-delete-block" aria-label={`Xóa ${meta.label}`} disabled={disabled} onClick={() => { commit(updateNode(program, node.id, () => null)); setSelection(null); setTarget(null); }}><Trash2 size={14}/></button>
                    </div>
                    {(node.type === 'repeat' || node.type === 'if') && list(node.body, node.id, 'body', depth + 1)}
                    {node.type === 'if' && <><div className="kc-else-label">Không thì <small>(có thể để trống)</small></div>{list(node.otherwise, node.id, 'otherwise', depth + 1)}</>}
                </div>;
            })}
            {(() => { const slot: Slot = { parent, branch, index: nodes.length }, encoded = JSON.stringify(slot), chosen = target && JSON.stringify(target) === encoded; return <button disabled={disabled} data-code-slot={encoded} className={`kc-insert ${!nodes.length ? 'empty' : ''} ${over === encoded || chosen ? 'target' : ''}`} onClick={() => { setTarget(slot); setSelection(null); }} aria-label={parent ? `Chèn vào ${branch === 'body' ? 'nhóm' : 'nhánh không thì'}` : 'Chèn cuối chương trình'}>{!nodes.length ? (parent ? '+ Thêm lệnh vào đây' : 'Chạm một lệnh bên dưới để bắt đầu') : '+ Chèn ở đây'}{chosen && <small>Đã chọn · chạm lệnh bên dưới</small>}</button>; })()}
        </div>;
    }
    return <div className="kc-editor" ref={root}>
        <div className="kc-editor-title"><div><span className="kc-eyebrow">BỘ ĐIỀU KHIỂN</span><h2>Chương trình của em</h2></div><span className={`kc-code-count ${countBlocks(program) > budget ? 'over' : ''}`} title="Ngân sách khối để đạt huy hiệu Viết gọn">{countBlocks(program)} <small>/ {budget}</small></span></div>
        <div className="kc-editor-tools">
            <button aria-label="Hoàn tác" title="Hoàn tác" disabled={disabled || !past.length} onClick={() => { setFuture(f => [program, ...f]); onChange(past.at(-1)!); setPast(p => p.slice(0, -1)); setTarget(null); }}><Undo2 size={17}/></button>
            <button aria-label="Làm lại" title="Làm lại" disabled={disabled || !future.length} onClick={() => { setPast(p => [...p, program]); onChange(future[0]); setFuture(f => f.slice(1)); setTarget(null); }}><Redo2 size={17}/></button>
            <span/>
            <button aria-label="Chuyển lệnh lên" title="Chuyển lên" disabled={disabled || !selection} onClick={() => shift(-1)}><ArrowUp size={16}/></button>
            <button aria-label="Chuyển lệnh xuống" title="Chuyển xuống" disabled={disabled || !selection} onClick={() => shift(1)}><ArrowDown size={16}/></button>
            <button aria-label="Nhân bản lệnh" title="Nhân bản" disabled={disabled || !selection} onClick={() => { const n = findNode(program, selection!), slot = locate(program, selection!); if (n && slot) commit(insertNode(program, { ...slot, index: slot.index + 1 }, copyProgram([n])[0])); }}><Copy size={16}/></button>
            <button aria-label="Xóa chương trình" title="Xóa hết · có thể hoàn tác" disabled={disabled || !program.length} onClick={() => { commit([]); setSelection(null); setTarget(null); }}><Trash2 size={16}/></button>
        </div>
        <div className="kc-program-list">{list(program)}</div>
        <div className="kc-palette-label">{target ? 'Chọn lệnh để chèn vào vị trí đã chọn' : 'CHẠM ĐỂ THÊM · KÉO ĐỂ SẮP XẾP'}</div>
        <div className="kc-palette">{allowed.map(type => <button key={type} disabled={disabled} className="kc-command" style={{ '--block': COMMANDS[type].color } as React.CSSProperties} title={COMMANDS[type].help} onPointerDown={e => begin(e, type)} onClick={() => add(type)} aria-label={`Thêm ${COMMANDS[type].label}`}><span>{COMMANDS[type].icon}</span><strong>{COMMANDS[type].short}</strong></button>)}</div>
        {notice && <p className="kc-editor-notice" role="alert">{notice}</p>}
        {drag && <div className="kc-drag-ghost" style={{ left: drag.x + 12, top: drag.y + 12, borderColor: COMMANDS[drag.type].color }}>{COMMANDS[drag.type].icon} {COMMANDS[drag.type].label}</div>}
    </div>;
}
