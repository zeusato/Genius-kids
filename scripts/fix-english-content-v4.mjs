// Apply reviewed corrections to the latest files, then save only changed fields
// in a generator overlay. Concurrent edits are detected before any content write.
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { reviewedC3Passages } from './english-c3-passages-reviewed.mjs';
import { validateContent } from '../src/english/validation.mjs';
import { generateInMemory } from './english-review-generator.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'src/data/english');
const raw={},before={},data={};
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){raw[file]=fs.readFileSync(path.join(dir,file),'utf8');before[file]=JSON.parse(raw[file]);data[file]=structuredClone(before[file]);}
const list=(l,k='sentences')=>data[`${l}.${k}.json`];
const get=(l,n,k='sentences')=>list(l,k).find(s=>+s.id.slice(-4)===n);
const noRoles=s=>{s.exerciseTypes=s.exerciseTypes.filter(x=>x!=='roles');};
const originalDifficulty=Object.fromEntries(['C1','C2'].flatMap(l=>generateInMemory(`build-${l.toLowerCase()}-full.mjs`,{finalReview:false}).get(`${l}.sentences.json`).map(s=>[s.id,s.difficulty])));
const detokenize=t=>t.map(t=>t.text).join(' ').replace(/\s+([,.!?;:])/g,'$1');
// Replace token ranges while preserving every surviving index reference.
function editTokens(s,replacements){
  const map=new Map(),out=[];
  s.tokens.forEach((t,i)=>{const replacement=replacements[i]??[t];map.set(i,replacement.map((_,j)=>out.length+j));out.push(...replacement);});
  s.roleSpans=s.roleSpans.map(r=>({...r,tokenIndices:r.tokenIndices.flatMap(i=>map.get(i))})).filter(r=>r.tokenIndices.length);
  s.blanks=s.blanks.map(b=>{const indices=map.get(b.tokenIndex);if(!indices.length)throw new Error(`${s.id}: removed blank`);const tokenIndex=indices[0];return {...b,tokenIndex,answer:out[tokenIndex].text};});
  s.tokens=out;s.en=detokenize(out);delete s.orderAlternatives;
}
const verb=(text,lemma,feature)=>({text,pos:'verb',role:'verb',lemma,feature});
const token=(text,pos,role,lemma,feature)=>({text,pos,role,...(lemma?{lemma}:{}),...(feature?{feature}:{})});

// R01 / R02 / R03: narrowly targeted semantics, no grader relaxation.
for(const f of Object.keys(data).filter(f=>f.endsWith('.sentences.json')))for(const s of data[f]){
  if(/\bright now[.?]$/.test(s.en)){
    const rest=(s.en.startsWith('I ')?s.en:s.en[0].toLowerCase()+s.en.slice(1)).replace(/ right now([.?])$/,'$1');
    s.orderAlternatives=[...new Set([...(s.orderAlternatives||[]).filter(a=>!/^Now .* right[.?]$/.test(a)),`Right now ${rest}`])];
  }
  if(s.orderAlternatives)s.orderAlternatives=s.orderAlternatives.map(a=>a.replace(/^Sometimes (She|He|They|We)\b/,(_,p)=>`Sometimes ${p.toLowerCase()}`).replace(/\bmr\. Brown/g,'Mr. Brown'));
  for(const b of s.blanks)if(b.alt?.some(a=>/\snot\b/.test(a)))b.promptVi=b.promptVi.replace(/ dạng viết tắt| viết tắt| dạng rút gọn| rút gọn/g,'');
  const targets=s.roleSpans.map(r=>r.clauseId+'/'+r.role);
  if(new Set(targets).size!==targets.length)noRoles(s);
}
for(const n of [4,10,62,152,171,187])noRoles(get('C1',n));
for(const [n,word]of [[68,'up'],[125,'not'],[129,'not'],[195,'up']]){
  const s=get('C1',n),i=s.tokens.findIndex(t=>t.text===word),r=s.roleSpans.find(r=>r.role==='verb');
  r.tokenIndices=[...new Set([...r.tokenIndices,i])].sort((a,b)=>a-b);
  if(word==='not')s.tokens[i].role='verb';
}
get('C1',194).roleSpans.find(r=>r.role==='subject').tokenIndices=[2,3,4,5,6];
for(const s of list('C1')){
  for(let i=0;i<s.tokens.length;i++){
    const t=s.tokens[i];
    if(t.pos==='preposition'){
      t.role='prep';
      for(let j=i+1;j<s.tokens.length;j++){
        const next=s.tokens[j];if(['punct','verb','preposition','conjunction'].includes(next.pos))break;
        if(['noun','pronoun'].includes(next.pos)&&next.role==='adverbial')next.role='prep-object';
      }
    }
    if(['last','next'].includes(t.text.toLowerCase())&&s.tokens[i+1]?.pos==='noun'){t.pos='adjective';t.role='modifier';}
  }
  if([53,54,105,127,149,155].includes(+s.id.slice(-4)))for(const t of s.tokens)if(t.lemma==='be')t.feature='past';
}
// Replace unsupported structures with already taught tenses.
for(const [n,word,lemma,feature,vi]of [
 [60,'do','do','aux-present-other','Tôi tìm thấy nước ở đâu?'],
 [109,'will','will','aux-future','Ai sẽ hát bài hát này?'],
 [150,'do','do','aux-present-other','Tôi giải bài toán này như thế nào?'],
 [165,'do','do','aux-present-other','Bạn nhìn thấy bao nhiêu chiếc ô tô trên đường?'],
]){const s=get('C1',n),i=s.tokens.findIndex(t=>t.text==='can');if(i>=0)editTokens(s,{[i]:[verb(word,lemma,feature)]});s.vi=vi;}
{const s=get('C1',183),i=s.tokens.findIndex(t=>t.text==='parked');if(i>=0)editTokens(s,{[i]:[]});s.tokens.find(t=>t.text==='is').feature='present-3sg';s.vi='Chiếc xe đạp ở bên ngoài là của ai?';}

