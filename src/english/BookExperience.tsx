import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, List, PencilLine, Sparkles, Sprout, Star, UserRound } from 'lucide-react';
import type { StudentProfile } from '../../types';
import type { Level } from '../data/english/schema';
import { isPreschool } from '../utils/grade';
import { cancelSpeech } from '../utils/speech';
import { LEVELS, LEVEL_NAMES, LEVEL_STORIES, LEVEL_OUTLINES, requiredSkills, skillTitle } from './catalog';
import type { EnglishContent } from './content';
import { type EnglishSession } from './model';
import { listSessions } from './storage';
import { useLibrary } from './useLibrary';
import { bookPages } from './book';
import { AudioButton, ColoredSentence, PronounSwap } from './LessonParts';
import { GrammarWidget, IrregularVerbs } from './GrammarWidgets';
import { ExampleText, FormulaText, KnowledgeText } from './KnowledgeText';

export function BookShell({ children, student, onLogout, onProfile }: { children: React.ReactNode; student: StudentProfile; onLogout: () => void; onProfile: () => void }) {
  const {pathname}=useLocation();
  return <div className="english-studio">
    <a className="book-skip" href="#english-content">Đến nội dung</a>
    <header className="book-header"><Link to="/mode" className="book-exit" aria-label="Sảnh khám phá"><ArrowLeft size={17}/><span>Sảnh khám phá</span></Link><Link to="/english" className="book-brand"><BookOpen size={23}/><span>English Garden<small>CUỐN SÁCH TIẾNG ANH CỦA EM</small></span></Link><div className="book-profile"><span><Star size={15}/> {student?.stars}</span><button onClick={onProfile} aria-label="Mở hồ sơ"><UserRound size={17}/>{student?.name}</button><button onClick={onLogout} className="book-switch">Đổi hồ sơ</button></div></header>
    <nav className="book-tabs" aria-label="Khu vực tiếng Anh">
      <NavLink to="/english" end><BookOpen size={17}/>Bìa sách</NavLink>
      <NavLink to="/english/contents" className={({isActive})=>isActive||pathname.includes("/learn/")||pathname.endsWith("/rulebook")?"active":""}><List size={17}/>Mục lục</NavLink>
      <NavLink to="/english/workshop" className={({isActive})=>isActive||/\/(practice|test|review|placement|result)(\/|$)/.test(pathname)?"active":""}><PencilLine size={17}/>Ôn luyện</NavLink>
      <NavLink to="/english/vocabulary"><Bookmark size={17}/>Từ vựng</NavLink>
      <NavLink to="/english/parent"><Sparkles size={17}/>AI ra đề</NavLink>
    </nav>
    <div id="english-content">{children}</div>
  </div>;
}

function ChapterProgress({ student, level }: { student: StudentProfile; level: Level }) {
  const progress = student.englishProgress;
  const skills = level === 'K' ? ['letters','phrases','vocab-picture','vocab-meaning','vocab-listen'] : requiredSkills[level];
  return <section className="book-progress"><span className="en-eyebrow">GÓC TIẾN ĐỘ</span><h3>{progress?.masteryByLevel[level]?.mastered ? 'Đã vững chương này' : 'Từng bước của em'}</h3>
    {skills.map(skill => { const data = progress?.skills[level+':'+skill] || (level==='A1' ? progress?.skills[skill] : undefined); const accuracy = data?.attempts ? Math.round(data.firstTryCorrect/data.attempts*100) : 0; return <div className="book-skill" key={skill}><div><span>{skillTitle(skill)}</span><small>{data?.attempts ? `${accuracy}% · ${data.attempts} lượt` : 'Chưa luyện'}</small></div><progress value={accuracy} max={100} aria-label={skillTitle(skill)}/></div>; })}
    <p className="en-small">{level==='K' ? 'Cùng người lớn nghe, nhìn và thử từng chút.' : '“Đã vững”: 2 bài kiểm tra đủ kỹ năng đạt từ 80%, ít nhất một nửa nguồn câu ở bài sau là mới.'}</p>
  </section>;
}

