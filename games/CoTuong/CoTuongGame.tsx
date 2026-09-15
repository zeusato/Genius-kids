import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Flag, FlipVertical2, Leaf, Maximize2, Pause, Play, RotateCcw, Settings2, Shield, Sparkles, Swords, Trophy, Users, Volume2, VolumeX, X, BookOpen, Grid2X2, Handshake, CircleCheck, AlertCircle } from 'lucide-react';
import { applyMove, finishMatch, newMatch } from './engine';
import { coordinate, glyph, LEVEL_NAMES, NAMES, other, REASONS, sideOf } from './model';
import type { Level, Match, Move, Side } from './model';
import { fromMatch, initialBoard } from './position';
import { inCheck, legalMoves } from './movegen';
import { BotController } from './bot-controller';
import { loadDraft, loadPrefs, persistResult, recordsFor, saveDraft, savePrefs } from './persistence';
import type { Prefs } from './persistence';
import { GameAudio } from './audio';
import Board2D from './Board2D';
import type { Motion } from './Board3D';
import './co-tuong.css';
const Board3D = lazy(() => import('./Board3D'));
const DEFAULT_OWNER = { id: 'standalone-player', name: 'Bạn', avatar: '茶' };
const COVER = new URL('./assets/art/courtyard.webp', import.meta.url).href;
export interface CoTuongGameProps { owner?: { id: string; name: string; avatar?: string }; onExit?: () => void }
type Modal = 'settings' | 'rules' | 'resign' | 'draw' | 'new' | null;
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
const formatTime = (ms: number) => `${Math.floor(ms / 60000).toString().padStart(2, '0')}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;
function Coin({ side, small = false }: { side: Side; small?: boolean }) { return <span aria-hidden='true' className={`kv-coin ${side === 0 ? 'red' : 'black'} ${small ? 'small' : ''}`}>{side === 0 ? '帥' : '將'}</span>; }
function Switch({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: () => void }) {
  return <button type='button' role='switch' aria-checked={value} className='kv-setting' onClick={onChange}><span><strong>{label}</strong><small>{description}</small></span><i className={value ? 'on' : ''}><b/></i></button>;
}
function Captures({ match, by }: { match: Match; by: Side }) {
  const start = initialBoard(), enemy = other(by), captured: number[] = [];
  for (let type = 2; type <= 7; type++) { const code = enemy === 0 ? type : -type, n = Array.from(start).filter(p => p === code).length - match.board.filter(p => p === code).length; for (let i = 0; i < n; i++) captured.push(code); }
  return <div className='kv-capture-row'><span className={`kv-side-dot ${by === 0 ? 'red' : ''}`}/><span className='kv-capture-label'>{by === 0 ? 'Đỏ' : 'Đen'}</span><div>{captured.length ? captured.map((piece, index) => <span key={index} className={`kv-captured ${piece > 0 ? 'red' : ''}`} title={NAMES[Math.abs(piece)]}>{glyph(piece)}</span>) : <small>Chưa ăn quân</small>}</div></div>;
}
export default function CoTuongGame(props: CoTuongGameProps) { return <Game key={props.owner?.id ?? DEFAULT_OWNER.id} {...props}/>; }
function Game({ owner = DEFAULT_OWNER, onExit }: CoTuongGameProps) {
  const loaded = useMemo(() => loadDraft(owner.id), [owner.id]);
  const [match, setMatch] = useState<Match | null>(loaded.match), [lobby, setLobby] = useState(true), [mode, setMode] = useState<'bot' | 'human'>('bot'), [side, setSide] = useState<Side>(0), [level, setLevel] = useState<Level>('medium');
  const [prefs, setPrefs] = useState(() => loadPrefs(owner.id)), [selected, setSelected] = useState<number | null>(null), [flip, setFlip] = useState(loaded.match?.ownerSide === 1);
  const [paused, setPaused] = useState(false), [handoff, setHandoff] = useState(false), [modal, setModal] = useState<Modal>(null), [motion, setMotion] = useState<Motion | null>(null);
  const [thinking, setThinking] = useState(false), [saved, setSaved] = useState(true), [notice, setNotice] = useState(loaded.error ? 'Bản lưu không đọc được. Hãy bắt đầu một ván mới.' : ''), [fontReady, setFontReady] = useState(false);
  const [records, setRecords] = useState(() => recordsFor(owner.id));
  const live = useRef(match), controller = useRef<BotController | null>(null), audio = useRef<GameAudio | null>(null), historyRef = useRef<HTMLDivElement>(null), dialogRef = useRef<HTMLDivElement>(null);
  live.current = match;
  const blocked = lobby || paused || handoff || modal !== null;
  const position = useMemo(() => match ? fromMatch(match) : null, [match?.id, match?.revision]);
  const allMoves = useMemo(() => position && match?.phase === 'play' ? legalMoves(position) : [], [position, match?.phase]);
  const checked = position ? inCheck(position) : false;
  const enabled = !!match && match.phase === 'play' && !blocked && !motion && match.players[match.active].kind === 'human';
  const selectedMoves = useMemo(() => selected === null ? [] : allMoves.filter(m => m.from === selected), [allMoves, selected]);
  const sound = useCallback((kind: Parameters<GameAudio['play']>[0]) => { if (!prefs.sound) return; audio.current ??= new GameAudio(); audio.current.play(kind); }, [prefs.sound]);
  useEffect(() => { let mounted = true; Promise.all([document.fonts.load('600 48px XiangqiPieces', '帥仕相傌俥炮兵將士象馬車砲卒楚河漢界'), document.fonts.load('800 16px KyVien')]).then(() => { if (mounted) setFontReady(true); }).catch(() => { if (mounted) setNotice('Chữ Hán chưa tải được. Đang dùng nhãn tiếng Việt.'); }); return () => { mounted = false; }; }, []);
  useEffect(() => { savePrefs(owner.id, prefs); }, [owner.id, prefs]);
  useEffect(() => () => { controller.current?.cancel(); audio.current?.dispose(); }, []);
  const persist = useCallback((next: Match) => { const draftOk = saveDraft(next), resultOk = next.phase === 'over' ? persistResult(next) : true; setSaved(draftOk && resultOk); if (resultOk && next.phase === 'over') setRecords(recordsFor(owner.id)); }, [owner.id]);
  useEffect(() => { if (live.current?.phase === 'over') persist(live.current); }, [match?.id, match?.phase, persist]);
  const commit = useCallback((move: Move) => {
    const current = live.current; if (!current || current.phase !== 'play') return;
    const next = applyMove(current, move); if (next === current) return;
    const captured = current.board[move.to]; live.current = next; setMatch(next); persist(next); setSelected(null);
    const newChecked = inCheck(fromMatch(next)); sound(next.phase === 'over' ? 'finish' : newChecked ? 'check' : captured ? 'capture' : 'move');
    if (!prefs.reduced) setMotion({ ...move, piece: current.board[move.from], at: performance.now(), duration: 360 });
    else if (prefs.handoff && next.players.every(p => p.kind === 'human') && next.phase === 'play') setHandoff(true);
  }, [persist, prefs.reduced, prefs.handoff, sound]);
  useEffect(() => { if (!motion) return; const timer = setTimeout(() => { setMotion(null); const current = live.current; if (prefs.handoff && current?.phase === 'play' && current.players.every(p => p.kind === 'human')) setHandoff(true); }, motion.duration + 30); return () => clearTimeout(timer); }, [motion, prefs.handoff]);
  useEffect(() => {
    if (!match || blocked || motion || match.phase === 'over' || match.players[match.active].kind !== 'bot') { setThinking(false); return; }
    controller.current ??= new BotController(); setThinking(true);
    const revision = match.revision, id = match.id;
    controller.current.start(match, allMoves, (move, fallback) => { if (live.current?.id !== id || live.current.revision !== revision) return; setThinking(false); if (fallback) setNotice('Máy dùng nước dự phòng. Ván cờ vẫn tiếp tục.'); commit(move); });
    return () => controller.current?.cancelPending();
  }, [match?.id, match?.revision, blocked, motion, allMoves, commit]);
  useEffect(() => { if (!match || blocked || match.phase === 'over') return; let last = performance.now(); const timer = setInterval(() => { const now = performance.now(), current = live.current; if (!current || current.phase === 'over') return; const next = { ...current, elapsed: current.elapsed + Math.min(now - last, 2000) }; last = now; live.current = next; setMatch(next); setSaved(saveDraft(next)); }, 1000); return () => clearInterval(timer); }, [match?.id, match?.phase, blocked]);
  useEffect(() => { const hide = () => { if (document.hidden) { controller.current?.cancel(); setPaused(true); setMotion(null); if (live.current) saveDraft(live.current); } }; const leave = () => { controller.current?.cancel(); if (live.current) saveDraft(live.current); }; document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', leave); return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', leave); }; }, []);
  useEffect(() => { historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: prefs.reduced ? 'instant' : 'smooth' }); }, [match?.ply, prefs.reduced]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    if (modal) dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (modal) setModal(null); else if (!lobby) setPaused(p => !p); }
      if (modal && event.key === 'Tab') { const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]') ?? []), first = items[0], last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); if (modal) old?.focus(); };
  }, [modal, lobby]);
  function begin(replace = false) {
    if (!replace && match?.phase === 'play') { setModal('new'); return; }
    const next = newMatch(owner, side, mode, level); controller.current?.cancel(); live.current = next; setMatch(next); persist(next); setFlip(side === 1); setSelected(null); setMotion(null); setHandoff(false); setPaused(false); setModal(null); setLobby(false); sound('select');
  }
  function pick(square: number) {
    if (!enabled || !match) return;
    if (square < 0 || square === selected) { setSelected(null); return; }
    const move = selectedMoves.find(m => m.to === square); if (move) { commit(move); return; }
    if (match.board[square] && sideOf(match.board[square]) === match.active) { setSelected(square); sound('select'); } else setSelected(null);
  }
  function finish(action: 'resign' | 'agreement') { if (!match) return; const next = finishMatch(match, action, match.players[match.active].kind === 'human' ? match.active : match.ownerSide); controller.current?.cancel(); live.current = next; setMatch(next); persist(next); setModal(null); setMotion(null); setSelected(null); sound('finish'); }
  function preference<K extends keyof Prefs>(name: K, value: Prefs[K]) { setPrefs(p => ({ ...p, [name]: value })); }
  const fail3D = useCallback(() => { setPrefs(p => ({ ...p, flat: true })); setNotice('Đã chuyển sang bàn 2D. Ván cờ được giữ nguyên.'); }, []);
  const win = match?.phase === 'over' && match.winner === match.ownerSide;
  const status = match?.phase === 'over' ? REASONS[match.reason!] : paused ? 'Ván cờ tạm dừng' : thinking ? 'Kỳ thủ vườn đang nghĩ…' : checked ? `${match?.active === 0 ? 'Đỏ' : 'Đen'} đang bị chiếu` : `Lượt ${match?.active === 0 ? 'Đỏ' : 'Đen'} · ${match?.players[match.active].name}`;
  return <div className={`kv-app ${prefs.reduced ? 'reduced' : ''}`}>
    <header className='kv-header'><button className='kv-brand' onClick={() => { setLobby(true); setPaused(false); setMotion(null); setSelected(null); }} aria-label='Về vườn cờ'><span className='kv-seal'>帥</span><span><strong>KỲ VIÊN</strong><small>Vườn cờ tướng</small></span></button>
      <div className='kv-header-center'><span/><span>{lobby ? 'MỘT NƯỚC CỜ · MỘT NIỀM VUI' : 'TĨNH TÂM · ĐI NƯỚC HAY'}</span><span/></div>
      <nav aria-label='Công cụ'><button className='kv-icon-button' onClick={() => preference('sound', !prefs.sound)} title={prefs.sound ? 'Tắt âm thanh' : 'Bật âm thanh'} aria-label={prefs.sound ? 'Tắt âm thanh' : 'Bật âm thanh'}>{prefs.sound ? <Volume2/> : <VolumeX/>}</button><button className='kv-icon-button' aria-label='Luật chơi' onClick={() => setModal('rules')}><BookOpen/></button><button className='kv-icon-button' aria-label='Cài đặt' onClick={() => setModal('settings')}><Settings2/></button></nav>
    </header>
    {lobby ? <main className='kv-lobby'>
      <section className='kv-welcome'><div className='kv-welcome-copy'><span className='kv-eyebrow'><Leaf size={15}/> HẸN NHAU DƯỚI TÁN CÂY</span><h1>Một ván cờ,<br/><em>một khoảng yên.</em></h1><p>Bày quân, thong thả nghĩ.<br/>Mỗi nước đi mở ra một điều thú vị.</p><div className='kv-welcome-tags'><span><Swords size={15}/> Đấu trí nhẹ nhàng</span><span><Users size={15}/> Vui cùng bạn bè</span></div></div><div className='kv-welcome-image'><img src={COVER} alt='Bàn cờ gỗ bên ấm trà trong khu vườn tre yên bình' width='1440' height='810'/><span className='kv-image-caption'><Leaf size={14}/> Một góc vườn, một cuộc cờ.</span></div></section>
      <section className='kv-setup' aria-label='Chuẩn bị ván cờ'><div className='kv-setup-title'><span className='kv-eyebrow'>CHỌN MỘT CUỘC CỜ</span><h2>Hôm nay, chơi cùng ai?</h2>{records.length > 0 && <small>{records.length} ván đã chơi · {records.filter(r => r.hostResult === 'win').length} ván thắng</small>}</div>
        <div className='kv-config'><fieldset><legend>Đối thủ</legend><div className='kv-options'><button aria-pressed={mode === 'bot'} className={mode === 'bot' ? 'active' : ''} onClick={() => setMode('bot')}><Sparkles size={18}/><span>Đấu với máy</span></button><button aria-pressed={mode === 'human'} className={mode === 'human' ? 'active' : ''} onClick={() => setMode('human')}><Users size={18}/><span>Hai người</span></button></div></fieldset>
          <fieldset><legend>Bạn cầm quân</legend><div className='kv-options'><button aria-pressed={side === 0} className={side === 0 ? 'active' : ''} onClick={() => setSide(0)}><Coin side={0} small/><span>Đỏ <small>Đi trước</small></span></button><button aria-pressed={side === 1} className={side === 1 ? 'active' : ''} onClick={() => setSide(1)}><Coin side={1} small/><span>Đen <small>Đi sau</small></span></button></div></fieldset>
          <fieldset><legend>{mode === 'bot' ? 'Mức thử thách' : 'Hai người, cùng một máy'}</legend>{mode === 'bot' ? <div className='kv-levels'>{(['easy', 'medium', 'hard'] as Level[]).map(l => <button key={l} aria-pressed={level === l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>{LEVEL_NAMES[l]}</button>)}</div> : <p className='kv-setup-note'>Luân phiên đi quân. Có thể bật chuyền máy trong Cài đặt.</p>}</fieldset>
        </div><div className='kv-start-area'>{match?.phase === 'play' ? <><button className='kv-primary' onClick={() => { setLobby(false); setPaused(false); setHandoff(false); }}><Play size={18}/> Tiếp tục ván cờ <ArrowRight size={18}/></button><button className='kv-text-button' onClick={() => begin()}>Bắt đầu ván mới</button></> : <button className='kv-primary' onClick={() => begin()}>Bắt đầu ván cờ <ArrowRight size={19}/></button>}<small><Shield size={13}/> Ván cờ tự lưu trên máy này</small></div>
      </section><footer className='kv-lobby-footer'><span><Leaf size={14}/> Không vội vàng. Cứ tận hưởng từng nước đi.</span>{onExit && <button className='kv-text-button' onClick={onExit}><ArrowLeft size={14}/> Trở về</button>}<button className='kv-text-button' onClick={() => setModal('rules')}>Làm quen với luật chơi <ArrowRight size={14}/></button></footer>
    </main> : match && <main className='kv-game'>
      <section className='kv-arena' aria-label='Ván cờ'><div className='kv-arena-top'><button className='kv-text-button' onClick={() => { setLobby(true); setMotion(null); }}><ArrowLeft size={17}/> Vườn cờ</button><div className={`kv-mobile-turn ${checked ? 'checked' : ''}`}><span aria-live='polite'>{status}</span><button className='kv-icon-button' disabled={match.phase === 'over'} aria-label={paused ? 'Tiếp tục ván cờ trên bàn' : 'Tạm dừng ván cờ trên bàn'} onClick={() => { setPaused(p => !p); setMotion(null); }}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button></div><span className={`kv-save-status ${saved ? '' : 'error'}`}>{saved ? <CircleCheck size={13}/> : <AlertCircle size={13}/>} {saved ? 'Đã lưu' : 'Chưa lưu được'}</span></div>
        <div className='kv-board-stage'>
          <div className={`kv-player-card top ${match.active === (flip ? 0 : 1) ? 'active' : ''}`}><Coin side={flip ? 0 : 1} small/><span><strong>{match.players[flip ? 0 : 1].name}</strong><small>{flip ? 'Quân Đỏ' : 'Quân Đen'}{match.players[flip ? 0 : 1].kind === 'bot' ? ` · ${LEVEL_NAMES[match.players[flip ? 0 : 1].level]}` : ''}</small></span>{match.active === (flip ? 0 : 1) && <i className={thinking ? 'thinking' : ''}/>}</div>
          <div className={`kv-board-canvas ${prefs.flat ? 'flat' : ''}`}>
            {prefs.flat ? <Board2D match={match} selected={selected} moves={selectedMoves} enabled={enabled} vietnamese={prefs.vietnamese || !fontReady} flip={flip} view={prefs.view} light={prefs.light} motion={motion} checked={checked} onPick={pick} onFailure={fail3D}/> : <SceneBoundary onFailure={fail3D}><Suspense fallback={<div className='kv-loading'><Leaf/><span>Đang bày bàn cờ…</span></div>}><Board3D match={match} selected={selected} moves={selectedMoves} enabled={enabled} vietnamese={prefs.vietnamese || !fontReady} flip={flip} view={prefs.view} light={prefs.light} motion={motion} checked={checked} onPick={pick} onFailure={fail3D}/></Suspense></SceneBoundary>}
          </div>
          <div className={`kv-player-card bottom ${match.active === (flip ? 1 : 0) ? 'active' : ''}`}><Coin side={flip ? 1 : 0} small/><span><strong>{match.players[flip ? 1 : 0].name}</strong><small>{flip ? 'Quân Đen' : 'Quân Đỏ'}{match.players[flip ? 1 : 0].kind === 'bot' ? ` · ${LEVEL_NAMES[match.players[flip ? 1 : 0].level]}` : ''}</small></span>{match.active === (flip ? 1 : 0) && <i className={thinking ? 'thinking' : ''}/>}</div>
          {(paused || handoff) && match.phase === 'play' && <div className='kv-board-overlay'><div><span className='kv-pause-symbol'>{handoff ? <Users/> : <Leaf/>}</span><h2>{handoff ? `Đến lượt ${match.players[match.active].name}` : 'Nghỉ một chút nhé.'}</h2><p>{handoff ? 'Chuyền máy cho người tiếp theo.' : 'Ván cờ đã lưu, quân cờ vẫn ở đây.'}</p><button className='kv-primary' onClick={() => { if (handoff) setFlip(match.active === 1); setHandoff(false); setPaused(false); }}><Play size={17}/> Tiếp tục chơi</button></div></div>}
          {match.phase === 'over' && <div className='kv-board-overlay result'><div><span className='kv-pause-symbol'>{match.winner === null ? <Handshake/> : <Trophy/>}</span><span className='kv-eyebrow'>MỘT CUỘC CỜ ĐÃ KHÉP LẠI</span><h2>{match.winner === null ? 'Một ván cờ hòa.' : `${match.winner === 0 ? 'Quân Đỏ' : 'Quân Đen'} chiến thắng!`}</h2><p>{REASONS[match.reason!]} · {match.ply} lượt đi</p><p className='kv-result-note'>{win ? 'Một nước đi hay, một niềm vui nhỏ.' : 'Mỗi ván cờ lại có thêm một điều để học.'}</p>{!saved && <button className='kv-text-button' onClick={() => persist(match)}>Thử lưu kết quả lại</button>}<button className='kv-primary' onClick={() => setLobby(true)}><RotateCcw size={17}/> Chơi một ván nữa</button></div></div>}
        </div>
        <div className='kv-board-toolbar'><div><button aria-pressed={!prefs.flat && prefs.view === 'tilted'} onClick={() => { preference('flat', false); preference('view', 'tilted'); }}><Maximize2 size={16}/><span>Nghiêng</span></button><button aria-pressed={!prefs.flat && prefs.view === 'straight'} onClick={() => { preference('flat', false); preference('view', 'straight'); }}><ChevronDown size={16}/><span>Nhìn thẳng</span></button><button aria-label='Lật bàn' onClick={() => setFlip(f => !f)}><FlipVertical2 size={16}/><span>Lật bàn</span></button><button aria-pressed={prefs.flat} onClick={() => preference('flat', !prefs.flat)}><Grid2X2 size={16}/><span>2D</span></button></div><button className='kv-label-toggle' aria-pressed={prefs.vietnamese} onClick={() => preference('vietnamese', !prefs.vietnamese)}><span>文</span><b>{prefs.vietnamese ? 'Tiếng Việt' : 'Chữ Hán'}</b></button></div>
      </section>
      <aside className='kv-sidebar'><div className={`kv-turn ${checked ? 'checked' : ''}`} aria-live='polite'><span className='kv-eyebrow'>CUỘC CỜ HIỆN TẠI</span><h2>{status}</h2><p>{match.phase === 'over' ? 'Cảm ơn một cuộc cờ đẹp.' : selected !== null ? `${NAMES[Math.abs(match.board[selected])]} · ${selectedMoves.length} ô có thể đi` : thinking ? 'Thảnh thơi chờ một nước cờ.' : 'Chọn quân, rồi chạm vào ô đích.'}</p></div>
        <div className='kv-match-numbers'><span><Clock3 size={16}/><b>{formatTime(match.elapsed)}</b><small>Thời gian chơi</small></span><span><Swords size={16}/><b>{match.ply.toString().padStart(2, '0')}</b><small>Lượt đã đi</small></span></div>
        <section className='kv-captures'><h3>Quân đã ăn</h3><Captures match={match} by={0}/><Captures match={match} by={1}/></section>
        <section className='kv-history'><div><h3>Nhật ký ván cờ</h3><span>{match.ply} lượt</span></div><div className='kv-history-list' ref={historyRef}>{match.history.length ? Array.from({ length: Math.ceil(match.history.length / 2) }, (_, index) => <div className='kv-history-row' key={index}><span>{index + 1}.</span>{[0, 1].map(side => { const move = match.history[index * 2 + side]; return <span key={side} className={side === 0 ? 'red' : ''}>{move ? `${coordinate(move.from)} → ${coordinate(move.to)}${move.gaveCheck ? ' +' : ''}` : '—'}</span>; })}</div>) : <div className='kv-empty-history'><span>楚 河</span><p>Nước cờ đầu tiên<br/>đang chờ được viết.</p></div>}</div></section>
        <div className='kv-game-actions'><button disabled={match.phase === 'over'} onClick={() => { setPaused(p => !p); setMotion(null); }}><Pause size={16}/>{paused ? 'Tiếp tục' : 'Tạm dừng'}</button><button disabled={match.phase === 'over' || motion !== null} onClick={() => setModal('resign')}><Flag size={16}/>Nhận thua</button>{match.players.every(p => p.kind === 'human') && <button disabled={match.phase === 'over' || motion !== null} onClick={() => setModal('draw')}><Handshake size={16}/>Đề nghị hòa</button>}</div>
      </aside>
    </main>}
    {notice && <div className='kv-toast' role='status'><Leaf size={17}/>{notice}<button aria-label='Đóng thông báo' onClick={() => setNotice('')}><X size={15}/></button></div>}
    {modal && <div className='kv-modal-backdrop' onClick={e => { if (e.target === e.currentTarget) setModal(null); }}><div className='kv-modal' role='dialog' aria-modal='true' aria-labelledby='kv-dialog-title' ref={dialogRef}><button className='kv-modal-close kv-icon-button' aria-label='Đóng' onClick={() => setModal(null)}><X/></button>
      <span className='kv-eyebrow'>KỲ VIÊN · CỜ TƯỚNG</span><h2 id='kv-dialog-title'>{modal === 'settings' ? 'Chơi theo cách của bạn.' : modal === 'rules' ? 'Làm quen cuộc cờ.' : modal === 'resign' ? 'Khép lại ván cờ?' : modal === 'draw' ? 'Cùng đồng ý hòa?' : 'Bày một ván cờ mới?'}</h2>
      {modal === 'settings' ? <div className='kv-settings-list'><Switch label='Nhãn tiếng Việt' description='Tướng, Sĩ, Tượng… dễ làm quen hơn.' value={prefs.vietnamese} onChange={() => preference('vietnamese', !prefs.vietnamese)}/><Switch label='Âm thanh' description='Tiếng quân chạm bàn và báo chiếu.' value={prefs.sound} onChange={() => preference('sound', !prefs.sound)}/><Switch label='Chuyền máy' description='Chờ người tiếp theo ở chế độ hai người.' value={prefs.handoff} onChange={() => preference('handoff', !prefs.handoff)}/><Switch label='Giảm chuyển động' description='Đặt quân ngay, bỏ chuyển động bay.' value={prefs.reduced} onChange={() => preference('reduced', !prefs.reduced)}/><Switch label='Đồ họa nhẹ' description='Bớt tiểu cảnh và bóng đổ.' value={prefs.light} onChange={() => preference('light', !prefs.light)}/><Switch label='Bàn 2D' description='Nhìn rõ, nhẹ máy và chơi bằng bàn phím.' value={prefs.flat} onChange={() => preference('flat', !prefs.flat)}/></div> : modal === 'rules' ? <div className='kv-rules'><p>Đỏ đi trước. Mục tiêu là khiến đối thủ không còn nước đi hợp lệ. Chạm quân của mình để xem các ô đi được.</p><div className='kv-rule-pieces'>{['Trong cung, đi ngang hoặc dọc một ô.', 'Đi chéo một ô trong cung.', 'Đi chéo hai ô, không qua sông; có thể bị cản mắt.', 'Đi hình chữ L; không nhảy qua quân cản chân.', 'Đi thẳng ngang hoặc dọc, không nhảy quân.', 'Đi như Xe; ăn quân phải có đúng một quân làm ngòi.', 'Tiến một ô; qua sông được đi ngang, không lùi.'].map((text, i) => <div key={i}><span className='kv-captured red'>{glyph(i + 1)}</span><p><strong>{NAMES[i + 1]}.</strong> {text}</p></div>)}</div><p><strong>Lưu ý:</strong> hai Tướng không được đối mặt khi không có quân chắn. Bí nước cũng bị xử thua.</p><p>Thế cờ lặp đủ ba lần: bên chiếu liên tục một phía bị xử thua; các trường hợp lặp còn lại hòa. Bản này chưa phân xử đuổi bắt theo đầy đủ luật WXF.</p><p>Không có hoàn tác hoặc gợi ý chiến thuật. Ván cờ tự lưu trên thiết bị này.</p></div> : <><p className='kv-confirm-copy'>{modal === 'resign' ? 'Bên nhận thua sẽ kết thúc ván và chiến thắng thuộc về đối thủ.' : modal === 'draw' ? 'Chuyền máy cho đối thủ. Chỉ chọn đồng ý khi cả hai người muốn kết thúc hòa.' : 'Ván đang chơi sẽ được thay thế bằng một ván mới với lựa chọn hiện tại.'}</p><div className='kv-confirm-actions'><button className='kv-secondary' onClick={() => setModal(null)}>Chơi tiếp</button><button className='kv-primary' onClick={() => modal === 'new' ? begin(true) : finish(modal === 'resign' ? 'resign' : 'agreement')}>{modal === 'new' ? 'Bắt đầu ván mới' : modal === 'resign' ? 'Xác nhận nhận thua' : 'Đối thủ đồng ý hòa'}</button></div></>}
    </div></div>}
  </div>;
}
