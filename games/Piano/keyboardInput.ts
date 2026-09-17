export const KEY_CODES=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon','Quote','BracketRight','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN'];

interface KeySignal {
    code: string;
    keyCode: number;
    repeat?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}
const legacyCodes = new Map(KEY_CODES.map(code=>[
    code.startsWith('Key')?code.charCodeAt(3):({Semicolon:186,Quote:222,BracketRight:221}[code]),code,
] as const));

// IMEs may report key="Process" / keyCode=229 on down but retain the physical
// code, or only deliver a recognizable keyup. Never derive notes from text (â).
export function physicalPianoCode(event:KeySignal):string|undefined {
    if(event.code&&event.code!=='Unidentified')return KEY_CODES.includes(event.code)?event.code:undefined;
    return legacyCodes.get(event.keyCode);
}

interface Callbacks {
    onDown:(id:string,midi:number,recovered:boolean)=>void;
    onUp:(id:string)=>void;
    onReset:()=>void;
    onIme:()=>void;
}
export class PianoKeyboardInput {
    private held=new Set<string>();
    private ignored=new Set<string>();
    private pulses=new Map<string,ReturnType<typeof setTimeout>>();
    private sequence=0;
    constructor(private callbacks:Callbacks){}

    keyDown(event:KeySignal,blocked=false):boolean {
        const code=physicalPianoCode(event);
        if(blocked||event.ctrlKey||event.altKey||event.metaKey){if(code)this.ignored.add(code);return false;}
        if(event.keyCode===229)this.callbacks.onIme();
        if(!code)return false;
        if(event.repeat){if(!this.held.has(code))this.ignored.add(code);return true;}
        this.ignored.delete(code);
        // A fresh down is another stroke even if an IME swallowed the old up.
        if(this.held.has(code))this.callbacks.onUp('key:'+code);
        this.held.add(code);
        this.callbacks.onDown('key:'+code,60+KEY_CODES.indexOf(code),false);
        return true;
    }

    keyUp(event:KeySignal,blocked=false):boolean {
        const code=physicalPianoCode(event);if(!code)return false;
        if(this.held.delete(code)){this.ignored.delete(code);this.callbacks.onUp('key:'+code);return true;}
        const ignored=this.ignored.delete(code);
        if(ignored||blocked||event.ctrlKey||event.altKey||event.metaKey)return false;
        // Native Vietnamese hooks can consume the second A down in A,A. If its
        // physical up survives, recover one short note without inventing a hold.
        this.callbacks.onIme();
        const id=`release:${code}:${++this.sequence}`;
        this.callbacks.onDown(id,60+KEY_CODES.indexOf(code),true);
        this.pulses.set(id,setTimeout(()=>{this.pulses.delete(id);this.callbacks.onUp(id);},100));
        return true;
    }

    reset(notify=true){
        for(const code of this.held)this.ignored.add(code);
        for(const timer of this.pulses.values())clearTimeout(timer);
        this.held.clear();this.pulses.clear();if(notify)this.callbacks.onReset();
    }
}