// Hard questions have a genuinely expanded subject; retain the original tense,
// question goal and ID, rather than merely changing difficulty labels.
const expandedQuestions=[
 [5,'children','beside','blue','gate','Những đứa trẻ cạnh cổng xanh đang làm gì bây giờ?'],
 [6,'boy','near','open','window','Cậu bé gần cửa sổ mở đang đọc gì?'],
 [7,'students','inside','small','classroom','Những học sinh trong phòng học nhỏ đã ăn gì hôm qua?'],
 [8,'woman','beside','fruit','stall','Người phụ nữ cạnh quầy trái cây đã mua gì ở chợ?'],
 [9,'children','near','school','gate','Những đứa trẻ gần cổng trường sẽ làm gì ngày mai?'],
 [17,'boy','beside','tall','tree','Cậu bé cạnh cây cao đã thấy gì ở sở thú?'],
 [18,'parents','inside','large','kitchen','Những phụ huynh trong bếp lớn đang nấu món gì cho bữa tối?'],
 [21,'man','near','bus','stop','Người đàn ông gần trạm xe buýt đã nói gì với bạn?'],
 [26,'woman','inside','small','house','Người phụ nữ trong ngôi nhà nhỏ đang nấu gì?'],
 [27,'students','beside','music','room','Những học sinh cạnh phòng nhạc đã học gì hôm nay?'],
 [28,'children','near','wooden','bridge','Những đứa trẻ gần cầu gỗ đang chơi gì?'],
 [30,'students','inside','art','room','Những học sinh trong phòng mỹ thuật đã vẽ gì lên giấy?'],
 [33,'children','beside','red','bus','Những đứa trẻ cạnh xe buýt đỏ đã mang gì đến trường hôm nay?'],
 [34,'parents','near','village','market','Những phụ huynh gần chợ làng sẽ mua gì sáng mai?'],
 [35,'bird','beside','small','nest','Con chim cạnh chiếc tổ nhỏ đang làm gì trên cây?'],
 [40,'teachers','inside','music','room','Những giáo viên trong phòng nhạc sẽ gặp nhau ở đâu ngày mai?'],
 [43,'girl','beside','clothes','shop','Cô bé cạnh cửa hàng quần áo đã mua chiếc váy đó ở đâu?'],
 [44,'children','behind','yellow','house','Những đứa trẻ sau ngôi nhà vàng đang chơi ở đâu?'],
 [46,'students','near','classroom','door','Những học sinh gần cửa lớp đã đặt bút chì của tôi ở đâu?'],
 [47,'visitors','beside','hotel','entrance','Những du khách cạnh lối vào khách sạn sẽ ở đâu tại Hà Nội?'],
 [49,'families','near','train','station','Những gia đình gần ga tàu đang đi nghỉ ở đâu?'],
 [50,'boy','behind','garden','fence','Cậu bé sau hàng rào vườn đã tìm thấy chìa khóa ở đâu?'],
 [52,'students','beside','school','library','Những học sinh cạnh thư viện trường thường chơi bóng đá ở đâu?'],
 [53,'boy','near','village','pond','Cậu bé gần ao làng đã ở đâu sáng hôm qua?'],
 [54,'children','inside','green','tent','Những đứa trẻ trong lều xanh đã ở đâu tối qua?'],
 [56,'teachers','near','city','museum','Những giáo viên gần bảo tàng thành phố đã nghỉ cuối tuần ở đâu?'],
 [58,'birds','above','village','pond','Những con chim phía trên ao làng bay đi đâu vào mùa đông?'],
 [59,'children','behind','classroom','door','Những đứa trẻ sau cửa lớp đã để giày ở đâu?'],
 [63,'woman','near','flower','shop','Người phụ nữ gần cửa hàng hoa đã đi nghỉ ở đâu?'],
 [64,'band','beside','school','stage','Ban nhạc cạnh sân khấu trường sẽ chơi ở đâu ngày mai?'],
 [69,'guests','near','hotel','desk','Những vị khách gần quầy khách sạn đã đến khi nào?'],
 [70,'train','beside','station','platform','Chuyến tàu cạnh sân ga sẽ đến khi nào?'],
 [71,'parents','inside','yellow','house','Những phụ huynh trong ngôi nhà vàng đã mua chiếc xe này khi nào?'],
 [73,'children','inside','quiet','library','Những đứa trẻ trong thư viện yên tĩnh làm bài tập khi nào?'],
 [74,'girl','near','classroom','window','Cô bé gần cửa sổ lớp đã làm xong bài tập khi nào?'],
 [75,'children','beside','red','gate','Những đứa trẻ cạnh cổng đỏ sẽ thăm ông bà khi nào?'],
 [77,'students','inside','school','dormitory','Những học sinh trong ký túc xá trường đã dọn phòng khi nào?'],
];
const pluralHeads=new Set(['children','students','parents','teachers','visitors','families','birds','guests']);
for(const [n,head,prep,modifier,object,vi]of expandedQuestions){
 const s=get('C1',n);if(s.tags.includes('expanded-subject-v4'))continue;
 const span=s.roleSpans.find(r=>r.role==='subject');
 const plural=pluralHeads.has(head),lemma={children:'child',families:'family'}[head]||(plural?head.slice(0,-1):head);
 const compoundNouns=new Set(['fruit','school','bus','music','art','village','clothes','classroom','hotel','train','garden','city','flower','station']);
 const replacement=[token('the','article','det'),token(head,'noun','subject',lemma,plural?'pl':'sg'),token(prep,'preposition','prep'),token('the','article','det'),token(modifier,compoundNouns.has(modifier)?'noun':'adjective','modifier',compoundNouns.has(modifier)?modifier:undefined,compoundNouns.has(modifier)?'sg':undefined),token(object,'noun','prep-object',object,'sg')];
 const changes=Object.fromEntries(span.tokenIndices.map((idx,i)=>[idx,i===0?replacement:[]]));
 editTokens(s,changes);s.vi=vi;s.difficulty=3;s.tags.push('expanded-subject-v4');
}
// Simple, short questions and one-clause location statements are genuinely
// introductory items. Avoid forcing exact quotas by reclassifying long rows.
for(const n of [56,59,73,77]){const s=get('C1',n);for(const t of s.tokens)if(t.text==='your')t.text='their';s.en=detokenize(s.tokens);}
{const s=get('C1',75),i=s.tokens.findIndex(t=>t.text==='grandparents');if(s.tokens[i-1]?.text!=='their')editTokens(s,{[i]:[token('their','determiner','det'),s.tokens[i]]});}
for(const s of list('C1')){
 const n=+s.id.slice(-4);s.difficulty=s.tags.includes('expanded-subject-v4')?3:originalDifficulty[s.id];
 if([11,13,22,23,24,76,78,88,97,98,99,100,103,107,108,110,113,114,124,127,128,132,156].includes(n))s.difficulty=1;
 if([15,81,150,166,170,200].includes(n))s.difficulty=2;
}

