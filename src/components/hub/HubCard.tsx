import React, { useId } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { HubArt } from './HubArt';
import type { HubEntry } from './catalog';

export function HubCard<T extends string>({ entry, onSelect, variant = 'game', eager = false }: { entry: HubEntry<T>; onSelect: (id: T) => void; variant?: 'mode' | 'game'; eager?: boolean }) {
    const id = useId();
    return <button className={`hub-card hub-card-${variant}`} data-hub-card={entry.id} aria-labelledby={id} onClick={() => onSelect(entry.id)}>
        <HubArt kind={entry.art} eager={eager}/>
        <span className="hub-card-body">
            <span className="hub-card-kicker">{entry.label}</span>
            <span className="hub-card-title" id={id}>{entry.title}{variant === 'game' && <small>{entry.subtitle}</small>}</span>
            <span className="hub-card-description">{entry.description}</span>
            {variant === 'game' ? <span className="hub-card-bottom"><span>Khám phá</span><ArrowRight size={18}/></span> : <span className="hub-card-arrow"><ArrowUpRight size={20}/></span>}
        </span>
    </button>;
}
