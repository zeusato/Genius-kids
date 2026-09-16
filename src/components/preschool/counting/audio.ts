import { cancelSpeech } from '../../../utils/speech';
import { VI } from './model';
import { VOICE_LINES } from './voiceLines';
export type AudioResult = 'ended' | 'error' | 'cancelled';
const slugs=['khong','mot','hai','ba','bon','nam','sau','bay','tam','chin','muoi'];
/** Scoped audio, explicit success, one settlement, bounded wait. Never treat play() as heard. */
export class CountingVoice {
    private stop?: () => void;
    cancel() { this.stop?.(); this.stop=undefined; }
    play(text:string, lang:'vi-VN'|'en-US'='vi-VN', number?:number):Promise<AudioResult> {
        this.cancel(); cancelSpeech();
        return new Promise(resolve=>{
            let settled=false, audio:HTMLAudioElement|undefined;
            const finish=(result:AudioResult)=>{if(settled)return;settled=true;clearTimeout(timeout);if(audio){audio.onended=null;audio.onerror=null;audio.pause();} window.speechSynthesis?.cancel(); this.stop=undefined;resolve(result);};
            const timeout=setTimeout(()=>finish('error'),15000);
            this.stop=()=>finish('cancelled');
            const recorded=VOICE_LINES[text];
            const file=number!==undefined && number>=1 && number<=10 ? `${import.meta.env.BASE_URL}audio/vi/${slugs[number]}.mp3` : recorded ? `${import.meta.env.BASE_URL}audio/vi/${recorded.file}.mp3` : undefined;
            const playFile=(url:string)=>{audio=new Audio(url);audio.onended=()=>finish('ended');audio.onerror=()=>finish('error');try{audio.play().catch(()=>finish('error'));}catch{finish('error');}};
            if(file) {playFile(file);return;}
            const voice=window.speechSynthesis?.getVoices().find(v=>v.lang.replace('_','-').startsWith(lang.slice(0,2)));
            if(voice){const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=lang;u.rate=.83;u.onend=()=>finish('ended');u.onerror=()=>finish('error');try{window.speechSynthesis.speak(u);}catch{finish('error');}}
            else {const qs=`ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang.slice(0,2)}&client=tw-ob`;const proxy=import.meta.env.DEV?'/api/tts':import.meta.env.VITE_TTS_PROXY; if(proxy)playFile(`${proxy}?${qs}`);else finish('error');}
        });
    }
    number(n:number) {return this.play(VI[n],'vi-VN',n);}
}