for(const s of list('C2')){
  const replacement={};
  s.tokens.forEach((t,i)=>{
    if(t.text==='in front of')replacement[i]=[token('in','preposition','prep'),token('front','noun','prep-object','front','sg'),token('of','preposition','prep')];
    if(t.text==='next to')replacement[i]=[token('next','adjective','modifier'),token('to','preposition','prep')];
    if(t.text==='out of')replacement[i]=[token('out','adverb','adverbial'),token('of','preposition','prep')];
  });
  if(Object.keys(replacement).length){editTokens(s,replacement);s.exerciseTypes=s.exerciseTypes.filter(t=>t!=='pos');s.tags=[...new Set([...s.tags,'complex-preposition'])];
    // Test a single fixed component; other choices such as beside cannot fit this blank.
    const b=s.blanks[0];if(s.tokens[b.tokenIndex].text==='next'){b.tokenIndex++;b.answer='to';}delete b.alt;
  }
  for(const t of s.tokens)if(t.text==='not'){t.pos='adverb';t.role='verb';}
}
for(const [n,word]of [[126,'until'],[149,'before']]){const t=get('C2',n).tokens.find(t=>t.text===word);t.pos='conjunction';t.role='conj';}
{const s=get('C2',100),i=s.tokens.findIndex(t=>t.text==='Year');if(i>=0)editTokens(s,{[i]:[{...s.tokens[i],text:"Year's",pos:'determiner',role:'det',lemma:'year',feature:'sg'}]});}
get('C2',30).vi='Nấm mọc dưới những chiếc lá rụng ẩm.';
get('C2',162).vi='Cậu ấy xếp đồ vào cặp rồi họ lên đường đến trường.';
get('C2',67).vi='Nhiệt độ đã hạ xuống dưới nhiệt độ đóng băng.';
get('C2',123).vi='Họ đã đi du lịch trong kỳ nghỉ hè.';
get('C2',127).vi='Em bé đã ngủ yên trong chuyến bay.';
for(const [n,from,to,lemma,feature,vi]of [
 [56,'Can','Do','do','aux-present-other','Bạn có giữ thước kẻ giữa các ngón tay không?'],
 [172,'could','did','do','aux-past','Tôi đã tìm khắp nơi nhưng không tìm thấy bút của mình.'],
 [177,'can','will','will','aux-future','Bạn sẽ đi xe buýt hoặc đi bộ.'],
 [178,'Would','Do','do','aux-present-other','Bạn thích táo hay cam?'],
]){const s=get('C2',n),i=s.tokens.findIndex(t=>t.text===from);if(i>=0)editTokens(s,{[i]:[verb(to,lemma,feature)]});s.vi=vi;}
{const s=get('C2',178),i=s.tokens.findIndex(t=>t.text==='like');if(i>=0)editTokens(s,{[i]:[verb('want','want','base')]});s.vi='Bạn muốn một quả táo hay một quả cam?';}
for(const [n,vi]of [[87,'Em trai tôi đến vào năm 2015.'],[96,'Cậu ấy đến vào ngày 10 tháng 10.']]){
  const s=get('C2',n),i=s.tokens.findIndex(t=>t.text==='born');if(i>=0)editTokens(s,{[i-1]:[],[i]:[verb('arrived','arrive','past')]});s.vi=vi;
}
{const s=get('C2',185);if(s.tokens[0].text==='You'){
 const t=s.tokens.findIndex(t=>t.text==='teacher');editTokens(s,{0:[],1:[],2:[verb('Finish','finish','base')],[t]:[token('the','article','det'),s.tokens[t]]});
 s.vi='Hãy làm xong bài tập của em, nếu không cô giáo sẽ giận.';
}}
{const s=get('C2',186),i=s.tokens.findIndex(t=>t.text==='raining');if(i>=0)editTokens(s,{[i-1]:[],[i]:[verb('rained','rain','past')]});s.vi='Trời đã mưa nên chúng tôi ở nhà.';}
{const s=get('C2',201),i=s.tokens.findIndex(t=>t.text==='can');if(i>=0)editTokens(s,{[i]:[],[i+1]:[],[i+2]:[verb('swim','swim','present-other')]});s.vi='Chúng tôi thích mùa hè vì chúng tôi đi bơi.';}
for(const s of list('C2')){
 s.difficulty=originalDifficulty[s.id];
 if([3,4,8,11,12,13,14,18,21,22,26,27,28,33,35,49,54,60,61,62,66,70,71,76,82,83,85,86,95,97,101,112,121].includes(+s.id.slice(-4)))s.difficulty=1;
 for(const t of s.tokens)if(t.pos==='preposition')t.role='prep';
}
for(const [n,words,vi]of [
 [50,[token('I','pronoun','subject'),verb("won't",'will','aux-future-neg'),verb('go','go','base'),token('out','adverb','adverbial'),token('tomorrow','adverb','adverbial'),token('.','punct','punct')],'Ngày mai tôi sẽ không ra ngoài.'],
 [72,[token('She','pronoun','subject'),verb("won't",'will','aux-future-neg'),verb('eat','eat','base'),token('dinner','noun','object','dinner','uncountable'),token('tonight','adverb','adverbial'),token('.','punct','punct')],'Tối nay cô ấy sẽ không ăn tối.'],
]){const s=get('B4',n);s.tokens=words;s.en=detokenize(words);s.vi=vi;noRoles(s);s.roleSpans=[{clauseId:'c1',role:'subject',tokenIndices:[0]},{clauseId:'c1',role:'verb',tokenIndices:[1,2]},{clauseId:'c1',role:n===50?'adverbial':'object',tokenIndices:n===50?[3,4]:[3]},...(n===72?[{clauseId:'c1',role:'adverbial',tokenIndices:[4]}]:[])];s.blanks=[{tokenIndex:1,answer:"won't",alt:['will not'],promptVi:'Điền trợ động từ phủ định ở thì tương lai đơn.',hint:'will + not'}];s.orderAlternatives=[`${n===50?'Tomorrow I':'Tonight she'} ${s.en.slice(s.en.indexOf(' ')+1).replace(/ (tomorrow|tonight)\.$/,'.')}`];s.tags=s.tags.filter(t=>!t.includes('conditional'));}

