import React, { useId, useState } from 'react';
/** Storybook artwork, with a lightweight vector fallback for uncached offline media. */
export function PianoArt({ small=false }: {small?:boolean}) {
    const [failed,setFailed]=useState(false);
    if(failed)return <PianoVectorArt small={small}/>;
    return <img className="pn-room-art pn-room-painting" src={`${import.meta.env.BASE_URL}piano/art/${small?'room-card':'room'}.webp`} width="1200" height="800" alt="" loading={small?'lazy':'eager'} decoding="async" onError={()=>setFailed(true)}/>;
}
export function PianoModeArt({mode}:{mode:'learn'|'songs'|'free'}) {
    const [failed,setFailed]=useState(false);
    if(failed)return <span aria-hidden="true">{mode==='learn'?'🌱':mode==='songs'?'🎼':'🦋'}</span>;
    return <img className="pn-mode-painting" src={`${import.meta.env.BASE_URL}piano/art/${mode}.webp`} width="640" height="640" alt="" decoding="async" onError={()=>setFailed(true)}/>;
}
function PianoVectorArt({ small=false }: {small?:boolean}) {
    const id=useId().replace(/:/g,'');
    return <svg viewBox="0 0 640 380" className="pn-room-art" aria-hidden="true">
        <defs><linearGradient id={id+'wall'} x2="0" y2="1"><stop stopColor="#e9eee0"/><stop offset="1" stopColor="#f8efdb"/></linearGradient><linearGradient id={id+'wood'} x2="0" y2="1"><stop stopColor="#edc78b"/><stop offset="1" stopColor="#cc965f"/></linearGradient><linearGradient id={id+'keys'} x2="0" y2="1"><stop stopColor="#fffef4"/><stop offset="1" stopColor="#e8e4d5"/></linearGradient></defs>
        <rect width="640" height="380" rx="32" fill={'url(#'+id+'wall)'}/>
        <path d="M0 302Q330 266 640 307V380H0Z" fill="#e3cfac"/><path d="M0 334Q270 310 640 345M90 380 159 303M484 380 448 302" fill="none" stroke="#d5ba94" strokeWidth="2"/>
        <rect x="338" y="29" width="193" height="222" rx="90" fill="#bad4c7" stroke="#fff9e8" strokeWidth="13"/>
        <path d="M347 200Q399 151 440 188T523 177V241H347Z" fill="#93b6a0"/><path d="M351 220Q416 174 521 220V241H351Z" fill="#78a591"/>
        <circle cx="472" cy="78" r="23" fill="#f6d687"/><path d="M434 37V243M344 144H524" stroke="#fff9e8" strokeWidth="8"/>
        <path d="M324 25Q318 133 339 254M538 25Q552 133 530 252" fill="none" stroke="#eddbc0" strokeWidth="24"/>
        <ellipse cx="315" cy="337" rx="217" ry="25" fill="#547567" opacity=".13"/>
        <path d="M177 193V306M447 190V307" stroke="#8e694d" strokeWidth="22" strokeLinecap="round"/>
        <rect x="150" y="110" width="326" height="169" rx="22" fill={'url(#'+id+'wood)'} stroke="#b5895a" strokeWidth="3"/>
        <rect x="166" y="125" width="294" height="78" rx="13" fill="#577e6f"/>
        <path d="M176 137H450" stroke="#91ad94" strokeWidth="2"/>
        <text x="313" y="166" textAnchor="middle" fill="#f3dcac" fontFamily="Georgia,serif" fontSize="15" letterSpacing="5">LITTLE MELODIES</text>
        <circle cx="187" cy="187" r="4" fill="#edce92"/><circle cx="204" cy="187" r="4" fill="#c5d5b4"/>
        <path d="M149 206H478L493 257H134Z" fill="#aa7850"/>
        <rect x="146" y="211" width="336" height="48" rx="5" fill={'url(#'+id+'keys)'}/>
        {Array.from({length:15},(_,i)=><path key={i} d={`M${147+i*22.3} 212v42`} stroke="#bbb9a9" strokeWidth="1.5"/>)}
        {[0,1,3,4,5,7,8,10,11,12].map(i=><rect key={i} x={161+i*22.3} y="209" width="13" height="31" rx="2" fill="#2e4942"/>)}
        <rect x="139" y="258" width="349" height="13" rx="5" fill="#c29562"/>
        <path d="M219 111 230 65H312L318 111M318 111 321 65H401L415 111" fill="#fff9e8" stroke="#bda779" strokeWidth="2"/>
        <path d="M241 80h54m-57 8h57m39-8h49m-47 8h50" stroke="#b4beb1" strokeWidth="2"/>
        <text x="260" y="102" fontSize="23" fill="#6d8d7a">♫</text><text x="352" y="103" fontSize="23" fill="#cd9c67">♪</text>
        <path d="M236 332V365M377 332V365" stroke="#896647" strokeWidth="12" strokeLinecap="round"/>
        <rect x="221" y="318" width="171" height="24" rx="12" fill="#64897a"/><path d="M235 325H378" stroke="#91b19c" strokeWidth="2"/>
        <path d="M72 281V164" stroke="#739b6b" strokeWidth="5"/>
        {[0,1,2].map(i=><g key={i}><ellipse cx={59} cy={179+i*31} rx="15" ry="24" fill={i%2?'#94b284':'#75986e'} transform={`rotate(-43 59 ${179+i*31})`}/><ellipse cx="89" cy={163+i*35} rx="14" ry="24" fill="#91b181" transform={`rotate(43 89 ${163+i*35})`}/></g>)}
        <path d="M45 265H104L95 320H54Z" fill="#d39776"/><rect x="41" y="264" width="67" height="12" rx="5" fill="#e6b391"/>
        <g transform="translate(506 254)"><path d="M9 71Q-18 21 7 12Q12 56 37 54" fill="#bc7a51"/><ellipse cx="56" cy="52" rx="34" ry="43" fill="#d39560"/><path d="M30 16 26-17 49-4M65-4 89-17 82 18" fill="#c08055"/><path d="M32 13Q55-8 79 13L91 39Q56 73 21 39Z" fill="#e2a66e"/><path d="M24 31Q42 31 55 46Q69 31 87 31L79 53Q56 66 32 53Z" fill="#fff3d8"/><circle cx="42" cy="26" r="3" fill="#354b40"/><circle cx="71" cy="26" r="3" fill="#354b40"/><path d="m50 42 7 7 7-7" fill="#354b40"/><ellipse cx="59" cy="78" rx="22" ry="19" fill="#f5dfb7"/></g>
        {!small&&<g fill="#c69b5e" fontFamily="Georgia" fontSize="32"><text x="112" y="82" transform="rotate(-12 112 82)">♪</text><text x="562" y="134" transform="rotate(12 562 134)">♫</text><path d="m98 112 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>}
    </svg>;
}
export function HandArt(){return <svg viewBox="0 0 190 130" aria-label="Ngón cái số 1, trỏ số 2, giữa số 3, áp út số 4, út số 5" role="img"><path d="M60 113 26 76Q17 60 30 56Q36 54 52 71V30Q52 17 64 21V63 15Q64 3 78 7V60 10Q82 0 91 10V63 22Q99 10 107 23V76Q109 105 95 116Z" fill="#f1cda8" stroke="#b48560" strokeWidth="2"/>{[[28,49],[55,15],[70,5],[89,5],[110,17]].map(([x,y],i)=><text key={i} x={x} y={y+8} fontSize="11" fill="#355f54">{i+1}</text>)}<text x="119" y="57" fill="#58776a" fontSize="10">Thả lỏng</text><text x="119" y="73" fill="#58776a" fontSize="10">bàn tay</text></svg>;}
