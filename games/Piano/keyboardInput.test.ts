import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEY_CODES, PianoKeyboardInput, physicalPianoCode } from './keyboardInput';

const signal=(code='KeyA',extra={})=>({code,keyCode:code.startsWith('Key')?code.charCodeAt(3):0,repeat:false,...extra});
const setup=()=>{const callbacks={onDown:vi.fn(),onUp:vi.fn(),onReset:vi.fn(),onIme:vi.fn()};return{...callbacks,input:new PianoKeyboardInput(callbacks)};};
afterEach(()=>vi.useRealTimers());

describe('physical piano keyboard with Vietnamese input methods',()=>{
    it('plays A, A as two independent strokes and holds chords until release',()=>{
        const {input,onDown,onUp}=setup();
        input.keyDown(signal());input.keyUp(signal());input.keyDown(signal());input.keyUp(signal());
        expect(onDown.mock.calls).toEqual([['key:KeyA',60,false],['key:KeyA',60,false]]);
        input.keyDown(signal());input.keyDown(signal('KeyD'));expect(onUp).toHaveBeenCalledTimes(2);
        input.keyUp(signal('KeyD'));input.keyUp(signal());expect(onUp.mock.calls.slice(-2)).toEqual([['key:KeyD'],['key:KeyA']]);
    });
    it('keeps physical codes when keydown is Process / 229 during composition',()=>{
        const {input,onDown}=setup();
        for(let i=0;i<2;i++){input.keyDown(signal('KeyA',{key:'Process',keyCode:229,isComposing:true}));input.keyUp(signal());}
        expect(onDown.mock.calls).toEqual([['key:KeyA',60,false],['key:KeyA',60,false]]);
    });
    it('recovers a swallowed second A down from its up exactly once',()=>{
        vi.useFakeTimers();const {input,onDown,onUp,onIme}=setup();
        input.keyDown(signal());input.keyUp(signal());input.keyUp(signal());
        expect(onDown).toHaveBeenCalledTimes(2);expect(onDown.mock.calls[1]).toEqual(['release:KeyA:1',60,true]);
        expect(onUp).toHaveBeenCalledTimes(1);vi.advanceTimersByTime(100);
        expect(onUp.mock.calls[1]).toEqual(['release:KeyA:1']);expect(onIme).toHaveBeenCalledOnce();
    });
    it('recovers an unidentifiable IME down followed by a legacy physical up',()=>{
        vi.useFakeTimers();const {input,onDown}=setup();
        expect(input.keyDown(signal('Unidentified',{keyCode:229}))).toBe(false);
        expect(input.keyUp(signal('',{keyCode:65}))).toBe(true);
        expect(onDown).toHaveBeenCalledExactlyOnceWith('release:KeyA:1',60,true);input.reset();
    });
    it('never guesses physical notes from composed text or unrelated keys',()=>{
        expect(physicalPianoCode(signal('',{keyCode:229,key:'â'}))).toBeUndefined();
        expect(physicalPianoCode(signal('Digit1',{keyCode:65}))).toBeUndefined();
        expect(physicalPianoCode(signal('Unidentified',{keyCode:0,key:'a'}))).toBeUndefined();
        for(const [keyCode,code] of [[186,'Semicolon'],[222,'Quote'],[221,'BracketRight']] as const)expect(physicalPianoCode(signal('',{keyCode}))).toBe(code);
        expect(KEY_CODES.every(code=>physicalPianoCode(signal(code))===code)).toBe(true);
    });
    it('does not turn key repeat into extra notes',()=>{
        const {input,onDown}=setup();input.keyDown(signal());for(let i=0;i<20;i++)input.keyDown(signal('KeyA',{repeat:true}));input.keyUp(signal());expect(onDown).toHaveBeenCalledOnce();
        input.keyDown(signal('KeyS',{repeat:true}));input.keyUp(signal('KeyS'));expect(onDown).toHaveBeenCalledOnce();
    });
    it('releases a stale held voice before accepting a new physical stroke',()=>{
        const {input,onDown,onUp}=setup();input.keyDown(signal());input.keyDown(signal());input.keyUp(signal());
        expect(onDown).toHaveBeenCalledTimes(2);expect(onUp).toHaveBeenCalledTimes(2);
        expect(onUp.mock.invocationCallOrder[0]).toBeLessThan(onDown.mock.invocationCallOrder[1]);
    });
    it.each(['ctrlKey','altKey','metaKey'])('does not play a shortcut when %s is released before the letter',modifier=>{
        const {input,onDown}=setup();expect(input.keyDown(signal('KeyS',{[modifier]:true}))).toBe(false);input.keyUp(signal('KeyS'));expect(onDown).not.toHaveBeenCalled();
    });
    it('does not play typing, disabled input or its later keyup after focus changes',()=>{
        const {input,onDown}=setup();input.keyDown(signal(),true);input.keyUp(signal(),false);input.keyUp(signal('KeyD'),true);expect(onDown).not.toHaveBeenCalled();
    });
    it('releases an owned key even when focus moved to a field',()=>{
        const {input,onDown,onUp}=setup();input.keyDown(signal());input.keyUp(signal(),true);expect(onDown).toHaveBeenCalledOnce();expect(onUp).toHaveBeenCalledExactlyOnceWith('key:KeyA');
    });
    it('cancels pulses and discards orphan ups after blur/unmount without phantom notes',()=>{
        vi.useFakeTimers();const {input,onDown,onUp,onReset}=setup();input.keyDown(signal());input.keyUp(signal('KeyD'));input.reset();input.keyUp(signal());vi.runAllTimers();
        expect(onReset).toHaveBeenCalledOnce();expect(onDown).toHaveBeenCalledTimes(2);expect(onUp).not.toHaveBeenCalled();
        input.keyDown(signal());expect(onDown).toHaveBeenCalledTimes(3);
    });
    it('can clear input tracking without stopping newly scheduled demo audio',()=>{
        const {input,onReset,onDown}=setup();input.keyDown(signal());input.reset(false);input.keyUp(signal());expect(onReset).not.toHaveBeenCalled();expect(onDown).toHaveBeenCalledOnce();
    });
});