// R06: meaning-based, bounded choice pools. Prompts contain alternatives, never
// a single dictated answer; VI establishes the intended spatial/logical relation.
for(const s of list('C1'))for(const b of s.blanks){
  const a=b.answer.toLowerCase();
  b.promptVi=`Điền một từ để hoàn thành câu hỏi theo nghĩa: “${s.vi}”`;
  if(['which','what'].includes(a)&&!/^What (is|will).*like/.test(s.en)){
    // What/which overlap without a bounded referent. Accept the valid alternative
    // only for noun-selection questions, not "What is your name?".
    const next=s.tokens[b.tokenIndex+1];
    if(next&&['noun','adjective'].includes(next.pos)&&!['time'].includes(next.text.toLowerCase()))b.alt=[...new Set([...(b.alt||[]),a==='which'?'What':'Which'])];
  }
  if(a==='which')b.promptVi+=' Ngữ cảnh: đang chọn trong những lựa chọn đã được đưa ra.';
}
const prepAlt={beside:['by'],by:['beside'],near:[],inside:['in'],in:['inside'],outside:[],under:['below'],above:['over']};
for(const s of list('C2'))for(const b of s.blanks){
  const t=s.tokens[b.tokenIndex];
  const complex=s.tags.includes('complex-preposition');
  if(complex){b.promptVi=`Điền một từ vào cụm giới từ còn thiếu theo nghĩa: “${s.vi}”`;continue;}
  // The translation fixes the intended relation; preserve only context-reviewed
  // variants for physical locations, not time or fixed expressions.
  const isPlace=s.grammarPoint==='preposition-place';
  if(!isPlace&&b.alt)b.alt=b.alt.filter(a=>a!=='inside');
  if(isPlace&&prepAlt[b.answer.toLowerCase()])b.alt=[...new Set([...(b.alt||[]),...prepAlt[b.answer.toLowerCase()]])];
  if([123,133].includes(+s.id.slice(-4)))b.alt=[...new Set([...(b.alt||[]),'in'])];
  const distractors=t.pos==='conjunction'?['and','but','or','so','because']:b.answer.toLowerCase()==='at'&&isPlace?['above','under','behind','in']:['in','on','at','under','behind'];
  const candidates=[b.answer,...(b.alt||[]),...distractors];
  const pool=candidates.filter((c,i)=>candidates.findIndex(x=>x.toLowerCase()===c.toLowerCase())===i).slice(0,4);
  for(let i=0;i<+s.id.slice(-4)%4;i++)pool.push(pool.shift());
  b.promptVi=`Chọn một từ trong nhóm [${pool.join(' / ')}] theo nghĩa: “${s.vi}”`;
}

