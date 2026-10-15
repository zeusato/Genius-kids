// Khung hộp thoại dùng chung của xưởng: lớp nền + khung, có useDialog (focus trap, Esc, nền inert).
import React from 'react';
import { useDialog } from './useDialog';

export function Dialog({ className = '', label, onClose, children }: { className?: string; label: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return (
    <div className={`bk-dialog ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      <div ref={ref} tabIndex={-1}>{children}</div>
    </div>
  );
}
