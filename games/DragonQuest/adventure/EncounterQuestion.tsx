import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sword } from 'lucide-react';
import { Event, Session } from './model';
import { nodeOf, questionOf } from './engine';
import { NODE_COPY } from './content';
import { getBuffName } from '../engine/buffs';
import { portraitArt } from './art';
import { QuestionView } from './QuestionView';

type Command = Event extends infer T ? T extends Event ? Omit<T, 'sessionId'> : never : never;

// This component stays mounted from the encounter cover through its answer.
// The engine enters "question" only after the cover has finished fading.
export function EncounterQuestion({s, worldReady, reduced, send, onRead, onReady}: {
  s: Session; worldReady: boolean; reduced: boolean; send: (event: Command) => void;
  onRead: () => void; onReady: () => void;
}) {
  const node = nodeOf(s), q = questionOf(s)!;
  const [view, setView] = useState<'cover' | 'revealing' | 'open'>(
    s.phase === 'intro' && s.bossPhase === 0 ? 'cover' : 'open'
  );
  const [systemReduced, setSystemReduced] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const reduceMotion = reduced || systemReduced;
  const feedback = s.phase === 'feedback';
  const active = s.phase === 'question' || feedback;
  const art = portraitArt(node.kind === 'boss' ? 'dragon' : node.kind === 'buff' ? 'fairy' : 'goblin');
  const name = node.kind === 'boss' ? 'Rồng Thần' : node.kind === 'buff' ? 'Nàng tiên ánh sáng' : 'Người giữ cánh rừng';

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (s.phase !== 'intro' || s.paused || !worldReady) return;
    const timer = window.setTimeout(() => {
      if (view === 'cover') setView('revealing');
      else { setView('open'); send({type: 'continue'}); }
    }, view === 'cover' ? 1400 : view === 'revealing' && !reduceMotion ? 450 : 0);
    return () => window.clearTimeout(timer);
  }, [s.phase, s.paused, worldReady, view, reduceMotion, send]);

  useEffect(() => {
    if (!active) return;
    const target = content.current?.querySelector<HTMLElement>(feedback ? '.dq-continue' : '#dq-question-text');
    target?.focus({preventScroll: true});
  }, [active, feedback]);

  return <div className="dq-encounter-stage" data-encounter-view={view} data-phase={s.phase}>
    <div ref={content} className="dq-encounter-content" inert={!active} aria-hidden={!active}>
      <div className="dq-question-scroll">
        <div className="dq-encounter-strip">
          <img src={art} alt="" width="52" height="52"/>
          <div><strong>{name}</strong><small>{node.kind === 'buff' ? 'Một câu trả lời, một món quà!' : node.kind === 'boss' ? `Câu ${s.bossPhase + 1} / ${s.bossTotal}` : 'Cùng mở lối bằng trí thông minh nhé.'}</small></div>
          {node.kind === 'boss' && <span className="dq-boss-swords"><Sword size={16}/>{s.buffs.holySword}</span>}
        </div>
        <QuestionView session={s} onAnswer={value => send({type: 'answer', slotId: q.slotId, encounter: s.encounter, value})} onHint={() => send({type: 'hint'})} onRead={onRead} onReady={onReady}/>
      </div>
      <div className="dq-encounter-footer" aria-hidden={!feedback} inert={!feedback}>
        <p className="dq-outcome">{feedback ? s.feedback?.correct ? `+${s.feedback.score} điểm${s.feedback.buff ? ' · Nhận ' + getBuffName(s.feedback.buff) : ''}` : node.kind === 'buff' ? 'Em vẫn giữ nguyên máu.' : 'Mất 1 tim.' : '\u00a0'}</p>
        <button className="dq-primary dq-wide dq-continue" disabled={!feedback} onClick={() => send({type: 'continue'})}>
          {s.energy === 0 ? 'Xem kết quả' : node.kind === 'boss' ? s.bossPhase + 1 === s.bossTotal ? 'Hoàn thành trận đấu' : 'Câu boss tiếp theo' : 'Tiếp tục gieo xúc xắc'}<ArrowRight size={18}/>
        </button>
      </div>
    </div>
    {view !== 'open' && <div className="dq-encounter-cover" aria-hidden={view === 'revealing'} inert={view === 'revealing'}>
      <img src={art} alt={name} fetchPriority="high"/>
      <div className="dq-cover-copy">
        <span className="dq-cover-eyebrow">{node.kind === 'boss' ? 'TRẬN ĐẤU CUỐI CHẶNG' : node.kind === 'buff' ? 'CUỘC GẶP KỲ DIỆU' : 'MỘT THỬ THÁCH MỚI'}</span>
        <h2>{NODE_COPY[node.kind].title}</h2>
        <p>{NODE_COPY[node.kind].line}</p>
        {s.pendingBuff && <p className="dq-cover-gift">Món quà: {getBuffName(s.pendingBuff)}</p>}
        <button className="dq-primary dq-wide" disabled={!worldReady || view !== 'cover'} onClick={() => setView('revealing')}>{NODE_COPY[node.kind].action}<ArrowRight size={18}/></button>
      </div>
    </div>}
  </div>;
}