// Vocab repairs (examples, forms and POS stay aligned).
function vocab(l,n,patch){Object.assign(get(l,n,'vocab'),patch);}
vocab('C1',87,{pos:'adverb'});vocab('C1',101,{pos:'adverb'});
vocab('C1',29,{exampleEn:'Which country do you live in?',exampleVi:'Bạn sống ở quốc gia nào?'});
vocab('C1',50,{exampleEn:'Where is the nearest park?',exampleVi:'Công viên gần nhất ở đâu?'});
vocab('C1',51,{exampleEn:'When does the library open?',exampleVi:'Thư viện mở cửa khi nào?'});
vocab('C1',42,{vi:'cha hoặc mẹ; phụ huynh'});
vocab('C1',33,{exampleEn:'Who asked this question?',exampleVi:'Ai đã hỏi câu hỏi này?'});
vocab('C1',55,{exampleEn:'What did she tell you?',exampleVi:'Cô ấy đã nói gì với bạn?'});
vocab('C1',76,{exampleEn:'What do you want to drink?',exampleVi:'Bạn muốn uống gì?'});
vocab('C1',101,{exampleEn:'How fast does he run?',exampleVi:'Cậu ấy chạy nhanh đến mức nào?'});
vocab('C2',82,{exampleEn:'My birthday is this month.',exampleVi:'Sinh nhật tôi vào tháng này.'});
// Preserve the since headword by replacing its advanced example with a noun
// phrase complement inside a subject (no present perfect needed).
vocab('C2',25,{exampleEn:'The first rain since Monday fell today.',exampleVi:'Cơn mưa đầu tiên kể từ thứ Hai đã rơi hôm nay.'});
vocab('C2',7,{vi:'ở giữa các đối tượng phân biệt rõ'});
vocab('C3',27,{exampleEn:'Big and small have opposite meanings.',exampleVi:'Big và small có nghĩa trái ngược nhau.'});
vocab('C3',62,{exampleEn:'Which musical instrument do you play?',exampleVi:'Bạn chơi nhạc cụ nào?'});
vocab('C3',96,{exampleEn:'We protect the trees in our garden.',exampleVi:'Chúng tôi bảo vệ những cây trong vườn.'});
vocab('C3',103,{exampleEn:'Please describe your pet dog.',exampleVi:'Hãy miêu tả chú chó cưng của bạn.'});
{const v=get('C3',78,'vocab');v.exampleEn=v.exampleEn.replace('its mother pouch',"its mother's pouch");}
{const v=get('C3',80,'vocab');v.exampleVi=v.exampleVi.replace(/hạt dẻ/g,'hạt sồi');}
{const v=get('C3',101,'vocab');v.exampleEn=v.exampleEn.replace(/Teachers Day/g,"Teachers' Day");}

