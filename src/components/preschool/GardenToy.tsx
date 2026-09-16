import React from 'react';

/** Live foreground toys stay separate from the Flow scenery so they can respond to touch. */
export function GardenToy({ kind }: { kind: 'apple' | 'ball' | 'cat' | 'bush' }) {
    return <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        {kind === 'apple' && <>
            <path d="M61 30Q56 13 68 7" fill="none" stroke="#775039" strokeWidth="7" strokeLinecap="round"/>
            <path d="M62 25Q67 1 92 13Q88 34 62 25" fill="#6b9958"/>
            <path d="M60 33C26 11 7 47 18 78C25 106 40 116 60 105C82 118 101 94 105 68C111 35 84 17 60 33" fill="#cd5848" stroke="#a54436" strokeWidth="2"/>
            <path d="M60 35C35 18 17 49 27 76C34 95 44 103 60 99C82 109 99 79 98 59C95 37 78 25 60 35" fill="#e9785e"/>
            <path d="M38 42Q28 48 30 63" fill="none" stroke="#ffd7a6" strokeWidth="8" strokeLinecap="round"/>
        </>}
        {kind === 'ball' && <>
            <circle cx="60" cy="60" r="51" fill="#f5d28d" stroke="#c88e4e" strokeWidth="3"/>
            <path d="M60 9C29 31 27 76 59 111C8 102-11 41 36 15Z" fill="#d97960"/>
            <path d="M60 9C91 31 93 76 59 111C111 102 129 41 85 15Z" fill="#7eaaab"/>
            <path d="M11 55Q62 31 109 57M22 91Q57 66 99 91" fill="none" stroke="#fff1c4" strokeWidth="3"/>
            <ellipse cx="46" cy="30" rx="12" ry="7" transform="rotate(-35 46 30)" fill="#fff7d5" opacity=".65"/>
        </>}
        {kind === 'cat' && <>
            <path d="M82 92Q119 116 106 66" fill="none" stroke="#c99463" strokeWidth="14" strokeLinecap="round"/>
            <ellipse cx="60" cy="91" rx="28" ry="26" fill="#d8b080"/>
            <path d="M22 48L20 9L48 29Q61 24 75 29L102 9L99 49Q111 89 61 91Q11 88 22 48" fill="#e7bf8d" stroke="#ba875b" strokeWidth="2"/>
            <path d="M27 20L43 33L28 42M94 20L79 33L94 42" fill="#d88f83"/>
            <path d="M38 55Q43 48 48 55M74 55Q79 48 84 55" fill="none" stroke="#574c3f" strokeWidth="4" strokeLinecap="round"/>
            <ellipse cx="60" cy="72" rx="20" ry="14" fill="#fff0cc"/>
            <path d="M54 64L66 64L60 70ZM60 70Q59 79 50 76M60 70Q61 79 70 76" fill="#b97f70" stroke="#a46b5e" strokeWidth="2"/>
            <path d="M17 62L34 65M16 72L34 70M88 64L107 60M88 70L109 73" stroke="#946e4f" strokeWidth="2" strokeLinecap="round"/>
            <path d="M55 29L57 40M67 29L65 40" stroke="#b58961" strokeWidth="4" strokeLinecap="round"/>
        </>}
        {kind === 'bush' && <>
            <path d="M8 102Q-4 75 20 65Q8 39 38 34Q48 4 73 32Q105 24 104 58Q130 72 109 101Z" fill="#708d58" stroke="#59794b" strokeWidth="2"/>
            <path d="M14 87Q7 64 31 62Q21 42 46 41Q58 16 76 40Q100 35 97 68Q114 66 108 88Z" fill="#9caf74"/>
            <path d="M26 76Q39 59 49 77M64 53Q78 41 86 60M66 89Q78 75 91 89" fill="none" stroke="#c7d69a" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="34" cy="83" r="5" fill="#ffe6a7"/><circle cx="85" cy="68" r="4" fill="#f0c4a2"/>
        </>}
    </svg>;
}
