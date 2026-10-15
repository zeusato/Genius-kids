// Hộp thoại có khả năng tiếp cận (mục 16): giữ focus bên trong (Tab vòng), Esc đóng, phần nền `inert`, đóng thì trả focus.
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const before = document.activeElement as HTMLElement | null;
    // nền: mọi anh em của hộp thoại (và của các tổ tiên tới body) thành inert — chuột, phím, trình đọc màn hình đều bỏ qua
    const inerted: HTMLElement[] = [];
    for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement)
      for (const sib of Array.from(node.parentElement?.children ?? [])) if (sib !== node && sib instanceof HTMLElement && !sib.inert) { sib.inert = true; inerted.push(sib); }
    const first = el.querySelector<HTMLElement>(FOCUSABLE); (first ?? el).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(n => n.offsetParent !== null);
      if (!items.length) return;
      const a = items[0], b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    el.addEventListener('keydown', key);
    return () => { el.removeEventListener('keydown', key); for (const n of inerted) n.inert = false; before?.focus?.(); };
  }, []);
  return ref;
}