// K examples: natural short sentences and matching Vietnamese.
for(const [n,en,vi]of [
 [35,'I see nine apples.','Em thấy chín quả táo.'],[56,'The butterfly flies.','Con bướm bay.'],
 [72,'I eat a banana.','Em ăn một quả chuối.'],[83,'The mango is sweet.','Quả xoài ngọt.'],[84,'The strawberry is red.','Quả dâu tây màu đỏ.'],[85,'The watermelon is big.','Quả dưa hấu to.'],
 [86,'Rabbits love carrots.','Thỏ thích cà rốt.'],[102,'The train goes choo-choo.','Tàu hỏa kêu tu tu.'],
 [110,'Babies sleep peacefully.','Các em bé ngủ yên.'],[117,'Use a yellow pencil.','Hãy dùng một chiếc bút chì vàng.'],
 [119,'Please knock on the door.','Hãy gõ cửa.'],[125,'The rain goes pitter-patter.','Mưa rơi tí tách.'],
])vocab('K',n,{exampleEn:en,exampleVi:vi});
for(const p of list('K','phrases')){if(p.topic)p.tags=[...new Set([...(p.tags||[]),p.topic])];delete p.topic;}
for(const [n,patch]of [[27,{en:'This is a baby.',vi:'Đây là một em bé.'}],[33,{en:'Drink some water.',vi:'Hãy uống chút nước.'}],[47,{en:'Smile brightly.',vi:'Hãy cười thật tươi.'}],[48,{en:'A soccer ball.',vi:'Một quả bóng đá.',image:'⚽'}]])Object.assign(get('K',n,'phrases'),patch,{audioHint:patch.en});

// First five passages retain their identity; all remaining texts are individual.
const passages=list('C3','passages');
for(const p of reviewedC3Passages())passages[passages.findIndex(x=>x.id===p.id)]=p;
for(const p of passages){for(const q of p.questions)if(q.type==='tf')q.answer=q.answer.toLowerCase();p.wordCount=p.en.split(/\s+/).length;}
{const p=get('C3',2,'passages');p.en=p.en.replace('three small glass jars','small glass jars for all of us');p.vi=p.vi.replace('ba chiếc lọ thủy tinh nhỏ','những chiếc lọ thủy tinh nhỏ cho tất cả chúng tôi');p.wordCount=p.en.split(/\s+/).length;}
get('C3',3,'passages').questions.find(q=>q.type==='short').alt.push('inside a cozy tree hollow');
get('C3',4,'passages').questions.find(q=>q.type==='short').alt.push('everyone is reading quietly and attentively');
for(const p of passages)for(const q of p.questions)if(q.alt)q.alt=[...new Set(q.alt)];
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Publish an explicit source map as tags, useful for future content checks.
for(const v of list('C3','vocab')){
  if(v.en==='firework')v.forms={...v.forms,plural:'fireworks'};
  if(v.en==='sentence')v.forms={...v.forms,plural:'sentences'};
  if(v.en==='opposite meaning')v.forms={...v.forms,plural:'opposite meanings'};
  const variants=[v.en,...Object.values(v.forms||{}).filter(x=>typeof x==='string')];
  const matches=passages.filter(p=>variants.some(w=>new RegExp(`(?<![\\p{L}])${escape(w)}(?![\\p{L}])`,'iu').test(p.en))).map(p=>`passage:${p.id}`);
  if(!matches.length)throw new Error(`Missing passage source: ${v.id} ${v.en}`);
  v.tags=[...v.tags.filter(t=>!t.startsWith('passage:')),...matches];
}