export function BookCover({ student }: { student: StudentProfile }) {
  const { entries, error } = useLibrary(student.id);
  const bookmark = entries.find(e => e.id==='bookmark');
  const level = bookmark?.level || (isPreschool(student.grade) ? 'K' : student.englishProgress?.selectedLevel || 'A1');
  const due = student.englishProgress?.reviewItems.filter(e => e.nextReviewAt<=new Date().toISOString()).length || 0;
  return <div className="book-cover-layout">
    <section className="book-cover" aria-label="Bìa sách English Garden"><span className="book-cover-edition">GENIUS KIDS · ENGLISH COLLECTION</span><div className="book-cover-title"><Sprout size={30}/><h1>English<br/><em>Garden</em></h1><p>Mở một trang sách.<br/>Khám phá một điều mới.</p></div><div className="book-cover-art"><img src={`${import.meta.env.BASE_URL}english/garden.webp`} alt="Khu vườn học tiếng Anh với bạn Cáo"/></div><div className="book-cover-owner"><small>CUỐN SÁCH NÀY CỦA</small><strong>{student.name}</strong></div><Link className="book-open" to="/english/contents">Mở sách <ArrowRight size={20}/></Link></section>
    <section className="book-welcome"><span className="en-eyebrow">CHÀO EM, NGƯỜI ĐỌC NHỎ</span><h2>Một cuốn sách,<br/>nhiều điều để khám phá.</h2><p>Từ những lời chào đầu tiên đến tự đọc một câu chuyện. Chọn chương mình thích, đọc từng trang và thử dùng điều vừa học.</p>
      <div className="book-bookmark"><Bookmark size={23}/><div><span className="en-eyebrow">{bookmark ? 'DẤU TRANG CỦA EM' : 'TRANG SÁCH ĐẦU TIÊN'}</span><h3>{LEVEL_NAMES[level]}</h3><p>{LEVEL_STORIES[level]}</p><Link className="en-button" to={`/english/learn/${level}${bookmark?.page ? '?page='+encodeURIComponent(bookmark.page) : ''}`}>{bookmark ? 'Đọc tiếp' : 'Bắt đầu đọc'} <ArrowRight size={17}/></Link></div></div>
      <div className="book-quick-links"><Link to="/english/workshop"><PencilLine size={20}/><span><strong>Vào ôn luyện</strong><small>Chọn một hoặc nhiều chủ đề</small></span><ArrowRight size={17}/></Link><Link to="/english/review"><Bookmark size={20}/><span><strong>{due ? `${due} câu đến hẹn ôn` : 'Góc ôn lại'}</strong><small>Gặp lại những câu cần nhớ</small></span><ArrowRight size={17}/></Link><Link to="/english/placement"><Sprout size={20}/><span><strong>Chưa biết bắt đầu từ đâu?</strong><small>Thử 8 câu để tìm chương phù hợp</small></span><ArrowRight size={17}/></Link></div>
      {error&&<p role="alert" className="en-error en-notice">{error}</p>}
    </section>
  </div>;
}

