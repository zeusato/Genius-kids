import React, { memo } from 'react';
import { Check, Flower2 } from 'lucide-react';
import { MemoryTile as Tile } from '../engine/model';
import { PictureId, PICTURES } from '../content/catalog';
import { Picture } from './Picture';

export const MemoryTile=memo(function MemoryTile({tile,index,cols,revealed,matched,hinted,blocked,tabStop,onFlip,onFocus,onKey}:{tile:Tile;index:number;cols:number;revealed:boolean;matched:boolean;hinted:boolean;blocked:boolean;tabStop:boolean;onFlip:(id:string)=>void;onFocus:(index:number)=>void;onKey:(e:React.KeyboardEvent,index:number)=>void}){
    const name=PICTURES[tile.picture as PictureId],position=`Hàng ${Math.floor(index/cols)+1} cột ${index%cols+1}`;
    return <button type="button" className={`mm-tile ${revealed?'is-open':''} ${matched?'is-matched':''} ${hinted?'is-hinted':''}`} data-memory-index={index}
        aria-label={`${position}, ${revealed?`${tile.face==='shadow'?'bóng ':''}${name}${matched?', đã ghép':''}`:'đang úp'}`} aria-pressed={revealed} aria-disabled={blocked||revealed||matched}
        tabIndex={tabStop?0:-1} onFocus={()=>onFocus(index)} onKeyDown={e=>onKey(e,index)} onClick={()=>{if(!blocked&&!revealed&&!matched)onFlip(tile.id);}}>
        <span className="mm-tile-turn"><span className="mm-tile-back" aria-hidden="true"><span className="mm-back-frame"/><Flower2/><i/><b/></span>
            <span className="mm-tile-front" aria-hidden={!revealed}><Picture id={tile.picture as PictureId} shadow={tile.face==='shadow'}/><span className="mm-tile-name">{revealed?(tile.face==='shadow'?'Chiếc bóng':name):''}</span>{matched&&<span className="mm-match-mark"><Check size={13}/></span>}</span>
        </span>
    </button>;
});