// Rewrite tasks: clear directions, valid transformations, controlled scope.
const rewrite=(n,patch)=>Object.assign(get('C3',n,'rewrites'),patch);
for(const r of list('C3','rewrites')){
  const prompts={'affirm-neg':'Chuyển câu sang phủ định; giữ nguyên thì và các thông tin khác.','neg-affirm':'Chuyển câu sang khẳng định; giữ nguyên thì và các thông tin khác.','statement-question':'Chuyển thành câu hỏi Yes/No; giữ nguyên thì và ý khẳng định/phủ định.','contraction':'Viết lại câu bằng dạng rút gọn thông dụng.'};
  if(prompts[r.type])r.promptVi=prompts[r.type];
  if(r.type==='affirm-neg')r.hint='Thêm not sau be, hoặc dùng trợ động từ phủ định phù hợp; sau do/does/did là động từ nguyên thể.';
  r.hint=r.hint.replace(/will\/can/g,'will');
  if(r.type==='contraction'){
    const contractions=[['She is',"She's"],['He is',"He's"],['It is',"It's"],['They are',"They're"],['We are',"We're"],['You are',"You're"],['I am',"I'm"],['I will',"I'll"],['You will',"You'll"],['He will',"He'll"],['She will',"She'll"],['We will',"We'll"],['They will',"They'll"]];
    const pair=contractions.find(([full])=>r.promptEn.startsWith(full+' '));
    if(pair){const alt=r.promptEn.replace(pair[0],pair[1]);if(alt!==r.answer)r.alt=[...new Set([...(r.alt||[]),alt])];}
  }
}
for(const [n,promptEn,answer,alt,vi]of [
 [16,'He swims in the pool.',"He doesn't swim in the pool.",['He does not swim in the pool.'],'Cậu ấy bơi trong hồ bơi. → phủ định'],
 [17,'Children run fast.',"Children don't run fast.",['Children do not run fast.'],'Trẻ em chạy nhanh. → phủ định'],
 [51,"He doesn't sing well.",'He sings well.',[],'Cậu ấy hát không hay. → khẳng định'],
 [63,"The birds aren't singing.",'The birds are singing.',[],'Những con chim không đang hót. → khẳng định'],
 [86,'You swim in the pool.','Do you swim in the pool?',[],'Bạn bơi trong hồ bơi. → câu hỏi'],
 [100,'She plays the acoustic guitar.','Does she play the acoustic guitar?',[],'Cô ấy chơi đàn ghi-ta mộc. → câu hỏi'],
])rewrite(n,{promptEn,answer,alt,vi});
for(const [n,promptEn,from,to,answer,vi]of [
 [142,'She has a small bag.','small','little','She has a little bag.','Cô ấy có một chiếc túi nhỏ.'],
 [150,'This book is very interesting.','very interesting','fascinating','This book is fascinating.','Cuốn sách này rất thú vị.'],
 [151,'The room is tidy.','tidy','neat','The room is neat.','Căn phòng ngăn nắp.'],
 [154,'This is a large house.','large','big','This is a big house.','Đây là một ngôi nhà lớn.'],
 [155,'They arrived at school at six.','arrived at','reached','They reached school at six.','Họ đến trường lúc sáu giờ.'],
 [160,'She likes playing the piano.','likes','enjoys','She enjoys playing the piano.','Cô ấy thích chơi đàn piano.'],
])rewrite(n,{promptEn,promptVi:`Viết lại câu, thay “${from}” bằng “${to}”.`,answer,alt:[],vi:vi+' → đồng nghĩa'});
for(const [n,promptEn,phrase,answer,vi]of [
 [178,'They arrived at the airport yesterday.','Yesterday','Yesterday they arrived at the airport.','Hôm qua họ đến sân bay.'],
 [182,'We finished our test before lunch.','Before lunch','Before lunch we finished our test.','Chúng tôi hoàn thành bài kiểm tra trước bữa trưa.'],
 [187,'The children played in the park on Sunday.','On Sunday','On Sunday the children played in the park.','Bọn trẻ chơi ở công viên vào Chủ nhật.'],
 [198,'He solved the puzzle last night.','Last night','Last night he solved the puzzle.','Cậu ấy giải câu đố tối qua.'],
])rewrite(n,{promptEn,promptVi:`Đưa “${phrase}” lên đầu câu, giữ nguyên nghĩa.`,answer,alt:[answer.replace(phrase,phrase+',')],vi:vi+' → đổi vị trí trạng ngữ'});