export function BookContents({ student }: { student: StudentProfile }) {
  const groups: [string, Level[]][] = [['01 · Nền tảng câu',['A1','A2','A3']],['02 · Bốn thì quen thuộc',['B1','B2','B3','B4']],['03 · Kết nối & diễn đạt',['C1','C2','C3']],['Góc làm quen · Mẫu giáo',['K']]];
  return <section className="book-spread book-contents"><div className="book-paper"><span className="en-eyebrow">ENGLISH GARDEN / MỤC LỤC</span><h1>Hôm nay,<br/><em>em muốn học gì?</em></h1><p>Mỗi chương có những trang nhỏ để em đọc theo nhịp của mình. Em có thể bắt đầu ở bất kỳ chương nào.</p><div className="book-contents-note"><Sprout size={38}/><h3>Đọc một chút.<br/>Thử một chút.</h3><p>Công thức, ví dụ và chỗ dễ nhầm được chia thành từng trang. Dấu trang giúp em quay lại đúng nơi đang đọc.</p><Link className="en-text-link" to="/english/workshop">Mở bàn ôn luyện <ArrowRight size={17}/></Link><Link className="en-text-link" to="/english/rulebook">Tra sổ tay ngữ pháp <ArrowRight size={17}/></Link></div><span className="book-folio">MỤC LỤC · 11 CHƯƠNG</span></div><div className="book-paper book-index">
    {groups.map(([name,levels])=><section key={name}><h2>{name}</h2>{levels.map(level=><Link key={level} to={`/english/learn/${level}`}><span className="book-chapter-number">{level}</span><span><strong>{LEVEL_NAMES[level]}</strong><small>{LEVEL_STORIES[level]} · {LEVEL_OUTLINES[level]}</small></span>{student.englishProgress?.masteryByLevel[level]?.mastered ? <Check size={18} aria-label="Đã vững"/> : <ArrowRight size={16}/>}</Link>)}</section>)}
  </div></section>;
}

