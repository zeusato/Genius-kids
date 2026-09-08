import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function MemoryModal({title,children,onClose}:{title:string;children:React.ReactNode;onClose?:()=>void}){
    const ref=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
    useEffect(()=>{
        const previous=document.activeElement as HTMLElement|null;
        ref.current?.querySelector<HTMLElement>('button:not(:disabled),input,select')?.focus();
        const key=(e:KeyboardEvent)=>{
            if(e.key==='Escape'){e.preventDefault();close.current?.();}
            if(e.key!=='Tab')return;
            const items=[...ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,summary,a[href],[tabindex="0"]')||[]];if(!items.length)return;
            if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}
            else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}
        };
        document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
    },[]);
    return <div className="mm-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose?.();}}><section className="mm-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>{onClose&&<button className="mm-icon mm-close" onClick={onClose} aria-label="Đóng"><X size={19}/></button>}{children}</section></div>;
}
