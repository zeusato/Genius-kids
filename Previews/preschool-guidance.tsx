// Development-only fixture: real game components, deterministic speech output.
// Open /Genius-kids/Previews/preschool-guidance.html with the Vite dev server.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentProvider } from '../src/contexts/StudentContext';
import { AlphabetGarden } from '../src/components/preschool/AlphabetGarden';
import '../src/index.css';

const voices = [{ lang: 'vi-VN', name: 'Test Vietnamese' }, { lang: 'en-US', name: 'Test English' }];
const events = new EventTarget();
Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
    text: string;
    constructor(text: string) { this.text = text; }
} });
let speechTimer: ReturnType<typeof setTimeout>;
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => voices,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    cancel: () => clearTimeout(speechTimer),
    speak: (utterance: SpeechSynthesisUtterance) => {
        events.dispatchEvent(new CustomEvent('line', { detail: `${utterance.lang}: ${utterance.text}` }));
        speechTimer = setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 20);
    },
} });

function Preview() {
    const [lines, setLines] = useState<string[]>([]);
    React.useEffect(() => {
        const record = (event: Event) => setLines(previous => [...previous, (event as CustomEvent<string>).detail]);
        events.addEventListener('line', record);
        return () => events.removeEventListener('line', record);
    }, []);
    return <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <StudentProvider><AlphabetGarden onBack={() => {}}/></StudentProvider>
        <details open><summary>Speech log (mock voices)</summary><ol aria-label="Speech log">{lines.map((line, i) => <li key={i}>{line}</li>)}</ol></details>
    </main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
