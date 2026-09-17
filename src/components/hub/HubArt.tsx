import React, { useState } from 'react';
import { BookOpen, Compass, FlaskConical, Shapes } from 'lucide-react';
import { Island } from '../../../games/MemoryMatch/components/Island';
import { Picture } from '../../../games/MemoryMatch/components/Picture';
import { BandStage } from '../../../games/SoundMemory/components/BandStage';
import { RoverPortrait } from '../../../games/KidCoder/rendering/RoverPortrait';
import type { ArtId } from './catalog';
import { PianoArt } from '../../../games/Piano/PianoArt';
import { RacingCover } from '../../../games/MathRacing/cup/RacingCover';

const chessCover = new URL('../../../games/CoVua/assets/cover.webp', import.meta.url).href;
const caroCover = new URL('../../../games/Caro/assets/cover.webp', import.meta.url).href;
const xiangqiCover = new URL('../../../games/CoTuong/assets/art/courtyard.webp', import.meta.url).href;
const asset = (file: string) => `${import.meta.env.BASE_URL}hub/art/${file}`;
function ArtImage({ name, className = '', eager = false, width = 800, height = 450 }: { name: string; className?: string; eager?: boolean; width?: number; height?: number }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <span className={`hub-art-fallback ${className}`}><Compass size={46}/></span>;
    return <img className={className} src={asset(`${name}.webp`)} srcSet={`${asset(`${name}-sm.webp`)} 400w, ${asset(`${name}.webp`)} ${width}w`} sizes="(max-width: 600px) 120px, (max-width: 960px) 45vw, 380px" alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width={width} height={height} onError={() => setFailed(true)}/>;
}
function MemoryScene() {
    return <><div className="hub-island"><Island zone="garden" completed={5}/></div><span className="hub-memory-tile tile-a"><Picture id="fox"/></span><span className="hub-memory-tile tile-b"><Picture id="fox"/></span></>;
}
function GearScene({ reverse = false }: { reverse?: boolean }) {
    const gear = (x: number, y: number, r: number, color: string, teeth: number, angle = 0) => <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        {Array.from({ length: teeth }, (_, i) => <rect key={i} x={-r * .13} y={-r - 5} width={r * .26} height={16} rx="2" fill={color} transform={`rotate(${i * 360 / teeth})`}/>)}
        <circle r={r} fill={color}/><circle r={r * .64} fill="none" stroke="#fff4d5" strokeOpacity=".45" strokeWidth="4"/>
        {[0, 120, 240].map(a => <path key={a} d={`M0 -9L0 -${r * .56}`} transform={`rotate(${a})`} stroke="#514d4160" strokeWidth="9" strokeLinecap="round"/>)}
        <circle r="10" fill="#fff3d6"/><circle r="4" fill="#526662"/>
    </g>;
    return <svg viewBox="0 0 480 270" className="hub-machine"><ellipse cx="240" cy="226" rx="152" ry="17" fill="#304e5018"/><path d="M96 201V100Q96 71 125 71H356Q385 71 385 100V201Z" fill="#d9d9c7"/><path d="M84 201H397L383 224H99Z" fill="#b2c1b1"/><path d="M122 118H359M122 181H359" stroke="#aebaa74d" strokeWidth="3"/>{gear(181, 143, 54, '#d9a654', 12)}{gear(283, 146, 39, '#6f9992', 10, 12)}{gear(343, 101, 30, '#c67c65', 8, 18)}{reverse && <path d="M141 59Q186 29 224 64M214 49 224 64 205 66" fill="none" stroke="#567d6c" strokeWidth="6" strokeLinecap="round"/>}</svg>;
}
function SudokuScene() {
    const numbers = [5, 3, 4, 6, 7, 2, 8, 9, 1];
    return <div className="hub-sudoku-board">{numbers.map((n, i) => <span className={i === 4 ? 'selected' : ''} key={i}>{n}</span>)}</div>;
}
export function HubArt({ kind, eager = false }: { kind: ArtId; eager?: boolean }) {
    let art: React.ReactNode;
    if (['study', 'library', 'riddle', 'science'].includes(kind) || kind.startsWith('science-')) art = <ArtImage name={kind} eager={eager}/>;
    else if (kind === 'board-games') art = <span className="hub-board-collection"><img src={chessCover} alt="" loading={eager?'eager':'lazy'}/><img src={`${import.meta.env.BASE_URL}horse-race/art/cover.webp`} alt="" loading={eager?'eager':'lazy'}/><img src={`${import.meta.env.BASE_URL}o-an-quan/art/cover.webp`} alt="" loading={eager?'eager':'lazy'}/></span>;
    else if (kind === 'co-vua' || kind === 'co-tuong') art = <img src={kind === 'co-vua' ? chessCover : xiangqiCover} alt="" loading={eager?'eager':'lazy'} decoding="async" width={800} height={450} style={{width:'100%',height:'100%',objectFit:'cover'}}/>;
    else if (kind === 'horse-race') art = <img src={`${import.meta.env.BASE_URL}horse-race/art/cover.webp`} srcSet={`${import.meta.env.BASE_URL}horse-race/art/cover-sm.webp 400w, ${import.meta.env.BASE_URL}horse-race/art/cover.webp 800w`} sizes='(max-width: 600px) 120px, (max-width: 960px) 45vw, 380px' width={800} height={450} alt='' loading={eager?'eager':'lazy'} decoding='async' style={{width:'100%',height:'100%',objectFit:'cover'}}/>;
    else if (kind === 'o-an-quan') art = <img src={`${import.meta.env.BASE_URL}o-an-quan/art/cover.webp`} srcSet={`${import.meta.env.BASE_URL}o-an-quan/art/cover-sm.webp 400w, ${import.meta.env.BASE_URL}o-an-quan/art/cover.webp 800w`} sizes='(max-width: 600px) 120px, (max-width: 960px) 45vw, 380px' width={800} height={450} alt='' loading={eager?'eager':'lazy'} decoding='async' style={{width:'100%',height:'100%',objectFit:'cover'}}/>;
    else if (kind === 'co-ti-phu') art = <img src={`${import.meta.env.BASE_URL}co-ti-phu/art/cover.webp`} srcSet={`${import.meta.env.BASE_URL}co-ti-phu/art/cover-sm.webp 400w, ${import.meta.env.BASE_URL}co-ti-phu/art/cover.webp 1600w`} sizes='(max-width: 600px) 120px, (max-width: 960px) 45vw, 380px' width={1600} height={900} alt='' loading={eager?'eager':'lazy'} decoding='async' style={{width:'100%',height:'100%',objectFit:'cover'}}/>;
    else if (kind === 'caro') art = <img src={caroCover} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width={1200} height={800} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#faf6eb' }}/>;
    else if (kind === 'memory') art = <MemoryScene/>;
    else if (kind === 'sound-memory') art = <BandStage/>;
    else if (kind === 'speed-math') art = <><ArtImage name="station" eager={eager}/><ArtImage name="tia" className="hub-tia" eager={eager}/><span className="hub-lightning">✦</span><span className="hub-puzzle-chip">2 + 3 = 5</span></>;
    else if (kind === 'dragon-quest') art = <><ArtImage name="forest" eager={eager}/><ArtImage name="knight" className="hub-knight" eager={eager}/></>;
    else if (kind === 'piano') art = <PianoArt small/>;
    else if (kind === 'coding') art = <><span className="hub-planet"/><span className="hub-orbit"/><RoverPortrait color="#91d9c0"/><span className="hub-code-blocks"><b>↑</b><b>↱</b><b>↑</b></span></>;
    else if (kind === 'game') art = <><span className="hub-game-orbit"/><span className="hub-game-card"><Picture id="fox"/></span><ArtImage name="tia" className="hub-game-tia" eager={eager}/><span className="hub-game-note">♫</span><span className="hub-game-star">✦</span></>;
    else if (kind === 'math-racing') art = <RacingCover/>;
    else if (kind === 'sudoku') art = <SudokuScene/>;
    else if (kind.startsWith('gears')) art = <GearScene reverse={kind === 'gears-guess'}/>;
    else if (kind === 'alphabet' || kind === 'counting' || kind === 'colors') art = <ArtImage name={`preschool-${kind}`} eager={eager} width={1200} height={670}/>;
    else art = <div className="hub-art-fallback"><Shapes/><BookOpen/><FlaskConical/></div>;
    return <span className={`hub-art hub-art-${kind}`} aria-hidden="true">{art}</span>;
}
