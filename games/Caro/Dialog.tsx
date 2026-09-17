import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current; el?.showModal(); return () => { el?.close(); }; }, []);
  return <dialog className="caro-dialog" ref={ref} aria-labelledby="caro-dialog-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <header><h2 id="caro-dialog-title">{title}</h2><button aria-label="Đóng" onClick={onClose}><X size={20}/></button></header>{children}
  </dialog>;
}