// Theory schema and pedagogical corrections.
for(const l of ['C1','C2','C3']){
 const t=data[`${l}.theory.json`];t.id=l;delete t.topic;delete t.exampleIds;
 t.formulas=t.formulas.map(f=>({label:f.label||f.name,pattern:f.pattern,example:f.example||f.examples.join('\n')}));
 t.sections=t.sections.map(s=>({heading:s.heading||s.title,body:s.body||s.content,...(l!=='C3'&&s.exampleIds?{exampleIds:s.exampleIds}:{})}));
}
{const t=data['C1.theory.json'];t.sections[2].body='Câu hỏi về tân ngữ hoặc trạng ngữ dùng do/does/did/will trước chủ ngữ và động từ nguyên thể: What did Lan buy? Với be là động từ chính, đưa be trước chủ ngữ: Where is Lan? Với hiện tại tiếp diễn, giữ V-ing: What is Lan reading? Khi who/what chính là chủ ngữ, không thêm do/does/did chỉ để tạo câu hỏi: Who broke the cup? What happened? Động từ vẫn chia theo thì và chủ ngữ.';
 t.formulas=t.formulas.filter(f=>f.label!=='Hỏi chủ ngữ');t.formulas.push({label:'Hỏi chủ ngữ',pattern:'Who / What + động từ đã chia + ...?',example:'Who broke the cup?\nWhat happened yesterday?'});
 t.commonMistakes[0].why='Khi hỏi nơi ở với động từ thường live và chủ ngữ you, dùng do trước chủ ngữ.';
}
{const t=data['C2.theory.json'];
 t.sections[0].body=t.sections[0].body.replace('ở giữa hai người hoặc hai vật.','ở giữa các đối tượng phân biệt rõ; ví dụ cơ bản là hai người hoặc hai vật.');
 t.sections[1].body=t.sections[1].body.split('\nVới cụm chỉ thời gian')[0].replace('trong suốt một khoảng thời gian','trong một khoảng thời gian (cả khoảng hoặc một thời điểm bên trong)')+'\nVới cụm chỉ thời gian bắt đầu bằng this/next/last/every, thường không thêm in/on/at: this month, next Monday, last year, every day. Before/until đứng trước một mệnh đề là liên từ: before you leave, until it closes.';
 t.sections[1].exampleIds=t.sections[1].exampleIds.filter(id=>id!=='C2-s-0071');
 t.sections[2].exampleIds=[...new Set([...t.sections[2].exampleIds.filter(id=>id!=='C2-s-0146'),'C2-s-0197'])];
 t.tips[1]='Between dùng khi xét các đối tượng phân biệt rõ; among dùng khi xét vị trí hoặc quan hệ trong một nhóm. Không phân biệt chỉ bằng quy tắc hai/nhiều.';
 for(const f of t.formulas)f.example=f.example.replace(/It was raining/g,'It rained');
 for(const m of t.commonMistakes)for(const key of ['wrong','right'])m[key]=m[key].replace(/It was raining/g,'It rained').replace(/it was raining/g,'it rained');
}
{const t=data['C3.theory.json'];t.summary='Luyện đọc hiểu đoạn văn 60–90 từ và sáu dạng biến đổi câu. Một số dạng đổi ý khẳng định/phủ định; các dạng đồng nghĩa, rút gọn và đổi vị trí trạng ngữ cần giữ thông điệp gốc.';
 t.sections[1].body='Đổi khẳng định/phủ định: thay đổi việc xác nhận hoặc phủ nhận, giữ thì và các thông tin còn lại. Đổi trần thuật thành câu hỏi: dùng be hoặc do/does/did/will phù hợp; sau do/does/did/will là động từ nguyên thể. Rút gọn: giữ nguyên nghĩa, dùng dạng như is not → isn\'t. Từ đồng nghĩa: thay từ được yêu cầu và kiểm tra sắc thái trong ngữ cảnh. Đổi vị trí trạng ngữ: ưu tiên cụm thời gian tự nhiên như yesterday hoặc after school. Ví dụ: Lan read a book yesterday. → Yesterday Lan read a book.';
 t.sections=t.sections.filter(s=>s.heading!=='3. Kiểm tra mục tiêu trước khi viết');t.sections.push({heading:'3. Kiểm tra mục tiêu trước khi viết',body:'Phủ định: She is here. → She is not here. Hai câu có ý trái nhau theo yêu cầu. Câu hỏi: They play chess. → Do they play chess? Rút gọn: They do not play chess. → They don\'t play chess. Đọc yêu cầu, giữ đúng thì, viết hoa chữ đầu và chọn dấu chấm hoặc dấu hỏi phù hợp. Với bài đọc, chỉ trả lời thông tin được hỏi và dựa vào bằng chứng trong đoạn.'});
 t.commonMistakes[3]={wrong:'You will come. → Will you not come?',right:'You will come. → Will you come?',why:'Đổi câu trần thuật khẳng định thành câu hỏi Yes/No không tự thêm phủ định.'};
}

// Do not write a partial corpus if a repair violates the runtime schema.
for(const [f,x]of Object.entries(data)){
 const [level,kind]=f.split('.'),errors=validateContent(kind,x,{level,sentenceIds:(data[`${level}.sentences.json`]||[]).map(s=>s.id)}).errors;
 if(errors.length)throw new Error(`${f}:\n${errors.join('\n')}`);
}
for(const f of Object.keys(raw))if(fs.readFileSync(path.join(dir,f),'utf8')!==raw[f])throw new Error(`${f} changed during repair; rerun against the latest data.`);
const ledgerPath=path.join(root,'scripts/english-content-review-v4.json');
const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{};
const changed=[];
for(const [f,x]of Object.entries(data)){
 if(!Array.isArray(x)){if(!isDeepStrictEqual(x,before[f])){ledger[f]={theory:x};changed.push(f);}continue;}
 for(const item of x){
  const old=before[f].find(r=>r.id===item.id),set={},remove=[];
  for(const key of Object.keys(item))if(!isDeepStrictEqual(item[key],old[key]))set[key]=item[key];
  for(const key of Object.keys(old))if(!(key in item))remove.push(key);
  // Preserve live C1/C2 order reviews even where this edit did not change them.
  if(['C1.sentences.json','C2.sentences.json'].includes(f)&&item.orderAlternatives)set.orderAlternatives=item.orderAlternatives;
  if(['B4-s-0050','B4-s-0072'].includes(item.id))set.exerciseTypes=item.exerciseTypes;
  if(Object.keys(set).length||remove.length){ledger[f]??={records:{}};const prev=ledger[f].records[item.id];
   ledger[f].records[item.id]={expectedEn:prev?.expectedEn||old.en,set:{...(prev?.set||{}),...set},remove:[...new Set([...(prev?.remove||[]),...remove])].filter(k=>!(k in set))};
  }
 }
 if(!isDeepStrictEqual(x,before[f]))changed.push(f);
}
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
for(const f of changed)fs.writeFileSync(path.join(dir,f),JSON.stringify(data[f],null,2)+'\n');
console.log(JSON.stringify({changed,passages:passages.length,uniquePassages:new Set(passages.map(p=>p.en)).size,ledger:ledgerPath},null,2));