export function BookReader({ content, student }: { content: EnglishContent; student: StudentProfile }) {
  const pages = bookPages(content);
  const [params,setParams] = useSearchParams();
  const index = Math.max(0,pages.findIndex(p=>p.id===params.get('page')));
  const page = pages[index];
  const {entries, save, error, ready} = useLibrary(student.id);
  const [saving,setSaving] = useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const first=useRef(true);
  const readId = `read:${content.level}:${content.version}:${page.id}`;
  const read = entries.some(e=>e.id===readId);
  const readCount = pages.filter(p=>entries.some(e=>e.id===`read:${content.level}:${content.version}:${p.id}`)).length;
  useEffect(()=>{ if(ready) void save({id:'bookmark',level:content.level,page:page.id,version:content.version}); },[ready,save,content.level,content.version,page.id]);
  useEffect(()=>{ cancelSpeech(); if(!first.current){heading.current?.focus({preventScroll:true}); heading.current?.scrollIntoView({block:'start',behavior:'instant'});}first.current=false; },[page.id]);
  const turn=(next:number)=>setParams({page:pages[next].id});
  const section=page.index===undefined?undefined:content.theory?.sections[page.index];
  const formula=page.index===undefined?undefined:content.theory?.formulas[page.index];
  const mistake=page.index===undefined?undefined:content.theory?.commonMistakes[page.index];
  return <>
    <div className="book-reader-toolbar"><Link to="/english/contents"><ArrowLeft size={16}/>Mục lục</Link><label><span>Chuyển chương</span><ChapterSelect level={content.level}/></label><Link to={`/english/practice?level=${content.level}`}>Luyện chương này <PencilLine size={16}/></Link></div>
    <div className="book-reading-layout"><section className="book-spread book-reader"><div className="book-paper book-lesson">
      <span className="en-eyebrow">CHƯƠNG {content.level} · {LEVEL_NAMES[content.level]}</span><h1 ref={heading} tabIndex={-1}>{page.title}</h1>
      <div key={page.id} className="book-page-content">
        {page.kind==='overview'&&<><p className="book-lead">{content.theory?.summary || 'Cùng làm quen với chữ cái, từ vựng và những câu giao tiếp đầu tiên. Nghe, nhìn, rồi thử nói cùng người lớn nhé.'}</p><div className="book-learning-goal"><span className="en-eyebrow">TRONG CHƯƠNG NÀY</span><h2>{LEVEL_NAMES[content.level]}</h2><p>{LEVEL_OUTLINES[content.level]}</p></div><p>{LEVEL_STORIES[content.level]}. Mỗi lần đọc, em chỉ cần tập trung vào một ý nhỏ.</p><button className="en-button" onClick={()=>turn(1)}>Khám phá trang đầu <ArrowRight size={17}/></button></>}
        {page.kind==='formula'&&formula&&<><span className="book-rule-label">MẪU CÂU CẦN NHỚ</span><div className="book-formula"><FormulaText text={formula.pattern}/></div><div className="book-example-simple"><span className="en-eyebrow">VÍ DỤ ÁP DỤNG</span><ExampleText text={formula.example}/></div><p className="book-prompt">Em thử tìm từng phần của công thức trong câu ví dụ nhé.</p></>}
        {page.kind==='section'&&section&&<><KnowledgeText body={section.body}/>{section.table&&<div className="en-table-scroll" tabIndex={0} role="region" aria-label={section.heading}><table><thead><tr>{section.table.columns.map((c,i)=><th key={i} scope="col">{c}</th>)}</tr></thead><tbody>{section.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.interactive==='pronoun-swap'?<PronounSwap/>:section.interactive&&<GrammarWidget kind={section.interactive} content={content}/>}</>}
        {page.kind==='examples'&&<><p>Quan sát màu từ và các cụm trong câu. Nhấn loa để nghe cách đọc.</p>{page.exampleIds?.map(id=>{const sentence=content.sentences.find(s=>s.id===id);return sentence&&<div className="en-example" key={id}><ColoredSentence sentence={sentence}/><div><p>{sentence.vi}</p><AudioButton text={sentence.en}/></div></div>;})}</>}
        {page.kind==='mistake'&&mistake&&<><p>Hai câu này khác nhau ở đâu? Em thử tìm trước khi xem lời giải.</p><div className="book-compare"><div><small>CHƯA ĐÚNG</small><p lang="en">{mistake.wrong}</p></div><div><small>CÁCH VIẾT ĐÚNG</small><p lang="en">{mistake.right}</p><AudioButton text={mistake.right}/></div></div><details className="book-reveal"><summary>Xem vì sao</summary><p>{mistake.why}</p></details></>}
        {page.kind==='tips'&&<><ul className="book-tips">{content.theory?.tips.map(tip=><li key={tip}>{tip}</li>)}</ul><IrregularVerbs content={content}/><Link className="en-button" to={`/english/practice?level=${content.level}`}>Thử điều vừa học <ArrowRight size={17}/></Link></>}
        {page.kind==='letters'&&<><p>Chữ hoa và chữ thường là một cặp. Chạm loa rồi đọc cùng nhé.</p><div className="book-alphabet">{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].slice(page.index!*7,page.index!*7+7).map(letter=><div key={letter}><strong>{letter}<em>{letter.toLowerCase()}</em></strong><AudioButton text={letter}/></div>)}</div></>}
        {page.kind==='phrases'&&<div className="book-phrases">{content.phrases.slice(page.index!*4,page.index!*4+4).map(phrase=><article key={phrase.id}><span>{phrase.image}</span><div><h2 lang="en">{phrase.en}</h2><p>{phrase.vi}</p></div><AudioButton text={phrase.audioHint}/></article>)}</div>}
      </div>
      <footer className="book-page-footer"><button className="en-text-link" disabled={!ready||saving||read} onClick={async()=>{setSaving(true);await save({id:readId,level:content.level,page:page.id,version:content.version});setSaving(false);}}><Check size={16}/>{read?'Đã đọc trang này':saving?'Đang lưu…':'Đánh dấu đã đọc'}</button><span>{String(index+1).padStart(2,'0')} / {pages.length}</span></footer>
    <nav className="book-pagination" aria-label="Lật trang"><button className="en-secondary" disabled={index===0} onClick={()=>turn(index-1)}><ArrowLeft size={18}/>Trang trước</button><span>CHƯƠNG {content.level} · {index+1} / {pages.length}</span>{index<pages.length-1?<button className="en-button" onClick={()=>turn(index+1)}>Trang tiếp <ArrowRight size={18}/></button>:<Link className="en-button" to={`/english/practice?level=${content.level}`}>Luyện tập <PencilLine size={18}/></Link>}</nav>
    </div><aside className="book-paper book-margin"><span className="en-eyebrow">DẤU TRANG</span><h2>{LEVEL_STORIES[content.level]}</h2><label>Trang trong chương<select aria-label="Trang trong chương" value={page.id} onChange={e=>setParams({page:e.target.value})}>{pages.map((p,i)=><option value={p.id} key={p.id}>{i+1}. {p.title}</option>)}</select></label><p className="en-small">Đã đọc {readCount}/{pages.length} trang</p><progress value={readCount} max={pages.length} aria-label="Số trang đã đọc"/><ChapterProgress student={student} level={content.level}/><Link className="en-text-link" to={`/english/vocabulary?level=${content.level}`}>Từ vựng của chương <ArrowRight size={16}/></Link>{error&&<p className="en-notice en-error" role="alert">{error}</p>}</aside></section></div>

  </>;
}

