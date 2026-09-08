import React, { createContext, useContext, useId } from 'react';
export type StageTheme = 'night' | 'garden' | 'festival';
export const StageThemeContext = createContext<StageTheme>('night');
export const STAGES: { id: StageTheme; name: string; at: number; color: string }[] = [{ id: 'night', name: 'Đêm đầy sao', at: 0, color: '#294857' }, { id: 'garden', name: 'Khu vườn sáng', at: 6, color: '#79a99a' }, { id: 'festival', name: 'Lễ hội âm nhạc', at: 24, color: '#986b85' }];
export function BandStage({ active = -1, members = 3, compact = false }: { active?: number; members?: number; compact?: boolean }) {
    const id = useId().replace(/:/g, '');
    const theme = useContext(StageThemeContext), sky = theme === 'garden' ? ['#9ac5b8', '#d6ddba'] : theme === 'festival' ? ['#65445c', '#ad788a'] : ['#203a4a', '#42636c'];
    return <svg viewBox="0 0 600 365" className={`sm-band ${compact ? 'compact' : ''}`} role="img" aria-label="Ban nhạc Cáo đàn gỗ, Gấu đánh trống và Thỏ rung chuông trên sân khấu">
        <defs><linearGradient id={`${id}sky`} x2="0" y2="1"><stop stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient><linearGradient id={`${id}floor`} x2="0" y2="1"><stop stopColor="#cd9871"/><stop offset="1" stopColor="#a97056"/></linearGradient></defs>
        <path d="M22 310V139Q22 24 147 24H453Q578 24 578 139V310Z" fill={`url(#${id}sky)`}/>
        <path d="M30 180Q80 67 182 62M567 170Q520 62 423 62" fill="none" stroke="#77928b" strokeWidth="2" opacity=".35"/>
        <circle cx="462" cy="79" r="24" fill="#f3d9a0"/>{theme !== 'garden' && <circle cx="452" cy="70" r="22" fill={theme === 'festival' ? '#734e67' : '#2a4655'}/>}
        {theme === 'festival' && <g fill="#edc482">{[90,150,210,270,330,390,450,510].map((x,i)=><path key={x} d={`M${x} 115l9 6-12 12Z`} fill={i%2?'#8dc1b3':'#edc482'}/>)}</g>}
        {[ [117,76],[200,109],[301,67],[391,122],[522,140],[69,171] ].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`} fill="#ecdbb0"><path d="M0-4L1-1L4 0L1 1L0 4L-1 1L-4 0L-1-1Z"/></g>)}
        <path d="M65 48Q300 129 540 48" fill="none" stroke="#acb2a0" strokeWidth="2"/>
        {[95,155,220,287,356,423,493].map((x,i)=><circle key={x} cx={x} cy={58+Math.sin(i/6*Math.PI)*31} r="5" fill={i%2?'#f6d58d':'#efaa84'}/>)}
        <ellipse cx="300" cy="311" rx="284" ry="42" fill={`url(#${id}floor)`}/><ellipse cx="300" cy="304" rx="275" ry="32" fill="#e0b38a"/>
        <path d="M69 298H533M107 313H500M200 277L173 330M398 277L429 330" stroke="#c18f6b" fill="none" opacity=".6"/>
        <g className={active===0?'sm-musician playing':'sm-musician'} style={{transformOrigin:'150px 300px'}}>
            <ellipse cx="153" cy="300" rx="66" ry="11" fill="#836b59" opacity=".23"/>
            <path d="M201 266Q246 229 222 218Q206 246 185 250Z" fill="#cf7550"/><path d="M222 218Q232 240 215 249L207 240Z" fill="#ffebcd"/>
            <rect x="123" y="217" width="60" height="68" rx="27" fill="#46796e"/>
            <path d="M115 178L110 124L144 145Q162 137 178 148L204 128L199 181Q197 219 156 220Q119 216 115 178Z" fill="#dc905c"/>
            <path d="M114 137L137 155L120 168M183 155L200 141L196 170" fill="#724f4b"/>
            <path d="M118 180Q130 174 155 194Q180 172 197 180Q196 219 157 219Q122 216 118 180Z" fill="#ffe9c9"/>
            <ellipse cx="137" cy="178" rx="3" ry="5" fill="#243d4d"/><ellipse cx="177" cy="178" rx="3" ry="5" fill="#243d4d"/>
            <path d="M149 193Q157 188 165 193L157 200Z" fill="#3b4243"/><path d="M150 206Q157 211 164 206" fill="none" stroke="#754f43" strokeWidth="2"/>
            <path d="M123 239L100 256M181 240L207 251" stroke="#dc905c" strokeWidth="13" strokeLinecap="round"/>
            <path d="M100 258L119 232M207 251L188 227" stroke="#634a40" strokeWidth="4"/><circle cx="119" cy="230" r="7" fill="#f5c275"/><circle cx="187" cy="225" r="7" fill="#f5c275"/>
            <path d="M93 272L94 304M211 272L214 304" stroke="#625d50" strokeWidth="6"/>
            <path d="M90 266H215V284H90Z" fill="#966f54"/>
            {[0,1,2,3,4].map(n=><rect key={n} x={94+n*24} y={254+n*2} width="19" height={26-n*2} rx="4" fill={['#eeb574','#edc480','#92b3a0','#77a9ac','#c4a2b7'][n]}/>)}
        </g>
        <g opacity={members>=2?1:.28} className={active===1?'sm-musician playing':'sm-musician'} style={{transformOrigin:'315px 302px'}}>
            <ellipse cx="315" cy="306" rx="64" ry="10" fill="#836b59" opacity=".23"/>
            <circle cx="283" cy="175" r="18" fill="#b79576"/><circle cx="350" cy="175" r="18" fill="#b79576"/>
            <rect x="277" y="207" width="81" height="82" rx="36" fill="#d1a558"/><rect x="275" y="160" width="83" height="70" rx="33" fill="#c4a386"/>
            <ellipse cx="302" cy="193" rx="3" ry="5" fill="#243d4d"/><ellipse cx="334" cy="193" rx="3" ry="5" fill="#243d4d"/>
            <ellipse cx="318" cy="210" rx="17" ry="12" fill="#edc8a0"/><ellipse cx="318" cy="204" rx="6" ry="4" fill="#494849"/>
            <path d="M283 239L266 252M351 237L372 246" stroke="#c4a386" strokeWidth="14" strokeLinecap="round"/>
            <path d="M265 251L276 221M371 245L355 214" stroke="#725540" strokeWidth="4" strokeLinecap="round"/>
            <path d="M265 276H365L359 301H271Z" fill="#915e4b"/>
            <circle cx="316" cy="270" r="37" fill="#426d77"/><circle cx="316" cy="270" r="30" fill="#fbdfb0" stroke="#e9b870" strokeWidth="3"/>
            <path d="M310 267V282M310 267L323 263V278" fill="none" stroke="#9d6d4c" strokeWidth="3"/><ellipse cx="306" cy="281" rx="5" ry="3" fill="#9d6d4c"/><ellipse cx="319" cy="277" rx="5" ry="3" fill="#9d6d4c"/>
        </g>
        <g opacity={members>=3?1:.28} className={active===2?'sm-musician playing':'sm-musician'} style={{transformOrigin:'455px 295px'}}>
            <ellipse cx="464" cy="299" rx="55" ry="10" fill="#836b59" opacity=".23"/>
            <path d="M435 287Q429 248 443 224H486Q505 249 496 287Z" fill="#ad8196"/>
            <ellipse cx="448" cy="143" rx="13" ry="42" fill="#eee1c6" transform="rotate(-12 448 143)"/><ellipse cx="482" cy="140" rx="12" ry="45" fill="#eee1c6" transform="rotate(12 482 140)"/>
            <ellipse cx="448" cy="140" rx="5" ry="29" fill="#d8ada8" transform="rotate(-12 448 140)"/><ellipse cx="482" cy="139" rx="5" ry="30" fill="#d8ada8" transform="rotate(12 482 139)"/>
            <ellipse cx="465" cy="191" rx="39" ry="35" fill="#eee1c6"/>
            <ellipse cx="451" cy="188" rx="3" ry="5" fill="#243d4d"/><ellipse cx="478" cy="188" rx="3" ry="5" fill="#243d4d"/>
            <path d="M459 201L465 207L471 201Z" fill="#b7827e"/><path d="M457 213Q465 218 473 212" stroke="#8c7166" strokeWidth="2" fill="none"/>
            <path d="M443 239L421 230M492 238L513 220" stroke="#eee1c6" strokeWidth="12" strokeLinecap="round"/>
            <path d="M421 222L411 239H431Z" fill="#efd396"/><circle cx="421" cy="240" r="4" fill="#b48859"/>
            <path d="M514 212L504 229H524Z" fill="#efd396"/><circle cx="514" cy="230" r="4" fill="#b48859"/>
            <ellipse cx="445" cy="290" rx="15" ry="7" fill="#eee1c6"/><ellipse cx="486" cy="290" rx="15" ry="7" fill="#eee1c6"/>
        </g>
        {active>=0&&<g className="sm-float-note" fill="#f4d398"><text x="240" y="161" fontSize="26">♪</text><text x="379" y="180" fontSize="22">♫</text></g>}
    </svg>;
}
