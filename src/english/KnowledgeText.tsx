import React from 'react';
import { questionAnswers, type QuestionAnswer } from './dialogue';

function partStyle(part: string) {
  if (/^(S|Subject|chủ ngữ|đại từ)$/i.test(part.trim())) return 'subject';
  if (/^(V(?:\b|[-(])|am\b|is\b|are\b|was\b|were\b|to be\b|will\b|do\b|does\b|did\b|be\b|động từ)/i.test(part.trim())) return 'verb';
  if (/^(adjective|tính từ)/i.test(part.trim())) return 'adjective';
  return 'neutral';
}

function FormulaParts({ text }: { text: string }) {
  return <div className="book-formula-parts">{text.split(/\s*\+\s*/).map((part,index)=><React.Fragment key={index}>{index>0&&<span className="book-formula-plus"> + </span>}<strong className={`book-formula-part is-${partStyle(part)}`}>{part}</strong></React.Fragment>)}</div>;
}

function Dialogue({ pairs, formula = false }: { pairs: QuestionAnswer[]; formula?: boolean }) {
  const line = (text: string) => formula ? <FormulaParts text={text}/> : <p lang="en">{text}</p>;
  return <div className="book-dialogues">{pairs.map((pair, index) => <dl className="book-dialogue" key={index}>
    <div className="book-dialogue-row is-question"><dt>Câu hỏi</dt><dd>{line(pair.question)}</dd></div>
    {pair.answers.map((answer, i) => <div className={`book-dialogue-row is-${answer.kind}`} key={i}>
      <dt>{answer.kind === 'yes' ? 'Trả lời đồng ý (Yes)' : answer.kind === 'no' ? 'Trả lời phủ định (No)' : 'Câu trả lời'}</dt>
      <dd>{line(answer.text)}</dd>
    </div>)}
  </dl>)}</div>;
}

export function FormulaText({ text }: { text: string }) {
  const pairs = questionAnswers(text);
  if (pairs) return <Dialogue pairs={pairs} formula/>;
  const rows = text.split(/\s+\|\s+/);
  if (rows.length > 1) return <div className="book-formula-rows">{rows.map((row, index) => {
    const labelled = row.match(/^(Khẳng định|Phủ định|Nghi vấn):\s*(.+)$/);
    return <div className="book-formula-row" key={index}>{labelled && <span className="book-dialogue-label">{labelled[1]}</span>}<FormulaParts text={labelled ? labelled[2] : row}/></div>;
  })}</div>;
  return <FormulaParts text={text}/>;
}

export function ExampleText({ text }: { text: string }) {
  const pairs = questionAnswers(text);
  if (pairs) return <Dialogue pairs={pairs}/>;
  return <div className="book-example-lines">{text.split(/\n+|(?<=[.!?])\s+\/\s+/).map((line, index) => <p lang="en" key={index}>{line}</p>)}</div>;
}

// Format reviewed text only. Unknown prose remains intact, never rewritten as a rule.
export function KnowledgeText({ body }: { body: string }) {
  return <div className="book-body">{body.split('\n').filter(Boolean).map((line,index)=>{
    const bullet=line.startsWith('- '),text=bullet?line.slice(2):line;
    const colon=text.indexOf(':');
    const label=colon>=0?text.slice(0,colon):'';
    const value=colon>=0?text.slice(colon+1).trim():text;
    // Explicit formula bullets: separate the bracketed explanation from the pattern.
    if(bullet&&colon>=0&&value.split(' (')[0].includes('+')&&!label.includes('+')) {
      const noteStart=value.indexOf(' (');
      const formula=noteStart>=0?value.slice(0,noteStart):value;
      const note=noteStart>=0?value.slice(noteStart+1):'';
      return <section className="book-knowledge-rule" key={index}><h2>{label}</h2><FormulaText text={formula}/>{note&&<p className="book-rule-note"><strong>Lưu ý</strong>{note.replace(/^\(|\)\.$/g,'')}</p>}</section>;
    }
    // Question-word patterns and their meaning: HOW MANY + ... : ...
    if(bullet&&colon>=0&&label.includes('+')) return <section className="book-knowledge-rule" key={index}><FormulaText text={label}/><p className="book-rule-note">{value}</p></section>;
    const bracketed=bullet?text.match(/^(.*?)\(([^()]*\+[^()]*)\)(\.?)(.*)$/):null;
    if(bracketed)return <section className="book-knowledge-rule" key={index}><p>{bracketed[1].trim()}</p><FormulaText text={bracketed[2]}/>{bracketed[4]&&<p>{bracketed[4]}</p>}</section>;
    // A formula explicitly introduced inline in the reviewed explanation.
    const inline=text.match(/^(.*?(?:Cấu trúc cơ bản:|Công thức luôn là:|dùng ))((?:am\/is\/are|Do\/Does|will)\s*\+[^.]+)(\..*)?$/);
    if(inline) return <section className="book-inline-rule" key={index}><p>{inline[1]}</p><FormulaText text={inline[2]}/>{inline[3]&&inline[3]!=='.'&&<p>{inline[3].replace(/^\.\s*/,'')}</p>}</section>;
    if(bullet) return <div className="book-knowledge-bullet" key={index}><span aria-hidden="true">•</span><p>{colon>=0?<><strong>{label}:</strong> {value}</>:text}</p></div>;
    return <p key={index}>{line}</p>;
  })}</div>;
}
