import React from 'react';
/** Lightweight, original SVG cover. The hub never loads the game or its 3D renderer. */
export function RacingCover() {
    return <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} aria-hidden="true">
        <path fill="#d7e9dc" d="M0 0H480V270H0z"/><circle cx="391" cy="50" r="24" fill="#f5df9f"/>
        <path d="M0 141Q66 39 150 129Q227 32 307 123Q405 61 480 119V270H0Z" fill="#a7c59c"/>
        <path d="M0 179Q85 100 202 170T480 143V270H0Z" fill="#bdd0a2"/>
        <path d="M316 105Q359 145 253 171Q203 192 155 270H370Q326 211 361 182Q408 145 334 105Z" fill="#628782"/>
        <path d="M325 116Q368 153 302 173Q244 191 267 267" fill="none" stroke="#ead9a8" strokeWidth="5" strokeDasharray="15 13"/>
        <path d="M85 148 95 75H119L129 148Z" fill="#f1dfb6"/><path d="m84 76 23-33 24 33" fill="#548677"/>
        <g stroke="#8b7753" strokeWidth="3"><path d="M107 59V113M80 86H134"/><path d="m87 66 40 40m-40 0 40-40"/></g>
        <g fill="#f9efcc"><path d="m88 67 15 12-5 5-15-12zm26 25 15 12-5 5-15-12zm8-24 5 5-15 14-5-5zM98 92l5 5-15 14-5-5z"/></g>
        <ellipse cx="249" cy="239" rx="85" ry="13" fill="#345b5130"/>
        <g transform="translate(246 203) rotate(-9)">
            <rect x="-74" y="-11" width="25" height="42" rx="8" fill="#2f4447"/><rect x="49" y="-11" width="25" height="42" rx="8" fill="#2f4447"/>
            <rect x="-48" y="-49" width="96" height="40" rx="18" fill="#de9f41"/><rect x="-62" y="-28" width="124" height="57" rx="23" fill="#efc064"/>
            <path d="M-56 11H56V23Q0 38-56 23Z" fill="#cf9e48"/><path d="M-13-26H13L17 13H-17Z" fill="#fff1cb"/>
            <rect x="-51" y="-7" width="20" height="10" rx="5" fill="#fff3c6"/><rect x="31" y="-7" width="20" height="10" rx="5" fill="#fff3c6"/>
            <rect x="-51" y="19" width="102" height="8" rx="4" fill="#fff0c5"/>
            <ellipse cy="-51" rx="25" ry="24" fill="#f2e7c5"/>
            <circle cy="-83" r="30" fill="#cc7947"/><path d="M-31-86Q-34-121 0-119Q34-121 31-86Z" fill="#419e92"/>
            <path d="M-4-119H4V-89H-4Z" fill="#f4d288"/><circle cx="-25" cy="-104" r="9" fill="#ce895b"/><circle cx="25" cy="-104" r="9" fill="#ce895b"/>
            <ellipse cx="-13" cy="-83" rx="11" ry="12" fill="#fff0d0"/><ellipse cx="13" cy="-83" rx="11" ry="12" fill="#fff0d0"/>
            <ellipse cx="-12" cy="-84" rx="4" ry="6" fill="#274b49"/><ellipse cx="12" cy="-84" rx="4" ry="6" fill="#274b49"/><ellipse cy="-69" rx="15" ry="9" fill="#fff0d0"/><ellipse cy="-73" rx="4" ry="3" fill="#274b49"/>
            <path d="M-24-45Q0-61 24-45" fill="none" stroke="#385650" strokeWidth="7" strokeLinecap="round"/>
        </g>
        <path d="m385 196 14-31-2 20h15l-21 32 5-21Z" fill="#efc266"/><path d="m56 196 5 9 10 1-7 7 2 10-10-5-9 5 2-10-7-7 10-1Z" fill="#f0ce81"/>
    </svg>;
}
