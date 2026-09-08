import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.querySelector<HTMLElement>('button,input,select')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close.current();}if(e.key==='Tab'){const all=[...ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,a[href],[tabindex="0"]')||[]];if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0]?.focus();}}};document.addEventListener('keydown',key,true);return()=>{document.removeEventListener('keydown',key,true);if(previous?.isConnected)previous.focus();};},[]);
 return <div className="dq-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} className="dq-modal" role="dialog" aria-modal="true" aria-label={title}><div className="dq-modal-heading"><h2>{title}</h2><button className="dq-icon" aria-label="Đóng" onClick={onClose}><X size={20}/></button></div>{children}</section></div>;
}
