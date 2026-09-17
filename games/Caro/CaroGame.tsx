import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Flag, History, Pause, Play, RotateCcw, Settings2, Sparkles, Users, Volume2, VolumeX, X, Circle, Trophy } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { playSound } from '../../utils/sound';
import { musicManager } from '../../services/musicManager';
import { BoardGamesBack } from '../shared/BoardGamesBack';
import { clock, LEVEL_NAMES, mark, opposite, type Match, type Side, type Level, type CaroRecord } from './model';
import { finish, newMatch, place, replayBoard, undo, validateMatch } from './engine';
import { loadDraft, loadPrefs, saveDraft, savePrefs } from './persistence';
import { BotController } from './bot-controller';
import Board2D, { Mark } from './Board2D';
import { Dialog } from './Dialog';
import './caro.css';
const cover = new URL('./assets/cover.webp', import.meta.url).href;
type Modal = 'rules' | 'options' | 'resign' | 'draw' | 'undo' | 'replace' | 'history' | null;

export default function CaroGame({ owner, complete, onExit }: { owner: StudentProfile; complete(match: Match): boolean; onExit(): void }) {
  const app = useRef<HTMLElement>(null);
  const [prefs, setPrefs] = useState(() => loadPrefs(owner.id)), prefsRef = useRef(prefs); prefsRef.current = prefs;
  const [draft, setDraft] = useState(() => loadDraft(owner.id));
  const [match, setMatch] = useState<Match | null>(null), current = useRef<Match | null>(null);
  const [paused, setPaused] = useState(false), [modal, setModal] = useState<Modal>(null), [selected, setSelected] = useState<number | null>(null);
  const [replay, setReplay] = useState<number | null>(null), [viewingArchive, setViewingArchive] = useState(false);
  const [notice, setNotice] = useState(''), [saved, setSaved] = useState(true), [resultSaved, setResultSaved] = useState(false);
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse), (max-width: 650px)').matches);
  const [confirmClick, setConfirmClick] = useState(false);
  const [bot] = useState(() => new BotController());
  const blocked = useRef(false), completed = useRef('');
  useEffect(() => { app.current?.scrollTo({ top: 0, left: 0 }); }, [match?.id]);
  blocked.current = paused || !!modal || replay !== null || document.hidden;
  const commit = useCallback((s: Match) => {
    current.current = s; setMatch(s); setSelected(null);
    const ok = saveDraft(s); setSaved(ok);
    if (!ok) setNotice('Chưa lưu được trên thiết bị này. Em vẫn có thể chơi tiếp.');
  }, []);
  useEffect(() => { savePrefs(owner.id, prefs); }, [prefs, owner.id]);
  useEffect(() => {
    musicManager.playTrack(null);
    const media = window.matchMedia('(pointer: coarse), (max-width: 650px)');
    const pointerChange = () => setCoarse(media.matches); media.addEventListener('change', pointerChange);
    const hide = () => { if (document.hidden) { blocked.current = true; bot.cancel(); setPaused(true); if (current.current && !viewingArchive) setSaved(saveDraft(current.current)); } };
    const flush = () => { if (current.current && !viewingArchive) saveDraft(current.current); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', flush);
    return () => { bot.cancel(); media.removeEventListener('change', pointerChange); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', flush); musicManager.resumeRouteMusic(); };
  }, [bot, viewingArchive]);
  useEffect(() => {
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), delta = Math.min(1500, now - previous); previous = now;
      const s = current.current;
      if (!s || s.phase !== 'play' || blocked.current || viewingArchive) return;
      const next = { ...s, elapsed: s.elapsed + delta }; current.current = next; setMatch(next); setSaved(saveDraft(next));
    }, 1000);
    return () => clearInterval(timer);
  }, [viewingArchive]);
  useEffect(() => {
    const s = current.current;
    if (!s || s.phase !== 'play' || s.players[s.activeSide].kind !== 'bot' || blocked.current || viewingArchive) return;
    const id = s.id, revision = s.revision;
    const delay = setTimeout(() => bot.start(s, (cell, fallback) => {
      const live = current.current;
      if (!live || blocked.current || live.id !== id || live.revision !== revision) return;
      const next = place(live, cell); if (next === live) return;
      if (fallback) setNotice('Máy đã chọn một nước dự phòng. Ván vẫn tiếp tục.');
      commit(next); if (prefsRef.current.sound) playSound(next.phase === 'over' ? 'complete' : 'click');
    }), 280);
    return () => { clearTimeout(delay); bot.cancel(); };
  }, [match?.id, match?.revision, paused, modal, replay, viewingArchive, bot, commit]);
  useEffect(() => {
    if (!match || match.phase !== 'over' || viewingArchive || completed.current === match.id) return;
    const ok = complete(match); setResultSaved(ok);
    if (ok) completed.current = match.id;
  }, [match?.id, match?.phase, complete, viewingArchive]);

  const start = (resume?: Match) => {
    const p = prefsRef.current;
    const human = { name: owner.name.slice(0, 40), avatar: '🌱', kind: 'human' as const };
    const other = { name: p.mode === 'bot' ? `Bạn máy · ${LEVEL_NAMES[p.level]}` : p.guest.trim() || 'Bạn của em', avatar: p.mode === 'bot' ? '🦉' : p.avatar, kind: p.mode === 'bot' ? 'bot' as const : 'human' as const };
    const s = resume || newMatch({ owner: owner.id, ownerSide: p.ownerSide, mode: p.mode, level: p.level, undoEnabled: p.undoEnabled, players: p.ownerSide === 0 ? [human, other] : [other, human] });
    bot.cancel(); setPaused(false); setModal(null); setReplay(null); setViewingArchive(false); setResultSaved(completed.current === s.id || owner.gameHistory.some(g => g.id === s.id)); setNotice(''); commit(s);
  };
  const rematch = () => {
    const s = current.current; if (!s) return;
    start(newMatch({ ...s, ownerSide: opposite(s.ownerSide), players: [s.players[1], s.players[0]] }));
  };
  const exit = () => { bot.cancel(); if (current.current && !viewingArchive) saveDraft(current.current); onExit(); };
  const lobby = () => { bot.cancel(); setDraft(loadDraft(owner.id)); current.current = null; setMatch(null); setModal(null); setReplay(null); setPaused(false); setViewingArchive(false); };
  const put = (cell: number) => {
    const s = current.current;
    if (!s || blocked.current || s.phase !== 'play' || s.players[s.activeSide].kind !== 'human') return;
    const next = place(s, cell); if (next === s) return;
    commit(next); if (prefsRef.current.sound) playSound(next.phase === 'over' ? 'complete' : 'click');
  };
  const act = (action: 'resign' | 'draw' | 'undo') => {
    const s = current.current; if (!s) return;
    bot.cancel();
    const next = action === 'undo' ? undo(s) : finish(s, action === 'draw' ? 'agreement' : 'resign', s.mode === 'bot' ? s.ownerSide : s.activeSide);
    commit(next); setModal(null);
  };
  const archive = (record: CaroRecord, id: string, elapsed: number, endedAt: string) => {
    if (!record.moves || record.version !== 1 || record.rulesVersion !== 'gk-caro-v1') return;
    let s = newMatch({ owner: owner.id, ownerSide: record.ownerSide, players: record.players, mode: record.mode, level: record.level, undoEnabled: !!record.undos }, id);
    for (const cell of record.moves) s = place(s, cell, endedAt);
    s = { ...s, phase: 'over', winner: record.winner, endReason: record.reason, endedAt, elapsed, undos: record.undos };
    if (!validateMatch(s, owner.id)) { setNotice('Chưa mở được bản xem lại này.'); return; }
    bot.cancel(); current.current = s; setMatch(s); setViewingArchive(true); setReplay(0); setModal(null); setPaused(false);
  };
  const recent = owner.gameHistory.filter(g => g.gameType === 'caro' && g.caro?.moves).slice(-50).reverse();
  const showRules = <>
    <p>Hai bạn lần lượt đặt X và O vào ô trống. X đi trước.</p>
    <div className="caro-rule-example"><b>· X X X X X ·</b><span><Check size={16}/> Đúng năm quân: thắng!</span></div>
    <div className="caro-rule-example"><b>O X X X X X O</b><span>Bị chặn cả hai đầu: chưa thắng.</span></div>
    <div className="caro-rule-example"><b>· X X X X X X ·</b><span>Sáu quân liên tiếp: chưa thắng.</span></div>
    <p>Nối ngang, dọc hoặc chéo đều được. Mép bàn không tính là quân chặn. Bàn đầy mà chưa ai thắng thì hòa.</p>
    <p className="caro-muted">Trên điện thoại, chạm chọn ô rồi bấm Đặt quân. Dùng + để phóng to nếu ô nhỏ. Bàn phím: mũi tên, Enter và Escape.</p>
    <button className="caro-primary" onClick={() => setModal(null)}>Em hiểu rồi <ArrowRight size={18}/></button>
  </>;
  const commonModal = modal === 'rules' ? <Dialog title="Nối năm quân, cùng tìm nước hay" onClose={() => setModal(null)}>{showRules}</Dialog> : modal === 'history' ? <Dialog title="Những ván đã chơi" onClose={() => setModal(null)}>
    {recent.length ? <div className="caro-history">{recent.map(g => <button key={g.id} onClick={() => archive(g.caro!, g.id, g.durationSeconds * 1000, g.date)}><span><strong>{g.caro!.winner === null ? 'Một ván hòa' : g.caro!.winner === g.caro!.ownerSide ? 'Em đã thắng' : 'Một lần thử sức'}</strong><small>{new Date(g.date).toLocaleDateString('vi-VN')} · {g.caro!.mode === 'bot' ? `Máy ${LEVEL_NAMES[g.caro!.level]}` : 'Chơi cùng bạn'} · {g.caro!.moves!.length} nước</small></span><ChevronRight size={18}/></button>)}</div> : <p>Ván đầu tiên đang chờ em. Chơi xong, em có thể xem lại từng nước ở đây.</p>}
  </Dialog> : null;

  if (!match) return <section ref={app} className="caro-app caro-lobby">
    <header className="caro-top"><BoardGamesBack onBack={exit}/><span className="caro-eyebrow">GÓC GIẤY Ô LY</span><button className="caro-text-button" onClick={() => setModal('history')}><History size={18}/> Ván đã chơi</button></header>
    <main className="caro-setup">
      <div className="caro-cover"><img src={cover} width="1200" height="800" alt="Tờ giấy ô ly với các nét X và O trên bàn gỗ trong vườn"/><div className="caro-cover-copy"><span className="caro-eyebrow">MỘT TỜ GIẤY · HAI NGƯỜI BẠN</span><h1>Cờ Ca-rô</h1><p>Một nét X, một vòng O.<br/>Cùng tìm nước hay, nối liền năm quân.</p><button className="caro-text-button" onClick={() => setModal('rules')}><BookOpen size={18}/> Cách chơi thật dễ</button></div></div>
      <section className="caro-setup-panel"><span className="caro-eyebrow">NGỒI VÀO BÀN NÀO</span><h2>Hôm nay chơi cùng ai?</h2>
        {draft.match && <button className="caro-resume" onClick={() => start(draft.match!)}><Play size={21}/><span><strong>{draft.match.phase === 'play' ? 'Chơi tiếp ván đang dở' : 'Xem ván gần nhất'}</strong><small>{draft.match.moves.length} nước · {clock(draft.match.elapsed)}</small></span><ChevronRight size={19}/></button>}
        <div className="caro-mode-options">
          <button className={prefs.mode === 'human' ? 'chosen' : ''} aria-pressed={prefs.mode === 'human'} onClick={() => setPrefs(p => ({ ...p, mode: 'human' }))}><Users size={24}/><strong>Chơi cùng bạn</strong><small>Hai người, cùng một máy</small></button>
          <button className={prefs.mode === 'bot' ? 'chosen' : ''} aria-pressed={prefs.mode === 'bot'} onClick={() => setPrefs(p => ({ ...p, mode: 'bot' }))}><Sparkles size={24}/><strong>Chơi với máy</strong><small>Mỗi ván một thử thách</small></button>
        </div>
        {prefs.mode === 'bot' ? <fieldset className="caro-field"><legend>Chọn thử thách</legend><div className="caro-segments">{(['easy', 'medium', 'hard'] as Level[]).map(level => <button key={level} aria-pressed={prefs.level === level} className={prefs.level === level ? 'chosen' : ''} onClick={() => setPrefs(p => ({ ...p, level }))}>{LEVEL_NAMES[level]}</button>)}</div><p className="caro-muted">{prefs.level === 'easy' ? 'Làm quen và thong thả tìm nước đi.' : prefs.level === 'medium' ? 'Thử tạo chuỗi, nhớ nhìn nước của máy nhé.' : 'Máy sẽ nghĩ kỹ hơn. Em cũng vậy nhé!'}</p></fieldset>
          : <div className="caro-field"><label htmlFor="caro-guest">Tên người bạn cùng chơi</label><input id="caro-guest" value={prefs.guest} maxLength={40} onChange={e => setPrefs(p => ({ ...p, guest: e.target.value }))}/><div className="caro-avatars">{['🐰', '🐻', '🐱', '🦊'].map((avatar, i) => <button key={avatar} aria-label={['Thỏ', 'Gấu', 'Mèo', 'Cáo'][i]} aria-pressed={prefs.avatar === avatar} className={prefs.avatar === avatar ? 'chosen' : ''} onClick={() => setPrefs(p => ({ ...p, avatar }))}>{avatar}</button>)}</div></div>}
        <fieldset className="caro-field"><legend>{owner.name} muốn cầm quân nào?</legend><div className="caro-segments">{([0, 1] as Side[]).map(side => <button key={side} className={prefs.ownerSide === side ? 'chosen' : ''} aria-pressed={prefs.ownerSide === side} onClick={() => setPrefs(p => ({ ...p, ownerSide: side }))}>{side === 0 ? <X size={20}/> : <Circle size={18}/>} {side === 0 ? 'X · đi trước' : 'O · đi sau'}</button>)}</div></fieldset>
        <label className="caro-check"><input type="checkbox" checked={prefs.undoEnabled} onChange={e => setPrefs(p => ({ ...p, undoEnabled: e.target.checked }))}/> Cho phép đi lại nước</label>
        <button className="caro-primary caro-start" onClick={() => draft.match?.phase === 'play' ? setModal('replace') : start()}>Bắt đầu ván mới <ArrowRight size={20}/></button>
        <p className="caro-footnote">Đúng 5 quân · Không chặn cả hai đầu<br/>Không giới hạn thời gian. Cứ thong thả nhé.</p>
        {(draft.error || notice) && <p className="caro-warning" role="status">{notice || 'Bản lưu chưa đọc được. Em có thể bắt đầu một ván mới.'}</p>}
      </section>
    </main>{commonModal}
    {modal === 'replace' && <Dialog title="Bắt đầu một ván mới?" onClose={() => setModal(null)}><p>Ván đang dở sẽ được thay bằng ván mới.</p><div className="caro-actions"><button onClick={() => start(draft.match!)}>Chơi tiếp ván cũ</button><button className="caro-primary" onClick={() => start()}>Bắt đầu ván mới</button></div></Dialog>}
  </section>;

  const isReplay = replay !== null, over = match.phase === 'over', botTurn = match.players[match.activeSide].kind === 'bot';
  const displayed = isReplay ? replayBoard(match.moves, replay) : match.board;
  const displayLines = !isReplay || replay === match.moves.length ? match.winningLines : [];
  const title = isReplay ? 'Từng nước, từng ý hay' : over ? match.winner === null ? 'Một ván hòa thật vui' : `${match.players[match.winner].name} đã thắng!` : paused ? 'Nghỉ một chút nhé' : botTurn ? 'Máy đang nghĩ…' : `Đến lượt ${match.players[match.activeSide].name}`;
  return <section ref={app} className="caro-app caro-play">
    <header className="caro-top"><BoardGamesBack onBack={exit}/><button className="caro-wordmark" onClick={lobby}>Cờ Ca-rô <span>Góc giấy ô ly</span></button><div className="caro-top-actions"><button aria-label={prefs.sound ? 'Tắt tiếng' : 'Bật tiếng'} onClick={() => setPrefs(p => ({ ...p, sound: !p.sound }))}>{prefs.sound ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button><button aria-label="Luật chơi" onClick={() => setModal('rules')}><BookOpen size={20}/></button><button aria-label="Tùy chọn ván" onClick={() => setModal('options')}><Settings2 size={20}/></button></div></header>
    <main className="caro-table">
      <aside className="caro-side-panel"><span className="caro-eyebrow">CÙNG TÌM NƯỚC HAY</span><h1>{isReplay ? 'Xem lại ván' : 'Từng nét nhỏ,\nmột nước hay.'}</h1><p>Nối năm quân ngang, dọc hoặc chéo. Nhớ nhìn cả hai đầu nhé.</p><div className="caro-small-rule"><Mark value={1}/><Mark value={1}/><Mark value={1}/><Mark value={1}/><Mark value={1}/></div><button className="caro-text-button" onClick={() => setModal('rules')}><BookOpen size={16}/> Xem luật</button><div className="caro-match-meta"><span>{match.mode === 'bot' ? `Chơi với máy · ${LEVEL_NAMES[match.level]}` : 'Hai người cùng chơi'}</span><span>{match.moves.length} nước · {clock(match.elapsed)}</span><span>{match.undos ? `Đã đi lại ${match.undos} lần` : 'Không cần vội vàng'}</span></div></aside>
      <div className="caro-board-column">
        <div className="caro-players">{match.players.map((p, i) => <div key={i} className={`caro-player ${!over && !isReplay && match.activeSide === i ? 'active' : ''}`}><span className="caro-player-avatar">{p.avatar}</span><div><strong>{p.name}</strong><small>{i === match.ownerSide ? 'Quân của em' : p.kind === 'bot' ? 'Bạn máy' : 'Bạn cùng chơi'}{!over && !isReplay && match.activeSide === i ? ' · tới lượt' : ''}</small></div><Mark value={i + 1}/></div>)}</div>
        <div className="caro-turn" role="status" aria-live="polite"><span className={botTurn && !over && !paused && !isReplay ? 'caro-thinking' : ''}/>{title}</div>
        <div className="caro-board-wrap">
          <Board2D board={displayed} activeSide={match.activeSide} selected={selected} onSelect={setSelected} onPlace={put} disabled={paused || !!modal || over || botTurn || isReplay} last={isReplay ? match.moves[replay - 1] : match.moves.at(-1)} lines={displayLines} confirmTouch={coarse || confirmClick}/>
          {paused && !over && !isReplay && <div className="caro-pause-cover"><Pause size={30}/><h2>Ván cờ đang tạm dừng</h2><p>{saved ? 'Tiến trình đã được giữ lại.' : 'Chưa lưu được. Em có thể chơi tiếp rồi thử lại.'}</p><button className="caro-primary" onClick={() => setPaused(false)}><Play size={18}/> Chơi tiếp</button></div>}
        </div>
        {isReplay ? <div className="caro-replay"><button aria-label="Về nước đầu" disabled={replay === 0} onClick={() => setReplay(0)}>Đầu</button><button aria-label="Nước trước" disabled={replay === 0} onClick={() => setReplay(replay - 1)}><ChevronLeft/></button><span>Nước {replay} / {match.moves.length}</span><button aria-label="Nước sau" disabled={replay === match.moves.length} onClick={() => setReplay(replay + 1)}><ChevronRight/></button><button aria-label="Về nước cuối" disabled={replay === match.moves.length} onClick={() => setReplay(match.moves.length)}>Cuối</button><button onClick={() => viewingArchive ? lobby() : setReplay(null)}>Đóng xem lại</button></div>
          : over ? <section className="caro-result" aria-label="Kết quả ván"><Trophy size={27}/><div><h2>{match.winner === null ? 'Cùng nhau chơi thêm nhé!' : 'Năm quân, một niềm vui!'}</h2><p>{match.endReason === 'five' ? 'Chuỗi năm quân đã được đánh dấu trên bàn.' : match.endReason === 'resign' ? 'Ván kết thúc do một người nhận thua.' : match.endReason === 'agreement' ? 'Hai bạn đã đồng ý hòa.' : 'Bàn đã đầy. Hai bạn hòa nhau.'}</p><small>{resultSaved ? 'Đã lưu kết quả vào hồ sơ' : 'Chưa lưu được kết quả'}</small>{!resultSaved && <button onClick={() => { const ok = complete(match); setResultSaved(ok); if (ok) completed.current = match.id; }}>Thử lưu lại</button>}</div><div className="caro-result-actions"><button className="caro-primary" onClick={rematch}>Chơi lại <RotateCcw size={17}/></button><button onClick={() => setReplay(0)}>Xem lại từng nước</button><button onClick={lobby}>Đổi người chơi</button></div></section>
          : <div className="caro-controls"><button aria-label="Đi lại" disabled={paused || !match.undoEnabled || undo(match) === match} onClick={() => match.mode === 'human' ? setModal('undo') : act('undo')}><RotateCcw size={18}/><span>Đi lại</span></button><span className="caro-selection">{selected !== null ? `Hàng ${Math.floor(selected / 15) + 1}, cột ${selected % 15 + 1}` : botTurn ? 'Em quan sát nước của máy nhé' : 'Một nước đi của em'}</span><button className="caro-primary" disabled={selected === null || paused || botTurn} onClick={() => selected !== null && put(selected)}>Đặt {mark(match.activeSide)} <Check size={18}/></button><button aria-label="Tạm dừng ván" disabled={paused} onClick={() => { blocked.current = true; bot.cancel(); setPaused(true); }}><Pause size={18}/></button></div>}
        <div className="caro-save-line" role="status">{viewingArchive ? 'Đang xem lại ván đã chơi' : saved ? <><Check size={13}/> Tự động lưu trên thiết bị này</> : 'Chưa lưu được tiến trình'}{notice && <span>{notice}</span>}</div>
      </div>
    </main>{commonModal}
    {modal === 'options' && <Dialog title="Một vài tùy chọn" onClose={() => setModal(null)}><label className="caro-check"><input type="checkbox" checked={confirmClick || coarse} disabled={coarse} onChange={e => setConfirmClick(e.target.checked)}/> Chọn ô rồi xác nhận đặt quân</label><p className="caro-muted">Ván này {match.undoEnabled ? 'cho phép' : 'không cho phép'} đi lại nước. Có thể đổi khi bắt đầu ván mới.</p><div className="caro-options-list">{!over && !isReplay && <><button onClick={() => { setPaused(true); setModal(null); }}><Pause size={18}/> Tạm dừng</button><button onClick={() => setModal('resign')}><Flag size={18}/> Nhận thua</button>{match.mode === 'human' && <button onClick={() => setModal('draw')}>Đề nghị hòa</button>}</>}<button onClick={lobby}><Users size={18}/> Về chọn người chơi</button><button onClick={exit}>Về Board games</button></div></Dialog>}
    {(modal === 'resign' || modal === 'draw' || modal === 'undo') && <Dialog title={modal === 'resign' ? 'Kết thúc ván này?' : modal === 'draw' ? 'Hai bạn đồng ý hòa?' : 'Bạn cùng chơi đồng ý đi lại?'} onClose={() => setModal(null)}><p>{modal === 'resign' ? `${match.players[match.mode === 'bot' ? match.ownerSide : match.activeSide].name} sẽ nhận thua ván này.` : modal === 'draw' ? 'Chuyển cho người còn lại bấm Đồng ý. Chưa đồng ý thì ván vẫn tiếp tục.' : 'Nước vừa đặt sẽ được bỏ. Người còn lại bấm Đồng ý để xác nhận.'}</p><div className="caro-actions"><button onClick={() => setModal(null)}>Chơi tiếp</button><button className="caro-primary" onClick={() => act(modal)}>Đồng ý</button></div></Dialog>}
  </section>;
}