function ChapterSelect({level}:{level:Level}) {
  const navigate=useNavigate();
  return <select aria-label="Chuyển chương" value={level} onChange={e=>navigate('/english/learn/'+e.target.value)}>{LEVELS.map(l=><option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}</select>;
}

export function PracticeDesk({student}:{student:StudentProfile}) {
  const [drafts,setDrafts]=useState<EnglishSession[]>([]),[error,setError]=useState('');
  useEffect(()=>{let active=true;listSessions(student.id).then(rows=>{if(active)setDrafts(rows.filter(s=>s.status==='draft'&&Date.now()-Date.parse(s.startedAt)<30*86400000));}).catch(()=>{if(active)setError('Chưa tải được bài đang làm.');});return()=>{active=false;};},[student.id]);
  const due=student.englishProgress?.reviewItems.filter(e=>e.nextReviewAt<=new Date().toISOString()).length||0;
  return <section className="book-desk"><header><span className="en-eyebrow">BÀN ÔN LUYỆN</span><h1>Biến điều vừa đọc<br/><em>thành điều em nhớ.</em></h1><p>Vào bài ngay tại đây. Chọn chương trong bước tiếp theo để luyện riêng hoặc trộn nhiều chủ đề.</p></header><div className="book-practice-paths">{[
    ['/english/practice','01','Luyện theo chủ đề','Điền từ, xếp câu, chia động từ và nhiều cách thử khác.'],
    ['/english/review','02',`Ôn đến hạn · ${due} câu`,'Gặp lại câu từng sai, theo lịch ôn của riêng em.'],
    ['/english/test','03','Kiểm tra kiến thức','Tự làm một bài rồi xem kết quả và lời giải.'],
    ['/english/parent','04','Nhờ AI ra bài mới','Chọn kiến thức, tạo câu hỏi và duyệt trước khi luyện.'],
  ].map(([url,no,title,description])=><Link to={url} key={url}><span>{no}</span><div><h2>{title}</h2><p>{description}</p></div><ArrowRight size={21}/></Link>)}</div>
  {error&&<p role="alert">{error}</p>}{drafts.length>0&&<section className="book-recent"><h2>Bài đang làm</h2>{drafts.slice(0,5).map(s=><Link key={s.id} to={`/english/${s.mode}?session=${s.id}`}><span>{LEVEL_NAMES[s.level]}<small>{Object.values(s.responses).filter(r=>r.attempts>0||(Array.isArray(r.answer)?r.answer.length:r.answer.trim())).length}/{s.exercises.length} câu đã trả lời</small></span><ArrowRight size={17}/></Link>)}</section>}
  <section className="book-recent"><h2>Những lần em đã thử</h2>{student.englishProgress?.recentSessions.length?student.englishProgress.recentSessions.slice(0,5).map(s=><Link key={s.id} to={`/english/result/${s.id}`}><span>{LEVEL_NAMES[s.level]}<small>{new Date(s.date).toLocaleDateString('vi-VN')} · {s.mode==='test'?'Kiểm tra':s.mode==='review'?'Ôn lại':s.mode==='placement'?'Gợi ý điểm bắt đầu':'Luyện tập'}</small></span><strong>{s.score}/{s.total}</strong></Link>):<p>Bài đầu tiên của em sẽ được lưu ở đây.</p>}</section></section>;
}
