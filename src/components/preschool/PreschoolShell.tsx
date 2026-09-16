import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, AudioLines, BookOpen, ChevronRight, Leaf, Palette, Sparkles, Volume2 } from 'lucide-react';
import { HubShell } from '../hub/HubShell';
import { SpeakButton } from '../shared/SpeakButton';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';
import { activityFor, activityThumbnail, preschoolArt, PRESCHOOL_TOPICS, topicFor, type PreschoolTopic } from './catalog';
import './preschool-menu.css';
import { CountingProgressStrip } from './counting/CountingAdventure';

function ActivityHub({ topic, onPick }: { topic: PreschoolTopic; onPick: (id: string) => void }) {
    const data = topicFor(topic);
    return <section className="ps-activities" aria-labelledby="ps-activities-title">
        <div className="ps-section-heading"><div><span className="hub-eyebrow">CHỌN MỘT ĐIỀU THÚ VỊ</span><h2 id="ps-activities-title">Hôm nay bé muốn thử gì?</h2></div><span className="ps-listen-tip"><Volume2 size={17}/>Chạm loa để nghe tên</span></div>
        <div className="ps-activity-grid">
            {data.activities.map((item, index) => <article className="ps-activity-card" key={item.id}>
                <button className="ps-activity-open" id={'preschool-' + topic + '-' + item.id} aria-label={item.title} onClick={() => onPick(item.id)}>
                    <span className="ps-activity-cover"><img src={activityThumbnail(topic, item.id)} width={720} height={480} alt={item.title} loading="lazy" decoding="async"/></span>
                    <span className="ps-activity-copy"><span className="ps-activity-label">{String(index + 1).padStart(2, '0')} · {item.label}</span><strong>{item.title}</strong><span className="ps-activity-description">{item.desc}</span><span className="ps-card-action">{item.id === 'learn' ? 'Cùng khám phá' : 'Cùng chơi nào'}<ArrowRight size={16}/></span></span>
                </button>
                <div className="ps-card-speaker"><SpeakButton text={item.title} title={'Nghe tên: ' + item.title} lang="vi-VN" size={24}/></div>
            </article>)}
        </div>
    </section>;
}

interface PreschoolShellProps {
    topic: PreschoolTopic;
    activity: string | null;
    onPick: (id: string) => void;
    onBack: () => void;
    children: React.ReactNode;
}
export function PreschoolShell({ topic, activity, onPick, onBack, children }: PreschoolShellProps) {
    const navigate = useNavigate(), { currentStudent } = useStudent(), { setStudent } = useStudentActions();
    const data = topicFor(topic), selected = activityFor(topic, activity);
    return <div className={'preschool-shell ps-topic-' + topic}>
        <HubShell student={currentStudent} section={data.title} backText backLabel={selected ? 'Về ' + data.shortTitle : 'Về khám phá'} onBack={selected ? onBack : () => navigate('/mode')} onProfile={() => navigate('/profile')} onShop={() => navigate('/shop')} onLogout={() => { setStudent(null); navigate('/'); }}>
            <main className={selected ? 'ps-main ps-playing' : 'ps-main'}>
                <nav className="ps-breadcrumb" aria-label="Đường dẫn"><Link to="/mode">Khám phá</Link><ChevronRight size={13}/>{selected ? <><button onClick={onBack}>{data.title}</button><ChevronRight size={13}/><span aria-current="page">{selected.title}</span></> : <span aria-current="page">{data.title}</span>}</nav>
                {!selected ? <>
                    <nav className="ps-topic-nav" aria-label="Chủ đề mầm non">{PRESCHOOL_TOPICS.map(item => <NavLink to={'/preschool/' + item.id} key={item.id} className={({ isActive }) => isActive ? 'active' : ''}><span aria-hidden="true">{item.id === 'alphabet' ? <BookOpen size={18}/> : item.id === 'counting' ? <span className="ps-tab-number">123</span> : <Palette size={18}/>}</span>{item.title}</NavLink>)}</nav>
                    <section className="ps-hero" aria-labelledby="preschool-title">
                        <div className="ps-hero-copy"><span className="hub-eyebrow"><Leaf size={14}/> MẦM NON · HỌC QUA KHÁM PHÁ</span><h1 id="preschool-title" tabIndex={-1}>{data.headline}</h1><p>{data.description}</p><div className="ps-hero-tags"><span><Sparkles size={15}/>{data.activities.length} hoạt động</span><span><AudioLines size={15}/>Có hướng dẫn bằng giọng nói</span></div><small>{data.note}</small></div>
                        <div className="ps-hero-picture"><img src={preschoolArt(topic)} srcSet={preschoolArt(topic, true) + ' 400w, ' + preschoolArt(topic) + ' 1200w'} sizes="(max-width: 640px) 100vw, 50vw" width={1200} height={675} alt={data.imageAlt} fetchPriority="high"/><span className="ps-picture-note"><Sparkles size={15}/>Mỗi ngày, một khám phá nhỏ</span></div>
                    </section>
                    {topic==='counting'&&<CountingProgressStrip/>}
                    <ActivityHub topic={topic} onPick={onPick}/>
                    <footer className="ps-footer"><Leaf size={15}/>Cứ thong thả. Bé có thể thử lại bất cứ lúc nào.</footer>
                </> : <>
                    <div className="ps-play-heading"><div><span className="hub-eyebrow">{data.title} · {selected.label}</span><h1 id="preschool-title" tabIndex={-1}>{selected.title}</h1><p>{selected.desc}</p></div>{topic!=='counting'&&<SpeakButton text={selected.title + '. ' + selected.desc} title="Nghe hướng dẫn hoạt động" size={24}/>}</div>
                    <div className="preschool-play" key={topic + '-' + activity}>{children}</div>
                </>}
            </main>
        </HubShell>
    </div>;
}
